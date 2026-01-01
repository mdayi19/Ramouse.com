<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use App\Services\WhatsAppService;

class WhatsAppChannel
{
    protected $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        if (!method_exists($notification, 'toWhatsApp')) {
            return;
        }

        $messageData = $notification->toWhatsApp($notifiable);
        $phone = $notifiable->routeNotificationFor('whatsapp') ?? $notifiable->phone ?? $notifiable->id; // Fallback to ID/Phone if routeNotificationFor not defined

        // Extract data
        $content = $messageData['message'] ?? '';
        $type = $messageData['type'] ?? 'notification';
        $file = $messageData['file'] ?? null;

        if (empty($content)) {
            return;
        }

        $this->whatsappService->sendTextMessage($phone, $content, $type, $file);
    }
}
