<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\WhatsAppService;
use App\Notifications\OtpNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WhatsAppIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_whatsapp_config_loads_from_env_fallback()
    {
        // Ensure config is set
        Config::set('services.whatsapp.app_key', 'test_app_key');
        Config::set('services.whatsapp.auth_key', 'test_auth_key');

        // We don't seed DB, so SystemSetting should be empty, triggering fallback

        $service = new WhatsAppService();

        Http::fake([
            '*' => Http::response(['message_status' => 'Success'], 200)
        ]);

        $result = $service->sendOTP('1234567890', '123456');

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return $request['appkey'] == 'test_app_key' &&
                $request['authkey'] == 'test_auth_key' &&
                str_contains($request['message'], '123456');
        });
    }

    public function test_otp_notification_sends_via_whatsapp_channel()
    {
        Notification::fake();

        // Trigger notification manually or via route
        Notification::route('whatsapp', '1234567890')
            ->notify(new OtpNotification('999999'));

        Notification::assertSentTo(
            new \Illuminate\Notifications\AnonymousNotifiable,
            OtpNotification::class,
            function ($notification, $channels, $notifiable) {
                return in_array(\App\Notifications\Channels\WhatsAppChannel::class, $channels);
            }
        );
    }

    public function test_localization_works()
    {
        $this->app->setLocale('ar');
        $notification = new OtpNotification('123');
        $data = $notification->toWhatsApp(null);

        // With corrected lang file, this should match
        $this->assertStringContainsString('123', $data['message']);
        $this->assertStringContainsString('رمز التحقق الخاص بك هو', $data['message']);
    }
}
