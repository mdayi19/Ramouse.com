<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $categories;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order, array $categories)
    {
        $this->order = $order;
        $this->categories = $categories;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to each category channel that matches this order
        $channels = [new Channel('orders')];

        foreach ($this->categories as $category) {
            $channels[] = new Channel('orders.category.' . $category);
        }

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
        // form_data is cast to array in Order model
        $formData = $this->order->form_data;

        return [
            'order' => [
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
                'date' => $this->order->date,
                'category' => $formData['category'] ?? null,
                'brand' => $formData['brand'] ?? null,
                'model' => $formData['model'] ?? null,
                'part_types' => $formData['partTypes'] ?? [],
            ],
            'message' => 'طلب جديد متاح',
        ];
    }
}
