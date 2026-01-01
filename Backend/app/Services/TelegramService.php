<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TelegramService
{
    // وقت المهلة الافتراضي للطلبات (ثواني)
    protected int $timeout = 15;

    // عدد محاولات إعادة المحاولة على فشل الشبكة
    protected int $maxRetries = 2;

    // تفعيل/تعطيل الإرسال (مفيد في بيئة التطوير)
    protected bool $enabled;

    public function __construct()
    {
        $this->enabled = config('telegram.enabled', true);
    }

    /**
     * إرسال إشعار طلب كامل (رسالة + وسائط) إلى قناة/محادثة تيليغرام
     *
     * @param string $botToken
     * @param string|int $chatId
     * @param string $messageText نص الرسالة (MarkdownV2 أو Markdown) - سيتم إرسالها كـ parse_mode = Markdown.
     * @param array $mediaPaths ['images' => ['/abs/path.jpg', ...], 'video' => '/abs/path.mp4'|'', 'voice' => '/abs/path.ogg'|'']
     * @param array $options ['parse_mode' => 'Markdown', 'disable_notification' => false]
     * @return bool
     */
    public function sendOrderNotification(string $botToken, $chatId, string $messageText, array $mediaPaths = [], array $options = []): bool
    {
        if (!$this->enabled) {
            Log::info('[TelegramService] sending disabled by config.');
            return false;
        }

        $baseUrl = "https://api.telegram.org/bot{$botToken}";
        $options = array_merge([
            'parse_mode' => 'Markdown',
            'disable_notification' => false,
        ], $options);

        // Clean media arrays & verify files exist
        $images = array_values(array_filter($mediaPaths['images'] ?? [], function ($p) {
            return is_string($p) && file_exists($p);
        }));
        $video = isset($mediaPaths['video']) && is_string($mediaPaths['video']) && file_exists($mediaPaths['video']) ? $mediaPaths['video'] : null;
        $voice = isset($mediaPaths['voice']) && is_string($mediaPaths['voice']) && file_exists($mediaPaths['voice']) ? $mediaPaths['voice'] : null;

        // إذا لا يوجد وسائط، نرسل رسالة نصية فقط
        if (empty($images) && !$video && !$voice) {
            return $this->sendTextMessage($baseUrl, $chatId, $messageText, $options);
        }

        // نجمع ميديا لمجموعة (حد أقصى 10 عناصر في sendMediaGroup)
        $mediaItems = [];
        $attachments = []; // name => path

        // helper لإضافة عنصر مع اسم attach://
        $addAttachment = function (string $type, string $path, ?string $caption = null) use (&$mediaItems, &$attachments) {
            $name = $type . '_' . Str::random(6);
            $mediaItems[] = array_filter([
                'type' => $type,
                'media' => "attach://{$name}",
                'caption' => $caption
            ]);
            $attachments[$name] = $path;
        };

        // صور
        foreach ($images as $i => $imgPath) {
            // caption فقط على العنصر الأول (أقصى طول caption يحدده تيليغرام)
            $caption = $i === 0 ? $this->truncateCaption($messageText) : null;
            $addAttachment('photo', $imgPath, $caption);
            // لا تُضيف caption كنص منفصل لاحقًا
        }

        // فيديو (يأخذ مكانًا واحدًا في الميديا)
        if ($video) {
            // إذا لم يكن لدينا caption مضافة بعد، نستخدم رسالة النص كـ caption على الفيديو الأول فقط إذا لم تكن الصور موجودة
            $caption = empty($mediaItems) ? $this->truncateCaption($messageText) : null;
            $addAttachment('video', $video, $caption);
        }

        // صوت (voice)
        // لن نضيف الصوت للمجموعة لأن sendMediaGroup لا يدعم خلط الصور بذات الطلب مع الصوتيات
        // وسيتم إرساله بشكل منفصل في الأسفل.

        // Telegram يسمح حتى 10 وسائط في sendMediaGroup
        if (count($mediaItems) > 10) {
            // اختصر إلى أول 10
            $mediaItems = array_slice($mediaItems, 0, 10);
            $attachments = array_slice($attachments, 0, 10, true);
        }

        $groupSuccess = true;
        // إذا كانت هناك عناصر للـ sendMediaGroup — حاول الإرسال
        if (!empty($mediaItems)) {
            $groupSuccess = $this->attemptSendMediaGroup($baseUrl, $chatId, $mediaItems, $attachments, $options);

            if (!$groupSuccess) {
                // فشل sendMediaGroup -> فالباك: نحاول إرسال الوسائط بشكل فردي
                Log::warning('[TelegramService] sendMediaGroup failed, attempting individual uploads.');
                $this->sendMediaIndividually($baseUrl, $chatId, $images, $video, null, $messageText, $options);
            }
        } else {
            // إذا لم يكن هناك صور/فيديو، أرسل النص (إلا إذا كان هناك صوت سيُرسل لاحقا، لكن الأفضل إرسال النص هنا)
            // إذا كان هناك صوت فقط، سنرسل النص هنا أولاً
            if ($voice || empty($mediaItems)) {
                $this->sendTextMessage($baseUrl, $chatId, $messageText, $options);
            }
        }

        // إرسال الصوت بشكل منفصل (ذكي: voice أو audio)
        if ($voice) {
            $this->sendVoiceOrAudio($baseUrl, $chatId, $voice, $options);
        }

        return $groupSuccess;
    }

    /**
     * إرسال الصوت بذكاء: Voice Note إذا كان OGG، و Audio File إذا كان غير ذلك (WebM)
     */
    protected function sendVoiceOrAudio(string $baseUrl, $chatId, string $path, array $options): bool
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        if ($extension === 'ogg') {
            return $this->sendFile($baseUrl, $chatId, 'sendVoice', 'voice', $path, null, $options);
        } else {
            // WebM أو صيغ أخرى -> نرسلها كملف صوتي عادي
            return $this->sendFile($baseUrl, $chatId, 'sendAudio', 'audio', $path, null, $options);
        }
    }

    /**
     * محاولة إرسال مجموعة وسائط باستخدام multipart (sendMediaGroup)
     */
    protected function attemptSendMediaGroup(string $baseUrl, $chatId, array $mediaItems, array $attachments, array $options): bool
    {
        $endpoint = "{$baseUrl}/sendMediaGroup";

        // قم بالإرسال مع محاولات إعادة محاولة بسيطة
        $attempt = 0;
        do {
            $attempt++;

            try {
                // Use Guzzle client directly for reliable multipart upload
                $client = new \GuzzleHttp\Client(['timeout' => $this->timeout]);

                $multipart = [
                    ['name' => 'chat_id', 'contents' => (string) $chatId],
                    ['name' => 'media', 'contents' => json_encode($mediaItems, JSON_UNESCAPED_UNICODE)],
                ];

                // Attach files
                foreach ($attachments as $name => $path) {
                    if (!file_exists($path)) {
                        Log::warning("[TelegramService] file not found for attachment: {$path}");
                        continue;
                    }
                    $multipart[] = [
                        'name' => $name,
                        'contents' => fopen($path, 'r'),
                        'filename' => basename($path)
                    ];
                }

                $response = $client->post($endpoint, [
                    'multipart' => $multipart
                ]);

                if ($response->getStatusCode() === 200) {
                    $body = json_decode($response->getBody()->getContents(), true);
                    if (!empty($body['ok'])) {
                        Log::info("[TelegramService] sendMediaGroup successful. chat_id={$chatId}");
                        return true;
                    }
                }

                Log::warning("[TelegramService] sendMediaGroup failed (attempt {$attempt}). response=" . $response->getBody());

            } catch (\GuzzleHttp\Exception\RequestException $e) {
                $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : $e->getMessage();
                Log::warning("[TelegramService] sendMediaGroup failed (attempt {$attempt}). error={$errorBody}");
            } catch (\Throwable $e) {
                Log::error("[TelegramService] sendMediaGroup exception (attempt {$attempt}): " . $e->getMessage());
            }

            // تأخير قصير قبل إعادة المحاولة
            if ($attempt <= $this->maxRetries) {
                sleep(1);
            }
        } while ($attempt <= $this->maxRetries);

        return false;
    }

    /**
     * إرسال كل وسيلة على حدة كفالباك
     */
    protected function sendMediaIndividually(string $baseUrl, $chatId, array $images, ?string $video, ?string $voice, string $messageText, array $options): bool
    {
        $allSuccess = true;
        // أرسل الصور أولاً (sendPhoto). caption على أول صورة من messageText
        foreach ($images as $i => $imgPath) {
            $caption = $i === 0 ? $this->truncateCaption($messageText) : null;
            $ok = $this->sendFile($baseUrl, $chatId, 'sendPhoto', 'photo', $imgPath, $caption, $options);
            $allSuccess = $allSuccess && $ok;
        }

        // فيديو
        if ($video) {
            $ok = $this->sendFile($baseUrl, $chatId, 'sendVideo', 'video', $video, null, $options);
            $allSuccess = $allSuccess && $ok;
        }

        // voice
        if ($voice) {
            $ok = $this->sendFile($baseUrl, $chatId, 'sendVoice', 'voice', $voice, null, $options);
            $allSuccess = $allSuccess && $ok;
        }

        // أخيراً، إن لم تكن قد أُرسلت رسالة نصية مع caption، أرسل الرسالة النصية الأساسية كخلاصة
        if (!empty($messageText) && (empty($images) && !$video)) {
            $allSuccess = $allSuccess && $this->sendTextMessage($baseUrl, $chatId, $messageText, $options);
        }

        return $allSuccess;
    }

    /**
     * إرسال ملف منفرد باستخدام اسم endpoint مناسب (sendPhoto, sendVideo, sendVoice)
     */
    protected function sendFile(string $baseUrl, $chatId, string $endpointMethod, string $fieldName, string $path, ?string $caption = null, array $options = []): bool
    {
        $endpoint = "{$baseUrl}/{$endpointMethod}";
        if (!file_exists($path)) {
            Log::warning("[TelegramService] file not found: {$path}");
            return false;
        }

        $attempt = 0;
        do {
            $attempt++;

            try {
                // Use Guzzle client directly for reliable multipart upload
                $client = new \GuzzleHttp\Client(['timeout' => $this->timeout]);

                $multipart = [
                    ['name' => 'chat_id', 'contents' => (string) $chatId],
                    ['name' => $fieldName, 'contents' => fopen($path, 'r'), 'filename' => basename($path)],
                ];

                if ($caption) {
                    $multipart[] = ['name' => 'caption', 'contents' => $this->truncateCaption($caption)];
                }

                if (!empty($options['parse_mode'])) {
                    $multipart[] = ['name' => 'parse_mode', 'contents' => $options['parse_mode']];
                }

                $response = $client->post($endpoint, [
                    'multipart' => $multipart
                ]);

                if ($response->getStatusCode() === 200) {
                    $body = json_decode($response->getBody()->getContents(), true);
                    if (!empty($body['ok'])) {
                        Log::info("[TelegramService] {$endpointMethod} successful. file=" . basename($path));
                        return true;
                    }
                }

                Log::warning("[TelegramService] {$endpointMethod} failed (attempt {$attempt}). response=" . $response->getBody());

            } catch (\GuzzleHttp\Exception\RequestException $e) {
                $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : $e->getMessage();
                Log::warning("[TelegramService] {$endpointMethod} failed (attempt {$attempt}). error={$errorBody}");
            } catch (\Throwable $e) {
                Log::error("[TelegramService] {$endpointMethod} exception (attempt {$attempt}): " . $e->getMessage());
            }

            if ($attempt <= $this->maxRetries) {
                sleep(1);
            }
        } while ($attempt <= $this->maxRetries);

        return false;
    }

    /**
     * إرسال رسالة نصية عادية
     */
    protected function sendTextMessage(string $baseUrl, $chatId, string $text, array $options = []): bool
    {
        try {
            $payload = array_merge([
                'chat_id' => $chatId,
                'text' => $text,
            ], $options);

            $response = Http::timeout($this->timeout)
                ->post("{$baseUrl}/sendMessage", $payload);

            if ($response->successful()) {
                Log::info("[TelegramService] sendMessage successful. chat_id={$chatId}");
                return true;
            }

            Log::warning("[TelegramService] sendMessage failed. status={$response->status()} body=" . $response->body());
        } catch (\Throwable $e) {
            Log::error("[TelegramService] sendMessage exception: " . $e->getMessage());
        }

        return false;
    }

    /**
     * اقتطاع caption لطول معقول (Telegram حدود الطول لكن نستخدم 1024 كقيمة أمينة)
     */
    protected function truncateCaption(string $text, int $max = 1024): string
    {
        $text = trim($text);
        if (mb_strlen($text) <= $max) {
            return $text;
        }
        return mb_substr($text, 0, $max - 3) . '...';
    }
}
