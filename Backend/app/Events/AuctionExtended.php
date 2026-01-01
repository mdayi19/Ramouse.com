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
 * Broadcast when an auction is extended due to last-second bidding
 */
class AuctionExtended implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;
    public int $newTimeRemaining;

    public function __construct(Auction $auction, int $newTimeRemaining)
    {
        $this->auction = $auction;
        $this->newTimeRemaining = $newTimeRemaining;
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
        return 'auction.extended';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'auction' => [
                'id' => $this->auction->id,
                'status' => 'extended',
                'newEndTime' => $this->auction->actual_end->toIso8601String(),
                'timeRemaining' => $this->newTimeRemaining,
                'extensionsUsed' => $this->auction->extensions_used,
                'maxExtensions' => $this->auction->max_extensions,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
