<?php

namespace App\Events;

use App\Models\Review;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReviewModerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $review;
    public $customerId;

    /**
     * Create a new event instance.
     */
    public function __construct(Review $review, $customerId)
    {
        $this->review = $review;
        $this->customerId = $customerId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->customerId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'review.moderated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $statusText = $this->review->status === 'approved' ? 'تم قبول' : 'تم رفض';
        return [
            'review' => $this->review,
            'message' => $statusText . ' تقييمك',
            'status' => $this->review->status,
        ];
    }
}
