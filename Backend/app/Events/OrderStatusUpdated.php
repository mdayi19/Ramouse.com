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

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $previousStatus;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order, string $previousStatus)
    {
        $this->order = $order;
        $this->previousStatus = $previousStatus;
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
        return 'order.status.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'order' => [
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
                'previous_status' => $this->previousStatus,
                'updated_at' => $this->order->updated_at,
            ],
            'message' => 'تم تحديث حالة الطلب',
        ];
    }
}
