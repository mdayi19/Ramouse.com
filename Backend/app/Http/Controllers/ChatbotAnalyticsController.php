<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatHistory;
use App\Models\ChatAnalytics;
use App\Models\ChatFeedback;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ChatbotAnalyticsController extends Controller
{
    /**
     * Get comprehensive chatbot analytics dashboard data
     */
    public function getDashboard(Request $request)
    {
        $period = $request->input('period', '7d'); // 7d, 30d, 90d, all
        $startDate = $this->getStartDate($period);

        return response()->json([
            'overview' => $this->getOverviewStats($startDate),
            'conversations' => $this->getConversationStats($startDate),
            'performance' => $this->getPerformanceStats($startDate),
            'feedback' => $this->getFeedbackStats($startDate),
            'popular_queries' => $this->getPopularQueries($startDate),
            'hourly_distribution' => $this->getHourlyDistribution($startDate),
            'user_engagement' => $this->getUserEngagementStats($startDate),
            'error_analysis' => $this->getErrorAnalysis($startDate),
        ]);
    }

    /**
     * Export analytics data to CSV
     */
    public function exportCSV(Request $request)
    {
        $period = $request->input('period', '7d');
        $startDate = $this->getStartDate($period);

        $analytics = ChatAnalytics::where('created_at', '>=', $startDate)
            ->orderBy('created_at', 'desc')
            ->get();

        $csv = "Timestamp,Event Type,User ID,Session ID,Response Time (ms),Event Data\n";

        foreach ($analytics as $record) {
            $eventData = json_encode($record->event_data);
            $csv .= "\"{$record->created_at}\",\"{$record->event_type}\",\"{$record->user_id}\",\"{$record->session_id}\",\"{$record->response_time_ms}\",\"{$eventData}\"\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="chatbot-analytics-' . now()->format('Y-m-d') . '.csv"');
    }

    // --- Private Helper Methods ---

    private function getStartDate($period)
    {
        return match ($period) {
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            '90d' => Carbon::now()->subDays(90),
            'all' => Carbon::parse('2020-01-01'),
            default => Carbon::now()->subDays(7),
        };
    }

    private function getOverviewStats($startDate)
    {
        $totalMessages = ChatAnalytics::where('event_type', 'message_sent')
            ->where('created_at', '>=', $startDate)
            ->count();

        $totalConversations = ChatHistory::where('created_at', '>=', $startDate)
            ->distinct('session_id')
            ->count('session_id');

        $totalUsers = ChatHistory::where('created_at', '>=', $startDate)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        $avgResponseTime = ChatAnalytics::where('event_type', 'message_sent')
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('response_time_ms')
            ->avg('response_time_ms');

        $errorRate = ChatAnalytics::where('created_at', '>=', $startDate)
            ->selectRaw('
                (COUNT(CASE WHEN event_type = "error" THEN 1 END) * 100.0 / COUNT(*)) as error_percentage
            ')
            ->first();

        return [
            'total_messages' => $totalMessages,
            'total_conversations' => $totalConversations,
            'total_users' => $totalUsers,
            'avg_response_time_ms' => round($avgResponseTime ?? 0),
            'error_rate' => round($errorRate->error_percentage ?? 0, 2),
        ];
    }

    private function getConversationStats($startDate)
    {
        $messagesPerConvo = ChatHistory::where('created_at', '>=', $startDate)
            ->groupBy('session_id')
            ->selectRaw('session_id, COUNT(*) as message_count')
            ->get()
            ->avg('message_count');

        $dailyConversations = ChatHistory::where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(DISTINCT session_id) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'count' => $item->count
            ]);

        return [
            'avg_messages_per_conversation' => round($messagesPerConvo ?? 0, 1),
            'daily_trend' => $dailyConversations,
        ];
    }

    private function getPerformanceStats($startDate)
    {
        $performanceByHour = ChatAnalytics::where('event_type', 'message_sent')
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('response_time_ms')
            ->selectRaw('HOUR(created_at) as hour, AVG(response_time_ms) as avg_time, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        $percentiles = ChatAnalytics::where('event_type', 'message_sent')
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('response_time_ms')
            ->orderBy('response_time_ms')
            ->pluck('response_time_ms')
            ->all();

        $p50 = $this->getPercentile($percentiles, 50);
        $p95 = $this->getPercentile($percentiles, 95);
        $p99 = $this->getPercentile($percentiles, 99);

        return [
            'by_hour' => $performanceByHour,
            'p50_ms' => round($p50),
            'p95_ms' => round($p95),
            'p99_ms' => round($p99),
        ];
    }

    private function getFeedbackStats($startDate)
    {
        $totalFeedback = ChatFeedback::where('created_at', '>=', $startDate)->count();
        $positiveFeedback = ChatFeedback::where('created_at', '>=', $startDate)
            ->where('is_positive', true)
            ->count();

        $sentimentRatio = $totalFeedback > 0
            ? round(($positiveFeedback / $totalFeedback) * 100, 1)
            : 0;

        $feedbackTrend = ChatFeedback::where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, 
                         SUM(CASE WHEN is_positive = 1 THEN 1 ELSE 0 END) as positive,
                         SUM(CASE WHEN is_positive = 0 THEN 1 ELSE 0 END) as negative')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'total_feedback' => $totalFeedback,
            'positive_count' => $positiveFeedback,
            'negative_count' => $totalFeedback - $positiveFeedback,
            'sentiment_ratio' => $sentimentRatio,
            'daily_trend' => $feedbackTrend,
        ];
    }

    private function getPopularQueries($startDate)
    {
        // Get most common search patterns from chat analytics
        $queries = ChatHistory::where('created_at', '>=', $startDate)
            ->where('role', 'user')
            ->selectRaw('content, COUNT(*) as count')
            ->groupBy('content')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'query' => substr($item->content, 0, 100),
                'count' => $item->count
            ]);

        return $queries;
    }

    private function getHourlyDistribution($startDate)
    {
        $distribution = ChatHistory::where('created_at', '>=', $startDate)
            ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->pluck('count', 'hour')
            ->toArray();

        // Fill in missing hours with 0
        $fullDistribution = [];
        for ($i = 0; $i < 24; $i++) {
            $fullDistribution[] = [
                'hour' => $i,
                'count' => $distribution[$i] ?? 0
            ];
        }

        return $fullDistribution;
    }

    private function getUserEngagementStats($startDate)
    {
        $newUsers = ChatHistory::where('created_at', '>=', $startDate)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        $returningUsers = ChatHistory::where('created_at', '>=', $startDate)
            ->whereNotNull('user_id')
            ->whereIn('user_id', function ($query) use ($startDate) {
                $query->select('user_id')
                    ->from('chat_histories')
                    ->where('created_at', '<', $startDate)
                    ->whereNotNull('user_id')
                    ->distinct();
            })
            ->distinct('user_id')
            ->count('user_id');

        $guestMessages = ChatHistory::where('created_at', '>=', $startDate)
            ->whereNull('user_id')
            ->count();

        $authenticatedMessages = ChatHistory::where('created_at', '>=', $startDate)
            ->whereNotNull('user_id')
            ->count();

        return [
            'new_users' => $newUsers,
            'returning_users' => $returningUsers,
            'guest_messages' => $guestMessages,
            'authenticated_messages' => $authenticatedMessages,
        ];
    }

    private function getErrorAnalysis($startDate)
    {
        $errors = ChatAnalytics::where('event_type', 'error')
            ->where('created_at', '>=', $startDate)
            ->get();

        $errorsByType = $errors->groupBy(function ($error) {
            return $error->event_data['error_type'] ?? 'Unknown';
        })->map(function ($group) {
            return [
                'count' => $group->count(),
                'latest' => $group->first()->created_at
            ];
        });

        return [
            'total_errors' => $errors->count(),
            'by_type' => $errorsByType,
        ];
    }

    private function getPercentile($values, $percentile)
    {
        if (empty($values)) {
            return 0;
        }

        $count = count($values);
        $index = ceil(($percentile / 100) * $count) - 1;
        return $values[$index] ?? 0;
    }
}
