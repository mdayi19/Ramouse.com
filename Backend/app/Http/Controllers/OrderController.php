<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Quote;
use App\Models\CarCategory;
use App\Jobs\SendTelegramOrderNotification;
use App\Services\OrderNotificationService;
use App\Services\OrderService;
use App\Events\AdminDashboardEvent;
use App\Events\CustomerOrderEvent;
use App\Http\Resources\OrderResource;
use App\Helpers\ApiResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    protected OrderNotificationService $notificationService;
    protected OrderService $orderService;

    public function __construct(
        OrderNotificationService $notificationService,
        OrderService $orderService
    ) {
        $this->notificationService = $notificationService;
        $this->orderService = $orderService;
    }
    public function create(Request $request)
    {
        // Enhanced validation for form data
        $request->validate([
            'form_data' => 'required|array',
            'form_data.category' => 'required|string',
            'form_data.brand' => 'nullable|string',
            'form_data.brandManual' => 'nullable|string',
            'form_data.model' => 'nullable|string',
            'form_data.year' => 'nullable|string',
            // Voice note OR text description is acceptable
            'form_data.partDescription' => 'required_without:form_data.voiceNote|nullable|string',
            'form_data.voiceNote' => 'required_without:form_data.partDescription|nullable',
            'form_data.city' => 'required|string',
            'form_data.contactMethod' => 'required|in:whatsapp,call,email',
            'form_data.partTypes' => 'required|array',
            'customer_name' => 'nullable|string',
            'customer_address' => 'nullable|string',
            'customer_phone' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Prevent providers from submitting orders
        if ($user && isset($user->role) && $user->role === 'provider') {
            return response()->json([
                'message' => __('messages.providers_not_allowed_to_order'),
                'error' => 'unauthorized_role'
            ], 403);
        }

        // Determine user type (supports customers, technicians, and tow truck providers)
        $userType = 'customer'; // Default
        if ($user && isset($user->role)) {
            $userType = match ($user->role) {
                'technician' => 'technician',
                'tow_truck' => 'tow_truck',
                default => 'customer',
            };
        }

        $order = Order::create([
            'order_number' => (string) now()->timestamp, // Simplified: timestamp only
            'user_id' => $user->phone ?? $user->id ?? 'guest', // Use phone for notifications
            'user_type' => $userType,
            'status' => 'pending',
            'form_data' => $request->form_data,
            'customer_name' => $request->customer_name,
            'customer_address' => $request->customer_address,
            'customer_phone' => $request->customer_phone,
            'delivery_method' => $request->delivery_method ?? 'shipping',
        ]);

        // Dispatch Telegram notification to category-specific channel
        $this->orderService->dispatchTelegramNotification($order, $request->form_data, $request->root());

        // Send notifications
        $this->notificationService->notifyOrderCreated($order);
        $this->notificationService->notifyAdminNewOrder($order);

        // Broadcast to admin dashboard for real-time refresh
        event(new AdminDashboardEvent('order.created', [
            'order_number' => $order->order_number,
            'status' => $order->status,
            'category' => $request->form_data['category'] ?? null,
        ]));

        return ApiResponse::created(
            new OrderResource($order),
            __('messages.order_created')
        );
    }



    public function list(Request $request)
    {
        $user = Auth::user();

        // Ensure user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
                'data' => []
            ], 401);
        }

        // Admins can see all orders, regular users see only their own
        $query = Order::with(['quotes', 'acceptedQuote'])->orderBy('created_at', 'desc');

        // Check if user is admin (adjust this check based on your auth setup)
        // Common approaches: $user->role === 'admin' or $user->is_admin
        $isAdmin = isset($user->role) && $user->role === 'admin';

        if (!$isAdmin) {
            // Regular users only see their own orders
            // Orders use phone number as user_id reference
            $query->where('user_id', $user->phone);
        }

        $orders = $query->get();

        return ApiResponse::success(OrderResource::collection($orders));
    }

    public function show($orderNumber)
    {
        $order = Order::with(['quotes', 'acceptedQuote'])->where('order_number', $orderNumber)->firstOrFail();
        return ApiResponse::success(new OrderResource($order));
    }

    public function submitQuote(Request $request, $orderNumber)
    {
        $request->validate([
            'price' => 'required|numeric',
            'part_status' => 'required|string',
        ]);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $user = Auth::user();

        if (!$user || $user->role !== 'provider') {
            return response()->json(['message' => __('messages.unauthorized')], 403);
        }

        $provider = $user->provider;

        if (!$provider) {
            return response()->json(['message' => __('messages.provider_profile_not_found')], 404);
        }

        $quote = Quote::create([
            'id' => Str::uuid(),
            'order_number' => $orderNumber,
            'provider_id' => $provider->id,
            'provider_name' => $provider->name,
            'provider_unique_id' => $provider->unique_id,
            'price' => $request->price,
            'part_status' => $request->part_status,
            'part_size_category' => $request->part_size_category,
            'notes' => $request->notes,
            'media' => $request->media,
        ]);

        // Notify Provider (Confirmation)
        $providerUser = \App\Models\User::where('phone', $provider->id)->first();
        if ($providerUser) {
            $notification = \App\Models\Notification::create([
                'user_id' => $providerUser->id,
                'title' => 'تم إرسال العرض',
                'message' => "تم إرسال عرضك للطلب #{$orderNumber} بنجاح.",
                'type' => 'OFFER_ACCEPTED_PROVIDER_WIN', // Using the type frontend expects
                'context' => ['orderNumber' => $orderNumber],
                'read' => false,
            ]);
            event(new \App\Events\UserNotification($providerUser->id, [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'timestamp' => $notification->created_at->toIso8601String(),
                'read' => false,
                'link' => null,
            ]));
        }

        // Notify Customer (New Quote)
        // Order user_id is phone, resolve to User ID
        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();
        if ($customerUser) {
            $customerNotification = \App\Models\Notification::create([
                'user_id' => $customerUser->id,
                'title' => 'عرض جديد',
                'message' => "تلقيت عرضاً جديداً للطلب #{$orderNumber}",
                'type' => 'quote_received',
                'context' => ['orderNumber' => $orderNumber, 'quoteId' => $quote->id],
                'read' => false,
            ]);
            event(new \App\Events\UserNotification($customerUser->id, [
                'id' => $customerNotification->id,
                'title' => $customerNotification->title,
                'message' => $customerNotification->message,
                'type' => $customerNotification->type,
                'timestamp' => $customerNotification->created_at->toIso8601String(),
                'read' => false,
                'link' => null,
            ]));
        }

        // Broadcast to admin dashboard for real-time refresh
        event(new AdminDashboardEvent('quote.received', [
            'order_number' => $orderNumber,
            'quote_id' => $quote->id,
            'provider_name' => $provider->name,
            'price' => $quote->price,
        ]));

        // Broadcast to customer for smooth MyOrders refresh
        if ($customerUser) {
            event(new CustomerOrderEvent($customerUser->id, 'quote.received', [
                'order_number' => $orderNumber,
                'quote_id' => $quote->id,
                'provider_name' => $provider->name,
                'price' => $quote->price,
            ]));
        }

        return response()->json(['message' => __('messages.quote_submitted'), 'data' => $quote], 201);
    }

    public function acceptQuote(Request $request, $orderNumber)
    {
        $request->validate([
            'quote_id' => 'required|exists:quotes,id',
            'payment_method_id' => 'required|string',
            'payment_method_name' => 'nullable|string',
            'delivery_method' => 'required|in:shipping,pickup',
            'customer_name' => 'required_if:delivery_method,shipping|nullable|string',
            'customer_address' => 'required_if:delivery_method,shipping|nullable|string',
            'customer_phone' => 'required_if:delivery_method,shipping|nullable|string',
            'shipping_price' => 'nullable|numeric',
            'payment_receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120', // 5MB max
        ]);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $quote = Quote::findOrFail($request->quote_id);

        // Handle Payment Receipt Upload
        $receiptUrl = null;
        $isNewUpload = false;
        $isReupload = false;

        if ($request->hasFile('payment_receipt')) {
            $file = $request->file('payment_receipt');
            $path = $file->store('payment_receipts', 'public');
            $receiptUrl = asset('storage/' . $path);

            // Check if this is a reupload (order already had a receipt)
            if ($order->payment_receipt_url) {
                $isReupload = true;
            } else {
                $isNewUpload = true;
            }
        }

        // Determine Status
        // If COD, status is 'processing' 
        // If Transfer, status is 'payment_pending'
        $isCOD = $request->payment_method_id === 'pm-cod';
        $status = $isCOD ? 'processing' : 'payment_pending';

        $order->update([
            'accepted_quote_id' => $request->quote_id,
            'payment_method_id' => $request->payment_method_id,
            'payment_method_name' => $request->payment_method_name,
            'payment_receipt_url' => $receiptUrl,
            'delivery_method' => $request->delivery_method,
            'customer_name' => $request->customer_name ?? $order->customer_name,
            'customer_address' => $request->customer_address ?? $order->customer_address,
            'customer_phone' => $request->customer_phone ?? $order->customer_phone,
            'shipping_price' => $request->shipping_price ?? 0,
            'status' => $status,
            'rejection_reason' => null, // Clear any previous rejection
        ]);

        // Notify admin about payment upload
        if ($isNewUpload) {
            $this->notificationService->notifyPaymentUploaded($order);
        } elseif ($isReupload) {
            $this->notificationService->notifyPaymentReuploaded($order);
        }

        // Notifications

        // 1. Notify Customer (Confirmation)
        $customerTitle = 'تم تأكيد طلبك!';
        $customerMessage = "تم تأكيد طلبك #{$orderNumber} وهو الآن " . ($isCOD ? 'قيد التجهيز.' : 'بانتظار تأكيد الدفع.');

        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();

        if ($customerUser) {
            \App\Models\Notification::create([
                'user_id' => $customerUser->id,
                'title' => $customerTitle,
                'message' => $customerMessage,
                'type' => 'ORDER_STATUS_CHANGED',
                'context' => ['orderNumber' => $orderNumber, 'status' => $status],
                'read' => false,
            ]);
            // Trigger Event for Real-time
            event(new \App\Events\UserNotification($customerUser->id, [
                'title' => $customerTitle,
                'message' => $customerMessage,
                'type' => 'ORDER_STATUS_CHANGED',
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $orderNumber]]
            ]));
        }


        // 2. Notify Winning Provider
        $winnerId = $quote->provider_id; // This is phone
        $winnerUser = \App\Models\User::where('phone', $winnerId)->first();

        if ($winnerUser) {
            \App\Models\Notification::create([
                'user_id' => $winnerUser->id,
                'title' => 'لقد فزت بطلب!',
                'message' => "تم قبول عرضك للطلب #{$orderNumber}.",
                'type' => 'OFFER_ACCEPTED_PROVIDER_WIN',
                'context' => ['orderNumber' => $orderNumber],
                'read' => false,
            ]);
            event(new \App\Events\UserNotification($winnerUser->id, [
                'title' => 'لقد فزت بطلب!',
                'message' => "تم قبول عرضك للطلب #{$orderNumber}.",
                'type' => 'OFFER_ACCEPTED_PROVIDER_WIN',
                'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $orderNumber]]
            ]));
        }

        // 3. Loss notifications removed - only winning providers receive notifications

        // 4. Notify Admin (if not COD)
        if (!$isCOD) {
            // Assuming admin ID or a specific channel for admin
            // For now, we might not have a specific admin user ID in this context easily without settings, 
            // but usually there is a super admin or we broadcast to 'admin' channel.
            // We will skip DB notification for admin if no ID, but we can broadcast.
            // If you have an admin user ID (e.g. from settings or fixed), use it.
            // For now, let's assume we broadcast to a private admin channel.
            // event(new \App\Events\AdminNotification(...)); 
        }

        // Broadcast to admin dashboard for real-time refresh when quote accepted/payment uploaded
        event(new AdminDashboardEvent('order.quote_accepted', [
            'order_number' => $orderNumber,
            'payment_method' => $request->payment_method_name,
            'has_receipt' => $receiptUrl ? true : false,
            'status' => $status,
        ]));

        return ApiResponse::success(
            new OrderResource($order->fresh()),
            __('messages.quote_accepted')
        );
    }

    /**
     * Admin: Get all orders with quotes
     */
    public function adminList(Request $request)
    {
        $orders = Order::with('quotes', 'acceptedQuote')
            ->orderBy('created_at', 'desc')
            ->get();

        return ApiResponse::success(OrderResource::collection($orders));
    }

    /**
     * Admin: Update order status with customer notification
     */
    public function adminUpdateStatus(Request $request, $orderNumber)
    {
        $request->validate(['status' => 'required|string']);

        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();
        $oldStatus = $order->status;
        $order->update(['status' => $request->status]);

        // Use OrderNotificationService for consistent notification handling
        $this->notificationService->notifyOrderStatusChange($order, $oldStatus, $request->status);

        // Broadcast to admin dashboard for real-time refresh
        event(new AdminDashboardEvent('order.status_updated', [
            'order_number' => $orderNumber,
            'old_status' => $oldStatus,
            'new_status' => $request->status,
        ]));

        // Broadcast to customer for smooth MyOrders refresh
        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();
        if ($customerUser) {
            event(new CustomerOrderEvent($customerUser->id, 'order.status_updated', [
                'order_number' => $orderNumber,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
            ]));
        }

        return ApiResponse::success(
            new OrderResource($order->fresh()),
            __('messages.order_status_updated')
        );
    }

    /**
     * Admin: Update shipping notes
     */
    public function updateShippingNotes(Request $request, $orderNumber)
    {
        $request->validate(['shipping_notes' => 'required|string']);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $order->update(['shipping_notes' => $request->shipping_notes]);

        // Notify customer about shipping notes update
        $this->notificationService->notifyShippingNotesUpdated($order);

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.shipping_notes_updated')
        );
    }

    /**
     * Admin: Approve payment
     */
    public function approvePayment(Request $request, $orderNumber)
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $order->update(['status' => 'processing']);

        // Notify customer
        // Notify customer
        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();
        if ($customerUser) {
            \App\Models\Notification::create([
                'user_id' => $customerUser->id,
                'title' => 'تم تأكيد الدفع',
                'message' => "تم تأكيد الدفع لطلبك #{$orderNumber}. جاري تجهيز الطلب.",
                'type' => 'ORDER_STATUS_CHANGED',
                'context' => ['orderNumber' => $orderNumber, 'status' => 'processing'],
                'read' => false,
            ]);

            event(new \App\Events\UserNotification($customerUser->id, [
                'title' => 'تم تأكيد الدفع',
                'message' => "تم تأكيد الدفع لطلبك #{$orderNumber}. جاري تجهيز الطلب.",
                'type' => 'ORDER_STATUS_CHANGED',
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $orderNumber]]
            ]));
        }

        // Notify provider if quote was accepted
        if ($order->acceptedQuote) {
            $providerUser = \App\Models\User::where('phone', $order->acceptedQuote->provider_id)->first();
            if ($providerUser) {
                \App\Models\Notification::create([
                    'user_id' => $providerUser->id,
                    'title' => 'تم تأكيد الدفع للطلب',
                    'message' => "تم تأكيد الدفع للطلب #{$orderNumber}. يرجى البدء بالتجهيز.",
                    'type' => 'OFFER_ACCEPTED_PROVIDER_WIN',
                    'context' => ['orderNumber' => $orderNumber],
                    'read' => false,
                ]);

                event(new \App\Events\UserNotification($providerUser->id, [
                    'title' => 'تم تأكيد الدفع للطلب',
                    'message' => "تم تأكيد الدفع للطلب #{$orderNumber}. يرجى البدء بالتجهيز.",
                    'type' => 'OFFER_ACCEPTED_PROVIDER_WIN',
                    'link' => ['view' => 'providerDashboard', 'params' => ['orderNumber' => $orderNumber]]
                ]));
            }
        }

        // Broadcast to admin dashboard for real-time refresh
        event(new AdminDashboardEvent('order.payment_updated', [
            'order_number' => $orderNumber,
            'action' => 'approved',
            'status' => 'processing',
        ]));

        // Broadcast to customer for smooth MyOrders refresh
        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();
        if ($customerUser) {
            event(new CustomerOrderEvent($customerUser->id, 'payment.updated', [
                'order_number' => $orderNumber,
                'action' => 'approved',
            ]));
        }

        return ApiResponse::success(
            new OrderResource($order->fresh()),
            __('messages.payment_approved')
        );
    }

    /**
     * Admin: Reject payment
     */
    public function rejectPayment(Request $request, $orderNumber)
    {
        $request->validate(['reason' => 'required|string']);

        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $order->update([
            'status' => 'pending',
            'rejection_reason' => $request->reason
        ]);

        // Notify customer
        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();
        if ($customerUser) {
            \App\Models\Notification::create([
                'user_id' => $customerUser->id,
                'title' => 'رفض إيصال الدفع',
                'message' => "تم رفض إيصال الدفع للطلب #{$orderNumber}. السبب: {$request->reason}",
                'type' => 'PAYMENT_REJECTED',
                'context' => ['orderNumber' => $orderNumber, 'reason' => $request->reason],
                'read' => false,
            ]);

            event(new \App\Events\UserNotification($customerUser->id, [
                'title' => 'رفض إيصال الدفع',
                'message' => "تم رفض إيصال الدفع للطلب #{$orderNumber}. السبب: {$request->reason}",
                'type' => 'PAYMENT_REJECTED',
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $orderNumber]]
            ]));
        }

        // Broadcast to admin dashboard for real-time refresh
        event(new AdminDashboardEvent('order.payment_updated', [
            'order_number' => $orderNumber,
            'action' => 'rejected',
            'reason' => $request->reason,
        ]));

        // Broadcast to customer for smooth MyOrders refresh
        if ($customerUser) {
            event(new CustomerOrderEvent($customerUser->id, 'payment.updated', [
                'order_number' => $orderNumber,
                'action' => 'rejected',
                'reason' => $request->reason,
            ]));
        }

        return ApiResponse::success(
            new OrderResource($order->fresh()),
            __('messages.payment_rejected')
        );
    }

    /**
     * Get Arabic label for order status
     */
    private function getStatusLabel($status)
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
            'completed' => 'تم الاستلام من الشركة',
            'cancelled' => 'ملغي',
        ];

        return $labels[$status] ?? $status;
    }

    public function updateStatus(Request $request, $orderNumber)
    {
        $request->validate(['status' => 'required|string']);

        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();
        $oldStatus = $order->status;
        $order->update(['status' => $request->status]);

        // Notify about status change
        $this->notificationService->notifyOrderStatusChange($order, $oldStatus, $request->status);

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_status_updated')
        );
    }

    /**
     * Mark order as ready for pickup or provider received (depending on delivery method)
     */
    public function markOrderReady(Request $request, $orderNumber)
    {
        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();
        $oldStatus = $order->status;

        // Validate delivery method
        if ($order->delivery_method === 'pickup') {
            $order->update(['status' => 'ready_for_pickup']);
        } else {
            // For shipping, provider marks as received first
            $order->update(['status' => 'provider_received']);
        }

        // Notify about status change
        $this->notificationService->notifyOrderStatusChange($order, $oldStatus, $order->status);

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_status_updated')
        );
    }

    /**
     * Mark order as shipped to customer
     */
    public function markOrderShipped(Request $request, $orderNumber)
    {
        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();
        $oldStatus = $order->status;

        $order->update(['status' => 'shipped']);

        // Notify about status change
        $this->notificationService->notifyOrderStatusChange($order, $oldStatus, 'shipped');

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_status_updated')
        );
    }

    /**
     * Mark order as out for delivery
     */
    public function markOutForDelivery(Request $request, $orderNumber)
    {
        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();
        $oldStatus = $order->status;

        $order->update(['status' => 'out_for_delivery']);

        // Notify about status change
        $this->notificationService->notifyOrderStatusChange($order, $oldStatus, 'out_for_delivery');

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_status_updated')
        );
    }

    /**
     * Mark order as delivered
     */
    public function markDelivered(Request $request, $orderNumber)
    {
        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();
        $oldStatus = $order->status;

        $order->update(['status' => 'delivered']);

        // Notify about status change
        $this->notificationService->notifyOrderStatusChange($order, $oldStatus, 'delivered');

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_status_updated')
        );
    }

    /**
     * Mark order as completed
     */
    public function markCompleted(Request $request, $orderNumber)
    {
        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();

        $order->update(['status' => 'completed']);

        // Send completion notifications to all parties
        $this->notificationService->notifyOrderCompleted($order);

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_completed')
        );
    }

    /**
     * Cancel order
     */
    public function cancelOrder(Request $request, $orderNumber)
    {
        $request->validate([
            'reason' => 'nullable|string'
        ]);

        $order = Order::with('acceptedQuote')->where('order_number', $orderNumber)->firstOrFail();

        $order->update(['status' => 'cancelled']);

        // Notify all parties about cancellation
        $this->notificationService->notifyOrderCancelled($order, $request->reason);

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_cancelled')
        );
    }
}
