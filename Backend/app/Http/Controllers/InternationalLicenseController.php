<?php

namespace App\Http\Controllers;

use App\Events\InternationalLicenseStatusChanged;
use App\Http\Requests\StoreInternationalLicenseStep1Request;
use App\Models\InternationalLicenseRequest;
use App\Models\SystemSetting;
use App\Models\User;
use App\Notifications\InternationalLicenseNotification;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InternationalLicenseController extends Controller
{
    /**
     * Allowed file types for uploads
     */
    private const ALLOWED_MIMES = 'jpeg,png,jpg,pdf';
    private const MAX_FILE_SIZE = 5120; // 5MB in KB

    /**
     * Document field names
     */
    private const DOCUMENT_FIELDS = [
        'personal_photo',
        'id_document',
        'id_document_back',
        'passport_document',
        'driving_license_front',
        'driving_license_back',
    ];

    /**
     * Get pricing configuration
     */
    public function getPricing(): JsonResponse
    {
        try {
            $settings = $this->getSettings();

            return response()->json([
                'syrian_price' => (float) ($settings['syrian_price'] ?? 350),
                'non_syrian_price' => (float) ($settings['non_syrian_price'] ?? 650),
                'license_duration' => $settings['license_duration'] ?? '1 Year',
                'informations' => $settings['informations'] ?? '',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get pricing', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to retrieve pricing information'
            ], 500);
        }
    }

    /**
     * Get user's international license requests
     */
    public function index(): JsonResponse
    {
        try {
            $requests = InternationalLicenseRequest::where('user_id', Auth::id())
                ->latest()
                ->get();

            return response()->json($requests);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user requests', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to retrieve requests'
            ], 500);
        }
    }

    /**
     * Store Step 1 data in cache
     */
    public function storeStep1(StoreInternationalLicenseStep1Request $request): JsonResponse
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $data = $request->validated();
            $user = Auth::user();
            $data['user_id'] = $user->id;

            // Generate unique token
            $token = $this->generateUniqueToken();

            // Store data in cache for 2 hours (extended from 1 hour for better UX)
            Cache::put("international_license_step_{$token}", $data, now()->addHours(2));

            return response()->json([
                'success' => true,
                'step_token' => $token,
                'expires_at' => now()->addHours(2)->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Step 1 submission failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to save step 1 data'
            ], 500);
        }
    }

    /**
     * Upload documents (Step 2)
     */
    public function uploadDocuments(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'file', 'mimes:' . self::ALLOWED_MIMES, 'max:' . self::MAX_FILE_SIZE],
                'step_token' => ['required', 'string'],
                'doc_type' => ['nullable', 'string', 'in:' . implode(',', self::DOCUMENT_FIELDS)],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $token = $request->input('step_token');

            // Verify token exists in cache
            if (!Cache::has("international_license_step_{$token}")) {
                return response()->json([
                    'message' => 'Session expired. Please start over.'
                ], 410);
            }

            $file = $request->file('file');
            $docType = $request->input('doc_type');

            // Generate secure filename
            $extension = $file->getClientOriginalExtension();
            $filename = ($docType ?? 'document') . '_' . time() . '_' . Str::random(8) . '.' . $extension;

            // Store file
            $path = $file->storeAs(
                "international_license_requests/{$token}",
                $filename,
                'public'
            );

            // Update cache if doc_type is provided
            if ($docType) {
                $cachedData = Cache::get("international_license_step_{$token}");
                $cachedData[$docType] = $path;
                Cache::put("international_license_step_{$token}", $cachedData, now()->addHours(2));
            }

            return response()->json([
                'success' => true,
                'url' => Storage::url($path),
                'path' => $path,
                'doc_type' => $docType,
            ]);
        } catch (\Exception $e) {
            Log::error('Document upload failed', [
                'user_id' => Auth::id(),
                'doc_type' => $request->input('doc_type'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to upload document'
            ], 500);
        }
    }

    /**
     * Upload payment proof (Step 3)
     */
    public function uploadPaymentProof(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'proof_of_payment' => ['required', 'file', 'mimes:' . self::ALLOWED_MIMES, 'max:' . self::MAX_FILE_SIZE],
                'step_token' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $token = $request->input('step_token');

            // Verify token exists in cache
            if (!Cache::has("international_license_step_{$token}")) {
                return response()->json([
                    'message' => 'Session expired. Please start over.'
                ], 410);
            }

            $file = $request->file('proof_of_payment');
            $extension = $file->getClientOriginalExtension();
            $filename = 'payment_proof_' . time() . '_' . Str::random(8) . '.' . $extension;

            // Store payment proof
            $path = $file->storeAs(
                "international_license_requests/{$token}",
                $filename,
                'public'
            );

            // Update cache
            $cachedData = Cache::get("international_license_step_{$token}");
            $cachedData['proof_of_payment_temp'] = $path;
            Cache::put("international_license_step_{$token}", $cachedData, now()->addHours(2));

            return response()->json([
                'success' => true,
                'path' => $path,
                'url' => Storage::url($path)
            ]);
        } catch (\Exception $e) {
            Log::error('Payment proof upload failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to upload payment proof'
            ], 500);
        }
    }

    /**
     * Final submission (Step 4)
     */
    public function finalSubmit(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'step_token' => ['required', 'string'],
            ]);

            $token = $request->input('step_token');
            $cachedData = Cache::get("international_license_step_{$token}");

            if (!$cachedData) {
                return response()->json([
                    'message' => 'Session expired. Please start over.'
                ], 410);
            }

            // Validate required fields
            $this->validateFinalSubmission($cachedData);

            DB::beginTransaction();

            try {
                $settings = $this->getSettings();
                $price = $this->calculatePrice($cachedData['nationality'] ?? 'non-syrian', $settings);
                $orderNumber = $this->generateOrderNumber();

                // Prepare data for database
                $licenseData = array_merge($cachedData, [
                    'proof_of_payment' => $cachedData['proof_of_payment_temp'],
                    'status' => 'payment_check',
                    'payment_status' => 'pending',
                    'order_number' => $orderNumber,
                    'price' => $price,
                ]);

                // Remove temporary key
                unset($licenseData['proof_of_payment_temp']);

                // Create the request
                $licenseRequest = InternationalLicenseRequest::create($licenseData);

                // Clear cache
                Cache::forget("international_license_step_{$token}");

                DB::commit();

                // Send notifications
                $this->notifyAdmins($licenseRequest);
                $this->notifyUser($licenseRequest, 'created');

                // Broadcast event for real-time updates
                event(new InternationalLicenseStatusChanged($licenseRequest));

                return response()->json([
                    'success' => true,
                    'order_number' => $orderNumber,
                    'message' => 'تم تقديم طلبك بنجاح. سيتم مراجعته قريباً.',
                    'request' => $licenseRequest,
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Incomplete data',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Final submission failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to submit request. Please try again.'
            ], 500);
        }
    }

    /**
     * Admin: Get all requests with filters
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $query = InternationalLicenseRequest::with('user');

            // Status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('order_number', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('email', 'like', "%{$search}%");
                        });
                });
            }

            // Date range filters
            if ($request->filled('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }

            if ($request->filled('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Payment status filter
            if ($request->filled('payment_status')) {
                $query->where('payment_status', $request->payment_status);
            }

            // Sorting - map frontend field names to actual database columns
            $sortByInput = $request->input('sort_by', 'created_at');
            $sortFieldMap = [
                'date' => 'created_at',
                'status' => 'status',
                'price' => 'price',
                'name' => 'full_name',
                'created_at' => 'created_at', // Allow direct mapping too
            ];

            // Map the sort field, default to created_at if not found
            $sortBy = $sortFieldMap[$sortByInput] ?? 'created_at';
            $sortOrder = in_array($request->input('sort_order'), ['asc', 'desc'])
                ? $request->input('sort_order')
                : 'desc';

            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->input('per_page', 15);
            $requests = $query->paginate($perPage);

            return response()->json($requests);
        } catch (\Exception $e) {
            Log::error('Admin index failed', [
                'admin_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to retrieve requests'
            ], 500);
        }
    }

    /**
     * Admin: Update request status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,payment_check,documents_check,in_work,ready_to_handle,rejected',
                'admin_note' => 'nullable|string|max:1000',
                'rejection_type' => 'nullable|in:payment,documents,other',
                'rejected_documents' => 'nullable|array',
                'rejected_documents.*' => 'string|in:' . implode(',', self::DOCUMENT_FIELDS) . ',proof_of_payment'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $licenseRequest = InternationalLicenseRequest::findOrFail($id);
            $oldStatus = $licenseRequest->status;

            DB::beginTransaction();

            try {
                // REJECTED STATUS - Handle all rejection types
                if ($request->status === 'rejected') {
                    $licenseRequest->status = 'rejected';
                    $licenseRequest->admin_note = $request->admin_note;

                    if ($request->filled('rejection_type')) {
                        $licenseRequest->rejection_type = $request->rejection_type;

                        if ($request->rejection_type === 'documents') {
                            $licenseRequest->rejected_documents = $request->rejected_documents;
                        } elseif ($request->rejection_type === 'payment') {
                            $licenseRequest->rejected_documents = null;
                            $licenseRequest->payment_status = 'rejected';
                        } else {
                            // 'other'
                            $licenseRequest->rejected_documents = null;
                            $licenseRequest->payment_status = 'rejected';
                        }
                    }
                }
                // DOCUMENTS CHECK (Payment Approved)
                elseif ($request->status === 'documents_check') {
                    $licenseRequest->status = 'documents_check';
                    $licenseRequest->rejection_type = null;
                    $licenseRequest->admin_note = null;
                    $licenseRequest->payment_status = 'pending'; // Approved payment, pending docs
                }
                // IN WORK (Documents Approved)
                elseif ($request->status === 'in_work') {
                    $licenseRequest->status = 'in_work';
                    $licenseRequest->rejection_type = null;
                    $licenseRequest->rejected_documents = null;
                    $licenseRequest->admin_note = null;
                    $licenseRequest->payment_status = 'paid';
                } else {
                    $licenseRequest->status = $request->status;

                    // Update admin note if provided
                    if ($request->filled('admin_note')) {
                        $licenseRequest->admin_note = $request->admin_note;
                    }
                }

                $licenseRequest->save();

                DB::commit();

                // Send notification to user
                $this->notifyUser($licenseRequest, 'status_changed', $oldStatus);

                // Broadcast event
                event(new InternationalLicenseStatusChanged($licenseRequest));

                return response()->json([
                    'success' => true,
                    'message' => 'تم تحديث الحالة بنجاح',
                    'data' => $licenseRequest->fresh()
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Status update failed', [
                'admin_id' => Auth::id(),
                'request_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to update status'
            ], 500);
        }
    }

    /**
     * User: Re-upload payment proof
     */
    public function updatePaymentProof(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'proof_of_payment' => ['required', 'file', 'mimes:' . self::ALLOWED_MIMES, 'max:' . self::MAX_FILE_SIZE],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $licenseRequest = InternationalLicenseRequest::where('id', $id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            if ($licenseRequest->status !== 'rejected') {
                return response()->json([
                    'message' => 'يمكن رفع إثبات دفع جديد فقط للطلبات المرفوضة'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Delete old payment proof
                if ($licenseRequest->proof_of_payment) {
                    Storage::disk('public')->delete($licenseRequest->proof_of_payment);
                }

                // Upload new file
                $file = $request->file('proof_of_payment');
                $extension = $file->getClientOriginalExtension();
                $filename = 'payment_proof_reupload_' . time() . '_' . Str::random(8) . '.' . $extension;

                $path = $file->storeAs(
                    "international_license_requests/reuploads/{$licenseRequest->order_number}",
                    $filename,
                    'public'
                );

                // Update request - clear rejection and move back to payment_check
                $licenseRequest->update([
                    'proof_of_payment' => $path,
                    'status' => 'payment_check',
                    'payment_status' => 'pending',
                    'admin_note' => null,
                    'rejection_type' => null,
                    'rejected_documents' => null,
                ]);

                DB::commit();

                // Notify admins
                $this->notifyAdmins($licenseRequest, 'reupload');

                return response()->json([
                    'success' => true,
                    'message' => 'تم رفع إثبات الدفع بنجاح',
                    'data' => $licenseRequest->fresh()
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Payment proof reupload failed', [
                'user_id' => Auth::id(),
                'request_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'فشل في رفع إثبات الدفع'
            ], 500);
        }
    }

    /**
     * User: Re-upload documents
     */
    public function updateDocuments(Request $request, $id): JsonResponse
    {
        try {
            $validationRules = [];
            foreach (self::DOCUMENT_FIELDS as $field) {
                $validationRules[$field] = ['nullable', 'file', 'mimes:' . self::ALLOWED_MIMES, 'max:' . self::MAX_FILE_SIZE];
            }

            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $licenseRequest = InternationalLicenseRequest::where('id', $id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            if ($licenseRequest->status !== 'rejected') {
                return response()->json([
                    'message' => 'يمكن رفع مستندات جديدة فقط للطلبات المرفوضة'
                ], 400);
            }

            // Check if at least one file is uploaded
            $hasFiles = false;
            foreach (self::DOCUMENT_FIELDS as $field) {
                if ($request->hasFile($field)) {
                    $hasFiles = true;
                    break;
                }
            }

            if (!$hasFiles) {
                return response()->json([
                    'message' => 'يجب رفع مستند واحد على الأقل'
                ], 422);
            }

            DB::beginTransaction();

            try {
                $updates = [
                    'status' => 'documents_check',
                    'admin_note' => null,
                    'rejection_type' => null,
                    'rejected_documents' => null,
                ];

                // Process each uploaded file
                foreach (self::DOCUMENT_FIELDS as $field) {
                    if ($request->hasFile($field)) {
                        // Delete old file
                        if ($licenseRequest->$field) {
                            Storage::disk('public')->delete($licenseRequest->$field);
                        }

                        // Upload new file
                        $file = $request->file($field);
                        $extension = $file->getClientOriginalExtension();
                        $filename = "{$field}_reupload_" . time() . '_' . Str::random(8) . '.' . $extension;

                        $updates[$field] = $file->storeAs(
                            "international_license_requests/reuploads/{$licenseRequest->order_number}",
                            $filename,
                            'public'
                        );
                    }
                }

                $licenseRequest->update($updates);

                DB::commit();

                // Notify admins
                $this->notifyAdmins($licenseRequest, 'reupload');

                return response()->json([
                    'success' => true,
                    'message' => 'تم رفع المستندات بنجاح',
                    'data' => $licenseRequest->fresh()
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Documents reupload failed', [
                'user_id' => Auth::id(),
                'request_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'فشل في رفع المستندات'
            ], 500);
        }
    }

    // ==================== Private Helper Methods ====================

    /**
     * Get system settings
     */
    private function getSettings(): array
    {
        $settings = SystemSetting::where('key', 'international_license_settings')->value('value');
        return is_array($settings) ? $settings : [];
    }

    /**
     * Calculate price based on nationality
     */
    private function calculatePrice(string $nationality, array $settings): float
    {
        $syrianPrice = $settings['syrian_price'] ?? 350;
        $nonSyrianPrice = $settings['non_syrian_price'] ?? 650;

        return (float) ($nationality === 'syrian' ? $syrianPrice : $nonSyrianPrice);
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'IL-' . strtoupper(Str::random(10));
        } while (InternationalLicenseRequest::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    /**
     * Generate unique token
     */
    private function generateUniqueToken(): string
    {
        do {
            $token = Str::random(40);
        } while (Cache::has("international_license_step_{$token}"));

        return $token;
    }

    /**
     * Validate final submission data
     */
    private function validateFinalSubmission(array $data): void
    {
        $requiredFields = array_merge(
            self::DOCUMENT_FIELDS,
            ['proof_of_payment_temp', 'full_name', 'phone']
        );

        $missing = [];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            throw ValidationException::withMessages([
                'missing_fields' => 'بيانات غير مكتملة: ' . implode(', ', $missing)
            ]);
        }
    }

    /**
     * Notify admins about new request or updates
     */
    /**
     * Notify admins about new request or updates
     */
    private function notifyAdmins(InternationalLicenseRequest $request, string $type = 'new'): void
    {
        try {
            $admins = User::where('role', 'admin')->get();
            $notificationInstance = new InternationalLicenseNotification($request, $type);
            $notificationData = $notificationInstance->toArray(new User()); // Dummy user for toArray

            foreach ($admins as $admin) {
                // 1. Create DB Notification manually (Custom Schema)
                $dbNotification = Notification::create([
                    'user_id' => $admin->id,
                    'title' => $notificationData['title'],
                    'message' => $notificationData['message'],
                    'type' => 'INTERNATIONAL_LICENSE_' . strtoupper($type),
                    'link' => ['view' => 'adminDashboard', 'params' => ['page' => 'international-licenses']], // Adjust based on frontend
                    'context' => $notificationData,
                    'read' => false,
                ]);

                // 2. Broadcast using Project Standard Event (matches .user.notification in frontend)
                event(new \App\Events\UserNotification($admin->id, [
                    'id' => $dbNotification->id,
                    'title' => $dbNotification->title,
                    'message' => $dbNotification->message,
                    'type' => $dbNotification->type,
                    'timestamp' => $dbNotification->created_at->toIso8601String(),
                    'read' => false,
                    'link' => $dbNotification->link,
                ]));
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify admins', [
                'request_id' => $request->id,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notify user about status changes
     */
    private function notifyUser(InternationalLicenseRequest $request, string $type, ?string $oldStatus = null): void
    {
        try {
            if ($request->user) {
                $notificationInstance = new InternationalLicenseNotification($request, $type, $oldStatus);
                $notificationData = $notificationInstance->toArray($request->user);

                // 1. Create DB Notification manually (Custom Schema)
                $dbNotification = Notification::create([
                    'user_id' => $request->user->id,
                    'title' => $notificationData['title'],
                    'message' => $notificationData['message'],
                    'type' => 'INTERNATIONAL_LICENSE_' . strtoupper($type),
                    'link' => ['view' => 'userDashboard', 'params' => ['page' => 'international-licenses']], // Adjust based on frontend
                    'context' => $notificationData,
                    'read' => false,
                ]);

                // 2. Broadcast using Project Standard Event (matches .user.notification in frontend)
                event(new \App\Events\UserNotification($request->user->id, [
                    'id' => $dbNotification->id,
                    'title' => $dbNotification->title,
                    'message' => $dbNotification->message,
                    'type' => $dbNotification->type,
                    'timestamp' => $dbNotification->created_at->toIso8601String(),
                    'read' => false,
                    'link' => $dbNotification->link,
                ]));
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify user', [
                'request_id' => $request->id,
                'user_id' => $request->user_id,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
        }
    }
}