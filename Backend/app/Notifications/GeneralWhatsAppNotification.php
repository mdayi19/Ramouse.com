<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\WhatsAppChannel;

class GeneralWhatsAppNotification extends Notification
{
    use Queueable;

    protected $type;
    protected $params;
    protected $file;

    public function __construct(string $type, array $params = [], ?string $file = null)
    {
        $this->type = $type;
        $this->params = $params;
        $this->file = $file;
    }

    public function via($notifiable)
    {
        return [WhatsAppChannel::class];
    }

    public function toWhatsApp($notifiable)
    {
        // Construct message key
        $key = 'notifications.' . $this->type;

        // Translate message
        $message = __($key, $this->params);

        return [
            'type' => 'notification',
            'message' => $message,
            'file' => $this->file
        ];
    }
}
