<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SystemMaintenanceCommand extends Command
{
    protected $signature = 'system:optimize';
    protected $description = 'Run system maintenance tasks based on configured settings.';

    public function handle()
    {
        $this->info('Starting System Maintenance...');

        $settings = SystemSettings::getAllFlat();

        // 1. Cleanup Notifications
        $notifDays = $settings['retention_notifications'] ?? 0;
        if ($notifDays > 0) {
            $this->info("Cleaning notifications older than {$notifDays} days...");
            Artisan::call('notifications:cleanup', ['--days' => $notifDays]);
        }

        // 2. Cleanup Quotes (Orphaned or Old)
        $quoteDays = $settings['retention_quotes'] ?? 0;
        if ($quoteDays > 0) {
            $this->cleanupQuotes($quoteDays, $settings);
        }

        // 3. Cleanup Media (Folder Policies)
        $this->info("Running Media Cleanup...");
        Artisan::call('media:cleanup');

        // 4. Log Rotation
        $logDays = $settings['retention_logs'] ?? 0;
        if ($logDays > 0) {
            $this->rotateLogs($logDays);
        }

        // 5. Database Optimization
        // Only run if specifically enabled or maybe just run it (it's safe usually)
        // Let's keep it manual or implicit?
        // Let's run it if retention rules are active, to reclaim space.
        $this->info('Optimizing Database...');
        $tables = DB::select('SHOW TABLES');
        $dbName = config('database.connections.mysql.database');
        $dbKey = "Tables_in_" . $dbName;
        foreach ($tables as $table) {
            $tableName = $table->$dbKey;
            DB::statement("OPTIMIZE TABLE `{$tableName}`");
        }

        // 6. Record run time for Status Dashboard
        \Illuminate\Support\Facades\Cache::put('scheduler_last_run', now(), 60 * 24); // Store for 24h

        $this->info('System Maintenance Completed.');
    }

    private function cleanupQuotes($days, $settings)
    {
        $date = now()->subDays($days);
        $this->info("Cleaning quotes linked to closed orders older than {$days} days...");

        // Get protected IDs
        $protectedIds = $this->getProtectedIds($settings);

        // Find targets
        $quotes = \App\Models\Quote::whereHas('order', function ($q) use ($date, $protectedIds) {
            $q->whereIn('status', ['completed', 'cancelled', 'rejected'])
                ->where('updated_at', '<', $date)
                ->whereNotIn('order_number', $protectedIds);
        })->get();

        $count = 0;
        foreach ($quotes as $quote) {
            // Move media to trash if exists (assuming 'media' is array of paths)
            if (!empty($quote->media) && is_array($quote->media)) {
                foreach ($quote->media as $file) {
                    $this->moveToTrash($file);
                }
            }
            $quote->delete();
            $count++;
        }

        $this->info("Deleted {$count} quotes.");
    }

    private function rotateLogs($days)
    {
        $logPath = storage_path('logs/laravel.log');
        if (file_exists($logPath)) {
            if (now()->diffInDays(filemtime($logPath)) >= $days) {
                // Truncate
                file_put_contents($logPath, '');
                $this->info("Logs cleared (exceeded {$days} days).");
            }
        }
    }

    private function moveToTrash($path)
    {
        if (Storage::disk('public')->exists($path)) {
            $trashPath = 'trash/' . date('Y-m-d') . '/' . basename($path);
            Storage::disk('public')->makeDirectory('trash/' . date('Y-m-d'));
            Storage::disk('public')->move($path, $trashPath);
        }
    }

    private function getProtectedIds($settings)
    {
        $raw = $settings['protected_order_ids'] ?? '';
        if (empty($raw))
            return [];
        return array_map('trim', explode(',', $raw));
    }
}
