<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Withdrawal;
use App\Models\Transaction;
use App\Models\Provider;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use App\Events\UserNotification;
use App\Events\AdminDashboardEvent;
use App\Http\Resources\WithdrawalResource;
use App\Http\Resources\TransactionResource;

class FinancialController extends Controller
{
    public function listWithdrawals(Request $request)
    {
        $withdrawals = Withdrawal::orderBy('request_timestamp', 'desc')->paginate(20);
        return WithdrawalResource::collection($withdrawals);
    }

    public function approveWithdrawal(Request $request, $id)
    {
        $withdrawal = Withdrawal::findOrFail($id);

        if ($withdrawal->status !== 'Pending') {
            return response()->json(['error' => 'Withdrawal already processed'], 400);
        }

        DB::transaction(function () use ($withdrawal, $request) {
            $withdrawal->status = 'Approved';
            $withdrawal->decision_timestamp = now();
            $withdrawal->receipt_url = $request->input('receiptUrl');
            $withdrawal->save();

            // Fetch provider to ensure we have the correct ID format
            $provider = Provider::findOrFail($withdrawal->provider_id);

            // Log transaction (assuming funds were deducted on request)
            Transaction::create([
                'id' => 'txn-' . uniqid(),
                'provider_id' => $provider->id,
                'type' => 'withdrawal_approved',
                'amount' => 0, // No balance change now, just log
                'description' => 'Withdrawal Approved',
                'balance_after' => $provider->wallet_balance,
                'timestamp' => now(),
                'related_withdrawal_id' => $withdrawal->id
            ]);

            // Create and broadcast notification
            $notification = Notification::create([
                'user_id' => $provider->user_id,
                'title' => 'تمت الموافقة على طلب السحب',
                'message' => sprintf('تمت الموافقة على طلب السحب بقيمة $%.2f', $withdrawal->amount),
                'type' => 'WITHDRAWAL_PROCESSED_APPROVED',
                'read' => false,
                'link' => [
                    'view' => 'providerDashboard',
                    'params' => ['tab' => 'wallet']
                ],
            ]);

            \Log::info('Broadcasting approval notification', [
                'provider_id' => $provider->id,
                'notification_id' => $notification->id,
                'title' => $notification->title,
            ]);

            // Broadcast real-time notification
            event(new UserNotification($provider->user_id, [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'timestamp' => $notification->created_at->toIso8601String(),
                'link' => $notification->link,
                'read' => false,
            ]));

            \Log::info('Approval notification broadcasted');

            \Log::info('Debug Notification', [
                'withdrawal_provider_id' => $withdrawal->provider_id,
                'provider_id' => $provider->id,
                'encoded_id' => str_replace('+', '-', $provider->id),
                'channel' => 'user.' . str_replace('+', '-', $provider->id)
            ]);

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('withdrawal.processed', [
                'withdrawal_id' => $withdrawal->id,
                'provider_id' => $provider->id,
                'action' => 'approved',
                'amount' => $withdrawal->amount,
            ]));
        });

        return new WithdrawalResource($withdrawal);
    }

    public function rejectWithdrawal(Request $request, $id)
    {
        $withdrawal = Withdrawal::findOrFail($id);

        if ($withdrawal->status !== 'Pending') {
            return response()->json(['error' => 'Withdrawal already processed'], 400);
        }

        DB::transaction(function () use ($withdrawal, $request) {
            $withdrawal->status = 'Rejected';
            $withdrawal->decision_timestamp = now();
            $withdrawal->admin_notes = $request->input('reason');
            $withdrawal->save();

            // Refund the provider
            $provider = Provider::findOrFail($withdrawal->provider_id);
            $provider->wallet_balance += $withdrawal->amount;
            $provider->save();

            Transaction::create([
                'id' => 'txn-' . uniqid(),
                'provider_id' => $provider->id,
                'type' => 'REFUND_PROCESSED', // Updated type
                'amount' => $withdrawal->amount,
                'description' => 'Withdrawal Rejected Refund',
                'balance_after' => $provider->wallet_balance,
                'timestamp' => now(),
                'related_withdrawal_id' => $withdrawal->id
            ]);

            // Create and broadcast notification
            $notification = Notification::create([
                'user_id' => $provider->user_id,
                'title' => 'تم رفض طلب السحب',
                'message' => sprintf('تم رفض طلب السحب - السبب: %s', $request->input('reason')),
                'type' => 'WITHDRAWAL_PROCESSED_REJECTED',
                'read' => false,
                'link' => [
                    'view' => 'providerDashboard',
                    'params' => ['tab' => 'wallet']
                ],
            ]);

            // Broadcast real-time notification
            event(new UserNotification($provider->user_id, [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'timestamp' => $notification->created_at->toIso8601String(),
                'link' => $notification->link,
                'read' => false,
            ]));

            \Log::info('Debug Notification Reject', [
                'withdrawal_provider_id' => $withdrawal->provider_id,
                'provider_id' => $provider->id,
                'encoded_id' => str_replace('+', '-', $provider->id),
                'channel' => 'user.' . str_replace('+', '-', $provider->id)
            ]);

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('withdrawal.processed', [
                'withdrawal_id' => $withdrawal->id,
                'provider_id' => $provider->id,
                'action' => 'rejected',
                'amount' => $withdrawal->amount,
            ]));
        });

        return new WithdrawalResource($withdrawal);
    }

    public function listTransactions(Request $request)
    {
        $transactions = Transaction::orderBy('timestamp', 'desc')->paginate(20);
        return TransactionResource::collection($transactions);
    }

    public function addFunds(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string'
        ]);

        $provider = Provider::findOrFail($id);
        $amount = $request->input('amount');
        $description = $request->input('description') ?: 'إيداع يدوي';

        DB::transaction(function () use ($provider, $amount, $description) {
            $provider->wallet_balance += $amount;
            $provider->save();

            Transaction::create([
                'id' => 'txn-' . uniqid(),
                'provider_id' => $provider->id,
                'type' => 'manual_deposit',
                'amount' => $amount,
                'description' => $description,
                'balance_after' => $provider->wallet_balance,
                'timestamp' => now(),
            ]);

            // Create and broadcast notification
            $notification = Notification::create([
                'user_id' => $provider->user_id,
                'title' => 'تم إضافة رصيد لمحفظتك',
                'message' => sprintf('تم إضافة $%.2f إلى محفظتك - %s', $amount, $description),
                'type' => 'FUNDS_DEPOSITED',
                'read' => false,
                'link' => [
                    'view' => 'providerDashboard',
                    'params' => ['tab' => 'wallet']
                ],
            ]);

            // Broadcast real-time notification
            event(new UserNotification($provider->user_id, [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'timestamp' => $notification->created_at->toIso8601String(),
                'link' => $notification->link,
                'read' => false,
            ]));

            \Log::info('Debug Notification AddFunds', [
                'provider_id' => $provider->id,
                'encoded_id' => str_replace('+', '-', $provider->id),
                'channel' => 'user.' . str_replace('+', '-', $provider->id)
            ]);

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('provider.balance_changed', [
                'provider_id' => $provider->id,
                'amount' => $amount,
                'new_balance' => $provider->wallet_balance,
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة الرصيد بنجاح',
            'new_balance' => $provider->wallet_balance
        ]);
    }

    // =====================================================
    // USER WALLET METHODS (customers, technicians, tow trucks)
    // =====================================================

    /**
     * List all user deposits
     */
    public function listUserDeposits(Request $request)
    {
        $query = \App\Models\UserDeposit::orderBy('request_timestamp', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $deposits = $query->paginate(20);
        return response()->json($deposits);
    }

    /**
     * Approve a user deposit
     */
    public function approveUserDeposit(Request $request, $id)
    {
        $deposit = \App\Models\UserDeposit::findOrFail($id);

        if ($deposit->status !== 'pending') {
            return response()->json(['error' => 'تم معالجة هذا الطلب مسبقاً'], 400);
        }

        DB::transaction(function () use ($deposit, $request) {
            $deposit->status = 'approved';
            $deposit->decision_timestamp = now();
            $deposit->admin_notes = $request->input('notes');
            $deposit->save();

            // Get the user's profile and credit the wallet
            $profile = $this->getUserProfileById($deposit->user_id, $deposit->user_type);
            if ($profile) {
                $newBalance = $profile->wallet_balance + $deposit->amount;
                $profile->wallet_balance = $newBalance;
                $profile->save();

                // Create transaction
                \App\Models\UserTransaction::create([
                    'user_id' => $deposit->user_id,
                    'user_type' => $deposit->user_type,
                    'type' => 'deposit',
                    'amount' => $deposit->amount,
                    'description' => 'إيداع - ' . $deposit->payment_method_name,
                    'balance_after' => $newBalance,
                    'reference_type' => 'deposit',
                    'reference_id' => $deposit->id,
                ]);

                // Notify user
                $notification = Notification::create([
                    'user_id' => $deposit->user_id,
                    'title' => 'تمت الموافقة على الإيداع',
                    'message' => 'تمت الموافقة على إيداعك بقيمة ' . number_format($deposit->amount, 2) . ' ر.س',
                    'type' => 'DEPOSIT_APPROVED',
                    'read' => false,
                ]);

                event(new UserNotification($deposit->user_id, [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'timestamp' => $notification->created_at->toIso8601String(),
                ]));
            }

            // Broadcast to admin dashboard
            event(new AdminDashboardEvent('user_deposit.processed', [
                'deposit_id' => $deposit->id,
                'action' => 'approved',
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'تمت الموافقة على الإيداع',
            'deposit' => $deposit,
        ]);
    }

    /**
     * Reject a user deposit
     */
    public function rejectUserDeposit(Request $request, $id)
    {
        $deposit = \App\Models\UserDeposit::findOrFail($id);

        if ($deposit->status !== 'pending') {
            return response()->json(['error' => 'تم معالجة هذا الطلب مسبقاً'], 400);
        }

        $deposit->status = 'rejected';
        $deposit->decision_timestamp = now();
        $deposit->admin_notes = $request->input('reason');
        $deposit->save();

        // Notify user
        $notification = Notification::create([
            'user_id' => $deposit->user_id,
            'title' => 'تم رفض طلب الإيداع',
            'message' => 'تم رفض طلب الإيداع - ' . ($request->input('reason') ?: 'لم يتم تحديد السبب'),
            'type' => 'DEPOSIT_REJECTED',
            'read' => false,
        ]);

        event(new UserNotification($deposit->user_id, [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'timestamp' => $notification->created_at->toIso8601String(),
        ]));

        // Broadcast to admin dashboard
        event(new AdminDashboardEvent('user_deposit.processed', [
            'deposit_id' => $deposit->id,
            'action' => 'rejected',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'تم رفض الإيداع',
            'deposit' => $deposit,
        ]);
    }

    /**
     * List all user withdrawals
     */
    public function listUserWithdrawals(Request $request)
    {
        $query = \App\Models\UserWithdrawal::orderBy('request_timestamp', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $withdrawals = $query->paginate(20);
        return response()->json($withdrawals);
    }

    /**
     * Approve a user withdrawal
     */
    public function approveUserWithdrawal(Request $request, $id)
    {
        $withdrawal = \App\Models\UserWithdrawal::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['error' => 'تم معالجة هذا الطلب مسبقاً'], 400);
        }

        DB::transaction(function () use ($withdrawal, $request) {
            $withdrawal->status = 'approved';
            $withdrawal->decision_timestamp = now();
            $withdrawal->admin_notes = $request->input('notes');

            // Handle receipt upload
            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('wallet/withdrawals', 'public');
                $withdrawal->receipt_url = '/storage/' . $path;
            }

            $withdrawal->save();

            // Balance was already deducted when withdrawal was requested
            // Just create an approval transaction record
            $profile = $this->getUserProfileById($withdrawal->user_id, $withdrawal->user_type);
            if ($profile) {
                // Create transaction record (informational, no balance change)
                \App\Models\UserTransaction::create([
                    'user_id' => $withdrawal->user_id,
                    'user_type' => $withdrawal->user_type,
                    'type' => 'withdrawal_approved',
                    'amount' => 0, // No balance change, already deducted
                    'description' => 'تمت الموافقة على السحب - ' . $withdrawal->payment_method_name,
                    'balance_after' => $profile->wallet_balance,
                    'reference_type' => 'withdrawal',
                    'reference_id' => $withdrawal->id,
                ]);

                // Notify user
                $notification = Notification::create([
                    'user_id' => $withdrawal->user_id,
                    'title' => 'تمت الموافقة على السحب',
                    'message' => 'تمت الموافقة على سحبك بقيمة ' . number_format((float) $withdrawal->amount, 2) . '$',
                    'type' => 'WITHDRAWAL_APPROVED',
                    'read' => false,
                ]);

                event(new UserNotification($withdrawal->user_id, [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'timestamp' => $notification->created_at->toIso8601String(),
                ]));
            }

            // Broadcast to admin dashboard
            event(new AdminDashboardEvent('user_withdrawal.processed', [
                'withdrawal_id' => $withdrawal->id,
                'action' => 'approved',
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'تمت الموافقة على السحب',
            'withdrawal' => $withdrawal,
        ]);
    }

    /**
     * Reject a user withdrawal
     */
    public function rejectUserWithdrawal(Request $request, $id)
    {
        $withdrawal = \App\Models\UserWithdrawal::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['error' => 'تم معالجة هذا الطلب مسبقاً'], 400);
        }

        DB::transaction(function () use ($withdrawal, $request) {
            $withdrawal->status = 'rejected';
            $withdrawal->decision_timestamp = now();
            $withdrawal->admin_notes = $request->input('reason');
            $withdrawal->save();

            // Refund the withdrawn amount (funds were deducted on request)
            $profile = $this->getUserProfileById($withdrawal->user_id, $withdrawal->user_type);
            if ($profile) {
                $newBalance = $profile->wallet_balance + $withdrawal->amount;
                $profile->wallet_balance = $newBalance;
                $profile->save();

                // Create refund transaction record
                \App\Models\UserTransaction::create([
                    'user_id' => $withdrawal->user_id,
                    'user_type' => $withdrawal->user_type,
                    'type' => 'withdrawal_refund',
                    'amount' => $withdrawal->amount,
                    'description' => 'استرجاع سحب مرفوض - ' . $withdrawal->payment_method_name,
                    'balance_after' => $newBalance,
                    'reference_type' => 'withdrawal',
                    'reference_id' => $withdrawal->id,
                ]);

                // Notify user about rejection and refund
                $notification = Notification::create([
                    'user_id' => $withdrawal->user_id,
                    'title' => 'تم رفض طلب السحب',
                    'message' => 'تم رفض طلب السحب وإرجاع المبلغ - ' . ($request->input('reason') ?: 'لم يتم تحديد السبب'),
                    'type' => 'WITHDRAWAL_REJECTED',
                    'read' => false,
                ]);

                event(new UserNotification($withdrawal->user_id, [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'timestamp' => $notification->created_at->toIso8601String(),
                ]));
            }

            // Broadcast to admin dashboard
            event(new AdminDashboardEvent('user_withdrawal.processed', [
                'withdrawal_id' => $withdrawal->id,
                'action' => 'rejected',
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'تم رفض السحب',
            'withdrawal' => $withdrawal,
        ]);
    }

    /**
     * List all user transactions
     */
    public function listUserTransactions(Request $request)
    {
        $query = \App\Models\UserTransaction::orderBy('timestamp', 'desc');

        if ($request->has('user_type')) {
            $query->where('user_type', $request->user_type);
        }

        $transactions = $query->paginate(20);
        return response()->json($transactions);
    }

    /**
     * Add funds to user wallet
     */
    public function addUserFunds(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'userType' => 'required|in:customer,technician,tow_truck',
            'description' => 'nullable|string',
        ]);

        $userType = $request->input('userType');
        $amount = $request->input('amount');
        $description = $request->input('description') ?: 'إيداع يدوي';

        $profile = $this->getUserProfileById($id, $userType);

        if (!$profile) {
            return response()->json(['error' => 'المستخدم غير موجود'], 404);
        }

        DB::transaction(function () use ($profile, $id, $userType, $amount, $description) {
            $newBalance = $profile->wallet_balance + $amount;
            $profile->wallet_balance = $newBalance;
            $profile->save();

            // Create transaction
            \App\Models\UserTransaction::create([
                'user_id' => $id,
                'user_type' => $userType,
                'type' => 'deposit',
                'amount' => $amount,
                'description' => $description,
                'balance_after' => $newBalance,
                'reference_type' => 'admin_deposit',
                'reference_id' => null,
            ]);

            // Notify user
            $notification = Notification::create([
                'user_id' => $id,
                'title' => 'تم إضافة رصيد لمحفظتك',
                'message' => 'تم إضافة ' . number_format($amount, 2) . ' ر.س إلى محفظتك - ' . $description,
                'type' => 'FUNDS_DEPOSITED',
                'read' => false,
            ]);

            event(new UserNotification($id, [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'timestamp' => $notification->created_at->toIso8601String(),
            ]));

            // Broadcast to admin dashboard
            event(new AdminDashboardEvent('user.balance_changed', [
                'user_id' => $id,
                'user_type' => $userType,
                'amount' => $amount,
                'new_balance' => $newBalance,
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة الرصيد بنجاح',
            'new_balance' => $profile->wallet_balance,
        ]);
    }

    /**
     * Helper: Get user profile by ID and type
     */
    private function getUserProfileById($userId, $userType)
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return null;
        }

        return match ($userType) {
            'customer' => $user->customer,
            'technician' => $user->technician,
            'tow_truck' => $user->towTruck,
            default => null,
        };
    }
}
