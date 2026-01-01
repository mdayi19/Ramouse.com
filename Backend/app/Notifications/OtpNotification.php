<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\WhatsAppChannel;

class OtpNotification extends Notification
{
    use Queueable;

    protected $otp;

    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    public function via($notifiable)
    {
        return [WhatsAppChannel::class];
    }

    public function toWhatsApp($notifiable)
    {
        return [
            'type' => 'verification',
            'message' => __('notifications.otp_message', ['otp' => $this->otp]),
        ];
    }
}
