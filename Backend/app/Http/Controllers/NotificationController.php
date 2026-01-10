<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Services\WhatsAppService;
use App\Events\UserNotification as UserNotificationEvent;
use App\Notifications\GenericWebPushNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    protected WhatsAppService $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Get user's notifications
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserNotifications(Request $request)
    {
        // Use integer ID as primary identifier
        $userId = $request->user()->id;

        // Debug: Log the user ID being used
        \Log::info('Fetching notifications for user', [
            'userId' => $userId,
            'user_phone' => $request->user()->phone ?? 'N/A',
        ]);

        // Get notifications from database (if storing in DB)
        // For now, return example structure - adapt based on your storage
        $notifications = $this->getNotificationsFromStorage($userId);

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => collect($notifications)->where('read', false)->count(),
            ],
        ]);
    }

    /**
     * Mark notification as read
     * 
     * @param Request $request
     * @param string $notificationId
     * @return \Illuminate\Http\\JsonResponse
     */
    public function markAsRead(Request $request, $notificationId)
    {
        $userId = $request->user()->id;

        // Update notification status
        $this->updateNotificationStatus($userId, $notificationId, true);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user()->id;

        $this->markAllNotificationsRead($userId);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete notification
     * 
     * @param Request $request
     * @param string $notificationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteNotification(Request $request, $notificationId)
    {
        $userId = $request->user()->id;

        $this->removeNotification($userId, $notificationId);

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Clear all notifications
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearAll(Request $request)
    {
        $userId = $request->user()->id;

        $this->clearAllNotifications($userId);

        return response()->json([
            'success' => true,
            'message' => 'All notifications cleared',
        ]);
    }

    /**
     * Send notification to user (Admin/System use)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendNotification(Request $request)
    {
        $request->validate([
            'user_id' => 'required|string',
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'string|nullable',
            'link' => 'array|nullable',
            'context' => 'array|nullable',
        ]);

        // Create notification in database
        $notification = Notification::create([
            'user_id' => $request->user_id,
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type ?? 'info',
            'link' => $request->link,
            'context' => $request->context,
            'read' => false,
        ]);

        // Broadcast real-time
        event(new UserNotificationEvent($request->user_id, $notification->toArray()));

        // Send Web Push Notification
        try {
            $user = User::find($request->user_id);
            if ($user) {
                \Log::info('🔵 [WebPush] Sending push notification', [
                    'user_id' => $user->id,
                    'title' => $request->title,
                    'has_subscriptions' => $user->pushSubscriptions()->count() > 0,
                ]);

                $user->notify(new GenericWebPushNotification(
                    $request->title,
                    $request->message,
                    $request->link['url'] ?? null,
                    $request->link['label'] ?? 'عرض',
                    $request->type ?? 'general'
                ));

                \Log::info('✅ [WebPush] Push notification sent successfully', [
                    'user_id' => $user->id,
                ]);
            } else {
                \Log::warning('⚠️ [WebPush] User not found', ['user_id' => $request->user_id]);
            }
        } catch (\Exception $e) {
            \Log::error('❌ [WebPush] Failed to send push notification', [
                'user_id' => $request->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Send WhatsApp if enabled
        if ($request->send_whatsapp ?? false) {
            $this->whatsappService->sendRawMessage(
                $request->user_id,
                "{$notification->title}\n\n{$notification->message}"
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification sent',
            'notification' => $notification,
        ]);
    }

    /**
     * Send bulk notification to a group of users (Admin use)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendBulk(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:100',
            'message' => 'required|string|max:500',
            'target_group' => 'required|in:all,customers,providers,technicians,tow_providers,car_providers',
            'type' => 'string|nullable',
            'link' => 'array|nullable',
        ]);

        // Get users based on target group
        $userIds = [];
        $targetGroup = $request->target_group;

        if ($targetGroup === 'all') {
            // Get all user IDs
            $userIds = \App\Models\User::pluck('id')->toArray();
        } elseif ($targetGroup === 'customers') {
            // Get user_ids from customers table
            $userIds = \DB::table('customers')->pluck('user_id')->toArray();
        } elseif ($targetGroup === 'providers') {
            // Get user_ids from providers table
            $userIds = \DB::table('providers')->pluck('user_id')->toArray();
        } elseif ($targetGroup === 'technicians') {
            // Get user_ids from technicians table
            $userIds = \DB::table('technicians')->pluck('user_id')->toArray();
        } elseif ($targetGroup === 'tow_providers') {
            // Get user_ids from tow_trucks table
            $userIds = \DB::table('tow_trucks')->pluck('user_id')->toArray();
        } elseif ($targetGroup === 'car_providers') {
            // Get user_ids from car_providers table
            $userIds = \DB::table('car_providers')->pluck('user_id')->toArray();
        }

        if (empty($userIds)) {
            return response()->json([
                'success' => false,
                'message' => 'No users found in the selected group',
            ], 400);
        }

        $sentCount = 0;
        foreach ($userIds as $userId) {
            try {
                // Create notification in database
                $notification = Notification::create([
                    'user_id' => $userId,
                    'title' => $request->title,
                    'message' => $request->message,
                    'type' => $request->type ?? 'NEW_ANNOUNCEMENT_CUSTOMER',
                    'link' => $request->link,
                    'read' => false,
                ]);

                // Broadcast real-time
                event(new UserNotificationEvent($userId, $notification->toArray()));

                // Send Web Push Notification
                try {
                    $user = User::find($userId);
                    if ($user) {
                        $user->notify(new GenericWebPushNotification(
                            $request->title,
                            $request->message,
                            $request->link['url'] ?? null,
                            $request->link['label'] ?? 'عرض',
                            $request->type ?? 'general'
                        ));
                    }
                } catch (\Exception $pushError) {
                    \Log::error('Failed to send web push in bulk', [
                        'user_id' => $userId,
                        'error' => $pushError->getMessage()
                    ]);
                }

                $sentCount++;
            } catch (\Exception $e) {
                \Log::error('Failed to send bulk notification', [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$sentCount} users",
            'sent_count' => $sentCount,
            'target_group' => $targetGroup,
        ]);
    }

    /**
     * Get unread count
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = $this->getNotificationsFromStorage($userId);
        $unreadCount = collect($notifications)->where('read', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    // ===== Helper Methods =====

    private function getNotificationsFromStorage($userId)
    {
        $notifications = Notification::forUser($userId)
            ->recent()
            ->limit(50)
            ->get()
            ->toArray();

        // Transform notifications to match frontend expectations
        return array_map(function ($notification) {
            $notification['timestamp'] = $notification['created_at'];
            return $notification;
        }, $notifications);
    }

    private function storeNotification($userId, $notification)
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $notification['title'],
            'message' => $notification['message'],
            'type' => $notification['type'] ?? 'info',
            'link' => $notification['link'] ?? null,
            'context' => $notification['context'] ?? null,
            'read' => false,
        ]);
    }

    private function updateNotificationStatus($userId, $notificationId, $isRead)
    {
        Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->update(['read' => $isRead]);
    }

    private function markAllNotificationsRead($userId)
    {
        Notification::where('user_id', $userId)
            ->update(['read' => true]);
    }

    private function removeNotification($userId, $notificationId)
    {
        Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->delete();
    }

    private function clearAllNotifications($userId)
    {
        Notification::where('user_id', $userId)
            ->delete();
    }

    // ===== WhatsApp Testing Methods (Existing) =====

    /**
     * Test WhatsApp notification
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testWhatsApp(Request $request)
    {
        // Handle generic message test (from Admin Dashboard)
        if ($request->has('to') && $request->has('message')) {
            $request->validate([
                'to' => 'required|string',
                'message' => 'required|string',
                'file' => 'nullable|string'
            ]);

            $result = $this->whatsappService->sendTextMessage($request->to, $request->message, 'notification', $request->file);
            return response()->json($result);
        }

        // Handle specific template test
        $request->validate([
            'phone' => 'required|string',
            'type' => 'required|in:otp,order,quote,status,store,welcome',
        ]);

        $phone = $request->phone;
        $result = null;

        switch ($request->type) {
            case 'otp':
                $result = $this->whatsappService->sendOTP($phone, '123456');
                break;
            case 'order':
                $result = $this->whatsappService->sendNewOrderNotification(
                    $phone,
                    'ORD-123456',
                    'تويوتا كامري 2020 - قطعة غيار محرك'
                );
                break;
            case 'quote':
                $result = $this->whatsappService->sendQuoteNotification(
                    $phone,
                    'ORD-123456',
                    'محمد أحمد',
                    '500,000 ل.س'
                );
                break;
            case 'status':
                $result = $this->whatsappService->sendOrderStatusUpdate(
                    $phone,
                    'ORD-123456',
                    'قيد التوصيل'
                );
                break;
            case 'store':
                $result = $this->whatsappService->sendStoreOrderConfirmation(
                    $phone,
                    'STORE-123',
                    'زيت موبيل 1 - 5 لتر',
                    '250,000 ل.س'
                );
                break;
            case 'welcome':
                $result = $this->whatsappService->sendWelcomeMessage(
                    $phone,
                    'أحمد'
                );
                break;
        }

        return response()->json($result);
    }

    /**
     * Get WhatsApp notification statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStats()
    {
        // You can implement statistics tracking here
        return response()->json([
            'message' => 'Statistics endpoint - implement as needed',
        ]);
    }
    /**
     * Subscribe to Web Push Notifications
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function subscribe(Request $request)
    {
        \Log::info('🔵 [Backend] Push subscription request received', [
            'endpoint' => $request->input('endpoint'),
            'has_auth' => $request->has('keys.auth'),
            'has_p256dh' => $request->has('keys.p256dh'),
        ]);

        $request->validate([
            'endpoint' => 'required',
            'keys.auth' => 'required',
            'keys.p256dh' => 'required',
        ]);

        $user = $request->user();

        if (!$user) {
            \Log::error('❌ [Backend] User not authenticated for push subscription');
            return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
        }

        \Log::info('🔵 [Backend] User authenticated', [
            'user_id' => $user->id,
            'user_email' => $user->email ?? 'N/A',
        ]);

        try {
            // Update subscription using the trait method
            // Use input() with dot notation for nested data
            $subscription = $user->updatePushSubscription(
                $request->input('endpoint'),
                $request->input('keys.p256dh'),
                $request->input('keys.auth')
            );

            \Log::info('✅ [Backend] Push subscription saved successfully', [
                'user_id' => $user->id,
                'subscription_id' => $subscription->id ?? 'N/A',
                'endpoint' => substr($request->input('endpoint'), 0, 50) . '...',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscribed to push notifications',
                'subscription_id' => $subscription->id ?? null,
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ [Backend] Failed to save push subscription', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save subscription: ' . $e->getMessage()
            ], 500);
        }
    }
}
