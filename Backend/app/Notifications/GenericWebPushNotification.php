<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class GenericWebPushNotification extends Notification
{
    use Queueable;

    public $title;
    public $message;
    public $link;
    public $actionTitle;
    public $type;
    public $tag;

    /**
     * Create a new notification instance.
     *
     * @param string $title - Notification title
     * @param string $message - Notification body
     * @param string|null $link - Deep link URL (e.g., '/my-orders', '/dashboard')
     * @param string $actionTitle - Primary action button text
     * @param string $type - Notification type for grouping (e.g., 'order', 'wallet', 'general')
     */
    public function __construct(
        $title,
        $message,
        $link = null,
        $actionTitle = "عرض",
        $type = 'general'
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->link = $link;
        $this->actionTitle = $actionTitle;
        $this->type = $type;
        $this->tag = 'ramouse-' . $type; // For notification grouping
    }

    public function via($notifiable)
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification)
    {
        $message = (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon('/pwa-192x192.png')
            ->badge('/pwa-192x192.png')
            ->tag($this->tag) // Grouping tag
            ->renotify() // Alert even if grouped
            ->data([
                'url' => $this->link ?? '/',
                'type' => $this->type,
            ]);

        // Add action button
        if ($this->link) {
            $message->action($this->actionTitle, 'view');
        }

        return $message;
    }
}
