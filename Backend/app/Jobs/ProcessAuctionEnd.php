<?php

namespace App\Jobs;

use App\Events\AuctionEnded;
use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\UserWalletHold;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
                // Update auction with winner
                $auction->update([
                    'status' => 'ended',
                    'actual_end' => now(),
                    'winner_id' => $winningBid->user_id,
                    'winner_type' => $winningBid->user_type,
                    'final_price' => $winningBid->amount,
                    'payment_status' => 'pending',
                ]);

                // Update car status
                $car->update(['status' => 'sold']);

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
                DB::transaction(function () use ($registration) {
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
                DB::transaction(function () use ($registration) {
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
                });
            } catch (\Exception $e) {
                Log::warning("Failed to release deposit for registration {$registration->id}: " . $e->getMessage());
            }
        }
    }
}
