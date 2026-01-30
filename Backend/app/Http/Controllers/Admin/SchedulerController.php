<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Console\Scheduling\Schedule;

class SchedulerController extends Controller
{
    /**
     * Get list of all scheduled tasks
     */
    public function index()
    {
        try {
            // Load console routes to populate the schedule
            require base_path('routes/console.php');

            $schedule = app(Schedule::class);
            $tasks = [];

            foreach ($schedule->events() as $event) {
                $tasks[] = [
                    'id' => md5($event->command ?? $event->description),
                    'command' => $event->command ?? 'Closure',
                    'description' => $event->description,
                    'expression' => $event->expression,
                    'timezone' => $event->timezone ?? config('app.timezone'),
                    'human_readable' => $this->expressionToHuman($event->expression),
                    'next_run' => $event->nextRunDate()?->toDateTimeString(),
                    'without_overlapping' => $event->withoutOverlapping ?? false,
                    'run_in_background' => property_exists($event, 'runInBackground') ? $event->runInBackground : false,
                ];
            }

            return response()->json([
                'tasks' => $tasks,
                'server_time' => now()->toDateTimeString(),
                'timezone' => config('app.timezone'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch scheduled tasks: ' . $e->getMessage());
            return response()->json(['error' => 'فشل في جلب المهام المجدولة'], 500);
        }
    }

    /**
     * Get scheduler health status
     */
    public function health()
    {
        $lastRun = Cache::get('scheduler:last_run');
        $healthy = false;
        $message = '';

        if (!$lastRun) {
            $message = 'لم يتم تشغيل المجدول مطلقًا أو لا يعمل الآن';
        } else {
            $minutesSinceLastRun = now()->diffInMinutes($lastRun);

            if ($minutesSinceLastRun <= 5) {
                $healthy = true;
                $message = "المجدول يعمل بشكل صحيح (آخر تشغيل: منذ {$minutesSinceLastRun} دقيقة)";
            } else {
                $message = "تحذير: المجدول متوقف أو عالق (آخر تشغيل: منذ {$minutesSinceLastRun} دقيقة)";
            }
        }

        return response()->json([
            'healthy' => $healthy,
            'message' => $message,
            'last_run' => $lastRun?->toDateTimeString(),
            'minutes_since_last_run' => $lastRun ? now()->diffInMinutes($lastRun) : null,
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Get scheduler logs
     */
    public function logs(Request $request)
    {
        try {
            $logFile = storage_path('logs/laravel.log');

            if (!File::exists($logFile)) {
                return response()->json(['logs' => [], 'message' => 'لا توجد سجلات متوفرة']);
            }

            $lines = $request->input('lines', 100);
            $filter = $request->input('filter', ''); // 'error', 'scheduler', etc.

            // Read last N lines
            $content = $this->tail($logFile, $lines);
            $logEntries = [];

            // Parse log entries (Laravel format)
            $pattern = '/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+\.\w+): (.+)/';

            foreach (explode(PHP_EOL, $content) as $line) {
                if (preg_match($pattern, $line, $matches)) {
                    $entry = [
                        'timestamp' => $matches[1],
                        'level' => $matches[2],
                        'message' => $matches[3],
                    ];

                    // Apply filter
                    if ($filter && stripos($entry['message'], $filter) === false) {
                        continue;
                    }

                    $logEntries[] = $entry;
                }
            }

            return response()->json([
                'logs' => array_reverse($logEntries), // Most recent first
                'total' => count($logEntries),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch logs: ' . $e->getMessage());
            return response()->json(['error' => 'فشل في جلب السجلات'], 500);
        }
    }

    /**
     * Execute a scheduled command manually
     */
    public function execute(Request $request)
    {
        $request->validate([
            'command' => 'required|string',
        ]);

        $command = $request->command;

        try {
            // Security: Whitelist allowed commands
            $allowedCommands = [
                'auction:start-scheduled',
                'auction:end-scheduled',
                'auction:send-reminders',
                'auction:check-payment-deadlines',
                'notifications:cleanup',
                'optimize',
                'scheduler:health',
                // Limit Enforcement Commands
                'orders:cancel-stale',
                'quotes:expire-old',
                'providers:deactivate-inactive',
            ];

            if (!in_array($command, $allowedCommands)) {
                return response()->json(['error' => 'الأمر غير مسموح به'], 403);
            }

            Log::info("[Scheduler] Manual execution requested: {$command}");

            // Execute command
            Artisan::call($command);
            $output = Artisan::output();

            Log::info("[Scheduler] Manual execution completed: {$command}");

            return response()->json([
                'success' => true,
                'message' => 'تم تنفيذ الأمر بنجاح',
                'output' => $output,
                'command' => $command,
                'executed_at' => now()->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            Log::error("[Scheduler] Manual execution failed: {$command} - " . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'فشل تنفيذ الأمر: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get scheduler statistics
     */
    public function stats()
    {
        try {
            // Read recent logs and calculate statistics
            $logFile = storage_path('logs/laravel.log');
            $stats = [
                'total_tasks' => 0,
                'successful_runs_today' => 0,
                'failed_runs_today' => 0,
                'last_error' => null,
                'uptime_percentage' => 100,
            ];

            if (File::exists($logFile)) {
                $content = $this->tail($logFile, 1000);
                $lines = explode(PHP_EOL, $content);

                $todayStart = now()->startOfDay();

                foreach ($lines as $line) {
                    // Count scheduler-related entries from today
                    if (preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $line, $matches)) {
                        $timestamp = \Carbon\Carbon::parse($matches[1]);

                        if ($timestamp->greaterThanOrEqualTo($todayStart)) {
                            if (stripos($line, '[Scheduler]') !== false) {
                                if (stripos($line, 'completed') !== false || stripos($line, 'success') !== false) {
                                    $stats['successful_runs_today']++;
                                } elseif (stripos($line, 'failed') !== false || stripos($line, 'error') !== false) {
                                    $stats['failed_runs_today']++;
                                    if (!$stats['last_error']) {
                                        $stats['last_error'] = [
                                            'message' => $line,
                                            'timestamp' => $timestamp->toDateTimeString(),
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }

                $total = $stats['successful_runs_today'] + $stats['failed_runs_today'];
                if ($total > 0) {
                    $stats['uptime_percentage'] = round(($stats['successful_runs_today'] / $total) * 100, 2);
                }
            }

            // Get task count from schedule
            $schedule = app(Schedule::class);
            $stats['total_tasks'] = count($schedule->events());

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Failed to fetch scheduler stats: ' . $e->getMessage());
            return response()->json(['error' => 'فشل في جلب الإحصائيات'], 500);
        }
    }

    /**
     * Convert cron expression to human-readable format
     */
    private function expressionToHuman(string $expression): string
    {
        $map = [
            '* * * * *' => 'كل دقيقة',
            '*/5 * * * *' => 'كل 5 دقائق',
            '*/10 * * * *' => 'كل 10 دقائق',
            '*/15 * * * *' => 'كل 15 دقيقة',
            '*/30 * * * *' => 'كل 30 دقيقة',
            '0 * * * *' => 'كل ساعة',
            '0 0 * * *' => 'يوميًا عند منتصف الليل',
            '0 2 * * *' => 'يوميًا الساعة 2:00 صباحًا',
            '0 3 * * *' => 'يوميًا الساعة 3:00 صباحًا',
            '0 4 * * 0' => 'أسبوعيًا يوم الأحد الساعة 4:00 صباحًا',
            '0 9 * * *' => 'يوميًا الساعة 9:00 صباحًا',
            '0 10 * * *' => 'يوميًا الساعة 10:00 صباحًا',
            '0 0 * * 0' => 'أسبوعيًا يوم الأحد',
            '0 11 * * 1' => 'أسبوعيًا يوم الاثنين الساعة 11:00 صباحًا',
        ];

        return $map[$expression] ?? $expression;
    }

    /**
     * Read last N lines from a file
     */
    private function tail(string $file, int $lines = 100): string
    {
        $handle = fopen($file, 'r');
        $linecounter = $lines;
        $pos = -2;
        $beginning = false;
        $text = [];

        while ($linecounter > 0) {
            $t = " ";
            while ($t != "\n") {
                if (fseek($handle, $pos, SEEK_END) == -1) {
                    $beginning = true;
                    break;
                }
                $t = fgetc($handle);
                $pos--;
            }
            $linecounter--;
            if ($beginning) {
                rewind($handle);
            }
            $text[$lines - $linecounter - 1] = fgets($handle);
            if ($beginning)
                break;
        }
        fclose($handle);

        return implode("", array_reverse($text));
    }
}
