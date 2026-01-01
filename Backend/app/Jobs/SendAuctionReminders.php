<?php

namespace App\Jobs;

use App\Models\AuctionReminder;
use App\Models\User;
use App\Notifications\GenericWebPushNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendAuctionReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    /**
     * Send all due auction reminders
     */
    public function handle(): void
    {
        $reminders = AuctionReminder::where('is_sent', false)
            ->where('remind_at', '<=', now())
            ->with(['auction', 'auction.car'])
            ->get();

        foreach ($reminders as $reminder) {
            try {
                $this->sendReminder($reminder);

                $reminder->update([
                    'is_sent' => true,
                    'sent_at' => now(),
                ]);

                Log::info("Sent auction reminder {$reminder->id} to user {$reminder->user_id}");
            } catch (\Exception $e) {
                Log::error("Failed to send auction reminder {$reminder->id}: " . $e->getMessage());
            }
        }
    }

    protected function sendReminder(AuctionReminder $reminder): void
    {
        $auction = $reminder->auction;
        if (!$auction || $auction->status === 'cancelled') {
            return;
        }

        $channels = $reminder->channels ?? ['push'];

        // Find the user
        $user = User::where(function ($query) use ($reminder) {
            $query->whereHas('customer', function ($q) use ($reminder) {
                $q->where('id', $reminder->user_id);
            })->where(function ($q) use ($reminder) {
                // Match user type
                if ($reminder->user_type === 'customer') {
                    $q->whereNotNull('id');
                }
            });
        })->orWhere(function ($query) use ($reminder) {
            $query->whereHas('technician', function ($q) use ($reminder) {
                $q->where('id', $reminder->user_id);
            });
        })->orWhere(function ($query) use ($reminder) {
            $query->whereHas('towTruck', function ($q) use ($reminder) {
                $q->where('id', $reminder->user_id);
            });
        })->first();

        if (!$user) {
            Log::warning("User not found for reminder {$reminder->id}");
            return;
        }

        foreach ($channels as $channel) {
            switch ($channel) {
                case 'push':
                    $this->sendWebPush($user, $auction, $reminder);
                    break;
                case 'sms':
                    $this->sendSms($user, $auction, $reminder);
                    break;
            }
        }
    }

    protected function sendWebPush($user, $auction, $reminder): void
    {
        try {
            $minutesUntil = $reminder->remind_minutes_before;
            $timeText = $minutesUntil >= 60
                ? ($minutesUntil / 60) . ' ساعة'
                : $minutesUntil . ' دقيقة';

            $user->notify(new GenericWebPushNotification(
                title: "⏰ تذكير بالمزاد",
                message: "المزاد '{$auction->title}' سيبدأ خلال {$timeText}!",
                link: "/auctions/{$auction->id}",
                actionTitle: "دخول المزاد",
                type: 'auction'
            ));

            Log::info("WebPush sent for auction {$auction->id} to user {$user->id}");
        } catch (\Exception $e) {
            Log::error("WebPush failed for reminder: " . $e->getMessage());
        }
    }

    protected function sendSms($user, $auction, $reminder): void
    {
        // TODO: Integrate with existing SMS/WhatsApp notification system
        // Uses the existing MessagingAPI configuration
        Log::info("SMS reminder would be sent for auction {$auction->id}");
    }
}
