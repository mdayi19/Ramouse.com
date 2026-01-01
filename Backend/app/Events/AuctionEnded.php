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
 * Broadcast when an auction ends
 */
class AuctionEnded implements ShouldBroadcast
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
        return 'auction.ended';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $hasWinner = $this->auction->winner_id !== null;

        return [
            'auction' => [
                'id' => $this->auction->id,
                'title' => $this->auction->title,
                'carId' => $this->auction->auction_car_id,
                'status' => 'ended',
                'hasWinner' => $hasWinner,
                'finalPrice' => $hasWinner ? (float) $this->auction->final_price : null,
                'winnerName' => $hasWinner ? $this->auction->winner_name : null,
                'bidCount' => $this->auction->bid_count,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
