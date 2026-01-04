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
use App\Events\OrderStatusUpdated;
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
    public function create(\App\Http\Requests\OrderRequest $request)
    {
        $user = Auth::user();

        // Determine user type (supports customers, technicians, and tow truck providers)
        $userType = 'customer'; // Default
        if ($user && isset($user->role)) {
            $userType = match ($user->role) {
                'technician' => 'technician',
                'tow_truck' => 'tow_truck',
                default => 'customer',
            };
        }

        $data = $request->validated();

        // Add calculated fields to pass to service
        $data['user_type'] = $userType;
        // Map request fields to structure expected by service/model if key names differ
        // But request keys match model/service keys closely based on request validation rules

        // Delegate to Service
        $order = $this->orderService->createOrder($request->all(), $user);

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

        // Delegate to Service
        $quote = $this->orderService->submitQuote($order, $provider, $request->all());

        return response()->json(['message' => __('messages.quote_submitted'), 'data' => $quote], 201);
    }

    /**
     * Customer: Accept Quote
     */
    public function acceptQuote(OrderRequest $request, $orderNumber)
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $quote = Quote::findOrFail($request->quote_id);

        $order = $this->orderService->acceptQuote($order, $quote, $request->validated());

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

        // Use service to update status which handles event dispatching
        $this->orderService->updateOrderStatus($order, $request->status);

        // Legacy Support: We might still want to return fresh resource or specifics the frontend needs
        // But for now keeping it clean. Note: updateOrderStatus handles events. 
        // NOTE: The previous controller method did extra specific notifications that might need preserving 
        // if not covered by generic status update. But we are standardizing.

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

        // Notify customer about shipping notes update - Service? 
        // Ideally move to service, but staying within scope of current refactor plan.
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

        $order = $this->orderService->approvePayment($order);

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

        $order = $this->orderService->rejectPayment($order, $request->reason);

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

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

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

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

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

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

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

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

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

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

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
        $oldStatus = $order->status;

        $order->update(['status' => 'completed']);

        // Send completion notifications to all parties
        $this->notificationService->notifyOrderCompleted($order);

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

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
        $oldStatus = $order->status;

        $order->update(['status' => 'cancelled']);

        // Notify all parties about cancellation
        $this->notificationService->notifyOrderCancelled($order, $request->reason);

        // Broadcast standard event
        event(new OrderStatusUpdated($order, $oldStatus));

        return ApiResponse::success(
            new OrderResource($order),
            __('messages.order_cancelled')
        );
    }
}
