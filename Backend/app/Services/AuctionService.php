<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\AuctionRegistration;
use App\Models\UserWalletHold;
use App\Models\Notification;
use App\Events\UserNotification;
use App\Events\AuctionStarted;
use App\Events\AuctionEnded;
use App\Events\AuctionExtended;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Centralized Auction Service
 * Single source of truth for all auction lifecycle operations
 */
class AuctionService
{
    /**
     * Start an auction
     */
    public function startAuction(Auction $auction): bool
    {
        if ($auction->status !== 'scheduled') {
            throw new \Exception('المزاد ليس في حالة مجدولة');
        }

        $auction->update([
            'status' => 'live',
            'actual_start' => now(),
        ]);

        // Update car status
        if ($auction->car) {
            $auction->car->update(['status' => 'in_auction']);
        }

        event(new AuctionStarted($auction));

        // Notify registered users
        $this->notifyRegisteredUsers($auction, 'بدأ المزاد!', 'مزاد ' . $auction->title . ' قد بدأ الآن!');

        Log::info("Auction {$auction->id} started");
        return true;
    }

    /**
     * End an auction
     */
    public function endAuction(Auction $auction): bool
    {
        if (!in_array($auction->status, ['live', 'extended', 'paused'])) {
            throw new \Exception('المزاد ليس نشطاً');
        }

        return DB::transaction(function () use ($auction) {
            // Get winning bid
            $winningBid = $auction->bids()
                ->where('status', 'valid')
                ->orderBy('amount', 'desc')
                ->first();

            if ($winningBid) {
                $winningBid->update(['status' => 'winning']);

                // Check reserve price
                $car = $auction->car;
                $reserveMet = !$car->reserve_price || $winningBid->amount >= $car->reserve_price;

                if ($reserveMet) {
                    $auction->update([
                        'status' => 'ended',
                        'actual_end' => now(),
                        'winner_id' => $winningBid->user_id,
                        'winner_type' => $winningBid->user_type,
                        'winner_name' => $winningBid->bidder_name,
                        'winner_phone' => $winningBid->bidder_phone,
                        'final_price' => $winningBid->amount,
                        'payment_status' => 'awaiting_payment',
                        'payment_deadline' => now()->addDays(3),
                    ]);

                    $car->update(['status' => 'sold']);

                    // Mark winner registration
                    $this->markWinnerRegistration($auction, $winningBid);

                    // Release non-winner deposits
                    $this->releaseNonWinnerDeposits($auction, $winningBid->user_id, $winningBid->user_type);

                    // Notify winner
                    $this->notifyWinner($auction, $winningBid);
                } else {
                    // Reserve not met
                    $auction->update([
                        'status' => 'ended',
                        'actual_end' => now(),
                        'payment_status' => 'n/a',
                    ]);
                    $car->update(['status' => 'unsold']);
                    $this->releaseAllDeposits($auction);
                }
            } else {
                // No bids
                $auction->update([
                    'status' => 'ended',
                    'actual_end' => now(),
                ]);
                $auction->car->update(['status' => 'unsold']);
                $this->releaseAllDeposits($auction);
            }

            event(new AuctionEnded($auction->fresh()));
            Log::info("Auction {$auction->id} ended. Winner: " . ($auction->winner_id ?? 'none'));
            return true;
        });
    }

    /**
     * Cancel an auction
     */
    public function cancelAuction(Auction $auction, string $reason): bool
    {
        if (in_array($auction->status, ['cancelled', 'completed'])) {
            throw new \Exception('لا يمكن إلغاء هذا المزاد');
        }

        return DB::transaction(function () use ($auction, $reason) {
            // Release all deposits
            $this->releaseAllDeposits($auction);

            $auction->update([
                'status' => 'cancelled',
                'actual_end' => now(),
                'cancellation_reason' => $reason,
            ]);

            // Reset car status
            if ($auction->car) {
                $auction->car->update(['status' => 'approved']);
            }

            // Notify users
            $this->notifyRegisteredUsers(
                $auction,
                'تم إلغاء المزاد ⚠️',
                'تم إلغاء المزاد: ' . $auction->title . '. السبب: ' . $reason
            );

            event(new AuctionEnded($auction));
            Log::info("Auction {$auction->id} cancelled. Reason: {$reason}");
            return true;
        });
    }

    /**
     * Pause an auction
     */
    public function pauseAuction(Auction $auction, string $reason = ''): bool
    {
        if (!in_array($auction->status, ['live', 'extended'])) {
            throw new \Exception('المزاد ليس نشطاً');
        }

        $auction->update([
            'status' => 'paused',
            'pause_reason' => $reason,
            'paused_at' => now(),
        ]);

        // Notify users
        $this->notifyRegisteredUsers(
            $auction,
            'تم إيقاف المزاد مؤقتاً ⏸️',
            'تم إيقاف المزاد: ' . $auction->title . ' مؤقتاً.' . ($reason ? ' السبب: ' . $reason : '')
        );

        Log::info("Auction {$auction->id} paused");
        return true;
    }

    /**
     * Resume a paused auction
     */
    public function resumeAuction(Auction $auction, int $additionalMinutes = 0): bool
    {
        if ($auction->status !== 'paused') {
            throw new \Exception('المزاد ليس متوقفاً');
        }

        $newEnd = $auction->scheduled_end;
        if ($additionalMinutes > 0) {
            $newEnd = $newEnd->addMinutes($additionalMinutes);
        }

        $auction->update([
            'status' => 'live',
            'scheduled_end' => $newEnd,
            'pause_reason' => null,
            'paused_at' => null,
        ]);

        $this->notifyRegisteredUsers(
            $auction,
            'استأنف المزاد ▶️',
            'استأنف المزاد: ' . $auction->title
        );

        Log::info("Auction {$auction->id} resumed");
        return true;
    }

    /**
     * Extend an auction
     */
    public function extendAuction(Auction $auction, int $minutes): bool
    {
        if (!in_array($auction->status, ['live', 'extended'])) {
            throw new \Exception('المزاد ليس نشطاً');
        }

        $newEnd = ($auction->actual_end ?? $auction->scheduled_end)->addMinutes($minutes);

        $auction->update([
            'status' => 'extended',
            'actual_end' => $newEnd,
            'extensions_used' => $auction->extensions_used + 1,
        ]);

        event(new AuctionExtended($auction, $auction->time_remaining));

        $this->notifyRegisteredUsers(
            $auction,
            'تم تمديد المزاد ⏰',
            'تم تمديد مزاد ' . $auction->title . ' لمدة ' . $minutes . ' دقيقة إضافية.'
        );

        return true;
    }

    /**
     * Release all deposits for an auction
     */
    public function releaseAllDeposits(Auction $auction): void
    {
        $registrations = $auction->registrations()
            ->whereNotNull('wallet_hold_id')
            ->whereIn('status', ['registered', 'participated', 'winner'])
            ->get();

        foreach ($registrations as $registration) {
            $this->releaseDeposit($registration, $auction);
        }
    }

    /**
     * Release deposits for non-winners only
     */
    public function releaseNonWinnerDeposits(Auction $auction, string $winnerId, string $winnerType): void
    {
        $registrations = $auction->registrations()
            ->where(function ($query) use ($winnerId, $winnerType) {
                $query->where('user_id', '!=', $winnerId)
                    ->orWhere('user_type', '!=', $winnerType);
            })
            ->whereIn('status', ['registered', 'participated'])
            ->get();

        foreach ($registrations as $registration) {
            $this->releaseDeposit($registration, $auction);
        }
    }

    /**
     * Release a single deposit
     */
    private function releaseDeposit(AuctionRegistration $registration, Auction $auction): void
    {
        try {
            DB::transaction(function () use ($registration, $auction) {
                if ($registration->wallet_hold_id) {
                    $hold = UserWalletHold::find($registration->wallet_hold_id);
                    if ($hold && $hold->status === 'active') {
                        $hold->release();
                    }
                }

                $registration->update([
                    'status' => 'deposit_released',
                    'deposit_released_at' => now(),
                ]);

                // Notify user
                $notification = Notification::create([
                    'user_id' => $registration->user_id,
                    'title' => 'تم استرداد مبلغ التأمين',
                    'message' => 'تم تحرير مبلغ التأمين لمزاد ' . $auction->title,
                    'type' => 'INFO',
                    'data' => json_encode(['auction_id' => $auction->id]),
                    'read' => false,
                ]);
                event(new UserNotification($registration->user_id, $notification->toArray()));
            });
        } catch (\Exception $e) {
            Log::warning("Failed to release deposit for registration {$registration->id}: " . $e->getMessage());
        }
    }

    /**
     * Mark winner registration
     */
    private function markWinnerRegistration(Auction $auction, $winningBid): void
    {
        $auction->registrations()
            ->where('user_id', $winningBid->user_id)
            ->where('user_type', $winningBid->user_type)
            ->update(['status' => 'winner']);
    }

    /**
     * Notify winner
     */
    private function notifyWinner(Auction $auction, $winningBid): void
    {
        try {
            $notification = Notification::create([
                'user_id' => $winningBid->user_id,
                'title' => 'مبروك! فزت بالمزاد 🎉',
                'message' => 'لقد فزت بمزاد ' . $auction->title . ' بمبلغ ' . number_format((float) $winningBid->amount) . '. سيتم التواصل معك لإتمام عملية الدفع.',
                'type' => 'AUCTION_WON',
                'data' => json_encode(['auction_id' => $auction->id]),
                'read' => false,
            ]);
            event(new UserNotification($winningBid->user_id, $notification->toArray()));
        } catch (\Exception $e) {
            Log::warning("Failed to notify winner: " . $e->getMessage());
        }
    }

    /**
     * Notify all registered users
     */
    public function notifyRegisteredUsers(Auction $auction, string $title, string $message): void
    {
        $registrations = $auction->registrations()
            ->whereIn('status', ['registered', 'participated', 'winner'])
            ->get();

        foreach ($registrations as $registration) {
            try {
                $notification = Notification::create([
                    'user_id' => $registration->user_id,
                    'title' => $title,
                    'message' => $message,
                    'type' => 'AUCTION_UPDATE',
                    'data' => json_encode(['auction_id' => $auction->id]),
                    'read' => false,
                ]);
                event(new UserNotification($registration->user_id, $notification->toArray()));
            } catch (\Exception $e) {
                Log::warning("Failed to notify user {$registration->user_id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Broadcast an auctioneer announcement
     */
    public function broadcastAnnouncement(Auction $auction, string $message, string $type = 'info'): bool
    {
        if (!in_array($auction->status, ['live', 'extended', 'paused'])) {
            throw new \Exception('المزاد ليس نشطاً');
        }

        // Broadcast via WebSocket
        broadcast(new \App\Events\AuctionAnnouncement($auction, $message, $type))->toOthers();

        Log::info("Auction {$auction->id} announcement: {$message}");
        return true;
    }
}
