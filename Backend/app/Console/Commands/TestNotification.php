<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Events\UserNotification;
use App\Models\User; // Or whatever model you use, but we'll use raw ID for event
use Illuminate\Support\Facades\Log;

class TestNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-notification {phone}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test real-time notification broadcasting';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $phone = $this->argument('phone');
        $this->info("Sending test notification to: {$phone}");

        $notification = [
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'title' => 'Test Notification',
            'message' => 'This is a test notification from the console.',
            'type' => 'info',
            'timestamp' => now()->toIso8601String(),
            'read' => false,
        ];

        Log::info("Dispatching UserNotification event for {$phone}");

        // Dispatch the event
        event(new UserNotification($phone, $notification));

        $this->info("Event dispatched! Check your queue worker and frontend.");
    }
}
