<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\TelegramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendTelegramOrderNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * عدد مرات إعادة المحاولة عند الفشل.
     */
    public $tries = 5;

    /**
     * المدة القصوى لتشغيل الـ Job.
     */
    public $timeout = 90;

    /**
     * مدة الانتظار بين المحاولات (ثواني).
     */
    public $backoff = [10, 20, 40, 60];

    /**
     * منع حذف الـ Job عند الفشل النهائي (اختياري).
     */
    public $deleteWhenMissingModels = true;

    public function __construct(
        public Order $order,
        public string $botToken,
        public string $channelId,
        public array $mediaUrls,
        public string $baseUrl
    ) {
        // تشغيله على Queue خاصة بالتيليغرام لضمان السرعة
        $this->onQueue('telegram');
    }

    /**
     * تنفيذ المهمة.
     */
    public function handle(TelegramService $telegram): void
    {
        try {
            // Format order data into Telegram message
            $messageText = $this->formatOrderMessage($this->order);

            $telegram->sendOrderNotification(
                $this->botToken,
                $this->channelId,
                $messageText,
                $this->mediaUrls
            );

            \Log::info("Telegram notification sent successfully", [
                'order_id' => $this->order->order_number,
                'channel' => $this->channelId,
            ]);

        } catch (\Throwable $e) {
            // تسجيل الخطأ مع تفاصيل مهمة
            \Log::warning("Telegram send attempt failed", [
                'order_id' => $this->order->order_number,
                'error' => $e->getMessage(),
                'trace' => str($e->getTraceAsString())->limit(500),
            ]);

            // عمل retry بشكل طبيعي
            throw $e;
        }
    }

    /**
     * Format order details into Telegram message
     */
    private function formatOrderMessage(Order $order): string
    {
        $formData = is_string($order->form_data)
            ? json_decode($order->form_data, true)
            : $order->form_data;

        $message = "🔔 *طلب جديد في نظام راموسة*\n\n";
        $message .= "📋 *رقم الطلب:* `" . $order->order_number . "`\n";
        $message .= "📅 *التاريخ:* " . $order->created_at->format('Y-m-d H:i') . "\n\n";

        $message .= "🚗 *تفاصيل المركبة:*\n";
        $message .= "▫️ الفئة: " . ($formData['category'] ?? 'غير محدد') . "\n";
        $message .= "▫️ الماركة: " . ($formData['brand'] ?? 'غير محدد') . "\n";
        $message .= "▫️ الموديل: " . ($formData['model'] ?? 'غير محدد') . "\n";
        $message .= "▫️ السنة: " . ($formData['year'] ?? 'غير محدد') . "\n";

        if (!empty($formData['vin'])) {
            $message .= "▫️ VIN: `" . $formData['vin'] . "`\n";
        }

        // Add engine type and transmission
        if (!empty($formData['engineType'])) {
            $engineLabels = [
                'petrol' => 'بنزين',
                'diesel' => 'ديزل',
                'electric' => 'كهربائي',
                'hybrid' => 'هجين'
            ];
            $engineType = $engineLabels[$formData['engineType']] ?? $formData['engineType'];
            $message .= "▫️ نوع المحرك: " . $engineType . "\n";
        }

        if (!empty($formData['transmission'])) {
            $transmissionLabels = [
                'manual' => 'يدوي',
                'auto' => 'أوتوماتيك'
            ];
            $transmission = $transmissionLabels[$formData['transmission']] ?? $formData['transmission'];
            $message .= "▫️ ناقل الحركة: " . $transmission . "\n";
        }

        $message .= "\n🔧 *القطعة المطلوبة:*\n";
        if (!empty($formData['partTypes']) && is_array($formData['partTypes'])) {
            $message .= "▫️ أنواع القطع: " . implode(', ', $formData['partTypes']) . "\n";
        }
        if (!empty($formData['partDescription'])) {
            $message .= "▫️ التفاصيل: " . $formData['partDescription'] . "\n";
        }
        if (!empty($formData['partNumber'])) {
            $message .= "▫️ رقم القطعة: `" . $formData['partNumber'] . "`\n";
        }

        $message .= "\n🔗 *رابط الطلب:* " . $this->baseUrl . "/provider/openOrders";

        return $message;
    }

    /**
     * عند الفشل بعد كل المحاولات.
     */
    public function failed(\Throwable $e): void
    {
        \Log::error("Telegram notification job failed permanently", [
            'order_id' => $this->order->order_number,
            'error' => $e->getMessage(),
            'channel' => $this->channelId,
        ]);
    }
}
