<?php

namespace App\Jobs;

use App\Events\AuctionEnded;
use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\UserWalletHold;
use App\Models\UserTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Notification;
use App\Events\UserNotification;

class ProcessAuctionEnd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    /**
     * End all live/extended auctions that have passed their end time
     */
    public function handle(): void
    {
        $auctions = Auction::whereIn('status', ['live', 'extended'])
            ->where('scheduled_end', '<=', now())
            ->get();

        foreach ($auctions as $auction) {
            try {
                DB::transaction(function () use ($auction) {
                    $this->endAuction($auction);
                });
            } catch (\Exception $e) {
                Log::error("Failed to end auction {$auction->id}: " . $e->getMessage());
            }
        }
    }

    protected function endAuction(Auction $auction): void
    {
        // Get the winning bid (highest valid bid)
        $winningBid = $auction->bids()
            ->where('status', 'valid')
            ->orderBy('amount', 'desc')
            ->first();

        if ($winningBid) {
            // Mark bid as winning
            $winningBid->update(['status' => 'winning']);

            // Check if reserve price is met
            $car = $auction->car;
            $reserveMet = !$car->reserve_price || $winningBid->amount >= $car->reserve_price;

            if ($reserveMet) {
                // FIXED: Update auction with winner, winner_name, payment_deadline, and correct payment_status
                $auction->update([
                    'status' => 'ended',
                    'actual_end' => now(),
                    'winner_id' => $winningBid->user_id,
                    'winner_type' => $winningBid->user_type,
                    'winner_name' => $winningBid->bidder_name,
                    'final_price' => $winningBid->amount,
                    'payment_status' => 'awaiting_payment',
                    'payment_deadline' => now()->addDays(3),
                ]);

                // Update car status
                $car->update(['status' => 'sold']);

                // Update winner registration status
                $auction->registrations()
                    ->where('user_id', $winningBid->user_id)
                    ->where('user_type', $winningBid->user_type)
                    ->update(['status' => 'winner']);

                // Notify winner
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
                    Log::warning("Failed to notify winner {$winningBid->user_id}: " . $e->getMessage());
                }

                // Keep winner's deposit held
                // Release all other deposits
                $this->releaseNonWinnerDeposits($auction, $winningBid->user_id, $winningBid->user_type);
            } else {
                // Reserve not met - no winner
                $auction->update([
                    'status' => 'ended',
                    'actual_end' => now(),
                    'payment_status' => 'n/a',
                ]);

                // Release all deposits
                $this->releaseAllDeposits($auction);

                // Update car status
                $car->update(['status' => 'unsold']);
            }
        } else {
            // No bids - end without winner
            $auction->update([
                'status' => 'ended',
                'actual_end' => now(),
            ]);

            // Release all deposits
            $this->releaseAllDeposits($auction);

            // Update car status
            $auction->car->update(['status' => 'unsold']);
        }

        // Broadcast auction ended event
        event(new AuctionEnded($auction));

        Log::info("Auction {$auction->id} ended. Winner: " . ($auction->winner_id ?? 'none'));
    }

    protected function releaseNonWinnerDeposits(Auction $auction, string $winnerId, string $winnerType): void
    {
        $registrations = $auction->registrations()
            ->where(function ($query) use ($winnerId, $winnerType) {
                $query->where('user_id', '!=', $winnerId)
                    ->orWhere('user_type', '!=', $winnerType);
            })
            ->whereIn('status', ['registered', 'participated'])
            ->get();

        foreach ($registrations as $registration) {
            try {
                DB::transaction(function () use ($registration, $auction) {
                    if ($registration->wallet_hold_id) {
                        $hold = UserWalletHold::find($registration->wallet_hold_id);
                        if ($hold && $hold->status === 'active') {
                            $hold->release();

                            // Add to wallet history (transaction record for release)
                            UserTransaction::create([
                                'user_id' => $registration->user_id,
                                'user_type' => $registration->user_type,
                                'type' => 'release',
                                'amount' => $hold->amount,
                                'description' => 'تحرير تأمين المزاد: ' . $auction->title,
                                'reference_type' => 'wallet_hold',
                                'reference_id' => $hold->id,
                                'balance_after' => null, // Balance unchanged
                            ]);
                        }
                    }

                    $registration->update([
                        'status' => 'deposit_released',
                        'deposit_released_at' => now(),
                    ]);

                    // Notify user
                    try {
                        $notification = Notification::create([
                            'user_id' => $registration->user_id,
                            'title' => 'تم استرداد مبلغ التأمين',
                            'message' => 'انتهى المزاد ' . $auction->title . ' ولم تفز به. تم تحرير مبلغ التأمين.',
                            'type' => 'INFO',
                            'data' => json_encode(['auction_id' => $auction->id]),
                            'read' => false,
                        ]);
                        event(new UserNotification($registration->user_id, $notification->toArray()));
                    } catch (\Exception $e) {
                        Log::warning("Failed to notify user {$registration->user_id}: " . $e->getMessage());
                    }
                });
            } catch (\Exception $e) {
                Log::warning("Failed to release deposit for registration {$registration->id}: " . $e->getMessage());
            }
        }
    }

    protected function releaseAllDeposits(Auction $auction): void
    {
        $registrations = $auction->registrations()
            ->whereIn('status', ['registered', 'participated'])
            ->get();

        foreach ($registrations as $registration) {
            try {
                DB::transaction(function () use ($registration, $auction) {
                    if ($registration->wallet_hold_id) {
                        $hold = UserWalletHold::find($registration->wallet_hold_id);
                        if ($hold && $hold->status === 'active') {
                            $hold->release();

                            // Add to wallet history (transaction record for release)
                            UserTransaction::create([
                                'user_id' => $registration->user_id,
                                'user_type' => $registration->user_type,
                                'type' => 'release',
                                'amount' => $hold->amount,
                                'description' => 'تحرير تأمين المزاد: ' . $auction->title,
                                'reference_type' => 'wallet_hold',
                                'reference_id' => $hold->id,
                                'balance_after' => null, // Balance unchanged
                            ]);
                        }
                    }

                    $registration->update([
                        'status' => 'deposit_released',
                        'deposit_released_at' => now(),
                    ]);

                    // Notify user
                    try {
                        $notification = Notification::create([
                            'user_id' => $registration->user_id,
                            'title' => 'تم استرداد مبلغ التأمين',
                            'message' => 'انتهى المزاد ' . $auction->title . ' (لم يتم البيع). تم تحرير مبلغ التأمين.',
                            'type' => 'INFO',
                            'data' => json_encode(['auction_id' => $auction->id]),
                            'read' => false,
                        ]);
                        event(new UserNotification($registration->user_id, $notification->toArray()));
                    } catch (\Exception $e) {
                        Log::warning("Failed to notify user {$registration->user_id}: " . $e->getMessage());
                    }
                });
            } catch (\Exception $e) {
                Log::warning("Failed to release deposit for registration {$registration->id}: " . $e->getMessage());
            }
        }
    }
}
