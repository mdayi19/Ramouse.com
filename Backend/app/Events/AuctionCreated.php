<?php

namespace App\Events;

use App\Models\Auction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $auction;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct(Auction $auction)
    {
        $this->auction = $auction;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return [
            new Channel('auctions'), // Public channel for listing pages
            new PrivateChannel('admin.dashboard'), // Admin channel for dashboard
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'auction.created';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'auction' => $this->auction->load('car', 'car.media'),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
