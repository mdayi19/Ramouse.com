<?php

namespace App\Events;

use App\Models\Quote;
use App\Models\Order;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $quote;
    public $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Quote $quote, Order $order)
    {
        $this->quote = $quote;
        $this->order = $order;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // 1. Order Channel (for anyone authorized to view this order)
        $channels = [
            new PrivateChannel('orders.' . $this->order->order_number),
            new PrivateChannel('admin.orders')
        ];

        // 2. Resolve User ID logic (Ideally this should be passed in, but we handle it here for now)
        // We need to support the existing architecture where user_id might be a phone number
        $user = User::where('phone', $this->order->user_id)->orWhere('id', $this->order->user_id)->first();

        if ($user) {
            $channels[] = new PrivateChannel('user.' . $user->id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'quote.received';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'quote' => [
                'id' => $this->quote->id,
                'provider_name' => $this->quote->provider_name,
                'provider_unique_id' => $this->quote->provider_unique_id,
                'price' => $this->quote->price,
                'part_status' => $this->quote->part_status,
                'created_at' => $this->quote->created_at->toIso8601String(),
                'media' => $this->quote->media,
            ],
            'order' => [
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
