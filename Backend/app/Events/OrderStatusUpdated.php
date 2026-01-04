<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $previousStatus;

    public function __construct(Order $order, string $previousStatus)
    {
        $this->order = $order;
        $this->previousStatus = $previousStatus;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('orders.' . $this->order->order_number),
            new PrivateChannel('admin.orders'),
        ];

        // Resolve user
        $user = User::where('phone', $this->order->user_id)->orWhere('id', $this->order->user_id)->first();
        if ($user) {
            $channels[] = new PrivateChannel('user.' . $user->id);
        }

        // Also notify provider if assigned
        if ($this->order->acceptedQuote && $this->order->acceptedQuote->provider_id) {
            $providerUser = User::where('phone', $this->order->acceptedQuote->provider_id)->first();
            if ($providerUser) {
                $channels[] = new PrivateChannel('user.' . $providerUser->id);
            }
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.status_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order' => [
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
                'previous_status' => $this->previousStatus,
                'updated_at' => $this->order->updated_at->toIso8601String(),
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
