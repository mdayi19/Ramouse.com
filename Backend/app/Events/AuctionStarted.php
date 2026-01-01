<?php

namespace App\Events;

use App\Models\Auction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when an auction starts
 */
class AuctionStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;

    public function __construct(Auction $auction)
    {
        $this->auction = $auction;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('auction.' . $this->auction->id),
            new Channel('auction-updates.' . $this->auction->id),
            new Channel('auctions'), // Public channel for listing updates
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'auction.started';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'auction' => [
                'id' => $this->auction->id,
                'title' => $this->auction->title,
                'carId' => $this->auction->auction_car_id,
                'carTitle' => $this->auction->car->title ?? '',
                'startingBid' => (float) $this->auction->starting_bid,
                'currentBid' => (float) $this->auction->current_bid,
                'minimumBid' => (float) $this->auction->minimum_bid,
                'bidIncrement' => (float) $this->auction->bid_increment,
                'scheduledEnd' => $this->auction->scheduled_end->toIso8601String(),
                'status' => 'live',
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
