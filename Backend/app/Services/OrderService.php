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
    public function calculateOrderStats(?string $status = null): array
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
     * Create a new order with transaction and events
     */
    public function createOrder(array $data, \App\Models\User $user): Order
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data, $user) {
            $order = Order::create([
                'order_number' => (string) now()->timestamp,
                'user_id' => $user->phone ?? $user->id ?? 'guest',
                'user_type' => $data['user_type'] ?? 'customer',
                'status' => 'pending',
                'form_data' => $data['form_data'],
                'customer_name' => $data['customer_name'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'delivery_method' => $data['delivery_method'] ?? 'shipping',
            ]);

            // Dispatch Events
            event(new \App\Events\OrderCreated($order));

            // Legacy Notifications (Preserved until listeners are fully set up)
            $this->dispatchTelegramNotification($order, $data['form_data'], request()->root());

            // Use Facade or Dependency Injection for Notification Service to avoid tight coupling if possible, 
            // but for now direct call is safe as it's existing logic moving location.
            $notificationService = app(OrderNotificationService::class);
            $notificationService->notifyOrderCreated($order);
            $notificationService->notifyAdminNewOrder($order);

            return $order;
        });
    }

    /**
     * Submit a quote for an order
     */
    public function submitQuote(Order $order, \App\Models\Provider $provider, array $data): \App\Models\Quote
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($order, $provider, $data) {
            $quote = \App\Models\Quote::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'order_number' => $order->order_number,
                'provider_id' => $provider->id, // This is phone
                'provider_name' => $provider->name,
                'provider_unique_id' => $provider->unique_id,
                'price' => $data['price'],
                'part_status' => $data['part_status'],
                'part_size_category' => $data['part_size_category'] ?? null,
                'notes' => $data['notes'] ?? null,
                'media' => $data['media'] ?? null,
            ]);

            $order->update(['status' => 'quoted']);

            // Fire Domain Event
            event(new \App\Events\QuoteReceived($quote, $order));
            event(new \App\Events\OrderStatusUpdated($order, 'pending')); // Status changed to quoted

            // Legacy Logic
            $notificationService = app(OrderNotificationService::class);
            // $notificationService->notifyQuoteReceived... (Logic is manual in controller, moving here)

            // We need to implement the manual notification logic that was in Controller here or in a Listener.
            // For safety in this refactor, we reproduce the Controller logic:

            // Notify Provider
            $providerUser = \App\Models\User::where('phone', $provider->id)->first();
            if ($providerUser) {
                // Using the specific notification structure
                $notifData = [
                    'title' => 'تم إرسال العرض',
                    'message' => "تم إرسال عرضك للطلب #{$order->order_number} بنجاح.",
                    'type' => 'OFFER_ACCEPTED_PROVIDER_WIN', // Frontend expects this? Or 'QUOTE_SUBMITTED'? Keeping original.
                    'context' => ['orderNumber' => $order->order_number],
                    'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]]
                ];
                $notificationService->notifyUser($providerUser->id, $notifData);
            }

            // Notify Customer
            $notificationService->notifyUser($order->user_id, [
                'title' => 'عرض جديد',
                'message' => "تلقيت عرضاً جديداً للطلب #{$order->order_number}",
                'type' => 'quote_received',
                'context' => ['orderNumber' => $order->order_number, 'quoteId' => $quote->id],
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]]
            ]);

            return $quote;
        });
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

    /**
     * Accept a quote and update order
     */
    public function acceptQuote(Order $order, \App\Models\Quote $quote, array $data): Order
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($order, $quote, $data) {
            $oldStatus = $order->status;

            // Handle receipt upload logic if present
            $receiptUrl = null;
            $isNewUpload = false;
            $isReupload = false;

            if (isset($data['payment_receipt']) && $data['payment_receipt'] instanceof \Illuminate\Http\UploadedFile) {
                $path = $data['payment_receipt']->store('receipts', 'public');
                $receiptUrl = asset('storage/' . $path);

                if ($order->payment_receipt_url) {
                    $isReupload = true;
                } else {
                    $isNewUpload = true;
                }
            }

            // Determine Status
            $isCOD = ($data['payment_method_id'] ?? '') === 'pm-cod';
            $status = $isCOD ? 'processing' : 'payment_pending';

            $order->update([
                'accepted_quote_id' => $quote->id,
                'payment_method_id' => $data['payment_method_id'] ?? null,
                'payment_method_name' => $data['payment_method_name'] ?? null,
                'payment_receipt_url' => $receiptUrl,
                'delivery_method' => $data['delivery_method'] ?? 'shipping',
                'customer_name' => $data['customer_name'] ?? $order->customer_name,
                'customer_address' => $data['customer_address'] ?? $order->customer_address,
                'customer_phone' => $data['customer_phone'] ?? $order->customer_phone,
                'shipping_price' => $data['shipping_price'] ?? 0,
                'status' => $status,
                'rejection_reason' => null,
            ]);

            // Notify admin about payment upload
            $notificationService = app(OrderNotificationService::class);
            if ($isNewUpload) {
                $notificationService->notifyPaymentUploaded($order);
            } elseif ($isReupload) {
                $notificationService->notifyPaymentReuploaded($order);
            }

            // Standard Notification Logic
            // 1. Notify Customer
            $customerTitle = 'تم تأكيد طلبك!';
            $customerMessage = "تم تأكيد طلبك #{$order->order_number} وهو الآن " . ($isCOD ? 'قيد التجهيز.' : 'بانتظار تأكيد الدفع.');
            $notificationService->notifyUser($order->user_id, [
                'title' => $customerTitle,
                'message' => $customerMessage,
                'type' => 'ORDER_STATUS_CHANGED',
                'context' => ['orderNumber' => $order->order_number, 'status' => $status],
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]]
            ]);

            // 2. Notify Winning Provider
            $winnerId = $quote->provider_id;
            $notificationService->notifyUser($winnerId, [
                'title' => 'لقد فزت بطلب!',
                'message' => "تم قبول عرضك للطلب #{$order->order_number}.",
                'type' => 'OFFER_ACCEPTED_PROVIDER_WIN',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]]
            ]);

            // 3. Notify Losing Providers
            $otherQuotes = $order->quotes()->where('id', '!=', $quote->id)->get();
            foreach ($otherQuotes as $otherQuote) {
                $notificationService->notifyUser($otherQuote->provider_id, [
                    'title' => 'لم يتم اختيار عرضك',
                    'message' => "تم اختيار عرض آخر للطلب #{$order->order_number}.",
                    'type' => 'OFFER_ACCEPTED_PROVIDER_LOSS',
                    'context' => ['orderNumber' => $order->order_number],
                    'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]]
                ]);
            }

            // Broadcast Admin Dashboard Event (Legacy/Specific)
            event(new \App\Events\AdminDashboardEvent('order.quote_accepted', [
                'order_number' => $order->order_number,
                'payment_method' => $data['payment_method_name'] ?? '',
                'has_receipt' => $receiptUrl ? true : false,
                'status' => $status,
            ]));

            // Broadcast Standard Order Update
            event(new \App\Events\OrderStatusUpdated($order, $oldStatus));

            return $order;
        });
    }

    /**
     * Approve Payment
     */
    public function approvePayment(Order $order): Order
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            $oldStatus = $order->status;
            $order->update(['status' => 'processing']);

            $notificationService = app(OrderNotificationService::class);

            // Notify Customer
            $notificationService->notifyUser($order->user_id, [
                'title' => 'تم تأكيد الدفع',
                'message' => "تم تأكيد الدفع لطلبك #{$order->order_number}. جاري تجهيز الطلب.",
                'type' => 'ORDER_STATUS_CHANGED',
                'context' => ['orderNumber' => $order->order_number, 'status' => 'processing'],
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]]
            ]);

            // Notify Provider
            if ($order->acceptedQuote) {
                $notificationService->notifyUser($order->acceptedQuote->provider_id, [
                    'title' => 'تم تأكيد الدفع للطلب',
                    'message' => "تم تأكيد الدفع للطلب #{$order->order_number}. يرجى البدء بالتجهيز.",
                    'type' => 'OFFER_ACCEPTED_PROVIDER_WIN',
                    'context' => ['orderNumber' => $order->order_number],
                    'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]]
                ]);
            }

            // Direct Admin Event
            event(new \App\Events\AdminDashboardEvent('order.payment_updated', [
                'order_number' => $order->order_number,
                'action' => 'approved',
                'status' => 'processing',
            ]));

            // Standard Event
            event(new \App\Events\OrderStatusUpdated($order, $oldStatus));

            return $order;
        });
    }

    /**
     * Reject Payment
     */
    public function rejectPayment(Order $order, string $reason): Order
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($order, $reason) {
            $oldStatus = $order->status;
            $order->update([
                'status' => 'pending', // Revert to pending or payment_pending? Logic says pending to probably allow re-quote or re-upload? Assuming pending per controller logic.
                'rejection_reason' => $reason
            ]);

            $notificationService = app(OrderNotificationService::class);

            // Notify Customer
            $notificationService->notifyUser($order->user_id, [
                'title' => 'رفض إيصال الدفع',
                'message' => "تم رفض إيصال الدفع للطلب #{$order->order_number}. السبب: {$reason}",
                'type' => 'PAYMENT_REJECTED',
                'context' => ['orderNumber' => $order->order_number, 'reason' => $reason],
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]]
            ]);

            // Direct Admin Event
            event(new \App\Events\AdminDashboardEvent('order.payment_updated', [
                'order_number' => $order->order_number,
                'action' => 'rejected',
                'reason' => $reason,
            ]));

            // Standard Event
            event(new \App\Events\OrderStatusUpdated($order, $oldStatus));

            return $order;
        });
    }
}

