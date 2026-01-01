<?php

namespace App\Services;

use App\Models\Order;
use App\Models\CarCategory;
use App\Jobs\SendTelegramOrderNotification;
use Illuminate\Support\Facades\Storage;

class OrderService
{
    /**
     * Dispatch Telegram notification for new order
     */
    public function dispatchTelegramNotification(Order $order, array $formData, string $baseUrl): void
    {
        // Get category from form data
        $category = CarCategory::where('name', $formData['category'] ?? null)->first();

        if (!$category || !$category->telegram_notifications_enabled) {
            return; // Skip if category not found or notifications disabled
        }

        if (empty($category->telegram_bot_token) || empty($category->telegram_channel_id)) {
            return; // Skip if Telegram not configured
        }

        // Collect media paths (Absolute paths for multipart upload)
        $images = $formData['images'] ?? [];
        if (!is_array($images)) {
            $images = [];
        }

        // Helper function to convert URL to file path
        $urlToPath = function ($url) {
            if (empty($url)) {
                return null;
            }

            // If it's already a relative path, use it directly
            if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://')) {
                return storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $url);
            }

            // Extract path after /storage/
            if (preg_match('#/storage/(.+)$#', $url, $matches)) {
                $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $matches[1]);
                return storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $relativePath);
            }

            return null;
        };

        $imagePaths = array_filter(array_map($urlToPath, $images));

        $mediaPaths = [
            'images' => $imagePaths,
            'video' => $urlToPath($formData['video'] ?? null),
            'voice' => $urlToPath($formData['voiceNote'] ?? null),
        ];

        // Debug logging
        \Log::info('[OrderService] Prepared media paths for Telegram', [
            'order_id' => $order->order_number,
            'images_count' => count($imagePaths),
            'has_video' => !empty($mediaPaths['video']),
            'has_voice' => !empty($mediaPaths['voice']),
            'image_paths' => $imagePaths,
            'video_path' => $mediaPaths['video'],
            'voice_path' => $mediaPaths['voice'],
            'images_exist' => array_map('file_exists', $imagePaths),
            'video_exists' => $mediaPaths['video'] ? file_exists($mediaPaths['video']) : null,
            'voice_exists' => $mediaPaths['voice'] ? file_exists($mediaPaths['voice']) : null,
        ]);

        // Dispatch to queue
        SendTelegramOrderNotification::dispatch(
            $order,
            $category->telegram_bot_token,
            $category->telegram_channel_id,
            $mediaPaths,
            $baseUrl
        );
    }

    /**
     * Calculate order statistics
     */
    public function calculateOrderStats(string $status = null): array
    {
        $query = Order::query();

        if ($status) {
            $query->where('status', $status);
        }

        return [
            'total' => $query->count(),
            'pending' => Order::where('status', 'pending')->count(),
            'quoted' => Order::where('status', 'quoted')->count(),
            'payment_pending' => Order::where('status', 'payment_pending')->count(),
            'processing' => Order::where('status', 'processing')->count(),
            'completed' => Order::where('status', 'completed')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
        ];
    }

    /**
     * Update order status with validation
     */
    public function updateOrderStatus(Order $order, string $newStatus, ?string $reason = null): bool
    {
        $validStatuses = [
            'pending',
            'quoted',
            'payment_pending',
            'processing',
            'ready_for_pickup',
            'provider_received',
            'shipped',
            'out_for_delivery',
            'delivered',
            'completed',
            'cancelled'
        ];

        if (!in_array($newStatus, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$newStatus}");
        }

        $oldStatus = $order->status;
        $order->status = $newStatus;

        if ($newStatus === 'cancelled' && $reason) {
            $order->cancellation_reason = $reason;
        }

        $saved = $order->save();

        if ($saved) {
            // Dispatch status change notification
            $notificationService = app(OrderNotificationService::class);
            if ($newStatus === 'cancelled') {
                $notificationService->notifyOrderCancelled($order, $reason);
            } else {
                $notificationService->notifyOrderStatusChange($order, $oldStatus, $newStatus);
            }
        }

        return $saved;
    }

    /**
     * Get orders with filters
     */
    public function getFilteredOrders(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = Order::with(['quotes', 'acceptedQuote']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['category'])) {
            $query->whereJsonContains('form_data->category', $filters['category']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Clean up old cancelled orders
     */
    public function cleanupCancelledOrders(int $daysOld = 30): int
    {
        return Order::where('status', 'cancelled')
            ->where('created_at', '<', now()->subDays($daysOld))
            ->delete();
    }
}
