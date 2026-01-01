<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\Log;

class MaintenanceController extends Controller
{
    /**
     * Get system maintenance stats and settings
     */
    public function getStats()
    {
        try {
            // 1. Log Size
            $logPath = storage_path('logs/laravel.log');
            $logSize = file_exists($logPath) ? filesize($logPath) : 0;

            // 2. Notification Count (Old)
            $settings = $this->getSettings();
            $notifDays = $settings['retention_notifications'] ?? 30;
            $oldNotifCount = 0;
            try {
                $oldNotifCount = DB::table('notifications')
                    ->where('created_at', '<', now()->subDays($notifDays))
                    ->count();
            } catch (\Exception $e) {
                Log::error("Maintenance: Failed to count notifications: " . $e->getMessage());
            }

            // 3. Quotes (Safe check)
            $oldQuotesCount = 0;
            try {
                $quoteDays = $settings['retention_quotes'] ?? 90;
                $oldQuotesCount = DB::table('quotes')
                    ->join('orders', 'quotes.order_number', '=', 'orders.order_number')
                    ->whereIn('orders.status', ['completed', 'cancelled', 'rejected'])
                    ->where('orders.updated_at', '<', now()->subDays($quoteDays))
                    ->count();
            } catch (\Exception $e) {
                Log::error("Maintenance: Failed to count quotes: " . $e->getMessage());
            }

            // 4. Trash Size
            $trashSize = 0;
            $trashCount = 0;
            try {
                if (Storage::disk('public')->exists('trash')) {
                    $trashFiles = Storage::disk('public')->allFiles('trash');
                    foreach ($trashFiles as $file) {
                        $trashSize += Storage::disk('public')->size($file);
                        $trashCount++;
                    }
                }
            } catch (\Exception $e) {
                Log::error("Maintenance: Failed to scan trash: " . $e->getMessage());
            }

            // 5. Scheduler Status
            $lastRun = \Illuminate\Support\Facades\Cache::get('scheduler_last_run');
            $schedulerRunning = $lastRun && now()->diffInMinutes($lastRun) < 5;

            return response()->json([
                'success' => true,
                'stats' => [
                    'log_size' => $this->formatBytes($logSize),
                    'log_size_bytes' => $logSize,
                    'old_notifications' => $oldNotifCount,
                    'old_quotes' => $oldQuotesCount,
                    'trash_size' => $this->formatBytes($trashSize),
                    'trash_count' => $trashCount, // Fixed: Added this field
                    'scheduler_running' => $schedulerRunning,
                    'last_scheduler_run' => $lastRun,
                ],
                'settings' => $settings,
                'folders' => $this->getFolderStats(),
            ]);

        } catch (\Exception $e) {
            Log::error("Maintenance Hub Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'System Maintenance Error: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getFolderStats()
    {
        $folders = [
            'international_license_requests',
            'payment_receipts',
            'products',
            'uploads',
            'technicians',
            'tow_trucks',
            'announcements',
            'blog',
            'receipts',
            'seo',
            'wallet'
        ];

        $stats = [];
        $settings = $this->getSettings();

        foreach ($folders as $folder) {
            try {
                // Check if directory exists first to avoid error
                if (!Storage::disk('public')->exists($folder)) {
                    // Create it implicitly to avoid error? Or just skip?
                    // Let's just return 0 stats
                    $stats[] = [
                        'name' => $folder,
                        'count' => 0,
                        'size' => '0 B',
                        'size_bytes' => 0,
                        'retention_days' => $settings["folder_policy_{$folder}"] ?? 0,
                        'auto_clean' => !empty($settings["folder_policy_{$folder}_enabled"]),
                    ];
                    continue;
                }

                $files = Storage::disk('public')->allFiles($folder);
                $size = 0;
                foreach ($files as $file) {
                    $size += Storage::disk('public')->size($file);
                }

                $stats[] = [
                    'name' => $folder,
                    'count' => count($files),
                    'size' => $this->formatBytes($size),
                    'size_bytes' => $size,
                    'retention_days' => $settings["folder_policy_{$folder}"] ?? 0, // 0 = Keep Forever
                    'auto_clean' => !empty($settings["folder_policy_{$folder}_enabled"]),
                ];
            } catch (\Exception $e) {
                Log::error("Maintenance: Failed to scan folder {$folder}: " . $e->getMessage());
                $stats[] = [
                    'name' => $folder . " (Error)",
                    'count' => 0,
                    'size' => 'Error',
                    'size_bytes' => 0,
                    'retention_days' => 0,
                    'auto_clean' => false,
                ];
            }
        }

        return $stats;
    }

    /**
     * Save Configuration
     */
    public function saveSettings(Request $request)
    {
        $data = $request->all(); // Expects key-value pairs

        // Save to system settings
        // Should validate keys first, but for admin valid keys are dynamic based on plan
        foreach ($data as $key => $value) {
            SystemSettings::setSetting($key, $value);
        }

        return response()->json(['success' => true, 'message' => 'Settings saved successfully']);
    }

    /**
     * Run Manual Actions
     */
    public function runAction(Request $request)
    {
        $action = $request->input('action');
        $output = '';

        try {
            switch ($action) {
                case 'clean_notifications':
                    Artisan::call('notifications:cleanup', ['--days' => $request->input('days', 30)]);
                    $output = Artisan::output();
                    break;

                case 'clean_logs':
                    file_put_contents(storage_path('logs/laravel.log'), '');
                    $output = "Logs cleared successfully.";
                    break;

                case 'optimize_db':
                    // Raw SQL for MySQL
                    $tables = DB::select('SHOW TABLES');
                    $dbName = config('database.connections.mysql.database');
                    $dbKey = "Tables_in_" . $dbName;

                    foreach ($tables as $table) {
                        $tableName = $table->$dbKey;
                        DB::statement("OPTIMIZE TABLE `{$tableName}`");
                    }
                    $output = "Database optimized successfully.";
                    break;

                case 'clear_cache':
                    Artisan::call('cache:clear');
                    Artisan::call('view:clear');
                    Artisan::call('route:clear');
                    $output = "System cache cleared.";
                    break;

                case 'empty_trash':
                    Storage::disk('public')->deleteDirectory('trash');
                    Storage::disk('public')->makeDirectory('trash'); // Recreate
                    $output = "Trash emptied.";
                    break;

                case 'run_all':
                    Artisan::call('system:optimize');
                    $output = Artisan::output();
                    break;

                default:
                    return response()->json(['success' => false, 'message' => 'Invalid action'], 400);
            }

            return response()->json(['success' => true, 'message' => $output]);

        } catch (\Exception $e) {
            Log::error("Maintenance Action Failed: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => "Error: " . $e->getMessage()], 500);
        }
    }

    /**
     * File Manager: List Files
     */
    public function listFiles(Request $request)
    {
        $path = $request->input('path', '/');

        // Security Check: Prevent traversing up
        if (str_contains($path, '..')) {
            return response()->json(['error' => 'Invalid path'], 400);
        }

        $directories = Storage::disk('public')->directories($path);
        $files = Storage::disk('public')->files($path);

        $content = [];

        foreach ($directories as $dir) {
            $content[] = [
                'type' => 'folder',
                'name' => basename($dir),
                'path' => $dir,
                'items' => count(Storage::disk('public')->files($dir))
            ];
        }

        foreach ($files as $file) {
            $content[] = [
                'type' => 'file',
                'name' => basename($file),
                'path' => $file,
                'size' => $this->formatBytes(Storage::disk('public')->size($file)),
                'last_modified' => date('Y-m-d H:i:s', Storage::disk('public')->lastModified($file)),
                'extension' => pathinfo($file, PATHINFO_EXTENSION),
                'url' => Storage::disk('public')->url($file)
            ];
        }

        return response()->json(['data' => $content, 'current_path' => $path]);
    }

    /**
     * File Manager: Delete File (Move to Trash)
     */
    public function deleteFile(Request $request)
    {
        $path = $request->input('path');

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        // Soft delete logic: Move to Trash
        $trashPath = 'trash/' . date('Y-m-d') . '/' . basename($path);

        // Ensure subfolder exists
        Storage::disk('public')->makeDirectory('trash/' . date('Y-m-d'));

        Storage::disk('public')->move($path, $trashPath);

        return response()->json(['success' => true, 'message' => 'File moved to Trash']);
    }

    /**
     * File Manager: Bulk Delete (Move to Trash)
     */
    public function bulkDelete(Request $request)
    {
        $paths = $request->input('paths', []);

        if (empty($paths) || !is_array($paths)) {
            return response()->json(['error' => 'No files selected'], 400);
        }

        $count = 0;
        $date = date('Y-m-d');
        Storage::disk('public')->makeDirectory('trash/' . $date);

        foreach ($paths as $path) {
            if (Storage::disk('public')->exists($path)) {
                $trashPath = 'trash/' . $date . '/' . basename($path);
                // Handle duplicate names in trash by appending timestamp
                if (Storage::disk('public')->exists($trashPath)) {
                    $trashPath = 'trash/' . $date . '/' . time() . '_' . basename($path);
                }
                Storage::disk('public')->move($path, $trashPath);
                $count++;
            }
        }

        return response()->json(['success' => true, 'message' => "Moved {$count} files to Trash"]);
    }

    /**
     * File Manager: Download File
     */
    public function downloadFile(Request $request)
    {
        $path = $request->input('path');

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($path);
    }

    /**
     * Download Backup
     */
    public function downloadBackup()
    {
        $filename = 'backup-' . date('Y-m-d-H-i-s') . '.sql';

        // Use mysqldump via exec
        $dbHost = config('database.connections.mysql.host');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        // Note: Password usage on command line can be insecure, but in Docker env it's often acceptable or use config file
        // A safer way is using a temp config file, but for simplicity:
        $command = "mysqldump --host={$dbHost} --user={$dbUser} --password={$dbPass} {$dbName}";

        $output = [];
        $returnVar = null;

        // Stream response
        return response()->streamDownload(function () use ($command) {
            echo passthru($command);
        }, $filename);
    }

    private function getSettings()
    {
        return SystemSettings::getAllFlat();
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
