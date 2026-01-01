<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event for customer order updates.
 * Broadcasts to the user's private channel for real-time order updates.
 */
class CustomerOrderEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int|string $userId;
    public string $eventType;
    public array $data;

    /**
     * Event types:
     * - quote.received - when a provider submits a quote
     * - order.status_updated - when order status changes
     * - payment.updated - when payment is approved/rejected
     */
    public function __construct(int|string $userId, string $eventType, array $data = [])
    {
        $this->userId = $userId;
        $this->eventType = $eventType;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return $this->eventType;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return array_merge($this->data, [
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
