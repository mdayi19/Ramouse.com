<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserTransaction;
use App\Models\UserDeposit;
use App\Models\UserWithdrawal;
use App\Models\UserWalletHold;
use App\Models\Customer;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Notification;
use App\Events\UserNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    /**
     * Get the user's profile and wallet balance
     */
    private function getUserProfile($user)
    {
        $profile = null;
        $userType = null;

        if ($user->customer) {
            $profile = $user->customer;
            $userType = 'customer';
        } elseif ($user->technician) {
            $profile = $user->technician;
            $userType = 'technician';
        } elseif ($user->towTruck) {
            $profile = $user->towTruck;
            $userType = 'tow_truck';
        }

        return [$profile, $userType];
    }

    /**
     * Get wallet balance
     */
    public function getBalance(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Calculate available balance (total - holds)
        $totalHolds = UserWalletHold::where('user_id', $user->id)
            ->where('user_type', $userType)
            ->validHolds()
            ->sum('amount');

        return response()->json([
            'balance' => (float) $profile->wallet_balance,
            'availableBalance' => (float) ($profile->wallet_balance - $totalHolds),
            'heldAmount' => (float) $totalHolds,
        ]);
    }

    /**
     * Get transaction history
     */
    public function getTransactions(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $transactions = UserTransaction::where('user_id', $user->id)
            ->where('user_type', $userType)
            ->orderBy('timestamp', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Get deposit request history
     */
    public function getDeposits(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $deposits = UserDeposit::where('user_id', $user->id)
            ->where('user_type', $userType)
            ->orderBy('request_timestamp', 'desc')
            ->get();

        return response()->json(['data' => $deposits]);
    }

    /**
     * Get withdrawal request history
     */
    public function getWithdrawals(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $withdrawals = UserWithdrawal::where('user_id', $user->id)
            ->where('user_type', $userType)
            ->orderBy('request_timestamp', 'desc')
            ->get();

        return response()->json(['data' => $withdrawals]);
    }

    /**
     * Submit a deposit request
     */
    public function submitDeposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'paymentMethodId' => 'required|string',
            'paymentMethodName' => 'required|string',
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Get limits from system settings
        $limitSettings = \App\Models\SystemSettings::getSetting('limitSettings');
        $minDeposit = $limitSettings['minDepositAmount'] ?? 0;
        $maxDeposit = $limitSettings['maxDepositAmount'] ?? 0;
        $maxBalance = $limitSettings['maxWalletBalance'] ?? 0;

        // Validate min deposit
        if ($minDeposit > 0 && $request->amount < $minDeposit) {
            return response()->json([
                'error' => "مبلغ الإيداع أقل من الحد الأدنى المسموح به (" . number_format($minDeposit) . "$)"
            ], 400);
        }

        // Validate max deposit
        if ($maxDeposit > 0 && $request->amount > $maxDeposit) {
            return response()->json([
                'error' => "مبلغ الإيداع يتجاوز الحد الأقصى المسموح به (" . number_format($maxDeposit) . "$)"
            ], 400);
        }

        // Validate max wallet balance (current balance + deposit amount)
        if ($maxBalance > 0 && ($profile->wallet_balance + $request->amount) > $maxBalance) {
            return response()->json([
                'error' => "لا يمكن إتمام الإيداع لأن الرصيد سيتجاوز الحد الأقصى للمحفظة (" . number_format($maxBalance) . "$)"
            ], 400);
        }

        // Upload receipt
        $receiptPath = $request->file('receipt')->store('wallet/deposits', 'public');
        $receiptUrl = '/storage/' . $receiptPath;

        // Create deposit request
        $deposit = UserDeposit::create([
            'user_id' => $user->id,
            'user_type' => $userType,
            'user_name' => $profile->name,
            'amount' => $request->amount,
            'status' => 'pending',
            'payment_method_id' => $request->paymentMethodId,
            'payment_method_name' => $request->paymentMethodName,
            'receipt_url' => $receiptUrl,
        ]);

        // Notify admin
        try {
            event(new \App\Events\AdminDashboardEvent('USER_DEPOSIT_REQUEST', [
                'depositId' => $deposit->id,
                'userName' => $profile->name,
                'userType' => $userType,
                'amount' => $request->amount,
            ]));
        } catch (\Exception $e) {
            \Log::warning('Failed to send admin notification: ' . $e->getMessage());
        }

        // Notify user
        try {
            $notification = Notification::create([
                'user_id' => $user->id,
                'title' => 'طلب إيداع جديد',
                'message' => 'تم تقديم طلب إيداع بمبلغ ' . number_format($request->amount, 2) . '$ وهو قيد المراجعة',
                'type' => 'DEPOSIT_REQUEST_CONFIRMATION',
                'read' => false,
            ]);

            event(new UserNotification($user->id, [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'timestamp' => $notification->created_at->toIso8601String(),
            ]));
        } catch (\Exception $e) {
            \Log::warning('Failed to send user notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'تم تقديم طلب الإيداع بنجاح',
            'deposit' => $deposit,
        ]);
    }

    /**
     * Submit a withdrawal request
     */
    public function submitWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'paymentMethodId' => 'required|string',
            'paymentMethodName' => 'required|string',
            'paymentMethodDetails' => 'required|string|min:10',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Check available balance
        $totalHolds = UserWalletHold::where('user_id', $user->id)
            ->where('user_type', $userType)
            ->validHolds()
            ->sum('amount');

        $availableBalance = $profile->wallet_balance - $totalHolds;

        if ($availableBalance < $request->amount) {
            return response()->json(['error' => 'الرصيد المتاح غير كافي'], 400);
        }

        // Get limits from system settings
        $limitSettings = \App\Models\SystemSettings::getSetting('limitSettings');

        // Use User-specific limits for withdrawal
        $minWithdrawal = $limitSettings['userMinWithdrawalAmount'] ?? $limitSettings['minWithdrawalAmount'] ?? 0;
        $maxWithdrawal = $limitSettings['userMaxWithdrawalAmount'] ?? $limitSettings['maxWithdrawalAmount'] ?? 0;
        $cooldownHours = $limitSettings['userWithdrawalCooldownHours'] ?? $limitSettings['withdrawalCooldownHours'] ?? 0;
        $maxRequests = $limitSettings['userMaxWithdrawalRequestsPerPeriod'] ?? $limitSettings['maxWithdrawalRequestsPerPeriod'] ?? 0;
        $periodDays = $limitSettings['withdrawalRequestsPeriodDays'] ?? 30;

        // Validate min withdrawal
        if ($minWithdrawal > 0 && $request->amount < $minWithdrawal) {
            return response()->json([
                'error' => "مبلغ السحب أقل من الحد الأدنى المسموح به (" . number_format($minWithdrawal) . "$)"
            ], 400);
        }

        // Validate max withdrawal
        if ($maxWithdrawal > 0 && $request->amount > $maxWithdrawal) {
            return response()->json([
                'error' => "مبلغ السحب يتجاوز الحد الأقصى المسموح به (" . number_format($maxWithdrawal) . "$)"
            ], 400);
        }

        // Validate cooldown period
        if ($cooldownHours > 0) {
            $lastWithdrawal = \App\Models\UserWithdrawal::where('user_id', $user->id)
                ->orderBy('request_timestamp', 'desc')
                ->first();

            if ($lastWithdrawal) {
                $hoursSinceLast = $lastWithdrawal->request_timestamp->diffInHours(now());
                if ($hoursSinceLast < $cooldownHours) {
                    $remainingHours = ceil($cooldownHours - $hoursSinceLast);
                    return response()->json([
                        'error' => "يرجى الانتظار $remainingHours ساعة قبل تقديم طلب سحب جديد"
                    ], 400);
                }
            }
        }

        // Validate request frequency limit
        if ($maxRequests > 0) {
            $requestsInPeriod = \App\Models\UserWithdrawal::where('user_id', $user->id)
                ->where('request_timestamp', '>=', now()->subDays($periodDays))
                ->count();

            if ($requestsInPeriod >= $maxRequests) {
                return response()->json([
                    'error' => "تم تجاوز الحد الأقصى لعدد طلبات السحب ($maxRequests) خلال $periodDays يوم"
                ], 400);
            }
        }

        // Wrap in database transaction to ensure atomicity
        DB::transaction(function () use ($request, $user, $profile, $userType, &$withdrawal) {
            // Deduct balance immediately to prevent double withdrawal
            $newBalance = $profile->wallet_balance - $request->amount;
            $profile->wallet_balance = $newBalance;
            $profile->save();

            // Create withdrawal request
            $withdrawal = UserWithdrawal::create([
                'user_id' => $user->id,
                'user_type' => $userType,
                'user_name' => $profile->name,
                'amount' => $request->amount,
                'status' => 'pending',
                'payment_method_id' => $request->paymentMethodId,
                'payment_method_name' => $request->paymentMethodName,
                'payment_method_details' => $request->paymentMethodDetails,
            ]);

            // Create transaction record
            UserTransaction::create([
                'user_id' => $user->id,
                'user_type' => $userType,
                'type' => 'withdrawal_pending',
                'amount' => -$request->amount,
                'description' => 'سحب معلق - ' . $request->paymentMethodName,
                'balance_after' => $newBalance,
                'reference_type' => 'withdrawal',
                'reference_id' => $withdrawal->id,
            ]);

            // Notify admin
            try {
                event(new \App\Events\AdminDashboardEvent('USER_WITHDRAWAL_REQUEST', [
                    'withdrawalId' => $withdrawal->id,
                    'userName' => $profile->name,
                    'userType' => $userType,
                    'amount' => $request->amount,
                ]));
            } catch (\Exception $e) {
                \Log::warning('Failed to send admin notification: ' . $e->getMessage());
            }

            // Notify user
            try {
                $notification = Notification::create([
                    'user_id' => $user->id,
                    'title' => 'طلب سحب جديد',
                    'message' => 'تم تقديم طلب سحب بمبلغ ' . number_format($request->amount, 2) . '$ وهو قيد المراجعة',
                    'type' => 'WITHDRAWAL_REQUEST_CONFIRMATION',
                    'read' => false,
                ]);

                event(new UserNotification($user->id, [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'timestamp' => $notification->created_at->toIso8601String(),
                ]));
            } catch (\Exception $e) {
                \Log::warning('Failed to send user notification: ' . $e->getMessage());
            }
        });

        return response()->json([
            'message' => 'تم تقديم طلب السحب بنجاح',
            'withdrawal' => $withdrawal,
        ]);
    }

    /**
     * Pay from wallet (for future auction/order integration)
     */
    public function payFromWallet(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'referenceType' => 'required|string',
            'referenceId' => 'required|string',
            'description' => 'required|string',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Check available balance
        $totalHolds = UserWalletHold::where('user_id', $user->id)
            ->where('user_type', $userType)
            ->validHolds()
            ->sum('amount');

        $availableBalance = $profile->wallet_balance - $totalHolds;

        if ($availableBalance < $request->amount) {
            return response()->json(['error' => 'الرصيد غير كافي'], 400);
        }

        DB::transaction(function () use ($user, $profile, $userType, $request) {
            // Deduct from wallet
            $newBalance = $profile->wallet_balance - $request->amount;
            $profile->wallet_balance = $newBalance;
            $profile->save();

            // Create transaction
            UserTransaction::create([
                'user_id' => $user->id,
                'user_type' => $userType,
                'type' => 'payment',
                'amount' => -$request->amount,
                'description' => $request->description,
                'balance_after' => $newBalance,
                'reference_type' => $request->referenceType,
                'reference_id' => $request->referenceId,
            ]);
        });

        return response()->json([
            'message' => 'تم الدفع بنجاح',
            'newBalance' => (float) $profile->wallet_balance,
        ]);
    }

    // ======== PAYMENT METHODS MANAGEMENT ========

    /**
     * Get user's saved payment methods
     */
    public function getPaymentMethods(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        return response()->json([
            'paymentMethods' => $profile->payment_info ?? [],
        ]);
    }

    /**
     * Add new payment method
     */
    public function addPaymentMethod(Request $request)
    {
        $request->validate([
            'methodName' => 'required|string',
            'details' => 'required|string|min:10',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $paymentMethods = $profile->payment_info ?? [];

        // Generate unique ID
        $methodId = uniqid('pm_');

        // Check if this is the first payment method
        $isFirst = empty($paymentMethods);

        $newMethod = [
            'methodId' => $methodId,
            'methodName' => $request->methodName,
            'details' => $request->details,
            'isPrimary' => $isFirst, // First method is automatically primary
        ];

        $paymentMethods[] = $newMethod;
        $profile->payment_info = $paymentMethods;
        $profile->save();

        return response()->json([
            'message' => 'تم إضافة طريقة الدفع بنجاح',
            'paymentMethod' => $newMethod,
        ]);
    }

    /**
     * Update payment method
     */
    public function updatePaymentMethod(Request $request, $methodId)
    {
        $request->validate([
            'details' => 'required|string|min:10',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $paymentMethods = $profile->payment_info ?? [];
        $found = false;

        foreach ($paymentMethods as &$method) {
            if ($method['methodId'] === $methodId) {
                $method['details'] = $request->details;
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json(['error' => 'طريقة الدفع غير موجودة'], 404);
        }

        $profile->payment_info = $paymentMethods;
        $profile->save();

        return response()->json([
            'message' => 'تم تحديث طريقة الدفع بنجاح',
        ]);
    }

    /**
     * Delete payment method
     */
    public function deletePaymentMethod(Request $request, $methodId)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $paymentMethods = $profile->payment_info ?? [];
        $filtered = array_filter($paymentMethods, fn($m) => $m['methodId'] !== $methodId);

        if (count($filtered) === count($paymentMethods)) {
            return response()->json(['error' => 'طريقة الدفع غير موجودة'], 404);
        }

        // Re-index array
        $paymentMethods = array_values($filtered);

        // If deleted method was primary and there are remaining methods, set first as primary
        if (!empty($paymentMethods)) {
            $hasPrimary = false;
            foreach ($paymentMethods as $method) {
                if ($method['isPrimary'] ?? false) {
                    $hasPrimary = true;
                    break;
                }
            }
            if (!$hasPrimary) {
                $paymentMethods[0]['isPrimary'] = true;
            }
        }

        $profile->payment_info = $paymentMethods;
        $profile->save();

        return response()->json([
            'message' => 'تم حذف طريقة الدفع بنجاح',
        ]);
    }

    /**
     * Set primary payment method
     */
    public function setPrimaryPaymentMethod(Request $request, $methodId)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $paymentMethods = $profile->payment_info ?? [];
        $found = false;

        foreach ($paymentMethods as &$method) {
            if ($method['methodId'] === $methodId) {
                $method['isPrimary'] = true;
                $found = true;
            } else {
                $method['isPrimary'] = false;
            }
        }

        if (!$found) {
            return response()->json(['error' => 'طريقة الدفع غير موجودة'], 404);
        }

        $profile->payment_info = $paymentMethods;
        $profile->save();

        return response()->json([
            'message' => 'تم تعيين طريقة الدفع الأساسية',
        ]);
    }
}
