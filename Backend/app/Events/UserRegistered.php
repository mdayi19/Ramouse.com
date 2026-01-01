<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserRegistered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userData;
    public $userType;

    /**
     * Create a new event instance.
     *
     * @param array $userData User data (name, phone, etc.)
     * @param string $userType Type of user: 'customer', 'technician', 'tow_truck'
     */
    public function __construct($userData, $userType)
    {
        $this->userData = $userData;
        $this->userType = $userType;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'user.registered';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $typeLabels = [
            'customer' => 'عميل',
            'technician' => 'فني',
            'tow_truck' => 'سطحة',
        ];

        return [
            'user' => [
                'type' => $this->userType,
                'typeLabel' => $typeLabels[$this->userType] ?? 'مستخدم',
                'name' => $this->userData['name'] ?? 'غير معروف',
                'phone' => $this->userData['phone'] ?? $this->userData['id'] ?? '',
                'registered_at' => now()->toIso8601String(),
            ],
            'message' => 'مستخدم جديد: ' . ($typeLabels[$this->userType] ?? 'مستخدم'),
        ];
    }
}
