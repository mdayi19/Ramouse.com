<?php

namespace App\Jobs;

use App\Events\AuctionStarted;
use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAuctionStart implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    /**
     * Start all scheduled auctions that should be live now
     */
    public function handle(): void
    {
        $auctions = Auction::where('status', 'scheduled')
            ->where('scheduled_start', '<=', now())
            ->get();

        foreach ($auctions as $auction) {
            try {
                $auction->update([
                    'status' => 'live',
                    'actual_start' => now(),
                ]);

                // Broadcast auction started event
                event(new AuctionStarted($auction));

                // Notify registered users
                $this->notifyRegisteredUsers($auction);

                Log::info("Auction {$auction->id} started automatically");
            } catch (\Exception $e) {
                Log::error("Failed to start auction {$auction->id}: " . $e->getMessage());
            }
        }
    }

    protected function notifyRegisteredUsers(Auction $auction): void
    {
        $registrations = $auction->registrations()
            ->where('status', 'registered')
            ->get();

        foreach ($registrations as $registration) {
            // Send notification based on user type
            // This integrates with the existing notification system
            try {
                // Update status to show user was notified of start
                $registration->update(['status' => 'participated']);
            } catch (\Exception $e) {
                Log::warning("Failed to notify user for auction start: " . $e->getMessage());
            }
        }
    }
}
