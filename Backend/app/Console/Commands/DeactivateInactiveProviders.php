<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Provider;
use App\Models\SystemSettings;
use App\Models\Notification;
use App\Events\UserNotification;
use Carbon\Carbon;

class DeactivateInactiveProviders extends Command
{
    protected $signature = 'providers:deactivate-inactive';
    protected $description = 'Deactivate providers who have been inactive for configured days';

    public function handle()
    {
        $limitSettings = SystemSettings::getSetting('limitSettings');
        $days = $limitSettings['providerInactivityDeactivationDays'] ?? 90;

        $cutoffDate = Carbon::now()->subDays($days);

        // Find providers who haven't submitted quotes recently
        $inactiveProviders = Provider::where('is_active', true)
            ->where(function ($q) use ($cutoffDate) {
                $q->whereDoesntHave('quotes', function ($qb) use ($cutoffDate) {
                    $qb->where('created_at', '>', $cutoffDate);
                })
                    ->orWhereDoesntHave('quotes');
            })
            ->get();

        $deactivatedCount = 0;

        foreach ($inactiveProviders as $provider) {
            $provider->update(['is_active' => false]);

            // Notify provider
            $user = \App\Models\User::where('phone', $provider->id)->first();
            if ($user) {
                $notification = Notification::create([
                    'user_id' => $user->id,
                    'title' => 'تم إيقاف حسابك',
                    'message' => "حسابك كمزود خدمة غير نشط منذ {$days} يوم. يرجى التواصل مع الإدارة لإعادة التفعيل.",
                    'type' => 'PROVIDER_INACTIVITY_WARNING',
                    'read' => false,
                ]);

                event(new UserNotification($user->id, [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'timestamp' => $notification->created_at->toIso8601String(),
                ]));
            }

            $deactivatedCount++;
        }

        $this->info("Deactivated {$deactivatedCount} inactive providers.");

        return 0;
    }
}
