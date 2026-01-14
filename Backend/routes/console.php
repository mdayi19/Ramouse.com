<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Log;

Schedule::command('notifications:cleanup')
    ->daily()
    ->onSuccess(function () {
        Log::info('[Scheduler] Notifications cleanup completed successfully');
    })
    ->onFailure(function () {
        Log::error('[Scheduler] Failed to cleanup notifications');
    });

Schedule::command('system:optimize')
    ->daily()
    ->onSuccess(function () {
        Log::info('[Scheduler] System optimization completed successfully');
    })
    ->onFailure(function () {
        Log::error('[Scheduler] Failed to optimize system');
    });

// Auction automated tasks
Schedule::command('auction:start-scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->onSuccess(function () {
        Log::debug('[Scheduler] Auction start check completed successfully');
    })
    ->onFailure(function () {
        Log::error('[Scheduler] CRITICAL: Failed to start scheduled auctions');
    });

Schedule::command('auction:end-scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->onSuccess(function () {
        Log::debug('[Scheduler] Auction end check completed successfully');
    })
    ->onFailure(function () {
        Log::error('[Scheduler] CRITICAL: Failed to end scheduled auctions');
    });

Schedule::command('auction:send-reminders')
    ->everyMinute()
    ->withoutOverlapping()
    ->onSuccess(function () {
        Log::debug('[Scheduler] Auction reminders sent successfully');
    })
    ->onFailure(function () {
        Log::warning('[Scheduler] Failed to send auction reminders');
    });

// NEW: Check payment deadlines and forfeit deposits
Schedule::command('auction:check-payment-deadlines')
    ->hourly()
    ->withoutOverlapping()
    ->onSuccess(function () {
        Log::info('[Scheduler] Payment deadline check completed successfully');
    })
    ->onFailure(function () {
        Log::error('[Scheduler] CRITICAL: Failed to check payment deadlines');
    });

// NEW: Cleanup expired wallet holds
Schedule::command('wallet:cleanup-expired-holds')
    ->hourly()
    ->withoutOverlapping()
    ->onSuccess(function () {
        Log::info('[Scheduler] Expired wallet holds cleanup completed');
    })
    ->onFailure(function () {
        Log::warning('[Scheduler] Failed to cleanup expired wallet holds');
    });

// Scheduler heartbeat - confirms scheduler is running
Schedule::call(function () {
    \Illuminate\Support\Facades\Cache::put('scheduler:last_run', now(), now()->addHour());
    \Illuminate\Support\Facades\Log::debug('[Scheduler] Heartbeat');
})->everyFiveMinutes();

// Aggregate car listing analytics daily
Schedule::command('analytics:aggregate')
    ->dailyAt('00:30')
    ->withoutOverlapping()
    ->onSuccess(function () {
        Log::info('[Scheduler] Car analytics aggregation completed successfully');
    })
    ->onFailure(function () {
        Log::error('[Scheduler] Failed to aggregate car analytics');
    });

