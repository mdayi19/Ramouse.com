<?php

namespace App\Jobs;

use App\Models\UserWalletHold;
use App\Models\UserTransaction;
use App\Models\Notification;
use App\Events\UserNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Cleanup expired wallet holds
 * 
 * This job releases wallet holds that have passed their expiration date.
 * Should run every hour via the scheduler.
 */
class CleanupExpiredWalletHolds implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        $expiredHolds = UserWalletHold::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        $released = 0;
        $failed = 0;

        foreach ($expiredHolds as $hold) {
            try {
                DB::transaction(function () use ($hold) {
                    // Release the hold
                    $hold->update(['status' => 'released']);

                    // Add to wallet history (transaction record for release)
                    UserTransaction::create([
                        'user_id' => $hold->user_id,
                        'user_type' => $hold->user_type,
                        'type' => 'release',
                        'amount' => $hold->amount,
                        'description' => 'تحرير تأمين منتهي الصلاحية: ' . $hold->reason,
                        'reference_type' => 'wallet_hold',
                        'reference_id' => $hold->id,
                        'balance_after' => null,
                    ]);

                    // Update the related auction registration if exists
                    $registration = \App\Models\AuctionRegistration::where('wallet_hold_id', $hold->id)->first();

                    if ($registration) {
                        $registration->update([
                            'status' => 'deposit_released',
                            'deposit_released_at' => now(),
                        ]);

                        // Notify the user
                        try {
                            $auction = $registration->auction;
                            $notification = Notification::create([
                                'user_id' => $hold->user_id,
                                'title' => 'تم تحرير مبلغ التأمين',
                                'message' => 'تم تحرير مبلغ التأمين الخاص بالمزاد "' . ($auction->title ?? 'غير معروف') . '" تلقائياً بعد انتهاء صلاحيته.',
                                'type' => 'INFO',
                                'data' => json_encode([
                                    'hold_id' => $hold->id,
                                    'auction_id' => $registration->auction_id,
                                ]),
                                'read' => false,
                            ]);
                            event(new UserNotification($hold->user_id, $notification->toArray()));
                        } catch (\Exception $e) {
                            Log::warning("Failed to notify user {$hold->user_id} about expired hold release: " . $e->getMessage());
                        }
                    }
                });

                $released++;
            } catch (\Exception $e) {
                $failed++;
                Log::error("Failed to release expired hold {$hold->id}: " . $e->getMessage());
            }
        }

        if ($released > 0 || $failed > 0) {
            Log::info("CleanupExpiredWalletHolds: Released {$released} holds, Failed {$failed}");
        }
    }
}
