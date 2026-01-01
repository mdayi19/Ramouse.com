<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class WhatsAppService
{
    private string $defaultApiUrl;
    private $defaultAppKey;
    private $defaultAuthKey;

    public function __construct()
    {
        // Load default configuration from env/config
        $this->defaultApiUrl = config('services.whatsapp.api_url', 'https://whatsoio.com/api/create-message');
        $this->defaultAppKey = config('services.whatsapp.app_key');
        $this->defaultAuthKey = config('services.whatsapp.auth_key');
    }

    /**
     * Get all active API configurations from database, falling back to env if none found
     * 
     * @param string $type 'verification' or 'notification'
     * @return array
     */
    private function getActiveApis(string $type): array
    {
        $key = $type === 'verification' ? 'verificationApis' : 'notificationApis';
        $setting = SystemSetting::where('key', $key)->first();
        $apis = $setting ? $setting->value : [];

        // Filter active APIs
        $activeApis = array_filter($apis, function ($api) {
            return isset($api['isActive']) && $api['isActive'];
        });

        // Use Env fallback if no active APIs found in DB
        if (empty($activeApis) && $this->defaultAppKey && $this->defaultAuthKey) {
            return [
                [
                    'id' => 'env-default',
                    'name' => 'Environment Default',
                    'apiUrl' => $this->defaultApiUrl,
                    'appKey' => $this->defaultAppKey,
                    'authKey' => $this->defaultAuthKey,
                    'isActive' => true
                ]
            ];
        }

        return array_values($activeApis); // Re-index array
    }

    /**
     * Get the next API to use based on round-robin logic
     * 
     * @param array $apis List of active APIs
     * @param string $type 'verification' or 'notification'
     * @return array The sorted list of APIs starting with the next one to use
     */
    private function getOrderedApis(array $apis, string $type): array
    {
        if (empty($apis)) {
            return [];
        }

        $cacheKey = "last_used_api_index_{$type}";
        $lastIndex = Cache::get($cacheKey, -1);
        $nextIndex = ($lastIndex + 1) % count($apis);

        // Update cache for next time
        Cache::put($cacheKey, $nextIndex, now()->addDay());

        // Rotate the array so the next API is first
        $rotatedApis = array_merge(
            array_slice($apis, $nextIndex),
            array_slice($apis, 0, $nextIndex)
        );

        return $rotatedApis;
    }

    /**
     * Send OTP verification code
     *
     * @param string $phone Phone number
     * @param string $otp OTP code
     * @return array
     */
    public function sendOTP(string $phone, string $otp): array
    {
        // Try to get custom template from DB first (if implemented), otherwise use Lang file
        // For now, we assume standard Lang file usage as per plan, but you could add DB lookup here
        $message = __('notifications.otp_message', ['otp' => $otp]);

        Log::info('WhatsAppService.sendOTP called', [
            'phone' => $phone,
            'otp' => $otp,
            'message_preview' => substr($message, 0, 50),
        ]);

        return $this->sendTextMessage($phone, $message, 'verification');
    }

    /**
     * Send a text message via WhatsApp with failover
     *
     * @param string $to Receiver phone number
     * @param string $message Message content
     * @param string $type 'verification' or 'notification'
     * @param string|null $fileUrl Optional URL to a file (pdf, image, etc.)
     * @return array
     */
    public function sendTextMessage(string $to, string $message, string $type = 'notification', ?string $fileUrl = null): array
    {
        $activeApis = $this->getActiveApis($type);

        if (empty($activeApis)) {
            Log::error('No active WhatsApp API found for ' . $type);
            return ['success' => false, 'error' => 'No active WhatsApp API configuration found.'];
        }

        $orderedApis = $this->getOrderedApis($activeApis, $type);
        $lastError = 'Unknown error';

        foreach ($orderedApis as $apiConfig) {
            $apiUrl = $apiConfig['apiUrl'] ?? $this->defaultApiUrl;
            $appKey = $apiConfig['appKey'] ?? '';
            $authKey = $apiConfig['authKey'] ?? '';
            $apiName = $apiConfig['name'] ?? 'Unknown';

            try {
                $formData = [
                    'appkey' => $appKey,
                    'authkey' => $authKey,
                    'to' => $to,
                    'message' => $message,
                    'sandbox' => 'false',
                ];

                if ($fileUrl) {
                    $formData['file'] = $fileUrl;
                }

                $response = Http::asForm()->post($apiUrl, $formData);
                $result = $response->json();

                if ($response->successful() && isset($result['message_status']) && $result['message_status'] === 'Success') {
                    Log::info('WhatsApp message sent successfully', [
                        'to' => $to,
                        'api_name' => $apiName,
                        'has_file' => !empty($fileUrl)
                    ]);
                    return [
                        'success' => true,
                        'data' => $result['data'] ?? null,
                    ];
                }

                $lastError = $result['message'] ?? 'API Error: ' . $response->body();
                Log::warning("WhatsApp send failed with API {$apiName}, trying next...", [
                    'to' => $to,
                    'response' => $result,
                    'status' => $response->status()
                ]);

            } catch (\Exception $e) {
                $lastError = $e->getMessage();
                Log::warning("WhatsApp send exception with API {$apiName}, trying next...", [
                    'to' => $to,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::error('All WhatsApp APIs failed', ['to' => $to, 'type' => $type]);
        return [
            'success' => false,
            'error' => "All APIs failed. Last error: {$lastError}",
        ];
    }

    /**
     * Send new order notification
     */
    public function sendNewOrderNotification(string $phone, string $orderNumber, string $orderDetails): array
    {
        $message = __('notifications.new_order', [
            'orderNumber' => $orderNumber,
            'orderDetails' => $orderDetails
        ]);
        return $this->sendTextMessage($phone, $message);
    }

    /**
     * Send quote notification
     */
    public function sendQuoteNotification(string $phone, string $orderNumber, string $providerName, string $price): array
    {
        $message = __('notifications.quote_received', [
            'orderNumber' => $orderNumber,
            'providerName' => $providerName,
            'price' => $price
        ]);
        return $this->sendTextMessage($phone, $message);
    }

    /**
     * Send order status update
     */
    public function sendOrderStatusUpdate(string $phone, string $orderNumber, string $status): array
    {
        $message = __('notifications.order_status_update', [
            'orderNumber' => $orderNumber,
            'status' => $status
        ]);
        return $this->sendTextMessage($phone, $message);
    }

    /**
     * Send store order confirmation
     */
    public function sendStoreOrderConfirmation(string $phone, string $orderNumber, string $productName, string $totalPrice): array
    {
        $message = __('notifications.store_order_confirmation', [
            'orderNumber' => $orderNumber,
            'productName' => $productName,
            'totalPrice' => $totalPrice
        ]);
        return $this->sendTextMessage($phone, $message);
    }

    /**
     * Send welcome message
     */
    public function sendWelcomeMessage(string $phone, string $name): array
    {
        $message = __('notifications.welcome_message', ['name' => $name]);
        return $this->sendTextMessage($phone, $message);
    }

    /**
     * Send a raw text message (alias for testing)
     */
    public function sendRawMessage(string $to, string $message): array
    {
        return $this->sendTextMessage($to, $message, 'notification');
    }
}
