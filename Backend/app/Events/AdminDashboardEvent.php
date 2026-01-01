<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Consolidated event for admin dashboard real-time updates.
 * Broadcasts to the admin.dashboard private channel with various event types.
 */
class AdminDashboardEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $eventType;
    public array $data;

    /**
     * Event types:
     * - order.created, order.status_updated, order.quote_received, order.payment_updated
     * - provider.registered, provider.updated, provider.balance_changed
     * - withdrawal.requested, withdrawal.processed
     * - store_order.created, store_order.updated
     * - user.registered
     * - technician.registered, technician.status_updated
     * - tow_truck.registered, tow_truck.status_updated
     */
    public function __construct(string $eventType, array $data = [])
    {
        $this->eventType = $eventType;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'admin.' . $this->eventType;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => $this->eventType,
            'data' => $this->data,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
