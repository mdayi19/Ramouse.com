<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // 1. Admin Channel (Always)
        $channels = [
            new PrivateChannel('admin.orders'),
            new PrivateChannel('providers.updates'), // Notify all providers of new open order
        ];

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.created';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        // Ensure consistent payload structure
        $formData = $this->order->form_data;

        return [
            'order' => [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
                'date' => $this->order->created_at->toIso8601String(),
                'category' => $formData['category'] ?? null,
                'brand' => $formData['brand'] ?? null,
                'model' => $formData['model'] ?? null,
                'part_types' => $formData['partTypes'] ?? [],
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
