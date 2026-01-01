<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $notification;

    /**
     * Create a new event instance.
     */
    public function __construct(int|string $userId, array $notification)
    {
        $this->userId = $userId;
        $this->notification = $notification;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // If userId looks like a phone number (starts with +), try to resolve it
        if (is_string($this->userId) && str_starts_with($this->userId, '+')) {
            $user = \App\Models\User::where('phone', $this->userId)->first();
            $targetId = $user ? $user->id : null;
        } else {
            $targetId = $this->userId;
        }

        if (!$targetId) {
            return [];
        }

        return [
            new PrivateChannel('user.' . $targetId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'user.notification';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => $this->notification,
        ];
    }
}
