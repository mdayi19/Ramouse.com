<?php

namespace App\Events;

use App\Models\Auction;
use App\Models\AuctionBid;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserOutbid implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public AuctionBid $bid;
    public Auction $auction;
    public float $newAmount;

    public function __construct(AuctionBid $bid, Auction $auction, float $newAmount)
    {
        $this->bid = $bid;
        $this->auction = $auction;
        $this->newAmount = $newAmount;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Send to user's private channel
        return [new PrivateChannel("user.{$this->bid->user_id}")];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'outbid';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auction->id,
            'auction_title' => $this->auction->title,
            'your_bid' => (float) $this->bid->amount,
            'new_bid' => $this->newAmount,
            'minimum_bid' => (float) $this->auction->minimum_bid,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
