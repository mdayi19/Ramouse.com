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
 * Broadcast when auction is paused
 */
class AuctionPaused implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;
    public string $reason;

    public function __construct(Auction $auction, string $reason = '')
    {
        $this->auction = $auction;
        $this->reason = $reason;
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
        return 'auction.paused';
    }

    public function broadcastWith(): array
    {
        return [
            'auction' => [
                'id' => $this->auction->id,
                'status' => 'paused',
                'reason' => $this->reason,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
