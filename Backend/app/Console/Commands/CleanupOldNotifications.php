<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Notification;

class CleanupOldNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:cleanup {--days=30 : Number of days to keep notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete notifications older than a specified number of days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $date = now()->subDays($days);

        $this->info("Cleaning up notifications older than {$days} days (before {$date->toDateTimeString()})...");

        $count = \App\Models\Notification::where('created_at', '<', $date)->delete();

        $this->info("Deleted {$count} old notifications.");
    }
}
