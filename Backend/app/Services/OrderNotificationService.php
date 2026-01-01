<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Notification;
use App\Events\UserNotification;

class OrderNotificationService
{
    /**
     * Notify user with real-time broadcast
     */
    /**
     * Notify user with real-time broadcast
     */
    public function notifyUser(int|string $userId, array $data): void
    {
        // Resolve phone number to integer User ID if necessary
        $targetUserId = $userId;
        $user = null;

        if (is_string($userId)) {
            $user = \App\Models\User::where('phone', $userId)->first();
            if ($user) {
                $targetUserId = $user->id;
            } else {
                \Log::warning("OrderNotificationService: Could not resolve user ID for phone: {$userId}");
                return;
            }
        } else {
            $user = \App\Models\User::find($userId);
        }

        // Send Web Push Notification
        if ($user) {
            try {
                // Build deep link URL based on notification type/context
                $url = $data['link']['view'] ?? '/notifications';
                if (isset($data['link']['params']['orderNumber'])) {
                    $url = '/my-orders?order=' . $data['link']['params']['orderNumber'];
                }

                // Determine notification type for grouping
                $type = 'general';
                if (str_contains($data['type'] ?? '', 'ORDER')) {
                    $type = 'order';
                } elseif (str_contains($data['type'] ?? '', 'PAYMENT') || str_contains($data['type'] ?? '', 'WALLET')) {
                    $type = 'payment';
                } elseif (str_contains($data['type'] ?? '', 'REVIEW')) {
                    $type = 'review';
                }

                $user->notify(new \App\Notifications\GenericWebPushNotification(
                    $data['title'],
                    $data['message'],
                    $url,
                    'عرض',
                    $type
                ));
            } catch (\Exception $e) {
                \Log::error('WebPush Error: ' . $e->getMessage());
            }
        }

        $notification = Notification::create([
            'user_id' => $targetUserId,
            'title' => $data['title'],
            'message' => $data['message'],
            'type' => $data['type'],
            'context' => $data['context'] ?? [],
            'read' => false,
        ]);

        event(new UserNotification($targetUserId, [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'timestamp' => $notification->created_at->toIso8601String(),
            'read' => false,
            'link' => $data['link'] ?? null,
        ]));
    }

    /**
     * Notify customer about order creation
     */
    public function notifyOrderCreated(Order $order): void
    {
        $this->notifyUser($order->user_id, [
            'title' => 'تم إنشاء طلبك',
            'message' => "تم إنشاء طلبك #{$order->order_number} بنجاح. سيتم مراجعته قريباً.",
            'type' => 'ORDER_CREATED_CUSTOMER',
            'context' => ['orderNumber' => $order->order_number],
            'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]],
        ]);

        // Notify relevant providers based on assigned category
        $category = $order->form_data['category'] ?? null;
        if ($category) {
            // Find providers who have this category in their assigned_categories array
            // We retrieve all providers and filter in PHP to ensure compatibility with array casting
            // For larger datasets, a JSON query would be more efficient, but this is safer for now
            $providers = \App\Models\Provider::all()->filter(function ($provider) use ($category) {
                return is_array($provider->assigned_categories) && in_array($category, $provider->assigned_categories);
            });

            foreach ($providers as $provider) {
                // Provider ID is their phone number, we need the User ID for notification
                // Assuming Provider model has a user() relation or we look up by phone (provider->id)
                // Provider->id IS the phone number from previous context (string key)
                // But notifications need integer User ID.
                // The Provider model belongsTo User via user_id.

                $targetUserId = $provider->user_id;

                if ($targetUserId) {
                    $this->notifyUser($targetUserId, [
                        'title' => 'طلب جديد في تخصصك',
                        'message' => "طلب جديد #{$order->order_number} في قسم {$category}",
                        'type' => 'NEW_ORDER_FOR_PROVIDER',
                        'context' => ['orderNumber' => $order->order_number],
                        'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]],
                    ]);
                }
            }
        }
    }

    /**
     * Notify admin about new order
     */
    public function notifyAdminNewOrder(Order $order): void
    {
        // Get admin users - you may need to adjust this based on your admin user setup
        // For now, we'll use a placeholder. You can fetch from users table where role = 'admin'
        // Get admin users - fetching IDs directly
        $adminIds = \DB::table('users')->where('role', 'admin')->pluck('id');

        foreach ($adminIds as $adminId) {
            $this->notifyUser($adminId, [
                'title' => 'طلب جديد',
                'message' => "طلب جديد #{$order->order_number} بانتظار المراجعة",
                'type' => 'ORDER_CREATED_ADMIN',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'adminDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Notify about payment receipt upload
     */
    public function notifyPaymentUploaded(Order $order): void
    {
        $adminIds = \DB::table('users')->where('role', 'admin')->pluck('id');

        foreach ($adminIds as $adminId) {
            $this->notifyUser($adminId, [
                'title' => 'إيصال دفع جديد',
                'message' => "تم رفع إيصال دفع للطلب #{$order->order_number}",
                'type' => 'PAYMENT_UPLOADED_ADMIN',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'adminDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Notify about payment receipt re-upload
     */
    public function notifyPaymentReuploaded(Order $order): void
    {
        $adminIds = \DB::table('users')->where('role', 'admin')->pluck('id');

        foreach ($adminIds as $adminId) {
            $this->notifyUser($adminId, [
                'title' => 'إعادة رفع إيصال الدفع',
                'message' => "تم إعادة رفع إيصال الدفع للطلب #{$order->order_number}",
                'type' => 'PAYMENT_REUPLOADED_ADMIN',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'adminDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Notify all parties about order status change
     */
    public function notifyOrderStatusChange(Order $order, string $oldStatus, string $newStatus): void
    {
        $statusLabel = $this->getStatusLabel($newStatus);

        // Notify customer
        $this->notifyUser($order->user_id, [
            'title' => 'تحديث حالة الطلب',
            'message' => "تم تحديث حالة طلبك #{$order->order_number} إلى: {$statusLabel}",
            'type' => $this->getStatusNotificationType($newStatus, 'customer'),
            'context' => [
                'orderNumber' => $order->order_number,
                'oldStatus' => $oldStatus,
                'newStatus' => $newStatus
            ],
            'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]],
        ]);

        // Notify provider if quote accepted
        // provider_id IS the phone number in the system
        if ($order->acceptedQuote && $order->acceptedQuote->provider_id) {
            $this->notifyUser($order->acceptedQuote->provider_id, [
                'title' => 'تحديث حالة الطلب',
                'message' => "تم تحديث حالة الطلب #{$order->order_number} إلى: {$statusLabel}",
                'type' => $this->getStatusNotificationType($newStatus, 'provider'),
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Notify about order cancellation
     */
    /**
     * Notify about order cancellation
     */
    public function notifyOrderCancelled(Order $order, string $reason = null): void
    {
        $message = "تم إلغاء الطلب #{$order->order_number}";
        if ($reason) {
            $message .= ". السبب: {$reason}";
        }

        // Notify customer
        $this->notifyUser($order->user_id, [
            'title' => 'تم إلغاء الطلب',
            'message' => $message,
            'type' => 'ORDER_CANCELLED_CUSTOMER',
            'context' => ['orderNumber' => $order->order_number, 'reason' => $reason],
            'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]],
        ]);

        // Notify provider if quote was accepted
        if ($order->acceptedQuote) {
            $this->notifyUser($order->acceptedQuote->provider_id, [
                'title' => 'تم إلغاء الطلب',
                'message' => "تم إلغاء الطلب #{$order->order_number}",
                'type' => 'ORDER_CANCELLED_PROVIDER',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }

        // Notify admin
        $admins = \DB::table('users')->where('role', 'admin')->pluck('id');
        foreach ($admins as $adminId) {
            $this->notifyUser($adminId, [
                'title' => 'تم إلغاء طلب',
                'message' => "تم إلغاء الطلب #{$order->order_number}",
                'type' => 'ORDER_CANCELLED_ADMIN',
                'context' => ['orderNumber' => $order->order_number, 'reason' => $reason],
                'link' => ['view' => 'adminDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Notify about order completion
     */
    public function notifyOrderCompleted(Order $order): void
    {
        // Notify customer
        $this->notifyUser($order->user_id, [
            'title' => 'تم إكمال الطلب',
            'message' => "شكراً لك! تم إكمال طلبك #{$order->order_number}. نأمل أن تكون راضياً عن الخدمة.",
            'type' => 'ORDER_COMPLETED_CUSTOMER',
            'context' => ['orderNumber' => $order->order_number],
            'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]],
        ]);

        // Notify provider
        if ($order->acceptedQuote) {
            $this->notifyUser($order->acceptedQuote->provider_id, [
                'title' => 'تم إكمال الطلب',
                'message' => "تم إكمال الطلب #{$order->order_number} بنجاح",
                'type' => 'ORDER_COMPLETED_PROVIDER',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }

        // Notify admin
        $admins = \DB::table('users')->where('role', 'admin')->pluck('id');
        foreach ($admins as $adminId) {
            $this->notifyUser($adminId, [
                'title' => 'تم إكمال طلب',
                'message' => "تم إكمال الطلب #{$order->order_number}",
                'type' => 'ORDER_COMPLETED_ADMIN',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'adminDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Notify about shipping notes update
     */
    public function notifyShippingNotesUpdated(Order $order): void
    {
        $this->notifyUser($order->user_id, [
            'title' => 'تحديث معلومات الشحن',
            'message' => "تم تحديث معلومات الشحن للطلب #{$order->order_number}",
            'type' => 'SHIPPING_NOTES_UPDATED',
            'context' => ['orderNumber' => $order->order_number],
            'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $order->order_number]],
        ]);
    }

    /**
     * Notify about review submission
     */
    public function notifyReviewSubmitted(Order $order, string $providerName): void
    {
        // Notify provider
        if ($order->acceptedQuote) {
            $this->notifyUser($order->acceptedQuote->provider_id, [
                'title' => 'تقييم جديد',
                'message' => "تلقيت تقييماً جديداً للطلب #{$order->order_number}",
                'type' => 'NEW_REVIEW_PROVIDER',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }

        // Notify admin
        $admins = \DB::table('users')->where('role', 'admin')->pluck('id');
        foreach ($admins as $adminId) {
            $this->notifyUser($adminId, [
                'title' => 'تقييم جديد',
                'message' => "تقييم جديد للطلب #{$order->order_number} من قبل {$providerName}",
                'type' => 'NEW_REVIEW_ADMIN',
                'context' => ['orderNumber' => $order->order_number],
                'link' => ['view' => 'adminDashboard', 'params' => ['orderNumber' => $order->order_number]],
            ]);
        }
    }

    /**
     * Get status label in Arabic
     */
    private function getStatusLabel(string $status): string
    {
        $labels = [
            'pending' => 'قيد المراجعة',
            'quoted' => 'تم استلام عروض',
            'payment_pending' => 'بانتظار تأكيد الدفع',
            'processing' => 'جاري التجهيز',
            'ready_for_pickup' => 'جاهز للاستلام',
            'provider_received' => 'تم الاستلام من المزود',
            'shipped' => 'تم الشحن للعميل',
            'out_for_delivery' => 'قيد التوصيل',
            'delivered' => 'تم التوصيل',
            'completed' => 'تم الإكمال',
            'cancelled' => 'ملغي',
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Get notification type based on status and recipient
     */
    private function getStatusNotificationType(string $status, string $recipient): string
    {
        $typeMap = [
            'ready_for_pickup' => 'ORDER_READY_FOR_PICKUP',
            'provider_received' => 'PROVIDER_RECEIVED_ORDER',
            'shipped' => 'ORDER_SHIPPED',
            'out_for_delivery' => 'ORDER_OUT_FOR_DELIVERY',
            'delivered' => 'ORDER_DELIVERED',
        ];

        return $typeMap[$status] ?? 'ORDER_STATUS_CHANGED';
    }
}
