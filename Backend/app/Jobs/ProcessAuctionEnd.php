<?php

namespace App\Jobs;

use App\Models\Auction;
use App\Services\AuctionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Process auction endings via queue
 * Uses AuctionService for centralized auction lifecycle management
 * 
 * This job is scheduled to run every minute via Laravel scheduler.
 * It finds all auctions that should have ended and delegates to AuctionService
 * for consistent end-of-auction logic including:
 * - Determining winner
 * - Releasing deposits
 * - Sending notifications
 */
class ProcessAuctionEnd implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    /**
     * End all live/extended auctions that have passed their end time
     * Delegates to AuctionService for consistent logic
     */
    public function handle(AuctionService $auctionService): void
    {
        $auctions = Auction::whereIn('status', ['live', 'extended'])
            ->where('scheduled_end', '<=', now())
            ->get();

        if ($auctions->isEmpty()) {
            return;
        }

        Log::info("ProcessAuctionEnd: Found {$auctions->count()} auctions to end");

        foreach ($auctions as $auction) {
            try {
                // Use centralized AuctionService for consistent logic
                $auctionService->endAuction($auction);
                Log::info("ProcessAuctionEnd: Auction {$auction->id} ended successfully");
            } catch (\Exception $e) {
                Log::error("ProcessAuctionEnd: Failed to end auction {$auction->id}: " . $e->getMessage(), [
                    'exception' => $e,
                    'auction_id' => $auction->id,
                ]);
            }
        }
    }
}
