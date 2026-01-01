<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class MediaCleanupCommand extends Command
{
    protected $signature = 'media:cleanup';
    protected $description = 'Cleanup old media files based on configured folder policies';

    public function handle()
    {
        $this->info('Starting Media Cleanup...');
        $settings = SystemSettings::getAllFlat();

        // 1. Process Folder Policies
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

        // Get file type filters
        $filters = $this->getFileFilters($settings);
        if (!empty($filters)) {
            $this->info("Filtering target files: " . implode(', ', $filters));
        }

        foreach ($folders as $folder) {
            // Check policy
            if (empty($settings["folder_policy_{$folder}_enabled"])) {
                continue;
            }

            $days = $settings["folder_policy_{$folder}"] ?? 0;
            if ($days <= 0)
                continue;

            $this->info("Scanning folder: {$folder} (Retention: {$days} days)...");
            $this->processFolder($folder, $days, $filters);
        }

        // 2. Cleanup Trash (Hard Delete)
        // Default 30 days for trash
        $trashDays = $settings['retention_trash'] ?? 30;
        if ($trashDays > 0) {
            $this->cleanupTrash($trashDays);
        }

        $this->info('Media Cleanup Completed.');
    }

    private function processFolder($folder, $days, $filters)
    {
        $files = Storage::disk('public')->allFiles($folder);
        $count = 0;

        foreach ($files as $file) {
            // Check extension filter
            if (!empty($filters)) {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (!in_array($ext, $filters)) {
                    continue; // Skip file if not in target list
                }
            }

            // Check Age
            if (now()->diffInDays(Storage::disk('public')->lastModified($file)) >= $days) {
                $this->moveToTrash($file);
                $count++;
            }
        }

        if ($count > 0) {
            $this->info("Moved {$count} files from '{$folder}' to Trash.");
        }
    }

    private function cleanupTrash($days)
    {
        $this->info("Cleaning Trash older than {$days} days...");

        // Trash structure: trash/YYYY-MM-DD/file.ext
        $dates = Storage::disk('public')->directories('trash');
        $deletedCount = 0;

        foreach ($dates as $dateDir) {
            $dateStr = basename($dateDir); // YYYY-MM-DD
            try {
                if (now()->diffInDays(\Carbon\Carbon::parse($dateStr)) >= $days) {
                    Storage::disk('public')->deleteDirectory($dateDir);
                    $deletedCount++;
                }
            } catch (\Exception $e) {
                // Ignore parsing errors
            }
        }

        if ($deletedCount > 0) {
            $this->info("Permanently deleted {$deletedCount} day-folders from Trash.");
        }
    }

    private function moveToTrash($path)
    {
        if (Storage::disk('public')->exists($path)) {
            try {
                $trashPath = 'trash/' . date('Y-m-d') . '/' . basename($path);
                Storage::disk('public')->makeDirectory('trash/' . date('Y-m-d'));
                Storage::disk('public')->move($path, $trashPath);
            } catch (\Exception $e) {
                $this->error("Failed to move {$path} to trash: " . $e->getMessage());
            }
        }
    }

    private function getFileFilters($settings)
    {
        $raw = $settings['target_file_extensions'] ?? '';
        if (empty($raw))
            return [];
        $parts = explode(',', $raw);
        return collect($parts)->mapWithKeys(function ($item) {
            $item = trim(str_replace('.', '', $item));
            return !empty($item) ? [strtolower($item) => strtolower($item)] : [];
        })->filter()->all();
    }
}
