<?php

namespace App\Events;

use App\Models\InternationalLicenseRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InternationalLicenseStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $licenseRequest;

    /**
     * Create a new event instance.
     */
    public function __construct(InternationalLicenseRequest $licenseRequest)
    {
        $this->licenseRequest = $licenseRequest;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('admin.dashboard'),
            new PrivateChannel('international-license.' . $this->licenseRequest->order_number),
        ];

        // Add user-specific channel if user exists
        if ($this->licenseRequest->user_id) {
            $channels[] = new PrivateChannel('user.' . $this->licenseRequest->user_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'international-license.status.changed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'license_request' => [
                'id' => $this->licenseRequest->id,
                'order_number' => $this->licenseRequest->order_number,
                'status' => $this->licenseRequest->status,
                'payment_status' => $this->licenseRequest->payment_status,
                'full_name' => $this->licenseRequest->full_name,
                'updated_at' => $this->licenseRequest->updated_at,
            ],
            'message' => 'تم تحديث حالة طلب الرخصة الدولية',
        ];
    }
}
