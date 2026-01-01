<?php

namespace App\Services;

use App\Models\InternationalLicenseRequest;
use App\Models\User;
use App\Models\Notification;
use App\Events\InternationalLicenseStatusChanged;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InternationalLicenseService
{
    /**
     * Calculate price based on nationality
     */
    public function calculatePrice(string $nationality, array $settings): float
    {
        $syrianPrice = $settings['syrian_price'] ?? 350;
        $nonSyrianPrice = $settings['non_syrian_price'] ?? 650;

        return $nationality === 'سورية' ? $syrianPrice : $nonSyrianPrice;
    }

    /**
     * Generate unique order number
     */
    public function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'IL-' . strtoupper(Str::random(8));
        } while (InternationalLicenseRequest::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    /**
     * Generate unique token for request tracking
     */
    public function generateUniqueToken(): string
    {
        do {
            $token = Str::random(32);
        } while (InternationalLicenseRequest::where('token', $token)->exists());

        return $token;
    }

    /**
     * Store step 1 data in cache
     */
    public function storeStep1Data(string $userId, array $data, int $ttl = 3600): void
    {
        $cacheKey = "license_step1_{$userId}";
        Cache::put($cacheKey, $data, $ttl);
    }

    /**
     * Get step 1 data from cache
     */
    public function getStep1Data(string $userId): ?array
    {
        $cacheKey = "license_step1_{$userId}";
        return Cache::get($cacheKey);
    }

    /**
     * Store documents for step 2
     */
    public function storeDocuments(string $userId, array $files): array
    {
        $paths = [];

        foreach ($files as $key => $file) {
            if ($file) {
                $path = $file->store('international_licenses/documents', 'public');
                $paths[$key] = $path;
            }
        }

        // Cache document paths
        $cacheKey = "license_step2_{$userId}";
        Cache::put($cacheKey, $paths, 3600);

        return $paths;
    }

    /**
     * Store payment proof for step 3
     */
    public function storePaymentProof(string $userId, $file): string
    {
        $path = $file->store('international_licenses/payments', 'public');

        // Cache payment proof path
        $cacheKey = "license_step3_{$userId}";
        Cache::put($cacheKey, ['payment_proof' => $path], 3600);

        return $path;
    }

    /**
     * Create international license request from cached data
     */
    public function createFromCache(string $userId): InternationalLicenseRequest
    {
        $step1 = $this->getStep1Data($userId);
        $step2 = Cache::get("license_step2_{$userId}");
        $step3 = Cache::get("license_step3_{$userId}");

        if (!$step1 || !$step2 || !$step3) {
            throw new \Exception('Incomplete license request data');
        }

        $orderNumber = $this->generateOrderNumber();
        $token = $this->generateUniqueToken();

        $request = InternationalLicenseRequest::create([
            'order_number' => $orderNumber,
            'token' => $token,
            'user_id' => $userId,
            'status' => 'pending',
            'full_name_arabic' => $step1['full_name_arabic'],
            'full_name_english' => $step1['full_name_english'],
            'nationality' => $step1['nationality'],
            'birth_date' => $step1['birth_date'],
            'birth_place' => $step1['birth_place'],
            'license_type' => $step1['license_type'],
            'phone_number' => $step1['phone_number'],
            'whatsapp_number' => $step1['whatsapp_number'],
            'passport_photo' => $step2['passport_photo'] ?? null,
            'passport_copy' => $step2['passport_copy'] ?? null,
            'license_front' => $step2['license_front'] ?? null,
            'license_back' => $step2['license_back'] ?? null,
            'personal_photo' => $step2['personal_photo'] ?? null,
            'payment_proof' => $step3['payment_proof'] ?? null,
            'price' => $step1['calculated_price'] ?? 0,
        ]);

        // Clear cache
        Cache::forget("license_step1_{$userId}");
        Cache::forget("license_step2_{$userId}");
        Cache::forget("license_step3_{$userId}");

        return $request;
    }

    /**
     * Update request status with notifications
     */
    public function updateStatus(InternationalLicenseRequest $request, string $newStatus, ?string $note = null): bool
    {
        $oldStatus = $request->status;
        $request->status = $newStatus;

        if ($note) {
            $request->admin_notes = $note;
        }

        $saved = $request->save();

        if ($saved) {
            // Broadcast status change event
            event(new InternationalLicenseStatusChanged($request, $oldStatus, $newStatus));

            // Notify user
            $this->notifyUser($request, 'status_changed', $oldStatus);
        }

        return $saved;
    }

    /**
     * Reupload payment proof
     */
    public function reuploadPaymentProof(InternationalLicenseRequest $request, $file): string
    {
        // Delete old payment proof
        if ($request->payment_proof) {
            Storage::disk('public')->delete($request->payment_proof);
        }

        // Store new payment proof
        $path = $file->store('international_licenses/payments', 'public');
        $request->payment_proof = $path;
        $request->save();

        // Notify admins
        $this->notifyAdmins($request, 'payment_updated');

        return $path;
    }

    /**
     * Reupload documents
     */
    public function reuploadDocuments(InternationalLicenseRequest $request, array $files): array
    {
        $updatedPaths = [];

        foreach ($files as $key => $file) {
            if ($file) {
                // Delete old file
                if ($request->{$key}) {
                    Storage::disk('public')->delete($request->{$key});
                }

                $path = $file->store('international_licenses/documents', 'public');
                $request->{$key} = $path;
                $updatedPaths[$key] = $path;
            }
        }

        $request->save();

        // Notify admins
        $this->notifyAdmins($request, 'documents_updated');

        return $updatedPaths;
    }

    /**
     * Notify admins about request changes
     */
    protected function notifyAdmins(InternationalLicenseRequest $request, string $type = 'new'): void
    {
        $admins = User::where('role', 'admin')->get();

        $titles = [
            'new' => 'طلب رخصة دولية جديد',
            'payment_updated' => 'تم تحديث إيصال الدفع',
            'documents_updated' => 'تم تحديث المستندات',
        ];

        $messages = [
            'new' => "طلب رخصة دولية جديد #{$request->order_number}",
            'payment_updated' => "تم تحديث إيصال الدفع للطلب #{$request->order_number}",
            'documents_updated' => "تم تحديث المستندات للطلب #{$request->order_number}",
        ];

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => $titles[$type] ?? 'إشعار رخصة دولية',
                'message' => $messages[$type] ?? "تحديث على الطلب #{$request->order_number}",
                'type' => 'INTERNATIONAL_LICENSE_' . strtoupper($type),
                'context' => ['order_number' => $request->order_number],
                'read' => false,
            ]);

            // Broadcast real-time notification
            event(new \App\Events\UserNotification($admin->id, [
                'title' => $titles[$type] ?? 'إشعار رخصة دولية',
                'message' => $messages[$type] ?? "تحديث على الطلب #{$request->order_number}",
                'type' => 'INTERNATIONAL_LICENSE_' . strtoupper($type),
                'link' => ['view' => 'adminDashboard', 'params' => ['adminView' => 'internationalLicenses']],
            ]));
        }
    }

    /**
     * Notify user about status changes
     */
    protected function notifyUser(InternationalLicenseRequest $request, string $type, ?string $oldStatus = null): void
    {
        $user = User::find($request->user_id);
        if (!$user)
            return;

        $statusLabels = [
            'pending' => 'قيد المراجعة',
            'under_review' => 'قيد المراجعة',
            'approved' => 'موافق عليه',
            'rejected' => 'مرفوض',
            'processing' => 'قيد المعالجة',
            'ready' => 'جاهز للاستلام',
            'completed' => 'مكتمل',
        ];

        $title = 'تحديث حالة طلب الرخصة الدولية';
        $message = "تم تحديث حالة طلبك #{$request->order_number} إلى: " . ($statusLabels[$request->status] ?? $request->status);

        Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => 'INTERNATIONAL_LICENSE_STATUS_CHANGED',
            'context' => [
                'order_number' => $request->order_number,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
            ],
            'read' => false,
        ]);

        // Broadcast real-time notification
        event(new \App\Events\UserNotification($user->id, [
            'title' => $title,
            'message' => $message,
            'type' => 'INTERNATIONAL_LICENSE_STATUS_CHANGED',
            'link' => ['view' => 'customerDashboard', 'params' => ['page' => 'international-licenses']],
        ]));
    }

    /**
     * Get filtered requests for admin
     */
    public function getFilteredRequests(array $filters = [])
    {
        $query = InternationalLicenseRequest::query();

        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $query->where(function ($q) use ($filters) {
                $q->where('order_number', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('full_name_arabic', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('full_name_english', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('phone_number', 'LIKE', "%{$filters['search']}%");
            });
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
     * Calculate statistics
     */
    public function calculateStatistics(): array
    {
        return [
            'total' => InternationalLicenseRequest::count(),
            'pending' => InternationalLicenseRequest::where('status', 'pending')->count(),
            'approved' => InternationalLicenseRequest::where('status', 'approved')->count(),
            'processing' => InternationalLicenseRequest::where('status', 'processing')->count(),
            'completed' => InternationalLicenseRequest::where('status', 'completed')->count(),
            'rejected' => InternationalLicenseRequest::where('status', 'rejected')->count(),
        ];
    }
}
