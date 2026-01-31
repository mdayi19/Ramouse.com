<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiSearchService;
use App\Models\ChatHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatbotController extends Controller
{
    // Removed Constructor Injection to prevent 500 crash on resolution
    // protected $aiService;
    // public function __construct(AiSearchService $aiService) ...

    public function sendMessage(Request $request)
    {
        // 1. Validation
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        try {
            // Pre-check for API Key to avoid hard crash in Service
            // Use config() instead of env() because env() returns null when config is cached
            if (!config('gemini.api_key')) {
                throw new \Exception("GEMINI_API_KEY is missing in .env");
            }

            // Resolve Service Manually safely
            $aiService = app(AiSearchService::class);

            $message = $request->input('message');
            $sessionId = $request->input('session_id') ?? (string) Str::uuid();
            $user = Auth::user();
            $userId = $user ? $user->id : null;

            // 2. Rate Limiting Logic...
            $limitKey = 'chat_limit_' . ($userId ? "user_{$userId}" : "ip_" . $request->ip());
            $dailyCount = Cache::get($limitKey, 0);
            $maxDaily = $userId ? 100 : 50;

            if ($dailyCount >= $maxDaily) {
                return response()->json([
                    'error' => 'Daily limit reached.',
                    'message' => $userId
                        ? 'لقد تجاوزت الحد اليومي للرسائل (100). يرجى العودة غداً.'
                        : 'لقد تجاوزت الحد اليومي كزائر (50). يرجى تسجيل الدخول للمتابعة.'
                ], 429);
            }

            // Increment count
            Cache::put($limitKey, $dailyCount + 1, now()->addDay());

            // 3. Context
            $history = ChatHistory::where('session_id', $sessionId)
                ->orderBy('created_at', 'desc')
                ->take(6)
                ->get()
                ->reverse()
                ->map(function ($chat) {
                    return [
                        'role' => $chat->role === 'user' ? 'user' : 'model',
                        'parts' => [['text' => $chat->content]]
                    ];
                })
                ->values()
                ->toArray();

            // 4. Call Service
            $responseContent = $aiService->sendMessage(
                $history,
                $message,
                $request->input('latitude'),
                $request->input('longitude')
            );

            // 5. Save Logs
            ChatHistory::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => 'user',
                'content' => $message
            ]);

            ChatHistory::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => 'model',
                'content' => $responseContent
            ]);

            return response()->json([
                'response' => $responseContent,
                'session_id' => $sessionId,
                'remaining' => $maxDaily - ($dailyCount + 1)
            ]);

        } catch (\Throwable $e) {
            Log::error("Chatbot Error: " . $e->getMessage());
            // Return JSON error instead of 500 page
            return response()->json([
                'error' => 'Backend Error: ' . $e->getMessage(),
                'message' => 'عذراً، حدث خطأ تقني: ' . $e->getMessage()
            ], 500);
        }
    }
}
