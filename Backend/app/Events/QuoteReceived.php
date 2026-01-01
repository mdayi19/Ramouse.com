<?php

namespace App\Events;

use App\Models\Quote;
use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
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
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Resolve user ID from the phone number stored in order
        $user = \App\Models\User::where('phone', $this->order->user_id)->first();

        $channels = [
            new PrivateChannel('orders.' . $this->order->order_number),
            new PrivateChannel('admin.dashboard'),
        ];

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
                'timestamp' => $this->quote->timestamp,
            ],
            'order' => [
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
            ],
            'message' => 'تم استلام عرض سعر جديد',
        ];
    }
}
