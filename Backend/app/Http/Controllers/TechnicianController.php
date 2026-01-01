<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Technician;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TechnicianController extends Controller
{
    /**
     * Get authenticated technician's profile
     */
    public function getProfile(Request $request)
    {
        $user = Auth::user();

        // Find technician by user_id or fallback to phone
        $technician = Technician::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician profile not found'], 404);
        }

        // Map to camelCase for frontend
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $technician->id,
                'uniqueId' => $technician->unique_id,
                'name' => $technician->name,
                'specialty' => $technician->specialty,
                'city' => $technician->city,
                'workshopAddress' => $technician->workshop_address,
                'location' => $technician->location,
                'description' => $technician->description,
                'profilePhoto' => $technician->profile_photo ? url('storage/' . $technician->profile_photo) : null,
                'gallery' => $this->formatGallery($technician->gallery),
                'socials' => $technician->socials ?? [],
                'isVerified' => $technician->is_verified,
                'isActive' => $technician->is_active,
                'qrCodeUrl' => $technician->qr_code_url,
                'averageRating' => $technician->average_rating,
                'registrationDate' => $technician->created_at ? $technician->created_at->toISOString() : null,
            ]
        ]);
    }

    /**
     * Update authenticated technician's profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $technician = Technician::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'specialty' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'workshopAddress' => 'sometimes|string|max:500',
            'description' => 'sometimes|string|max:2000',
            'location' => 'sometimes|array',
            'location.latitude' => 'required_with:location|numeric|between:-90,90',
            'location.longitude' => 'required_with:location|numeric|between:-180,180',
            'socials' => 'sometimes|array',
            'socials.facebook' => 'nullable|string|max:255',
            'socials.instagram' => 'nullable|string|max:255',
            'socials.whatsapp' => 'nullable|string|max:255',
            'notificationSettings' => 'sometimes|array',
            'password' => 'sometimes|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $updateData = [];

        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }
        if ($request->has('specialty')) {
            $updateData['specialty'] = $request->specialty;
        }
        if ($request->has('city')) {
            $updateData['city'] = $request->city;
        }
        if ($request->has('workshopAddress')) {
            $updateData['workshop_address'] = $request->workshopAddress;
        }
        if ($request->has('description')) {
            $updateData['description'] = $request->description;
        }
        if ($request->has('location')) {
            $updateData['location'] = $request->location;
        }
        if ($request->has('socials')) {
            $updateData['socials'] = $request->socials;
        }
        if ($request->has('notificationSettings')) {
            $updateData['notification_settings'] = $request->notificationSettings;
        }

        if ($request->has('password')) {
            $hashedPassword = \Illuminate\Support\Facades\Hash::make($request->password);
            $updateData['password'] = $hashedPassword;

            // Update User model password as well if linked
            if ($technician->user) {
                $technician->user->update(['password' => $hashedPassword]);
            }
        }

        // Handle location specially for MySQL spatial
        if ($request->has('location') && is_array($request->location)) {
            $lat = $request->location['latitude'];
            $lng = $request->location['longitude'];

            // Use raw SQL to update MySQL point
            DB::statement(
                "UPDATE technicians SET location = ST_PointFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326) WHERE id = ?",
                [$lng, $lat, $technician->id]
            );

            // Remove from regular update data since we handled it separately
            unset($updateData['location']);
        }

        if (!empty($updateData)) {
            $technician->update($updateData);
        }

        // Refresh to get updated location
        $technician->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $technician->id,
                'uniqueId' => $technician->unique_id,
                'name' => $technician->name,
                'specialty' => $technician->specialty,
                'city' => $technician->city,
                'workshopAddress' => $technician->workshop_address,
                'location' => $technician->location,
                'description' => $technician->description,
                'socials' => $technician->socials ?? [],
                'notificationSettings' => $technician->notification_settings ?? [],
            ]
        ]);
    }

    /**
     * Upload profile photo
     */
    public function uploadProfilePhoto(Request $request)
    {
        $user = Auth::user();

        $technician = Technician::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        try {
            // Delete old photo if exists
            if ($technician->profile_photo && Storage::disk('public')->exists($technician->profile_photo)) {
                Storage::disk('public')->delete($technician->profile_photo);
            }

            // Store new photo
            $file = $request->file('photo');
            $fileName = 'profile_' . time() . '.' . $file->getClientOriginalExtension();
            $sanitizedId = $this->sanitizeIdForPath($technician->id);
            $path = $file->storeAs(
                'technicians/' . $sanitizedId . '/profile',
                $fileName,
                'public'
            );

            // Update database
            $technician->update(['profile_photo' => $path]);

            return response()->json([
                'success' => true,
                'message' => 'Profile photo uploaded successfully',
                'data' => [
                    'profilePhoto' => url('storage/' . $path)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to upload photo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Upload gallery image/video
     */
    public function uploadGalleryImage(Request $request)
    {
        $user = Auth::user();

        $technician = Technician::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:20480', // 20MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        try {
            $gallery = $technician->gallery ?? [];

            // Check gallery limit (max 20 items)
            if (count($gallery) >= 20) {
                return response()->json(['error' => 'Gallery limit reached (max 20 items)'], 422);
            }

            // Store file
            $file = $request->file('file');
            $fileName = 'gallery_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $sanitizedId = $this->sanitizeIdForPath($technician->id);
            $path = $file->storeAs(
                'technicians/' . $sanitizedId . '/gallery',
                $fileName,
                'public'
            );

            // Determine file type
            $mimeType = $file->getMimeType();
            $type = str_starts_with($mimeType, 'video/') ? 'video' : 'image';

            // Add to gallery
            $gallery[] = [
                'type' => $type,
                'path' => $path,
                'uploaded_at' => now()->toISOString()
            ];

            // Update database
            $technician->update(['gallery' => $gallery]);

            return response()->json([
                'success' => true,
                'message' => 'Gallery item uploaded successfully',
                'data' => [
                    'gallery' => $this->formatGallery($gallery)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to upload file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete gallery item
     */
    public function deleteGalleryItem(Request $request, $index)
    {
        $user = Auth::user();

        $technician = Technician::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician profile not found'], 404);
        }

        $gallery = $technician->gallery ?? [];

        if (!isset($gallery[$index])) {
            return response()->json(['error' => 'Gallery item not found'], 404);
        }

        try {
            // Delete file from storage
            $item = $gallery[$index];
            if (isset($item['path']) && Storage::disk('public')->exists($item['path'])) {
                Storage::disk('public')->delete($item['path']);
            }

            // Remove from gallery array
            array_splice($gallery, $index, 1);

            // Update database
            $technician->update(['gallery' => $gallery]);

            return response()->json([
                'success' => true,
                'message' => 'Gallery item deleted successfully',
                'data' => [
                    'gallery' => $this->formatGallery($gallery)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete gallery item: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Format gallery items with full URLs
     */
    private function formatGallery($gallery)
    {
        if (!$gallery || !is_array($gallery)) {
            return [];
        }

        return array_map(function ($item) {
            return [
                'type' => $item['type'] ?? 'image',
                'url' => isset($item['path']) ? url('storage/' . $item['path']) : null,
                'uploaded_at' => $item['uploaded_at'] ?? null
            ];
        }, $gallery);
    }

    /**
     * Sanitize technician ID for use in file paths
     * Removes + and other special characters
     */
    private function sanitizeIdForPath($id)
    {
        return str_replace(['+', ' ', '/', '\\'], '', $id);
    }
    /**
     * Get dashboard statistics for the authenticated technician
     */
    public function getDashboardStats(Request $request)
    {
        $user = Auth::user();

        $technician = Technician::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician profile not found'], 404);
        }

        // 1. Order Stats (Orders placed by this technician)
        // Note: Providing 'user_id' as phone number because that's how it's currently stored in Order model for non-auth flows sometimes, 
        // but here we should be consistent. OrderController uses $user->phone for user_id.
        $userPhone = $user->phone;

        $totalOrders = \App\Models\Order::where('user_id', $userPhone)->count();

        $activeOrders = \App\Models\Order::where('user_id', $userPhone)
            ->whereIn('status', ['pending', 'quoted', 'payment_pending', 'processing', 'ready_for_pickup', 'provider_received', 'shipped', 'out_for_delivery'])
            ->count();

        $completedOrders = \App\Models\Order::where('user_id', $userPhone)
            ->where('status', 'completed') // or delivered? Let's check OrderController. getStatusLabel says 'completed' is 'تم الاستلام من الشركة'
            ->count();

        // 2. Flash Requests Stats
        // Assuming there is a FlashProductBuyerRequest model or we query directly
        $activeRequests = \DB::table('flash_product_buyer_requests')
            ->where('buyer_id', $user->phone)
            ->where('status', 'pending')
            ->count();

        $confirmedPurchases = 0;
        if (isset($technician->flash_purchases) && is_array($technician->flash_purchases)) {
            $confirmedPurchases = count($technician->flash_purchases);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'totalOrders' => $totalOrders,
                'activeOrders' => $activeOrders,
                'completedOrders' => $completedOrders,
                'pendingRequests' => $activeRequests,
                'confirmedPurchases' => $confirmedPurchases,
                'isVerified' => $technician->is_verified,
            ]
        ]);
    }
}
