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
 * Broadcast when auction is resumed
 */
class AuctionResumed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;

    public function __construct(Auction $auction)
    {
        $this->auction = $auction;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('auction.' . $this->auction->id),
            new Channel('auction-updates.' . $this->auction->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'auction.resumed';
    }

    public function broadcastWith(): array
    {
        return [
            'auction' => [
                'id' => $this->auction->id,
                'status' => 'live',
                'scheduledEnd' => $this->auction->scheduled_end?->toIso8601String(),
                'timeRemaining' => $this->auction->time_remaining,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
