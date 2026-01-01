<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class ServerStatusController extends Controller
{
    /**
     * Get comprehensive server status and statistics
     */
    public function getStatus()
    {
        // CPU Load (Linux only)
        $cpuLoad = $this->getCpuLoad();

        // Memory Usage
        $memoryInfo = $this->getMemoryInfo();

        // Disk Usage
        $diskInfo = $this->getDiskInfo();

        // System Uptime
        $uptime = $this->getUptime();

        // PHP Info
        $phpInfo = [
            'version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
        ];

        // Laravel Info
        $laravelInfo = [
            'version' => app()->version(),
            'environment' => config('app.env'),
            'debug_mode' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
        ];

        // Database Stats
        $databaseInfo = $this->getDatabaseInfo();

        // Queue Stats
        $queueInfo = $this->getQueueInfo();

        // Cache/Redis Status
        $cacheInfo = $this->getCacheInfo();

        // Application Stats
        $appStats = $this->getAppStats();

        return response()->json([
            'success' => true,
            'data' => [
                'cpu' => $cpuLoad,
                'memory' => $memoryInfo,
                'disk' => $diskInfo,
                'uptime' => $uptime,
                'php' => $phpInfo,
                'laravel' => $laravelInfo,
                'database' => $databaseInfo,
                'queue' => $queueInfo,
                'cache' => $cacheInfo,
                'app' => $appStats,
                'timestamp' => now()->toIso8601String(),
            ]
        ]);
    }

    private function getCpuLoad(): array
    {
        $load = [0, 0, 0];

        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
        } elseif (is_readable('/proc/loadavg')) {
            $loadavg = file_get_contents('/proc/loadavg');
            $load = array_map('floatval', explode(' ', $loadavg));
        }

        // Get number of CPU cores for percentage calculation
        $cores = 1;
        if (is_readable('/proc/cpuinfo')) {
            $cpuinfo = file_get_contents('/proc/cpuinfo');
            preg_match_all('/^processor/m', $cpuinfo, $matches);
            $cores = count($matches[0]) ?: 1;
        }

        return [
            'load_1min' => round($load[0], 2),
            'load_5min' => round($load[1], 2),
            'load_15min' => round($load[2], 2),
            'cores' => $cores,
            'usage_percent' => round(($load[0] / $cores) * 100, 1),
        ];
    }

    private function getMemoryInfo(): array
    {
        $total = 0;
        $free = 0;
        $used = 0;

        if (is_readable('/proc/meminfo')) {
            $meminfo = file_get_contents('/proc/meminfo');
            preg_match('/MemTotal:\s+(\d+)/', $meminfo, $totalMatch);
            preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $availableMatch);

            $total = isset($totalMatch[1]) ? intval($totalMatch[1]) * 1024 : 0;
            $free = isset($availableMatch[1]) ? intval($availableMatch[1]) * 1024 : 0;
            $used = $total - $free;
        }

        return [
            'total' => $total,
            'used' => $used,
            'free' => $free,
            'total_formatted' => $this->formatBytes($total),
            'used_formatted' => $this->formatBytes($used),
            'free_formatted' => $this->formatBytes($free),
            'usage_percent' => $total > 0 ? round(($used / $total) * 100, 1) : 0,
        ];
    }

    private function getDiskInfo(): array
    {
        $path = base_path();
        $total = disk_total_space($path) ?: 0;
        $free = disk_free_space($path) ?: 0;
        $used = $total - $free;

        return [
            'total' => $total,
            'used' => $used,
            'free' => $free,
            'total_formatted' => $this->formatBytes($total),
            'used_formatted' => $this->formatBytes($used),
            'free_formatted' => $this->formatBytes($free),
            'usage_percent' => $total > 0 ? round(($used / $total) * 100, 1) : 0,
        ];
    }

    private function getUptime(): array
    {
        $uptime = 0;
        $bootTime = null;

        if (is_readable('/proc/uptime')) {
            $uptimeData = file_get_contents('/proc/uptime');
            $uptime = floatval(explode(' ', $uptimeData)[0]);
            $bootTime = now()->subSeconds($uptime)->toDateTimeString();
        }

        return [
            'seconds' => intval($uptime),
            'formatted' => $this->formatUptime($uptime),
            'boot_time' => $bootTime,
        ];
    }

    private function getDatabaseInfo(): array
    {
        try {
            $connection = config('database.default');
            $tableCount = 0;
            $dbSize = 0;

            if ($connection === 'mysql') {
                $dbName = config('database.connections.mysql.database');

                $tables = DB::select('SHOW TABLES');
                $tableCount = count($tables);

                $sizeResult = DB::select("
                    SELECT SUM(data_length + index_length) as size 
                    FROM information_schema.tables 
                    WHERE table_schema = ?
                ", [$dbName]);

                $dbSize = $sizeResult[0]->size ?? 0;
            }

            return [
                'connected' => true,
                'driver' => $connection,
                'database' => config("database.connections.{$connection}.database"),
                'table_count' => $tableCount,
                'size' => $dbSize,
                'size_formatted' => $this->formatBytes($dbSize),
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getQueueInfo(): array
    {
        try {
            $pendingJobs = DB::table('jobs')->count();
            $failedJobs = DB::table('failed_jobs')->count();

            return [
                'driver' => config('queue.default'),
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
            ];
        } catch (\Exception $e) {
            return [
                'driver' => config('queue.default'),
                'pending_jobs' => 0,
                'failed_jobs' => 0,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getCacheInfo(): array
    {
        $driver = config('cache.default');
        $connected = false;

        try {
            if ($driver === 'redis') {
                Redis::ping();
                $connected = true;
            } else {
                Cache::put('health_check', true, 1);
                $connected = Cache::get('health_check') === true;
            }
        } catch (\Exception $e) {
            $connected = false;
        }

        return [
            'driver' => $driver,
            'connected' => $connected,
        ];
    }

    private function getAppStats(): array
    {
        return [
            'users' => DB::table('users')->count(),
            'orders' => DB::table('orders')->count(),
            'providers' => DB::table('providers')->count(),
            'technicians' => DB::table('technicians')->count(),
            'tow_trucks' => DB::table('tow_trucks')->count(),
            'products' => DB::table('products')->count(),
            'notifications' => DB::table('notifications')->count(),
            'push_subscriptions' => DB::table('push_subscriptions')->count(),
        ];
    }

    private function formatBytes($bytes): string
    {
        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' B';
    }

    private function formatUptime($seconds): string
    {
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        $parts = [];
        if ($days > 0)
            $parts[] = "{$days} يوم";
        if ($hours > 0)
            $parts[] = "{$hours} ساعة";
        if ($minutes > 0)
            $parts[] = "{$minutes} دقيقة";

        return implode(' و ', $parts) ?: '0 دقيقة';
    }
}
