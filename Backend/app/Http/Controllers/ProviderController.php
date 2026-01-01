<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Models\Provider;
use App\Models\Notification;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\WithdrawalResource;
use App\Http\Resources\OrderResource;
use App\Events\UserNotification;
use App\Events\AdminDashboardEvent;

class ProviderController extends Controller
{
    public function getTransactions(Request $request)
    {
        $user = $request->user();

        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $transactions = Transaction::where('provider_id', $user->provider->id)
            ->orderBy('timestamp', 'desc')
            ->get();

        return TransactionResource::collection($transactions);
    }

    public function getOpenOrders(Request $request)
    {
        $user = $request->user();

        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $provider = $user->provider;

        // Ensure assignedCategories is an array
        $categories = $provider->assigned_categories ?? [];
        if (is_string($categories)) {
            $categories = json_decode($categories, true) ?? [];
        }

        $orders = Order::where('status', 'pending')
            ->whereIn('form_data->category', $categories)
            ->whereDoesntHave('quotes', function ($query) use ($provider) {
                $query->where('provider_id', $provider->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function getMyBids(Request $request)
    {
        $user = $request->user();
        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $orders = Order::whereHas('quotes', function ($query) use ($user) {
            $query->where('provider_id', $user->provider->id);
        })
            ->with([
                'quotes' => function ($query) use ($user) {
                    $query->where('provider_id', $user->provider->id);
                },
                'acceptedQuote'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function getAcceptedOrders(Request $request)
    {
        $user = $request->user();
        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $orders = Order::whereHas('acceptedQuote', function ($query) use ($user) {
            $query->where('provider_id', $user->provider->id);
        })
            ->with(['acceptedQuote'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function getWithdrawals(Request $request)
    {
        $user = $request->user();

        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $withdrawals = Withdrawal::where('provider_id', $user->provider->id)
            ->orderBy('request_timestamp', 'desc')
            ->get();

        return WithdrawalResource::collection($withdrawals);
    }

    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'paymentMethodId' => 'required|string'
        ]);

        $user = $request->user();
        $provider = $user->provider;

        if (!$provider) {
            return response()->json(['error' => 'Provider profile not found'], 404);
        }

        if ($provider->wallet_balance < $request->amount) {
            return response()->json(['error' => __('messages.insufficient_funds')], 400);
        }

        // Find payment method details from provider's settings/payment info
        // Assuming payment_info is a JSON casted array on the Provider model
        $paymentMethods = $provider->payment_info ?? [];
        $selectedMethod = null;

        foreach ($paymentMethods as $method) {
            if (isset($method['methodId']) && $method['methodId'] === $request->paymentMethodId) {
                $selectedMethod = $method;
                break;
            }
        }

        if (!$selectedMethod) {
            return response()->json(['error' => __('messages.invalid_payment_method')], 400);
        }

        $withdrawal = null;

        DB::transaction(function () use ($provider, $request, $selectedMethod, &$withdrawal) {
            // Create withdrawal request
            $withdrawal = Withdrawal::create([
                'id' => 'WDR-' . uniqid(),
                'provider_id' => $provider->id,
                'provider_name' => $provider->name,
                'provider_unique_id' => $provider->unique_id ?? $provider->id, // Fallback if unique_id is missing
                'amount' => $request->amount,
                'status' => 'Pending',
                'request_timestamp' => now(),
                'payment_method_id' => $request->paymentMethodId,
                'payment_method_name' => $selectedMethod['methodName'] ?? 'Unknown Method',
            ]);

            // Deduct from wallet immediately (or hold it)
            // Strategy: Deduct now. If rejected, refund.
            $provider->wallet_balance -= $request->amount;
            $provider->save();

            // Log transaction
            Transaction::create([
                'id' => 'txn-' . uniqid(),
                'provider_id' => $provider->id,
                'type' => 'withdrawal_request',
                'amount' => -$request->amount,
                'description' => 'Withdrawal Request',
                'balance_after' => $provider->wallet_balance,
                'timestamp' => now(),
                'related_withdrawal_id' => $withdrawal->id
            ]);

            // Notify admin about new withdrawal request
            $adminPhone = SystemSettings::getSetting('adminPhone', '+963999999999');
            $adminUser = \App\Models\User::where('phone', $adminPhone)->first();

            if ($adminUser) {
                $adminNotification = Notification::create([
                    'user_id' => $adminUser->id,
                    'title' => 'طلب سحب جديد - يتطلب مراجعة',
                    'message' => sprintf('طلب سحب جديد من %s بقيمة $%.2f - انقر لمراجعة طلبات السحب', $provider->name, $request->amount),
                    'type' => 'WITHDRAWAL_REQUEST_ADMIN',
                    'read' => false,
                    'link' => [
                        'view' => 'adminDashboard',
                        'params' => ['adminView' => 'accounting', 'tab' => 'withdrawals']
                    ],
                ]);

                // Broadcast to admin
                event(new UserNotification($adminUser->id, [
                    'id' => $adminNotification->id,
                    'title' => $adminNotification->title,
                    'message' => $adminNotification->message,
                    'type' => $adminNotification->type,
                    'timestamp' => $adminNotification->created_at->toIso8601String(),
                    'link' => $adminNotification->link,
                    'read' => false,
                ]));
            }

            // Notify Provider (Confirmation)
            // Provider id is a phone number, resolve to user id
            $providerUser = \App\Models\User::where('phone', $provider->id)->first();

            if ($providerUser) {
                $providerNotification = Notification::create([
                    'user_id' => $providerUser->id,
                    'title' => 'تم استلام طلب السحب',
                    'message' => sprintf('تم استلام طلب السحب بقيمة $%.2f وهو قيد المراجعة.', $request->amount),
                    'type' => 'WITHDRAWAL_REQUEST_CONFIRMATION',
                    'read' => false,
                    'context' => ['amount' => number_format($request->amount, 2)],
                ]);

                event(new UserNotification($providerUser->id, [
                    'id' => $providerNotification->id,
                    'title' => $providerNotification->title,
                    'message' => $providerNotification->message,
                    'type' => $providerNotification->type,
                    'timestamp' => $providerNotification->created_at->toIso8601String(),
                    'read' => false,
                    'link' => null,
                ]));
            }

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('withdrawal.requested', [
                'withdrawal_id' => $withdrawal->id,
                'provider_id' => $provider->id,
                'provider_name' => $provider->name,
                'amount' => $request->amount,
            ]));
        });

        return new WithdrawalResource($withdrawal);
    }

    public function getWalletBalance(Request $request)
    {
        $user = $request->user();

        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        return response()->json([
            'balance' => $user->provider->wallet_balance ?? 0
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $provider = $user->provider;

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'paymentInfo' => 'sometimes|array',
            'notificationSettings' => 'sometimes|array',
        ]);

        if (isset($validated['name'])) {
            $provider->name = $validated['name'];
        }

        if (isset($validated['paymentInfo'])) {
            $provider->payment_info = $validated['paymentInfo'];
        }

        if (isset($validated['notificationSettings'])) {
            $provider->notification_settings = $validated['notificationSettings'];
        }

        $provider->save();

        return response()->json($provider);
    }

    public function updateAcceptedOrderStatus(Request $request, $orderNumber)
    {
        $request->validate([
            'status' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        $user = $request->user();
        if (!$user->provider) {
            return response()->json(['error' => 'Provider profile not found'], 404);
        }

        $provider = $user->provider;

        // Find order and verify it belongs to this provider
        $order = Order::where('order_number', $orderNumber)
            ->with('acceptedQuote')
            ->firstOrFail();

        // Verify this provider owns the accepted quote
        if (!$order->acceptedQuote || $order->acceptedQuote->provider_id !== $provider->id) {
            return response()->json(['error' => __('messages.unauthorized')], 403);
        }

        $newStatus = $request->status;
        $currentStatus = $order->status;

        // Define allowed status transitions for providers
        $allowedTransitions = [
            'processing' => ['provider_received', 'ready_for_pickup'],
            'جاري التجهيز' => ['تم الاستلام من المزود', 'جاهز للاستلام'],
        ];

        // Check if transition is allowed
        $validTransition = false;
        if (isset($allowedTransitions[$currentStatus])) {
            $validTransition = in_array($newStatus, $allowedTransitions[$currentStatus]);
        }

        if (!$validTransition) {
            return response()->json([
                'error' => __('messages.invalid_status_transition'),
                'message' => "Cannot change status from '{$currentStatus}' to '{$newStatus}'"
            ], 400);
        }

        // Update order status
        $order->update(['status' => $newStatus]);

        // Get status label for notification
        $statusLabels = [
            'provider_received' => 'تم الاستلام من المزود',
            'ready_for_pickup' => 'جاهز للاستلام',
            'تم الاستلام من المزود' => 'تم الاستلام من المزود',
            'جاهز للاستلام' => 'جاهز للاستلام',
        ];
        $statusLabel = $statusLabels[$newStatus] ?? $newStatus;

        // Notify customer about status change
        $customerUser = \App\Models\User::where('phone', $order->user_id)->first();
        if ($customerUser) {
            $customerNotification = Notification::create([
                'user_id' => $customerUser->id,
                'title' => 'تحديث حالة الطلب',
                'message' => "تم تحديث حالة طلبك #{$orderNumber} إلى: {$statusLabel}",
                'type' => 'ORDER_STATUS_CHANGED',
                'context' => ['orderNumber' => $orderNumber, 'status' => $newStatus],
                'read' => false,
            ]);

            event(new UserNotification($customerUser->id, [
                'id' => $customerNotification->id,
                'title' => $customerNotification->title,
                'message' => $customerNotification->message,
                'type' => $customerNotification->type,
                'timestamp' => $customerNotification->created_at->toIso8601String(),
                'read' => false,
                'link' => ['view' => 'customerDashboard', 'params' => ['orderNumber' => $orderNumber]]
            ]));
        }

        // Notify admin about status change
        $adminPhone = SystemSettings::getSetting('adminPhone', '+963999999999');
        $adminUser = \App\Models\User::where('phone', $adminPhone)->first();

        if ($adminUser) {
            $adminNotification = Notification::create([
                'user_id' => $adminUser->id,
                'title' => 'تحديث من المزود',
                'message' => "قام {$provider->name} بتحديث حالة الطلب #{$orderNumber} إلى: {$statusLabel}",
                'type' => 'ORDER_STATUS_CHANGED',
                'read' => false,
                'link' => [
                    'view' => 'adminDashboard',
                    'params' => ['adminView' => 'orders', 'orderNumber' => $orderNumber]
                ],
            ]);

            event(new UserNotification($adminUser->id, [
                'id' => $adminNotification->id,
                'title' => $adminNotification->title,
                'message' => $adminNotification->message,
                'type' => $adminNotification->type,
                'timestamp' => $adminNotification->created_at->toIso8601String(),
                'read' => false,
                'link' => $adminNotification->link,
            ]));
        }

        // Broadcast to admin dashboard for real-time refresh
        event(new AdminDashboardEvent('order.status_updated', [
            'order_number' => $orderNumber,
            'old_status' => $currentStatus,
            'new_status' => $newStatus,
            'updated_by' => 'provider',
        ]));

        return response()->json([
            'message' => __('messages.order_status_updated'),
            'data' => $order->fresh(['acceptedQuote'])
        ]);
    }

    public function getOverviewData(Request $request)
    {
        $user = $request->user();
        if (!$user->provider) {
            return response()->json(['error' => __('messages.provider_profile_not_found')], 404);
        }

        $provider = $user->provider;
        $providerId = $provider->id;

        // 1. Wallet Balance
        $walletBalance = $provider->wallet_balance ?? 0;

        // 2. Statistics
        $activeBidsCount = Order::whereIn('status', ['pending', 'quoted'])
            ->whereHas('quotes', function ($q) use ($providerId) {
                $q->where('provider_id', $providerId);
            })->count();

        // Won Orders
        $wonOrdersCount = Order::whereHas('acceptedQuote', function ($q) use ($providerId) {
            $q->where('provider_id', $providerId);
        })->count();

        // Open Orders
        $categories = $provider->assigned_categories ?? [];
        if (is_string($categories)) {
            $categories = json_decode($categories, true) ?? [];
        }

        $openOrdersCount = Order::where('status', 'pending')
            ->whereIn('form_data->category', $categories)
            ->whereDoesntHave('quotes', function ($q) use ($providerId) {
                $q->where('provider_id', $providerId);
            })
            ->count();

        // Total Bids
        $totalBidsCount = DB::table('quotes')->where('provider_id', $providerId)->count();


        // 3. Recent Transactions
        $recentTransactions = Transaction::where('provider_id', $providerId)
            ->orderBy('timestamp', 'desc')
            ->take(5)
            ->get();

        // 4. Charts Data (Last 7 Days)
        $sevenDaysAgo = now()->subDays(6)->startOfDay();

        // Activity: Quotes placed per day
        $activityDataRaw = DB::table('quotes')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('provider_id', $providerId)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        // Revenue: Transactions (positive amount, not deposit) per day
        $revenueDataRaw = Transaction::select(DB::raw('DATE(timestamp) as date'), DB::raw('SUM(amount) as total'))
            ->where('provider_id', $providerId)
            ->where('amount', '>', 0)
            ->where('type', '!=', 'deposit')
            ->where('timestamp', '>=', $sevenDaysAgo)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $activityChart = [];
        $revenueChart = [];

        $enToArDays = [
            'Sun' => 'أحد',
            'Mon' => 'إثنين',
            'Tue' => 'ثلاثاء',
            'Wed' => 'أربعاء',
            'Thu' => 'خميس',
            'Fri' => 'جمعة',
            'Sat' => 'سبت'
        ];

        for ($i = 0; $i < 7; $i++) {
            $d = now()->subDays($i);
            $date = $d->format('Y-m-d');
            $dayNameEn = $d->format('D');
            $dayName = $enToArDays[$dayNameEn] ?? $dayNameEn;

            // Activity
            $actItem = isset($activityDataRaw[$date]) ? $activityDataRaw[$date] : null;
            $count = $actItem ? $actItem->count : 0;

            $activityChart[] = [
                'name' => $dayName,
                'date' => $date,
                'quotes' => (int) $count
            ];

            // Revenue
            $revItem = isset($revenueDataRaw[$date]) ? $revenueDataRaw[$date] : null;
            $total = $revItem ? $revItem->total : 0;

            $revenueChart[] = [
                'name' => $dayName,
                'date' => $date,
                'value' => (float) $total
            ];
        }

        return response()->json([
            'stats' => [
                'walletBalance' => $walletBalance,
                'activeBids' => $activeBidsCount,
                'wonOrders' => $wonOrdersCount,
                'openOrders' => $openOrdersCount,
                'totalBids' => $totalBidsCount,
            ],
            'recentTransactions' => TransactionResource::collection($recentTransactions),
            'charts' => [
                'activity' => array_reverse($activityChart),
                'revenue' => array_reverse($revenueChart)
            ]
        ]);
    }
}

