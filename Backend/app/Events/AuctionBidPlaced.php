<?php

namespace App\Events;

use App\Models\Auction;
use App\Models\AuctionBid;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a new bid is placed in an auction
 */
class AuctionBidPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;
    public AuctionBid $bid;

    public function __construct(Auction $auction, AuctionBid $bid)
    {
        $this->auction = $auction;
        $this->bid = $bid;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('auction.' . $this->auction->id),
            new Channel('auction-updates.' . $this->auction->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'bid.placed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'bid' => [
                'id' => $this->bid->id,
                'amount' => (float) $this->bid->amount,
                'bidderName' => $this->bid->anonymized_name,
                'bidTime' => $this->bid->bid_time->toIso8601String(),
                'isAutoBid' => $this->bid->is_auto_bid,
            ],
            'auction' => [
                'id' => $this->auction->id,
                'currentBid' => (float) $this->auction->current_bid,
                'minimumBid' => (float) $this->auction->minimum_bid,
                'bidCount' => $this->auction->bid_count,
                'timeRemaining' => $this->auction->time_remaining,
                'status' => $this->auction->status,
                'extensionsUsed' => $this->auction->extensions_used,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
