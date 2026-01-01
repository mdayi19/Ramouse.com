<?php

namespace App\Http\Controllers;

use App\Models\AuctionCar;
use App\Models\Notification;
use App\Events\AdminDashboardEvent;
use Illuminate\Http\Request;

class AuctionCarController extends Controller
{
    /**
     * User submits their car for auction
     */
    public function userSubmit(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'condition' => 'required|in:new,used',
            'brand' => 'required|string',
            'model' => 'required|string',
            'year' => 'required|integer|min:1900|max:2100',
            'starting_price' => 'required|numeric|min:100',
            'media' => 'required|array',
            'media.images' => 'required|array|min:3', // At least 3 images
        ], [
            'title.required' => 'يرجى إدخال عنوان الإعلان',
            'brand.required' => 'يرجى تحديد الماركة',
            'model.required' => 'يرجى تحديد الموديل',
            'year.required' => 'يرجى تحديد سنة الصنع',
            'starting_price.required' => 'يرجى تحديد سعر البداية',
            'starting_price.min' => 'سعر البداية يجب أن يكون 100 على الأقل',
            'media.images.required' => 'يرجى إضافة صور للسيارة',
            'media.images.min' => 'يجب إضافة 3 صور على الأقل',
            'media.images.array' => 'بيانات الصور غير صالحة',
        ]);

        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        // Providers cannot sell cars
        if ($user->role === 'provider') {
            return response()->json(['error' => 'مقدمي الخدمات لا يمكنهم بيع السيارات'], 403);
        }

        $car = AuctionCar::create([
            'title' => $request->title,
            'description' => $request->description,
            'condition' => $request->condition,
            'brand' => $request->brand,
            'model' => $request->model,
            'body_type' => $request->body_type,
            'year' => $request->year,
            'vin' => $request->vin,
            'mileage' => $request->mileage,
            'engine_type' => $request->engine_type,
            'transmission' => $request->transmission,
            'fuel_type' => $request->fuel_type,
            'exterior_color' => $request->exterior_color,
            'interior_color' => $request->interior_color,
            'features' => $request->features ?? [],
            'media' => $request->media,
            'location' => $request->location,
            'starting_price' => $request->starting_price,
            'reserve_price' => $request->reserve_price,
            'buy_now_price' => $request->buy_now_price,
            'deposit_amount' => $request->deposit_amount ?? 0,
            'seller_type' => 'user',
            'seller_id' => $profile->id,
            'seller_user_type' => $userType,
            'seller_name' => $profile->name,
            'seller_phone' => $user->phone,
            'status' => 'pending_approval',
        ]);

        // Notify admin
        try {
            event(new AdminDashboardEvent('car.submitted', [
                'carId' => $car->id,
                'title' => $car->title,
                'sellerName' => $profile->name,
            ]));
        } catch (\Exception $e) {
            \Log::warning('Failed to send admin notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تقديم طلب بيع السيارة بنجاح. سيتم مراجعته من قبل الإدارة.',
            'id' => $car->id, // Explicit ID return
            'car' => $car,
        ]);
    }

    /**
     * Get user's submitted cars
     */
    public function myCars(Request $request)
    {
        $user = $request->user();
        [$profile, $userType] = $this->getUserProfile($user);

        if (!$profile) {
            return response()->json(['error' => 'الحساب غير موجود'], 404);
        }

        $cars = AuctionCar::where('seller_id', $profile->id)
            ->where('seller_user_type', $userType)
            ->with('auction')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($cars);
    }

    /**
     * Get user profile and type
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
     * Upload media for auction car
     */
    public function uploadMedia(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,mp4,mov|max:20480', // Max 20MB
            'type' => 'required|in:image,video',
        ]);

        $file = $request->file('file');
        $type = $request->type;

        // Store in local storage public disk
        $path = $file->store("auction-media/{$type}s", 'public');

        // Return full URL
        try {
            $url = asset('storage/' . $path);
            \Log::info("Media uploaded successfully: $url");

            return response()->json([
                'url' => $url,
                'path' => $path,
                'type' => $type
            ]);
        } catch (\Exception $e) {
            \Log::error("Media upload error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to process upload'], 500);
        }
    }
}
