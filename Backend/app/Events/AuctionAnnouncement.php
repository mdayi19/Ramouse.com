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
 * Auctioneer announcement event
 * Broadcasts messages to all participants in a live auction
 */
class AuctionAnnouncement implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Auction $auction;
    public string $message;
    public string $type;

    public function __construct(Auction $auction, string $message, string $type = 'info')
    {
        $this->auction = $auction;
        $this->message = $message;
        $this->type = $type;
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
        return 'auctioneer.announcement';
    }

    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auction->id,
            'message' => $this->message,
            'type' => $this->type, // info, warning, going_once, going_twice, sold
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
