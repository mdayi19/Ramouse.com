<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Provider;
use App\Models\CarProvider;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Events\UserRegistered;
use App\Events\AdminDashboardEvent;

class AuthController extends Controller
{
    public function checkPhone(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $phone = $request->phone;

        // Check in User table
        $user = \App\Models\User::where('phone', $phone)
            ->orWhere('phone', str_replace('+', '', $phone))
            ->first();

        if ($user) {
            return response()->json([
                'exists' => true,
                'type' => $user->role,
                'requiresPassword' => true,
            ]);
        }

        // Phone doesn't exist - new user
        return response()->json([
            'exists' => false,
            'requiresPassword' => false,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required',
            'password' => 'required',
        ]);

        $phone = $request->phone;
        $user = \App\Models\User::where('phone', $phone)
            ->orWhere('phone', str_replace('+', '', $phone))
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => __('auth.invalid_credentials')], 401);
        }

        // Load profile based on role
        $profile = null;
        if ($user->role === 'customer') {
            $profile = $user->customer;
            if (!$profile) {
                return response()->json(['message' => __('auth.profile_not_found')], 404);
            }
            if (!$profile->is_active) {
                return response()->json(['message' => __('auth.account_inactive'), 'error' => __('auth.account_inactive')], 403);
            }
        } elseif ($user->role === 'provider') {
            $profile = $user->provider;
            if (!$profile) {
                return response()->json(['message' => __('auth.profile_not_found')], 404);
            }
            if (!$profile->is_active) {
                return response()->json(['message' => __('auth.account_inactive'), 'error' => __('auth.account_inactive')], 403);
            }
        } elseif ($user->role === 'car_provider') {
            $profile = $user->carProvider;
            if (!$profile) {
                return response()->json(['message' => __('auth.profile_not_found')], 404);
            }
            // Strict checks for Car Providers
            if (!$profile->is_verified) {
                return response()->json(['message' => __('auth.account_not_verified'), 'error' => __('auth.account_not_verified')], 403);
            }
            if (!$profile->is_active) {
                return response()->json(['message' => __('auth.account_inactive'), 'error' => __('auth.account_inactive')], 403);
            }
        } elseif ($user->role === 'technician') {
            $profile = $user->technician;
            if (!$profile) {
                return response()->json(['message' => __('auth.profile_not_found')], 404);
            }
            if (!$profile->is_verified) {
                return response()->json(['message' => __('auth.account_not_verified'), 'error' => __('auth.account_not_verified')], 403);
            }
            if (!$profile->is_active) {
                return response()->json(['message' => __('auth.account_inactive'), 'error' => __('auth.account_inactive')], 403);
            }
        } elseif ($user->role === 'tow_truck') {
            $profile = $user->towTruck;
            if (!$profile) {
                return response()->json(['message' => __('auth.profile_not_found')], 404);
            }
            if (!$profile->is_verified) {
                return response()->json(['message' => __('auth.account_not_verified'), 'error' => __('auth.account_not_verified')], 403);
            }
            if (!$profile->is_active) {
                return response()->json(['message' => __('auth.account_inactive'), 'error' => __('auth.account_inactive')], 403);
            }
        } else {
            // Unknown or unauthorized role for this app login
            return response()->json(['message' => __('auth.unauthorized_role')], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => __('auth.login_successful'),
            'user' => $profile ?? $user, // Return profile if exists, else user (admin)
            'token' => $token,
            'role' => $user->role,
            'user_type' => $user->role,
            'user_id' => $user->id, // Explicitly return User ID for channel subscription
            'is_admin' => $user->is_admin,
        ]);
    }

    public function registerCustomer(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string|min:6',
            'name' => 'nullable|string',
        ]);

        // Check if user already exists
        $existingUser = \App\Models\User::where('phone', $request->phone)
            ->orWhere('phone', str_replace('+', '', $request->phone))
            ->first();

        if ($existingUser) {
            return response()->json(['message' => __('auth.user_already_exists')], 400);
        }

        // Generate unique 10-character ID
        do {
            $uniqueId = strtoupper(substr(md5(uniqid(rand(), true)), 0, 10));
            $existingId = Customer::where('unique_id', $uniqueId)->first();
        } while ($existingId);

        DB::beginTransaction();
        try {
            // Create User
            $user = \App\Models\User::create([
                'name' => $request->name ?? 'عميل جديد',
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => 'customer',
                'is_admin' => false,
            ]);

            // Create Customer Profile
            $customer = Customer::create([
                'id' => $request->phone,
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->name ?? 'عميل جديد',
                'password' => Hash::make($request->password), // Keep for legacy/redundancy if needed, or remove
            ]);

            DB::commit();

            // Broadcast registration event to admin
            event(new UserRegistered([
                'id' => $customer->id,
                'unique_id' => $customer->unique_id,
                'name' => $customer->name,
                'phone' => $customer->id,
            ], 'customer'));

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('user.registered', [
                'user_type' => 'customer',
                'name' => $customer->name,
            ]));

            return response()->json([
                'message' => __('auth.customer_registered'),
                'user' => $customer,
                'token' => $user->createToken('auth_token')->plainTextToken,
                'role' => 'customer',
                'user_type' => 'customer',
                'is_admin' => false,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('auth.registration_failed'), 'error' => $e->getMessage()], 500);
        }
    }

    public function registerTechnician(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string|min:6',
            'name' => 'required|string',
            'specialty' => 'required|string',
            'city' => 'required|string',
        ]);

        // Check if user already exists
        $existingUser = \App\Models\User::where('phone', $request->phone)
            ->orWhere('phone', str_replace('+', '', $request->phone))
            ->first();

        if ($existingUser) {
            return response()->json(['message' => __('auth.user_already_exists')], 400);
        }

        // Generate unique 6-digit ID
        do {
            $uniqueId = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $exists = Technician::where('unique_id', $uniqueId)->first();
        } while ($exists);

        DB::beginTransaction();
        try {
            // Create User
            $user = \App\Models\User::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => 'technician',
                'is_admin' => false,
            ]);

            // Clean phone for folder name (remove +)
            $cleanPhone = str_replace('+', '', $request->phone);

            // Handle Profile Photo
            $profilePhotoPath = null;
            if ($request->has('profilePhoto')) {
                // Folder: technicians/{phone}/profile
                // Filename: profile_{timestamp}
                $folder = "technicians/{$cleanPhone}/profile";
                $filename = "profile_" . time();
                $profilePhotoPath = $this->saveBase64File($request->profilePhoto, $folder, $filename, true);
            }

            // Handle Gallery
            $galleryData = [];
            if ($request->has('gallery') && is_array($request->gallery)) {
                foreach ($request->gallery as $item) {
                    // Check for 'url' (frontend) or 'data' (legacy/other)
                    $base64Data = $item['url'] ?? $item['data'] ?? null;

                    if ($base64Data && isset($item['type'])) {
                        // Folder: technicians/{phone}/gallery
                        // Filename: gallery_{timestamp}_{random}
                        $folder = "technicians/{$cleanPhone}/gallery";
                        $filename = "gallery_" . time() . "_" . uniqid();

                        $savedPath = $this->saveBase64File($base64Data, $folder, $filename, true);

                        // Construct the specific JSON format required
                        $galleryData[] = [
                            'path' => $savedPath,
                            'type' => $item['type'],
                            'uploaded_at' => now()->toISOString() // e.g. 2025-11-27T20:06:25.183034Z
                        ];
                    }
                }
            }

            // Create Technician Profile
            $technician = Technician::create([
                'id' => $request->phone,
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'specialty' => $request->specialty,
                'city' => $request->city,
                'workshop_address' => $request->workshopAddress ?? '',
                'description' => $request->description ?? '',
                'profile_photo' => $profilePhotoPath,
                'gallery' => $galleryData, // Eloquent casts this to array/JSON automatically
                'socials' => $request->socials ?? [],
                'location' => $request->location ? \Illuminate\Support\Facades\DB::raw("ST_PointFromText('POINT(" . $request->location['longitude'] . " " . $request->location['latitude'] . ")', 4326)") : null,
                'is_verified' => false, // Requires admin verification
                'is_active' => true,
                'average_rating' => 5.0,
            ]);

            DB::commit();

            // Broadcast registration event to admin
            event(new UserRegistered([
                'id' => $technician->id,
                'unique_id' => $technician->unique_id,
                'name' => $technician->name,
                'phone' => $technician->id,
                'specialty' => $technician->specialty,
                'city' => $technician->city,
            ], 'technician'));

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('technician.registered', [
                'name' => $technician->name,
                'specialty' => $technician->specialty,
            ]));

            return response()->json([
                'message' => 'Technician registered successfully',
                'user' => $technician,
                // 'token' => $user->createToken('auth_token')->plainTextToken, // Removed to prevent auto-login
                'role' => 'technician',
                'user_type' => 'technician',
                'is_admin' => false,
                'requires_approval' => true,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('auth.registration_failed'), 'error' => $e->getMessage()], 500);
        }
    }

    public function registerCarProvider(Request $request)
    {
        // Validation using FormData logic (files are binary, not base64)
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string|min:6',
            'business_name' => 'required|string',
            'business_type' => 'required|string',
            'city' => 'required|string',
            'address' => 'required|string',
            'business_license' => 'nullable|string',
            'description' => 'nullable|string',
            'email' => 'nullable|email',
            'profile_photo' => 'nullable|image|max:10240', // 10MB
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|max:10240',
            'socials' => 'nullable|array',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        // Check if user already exists
        $existingUser = \App\Models\User::where('phone', $request->phone)
            ->orWhere('phone', str_replace('+', '', $request->phone))
            ->first();

        if ($existingUser) {
            return response()->json(['message' => __('auth.user_already_exists')], 400);
        }

        // Generate unique 10-character ID
        do {
            $uniqueId = strtoupper(substr(md5(uniqid(rand(), true)), 0, 10));
            $existingId = CarProvider::where('unique_id', $uniqueId)->first();
        } while ($existingId);

        DB::beginTransaction();
        try {
            // Create User
            // Note: role is 'car_provider' to differentiate from generic 'provider'
            $user = \App\Models\User::create([
                'name' => $request->business_name,
                'phone' => $request->phone,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'car_provider',
                'is_admin' => false,
            ]);
            // Explicitly force role save to prevent default 'user' role
            $user->role = 'car_provider';
            $user->save();

            // Handle Profile Photo (Standard File Upload)
            $profilePhotoPath = null;
            if ($request->hasFile('profile_photo')) {
                $path = $request->file('profile_photo')->store('car_providers/profile_photos', 'public');
                $profilePhotoPath = \Illuminate\Support\Facades\Storage::url($path);
            }

            // Handle Gallery (Standard File Uploads)
            $galleryPaths = [];
            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $file) {
                    $path = $file->store('car_providers/gallery', 'public');
                    // Store just the path strings in the JSON array
                    $galleryPaths[] = \Illuminate\Support\Facades\Storage::url($path);
                }
            }

            // Create Car Provider Profile
            $provider = CarProvider::create([
                'id' => $request->phone, // Use phone as ID
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->business_name,
                'password' => Hash::make($request->password),
                'business_type' => $request->business_type,
                'business_license' => $request->business_license,
                'city' => $request->city,
                'address' => $request->address,
                'description' => $request->description,
                'profile_photo' => $profilePhotoPath,
                'gallery' => $galleryPaths,
                'socials' => $request->socials ?? [],
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'is_active' => false, // requires admin activation
                'is_verified' => false,
                'is_trusted' => false,
                'wallet_balance' => 0.00,
            ]);

            // Create Primary Phone Record
            \App\Models\CarProviderPhone::create([
                'car_provider_id' => $provider->id,
                'phone' => $request->phone,
                'label' => 'Main',
                'is_primary' => true,
                'is_whatsapp' => true // Default to true for convenience
            ]);

            DB::commit();

            // Broadcast registration event to admin
            event(new UserRegistered([
                'id' => $provider->id,
                'unique_id' => $provider->unique_id,
                'name' => $provider->name,
                'phone' => $provider->id,
                'type' => 'car_provider'
            ], 'car_provider'));

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('car_provider.registered', [
                'name' => $provider->name,
                'city' => $provider->city,
                'business_type' => $provider->business_type
            ]));

            return response()->json([
                'message' => __('auth.provider_registered_waiting_approval'),
                'user' => $provider,
                // Token removed to prevent auto-login for inactive account
                // 'token' => $user->createToken('auth_token')->plainTextToken, 
                'role' => 'car_provider',
                'user_type' => 'car_provider',
                'is_admin' => false,
                'requires_approval' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('auth.registration_failed'), 'error' => $e->getMessage()], 500);
        }
    }

    public function registerTowTruck(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string|min:6',
            'name' => 'required|string',
            'vehicleType' => 'required|string',
            'city' => 'required|string',
        ]);

        // Check if user already exists
        $existingUser = \App\Models\User::where('phone', $request->phone)
            ->orWhere('phone', str_replace('+', '', $request->phone))
            ->first();

        if ($existingUser) {
            return response()->json(['message' => __('auth.user_already_exists')], 400);
        }

        // Generate unique 6-digit ID
        do {
            $uniqueId = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $exists = TowTruck::where('unique_id', $uniqueId)->first();
        } while ($exists);

        DB::beginTransaction();
        try {
            // Create User
            $user = \App\Models\User::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => 'tow_truck',
                'is_admin' => false,
            ]);

            // Clean phone for folder name (remove +)
            $cleanPhone = str_replace('+', '', $request->phone);

            // Handle Profile Photo
            $profilePhotoPath = null;
            if ($request->has('profilePhoto')) {
                // Folder: tow_trucks/{phone}/profile
                // Filename: profile_{timestamp}
                $folder = "tow_trucks/{$cleanPhone}/profile";
                $filename = "profile_" . time();
                $profilePhotoPath = $this->saveBase64File($request->profilePhoto, $folder, $filename, true);
            }

            // Handle Gallery
            $galleryData = [];
            if ($request->has('gallery') && is_array($request->gallery)) {
                foreach ($request->gallery as $item) {
                    // Check for 'url' (frontend) or 'data' (legacy/other)
                    $base64Data = $item['url'] ?? $item['data'] ?? null;

                    if ($base64Data && isset($item['type'])) {
                        // Folder: tow_trucks/{phone}/gallery
                        // Filename: gallery_{timestamp}_{random}
                        $folder = "tow_trucks/{$cleanPhone}/gallery";
                        $filename = "gallery_" . time() . "_" . uniqid();

                        $savedPath = $this->saveBase64File($base64Data, $folder, $filename, true);

                        // Construct the specific JSON format required
                        $galleryData[] = [
                            'path' => $savedPath,
                            'type' => $item['type'],
                            'uploaded_at' => now()->toISOString()
                        ];
                    }
                }
            }

            // Create Tow Truck Profile
            $towTruck = TowTruck::create([
                'id' => $request->phone,
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'vehicle_type' => $request->vehicleType,
                'city' => $request->city,
                'service_area' => $request->serviceArea ?? '',
                'description' => $request->description ?? '',
                'profile_photo' => $profilePhotoPath,
                'gallery' => $galleryData,
                'socials' => $request->socials ?? [],
                'location' => $request->location ? \Illuminate\Support\Facades\DB::raw("ST_PointFromText('POINT(" . $request->location['longitude'] . " " . $request->location['latitude'] . ")', 4326)") : null,
                'is_verified' => false, // Requires admin verification
                'is_active' => true,
                'average_rating' => 5.0,
            ]);

            DB::commit();

            // Broadcast registration event to admin
            event(new UserRegistered([
                'id' => $towTruck->id,
                'unique_id' => $towTruck->unique_id,
                'name' => $towTruck->name,
                'phone' => $towTruck->id,
                'vehicleType' => $towTruck->vehicle_type,
                'city' => $towTruck->city,
            ], 'tow_truck'));

            // Broadcast to admin dashboard for real-time refresh
            event(new AdminDashboardEvent('tow_truck.registered', [
                'name' => $towTruck->name,
                'city' => $towTruck->city,
            ]));

            return response()->json([
                'message' => __('auth.tow_truck_registered'),
                'user' => $towTruck,
                // 'token' => $user->createToken('auth_token')->plainTextToken, // Removed to prevent auto-login
                'role' => 'tow_truck',
                'user_type' => 'tow_truck',
                'is_admin' => false,
                'requires_approval' => true,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('auth.registration_failed'), 'error' => $e->getMessage()], 500);
        }
    }

    public function sendOtp(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        // Get rate limit settings from database (with fallback defaults)
        $settings = \App\Models\SystemSetting::where('key', 'limitSettings')->first();
        $limits = $settings ? $settings->value : [];

        $maxAttempts = $limits['maxVerificationAttempts'] ?? 3;
        $windowMinutes = $limits['verificationWindowMinutes'] ?? 60;

        // Use SEPARATE keys for OTP storage and rate limiting to avoid collision
        $otpKey = 'otp:' . $request->phone;
        $rateLimitKey = 'otp_rate_limit:' . $request->phone;

        // Check if too many attempts
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'message' => "تم تجاوز الحد المسموح. حاول مرة أخرى بعد " . ceil($seconds / 60) . " دقيقة."
            ], 429);
        }

        // Generate OTP as string to ensure consistent comparison
        $otp = (string) rand(100000, 999999);
        \Illuminate\Support\Facades\Log::info("Generated OTP for {$request->phone}", [
            'otp' => $otp,
            'otp_type' => gettype($otp),
        ]);

        try {
            // Use WhatsApp Service directly for OTP (need immediate success/failure feedback)
            $whatsappService = app(\App\Services\WhatsAppService::class);
            $result = $whatsappService->sendOTP($request->phone, $otp);

            if (!$result['success']) {
                \Illuminate\Support\Facades\Log::error("Failed to send OTP: " . ($result['error'] ?? 'Unknown'));
                return response()->json(['message' => 'فشل إرسال رمز التحقق'], 500);
            }

            // Store OTP in cache for 5 minutes
            \Illuminate\Support\Facades\Cache::put($otpKey, $otp, now()->addMinutes(5));

            // Hit the rate limiter (using separate key to avoid collision with OTP cache)
            \Illuminate\Support\Facades\RateLimiter::hit($rateLimitKey, $windowMinutes * 60);

            return response()->json(['message' => 'تم إرسال رمز التحقق']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send OTP: " . $e->getMessage());
            return response()->json(['message' => 'فشل إرسال رمز التحقق', 'error' => $e->getMessage()], 500);
        }
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        // Debug logging
        \Illuminate\Support\Facades\Log::info('OTP Verification attempt', [
            'phone' => $request->phone,
            'otp_entered' => $request->otp,
        ]);

        // Check cache for OTP
        $key = 'otp:' . $request->phone;
        $cachedOtp = \Illuminate\Support\Facades\Cache::get($key);

        \Illuminate\Support\Facades\Log::info('OTP Cache check', [
            'key' => $key,
            'cached_otp' => $cachedOtp,
            'cached_otp_type' => gettype($cachedOtp),
        ]);

        if (!$cachedOtp) {
            \Illuminate\Support\Facades\Log::warning('OTP not found in cache', ['phone' => $request->phone]);
            return response()->json([
                'message' => __('auth.otp_expired'),
            ], 400);
        }

        // Compare as strings to avoid type mismatch
        if ((string) $cachedOtp !== (string) $request->otp) {
            \Illuminate\Support\Facades\Log::warning('OTP mismatch', [
                'cached' => (string) $cachedOtp,
                'entered' => (string) $request->otp,
            ]);
            return response()->json([
                'message' => __('auth.invalid_otp'),
            ], 400);
        }

        // OTP verified successfully, remove from cache
        \Illuminate\Support\Facades\Cache::forget($key);

        return response()->json([
            'message' => __('auth.otp_verified'),
            'verified' => true,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $phone = $request->phone;

        // Find user in User table
        $user = \App\Models\User::where('phone', $phone)
            ->orWhere('phone', str_replace('+', '', $phone))
            ->first();

        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();

            // Also update profile password for consistency (optional)
            if ($user->role === 'customer' && $user->customer) {
                $user->customer->password = $user->password;
                $user->customer->save();
            } elseif ($user->role === 'provider' && $user->provider) {
                $user->provider->password = $user->password;
                $user->provider->save();
            } elseif ($user->role === 'technician' && $user->technician) {
                $user->technician->password = $user->password;
                $user->technician->save();
            } elseif ($user->role === 'tow_truck' && $user->towTruck) {
                $user->towTruck->password = $user->password;
                $user->towTruck->save();
            }

            return response()->json(['message' => __('auth.password_reset_success')]);
        }

        return response()->json(['message' => __('messages.user_not_found')], 404);
    }
    private function saveBase64File($base64String, $folder, $customFilename = null, $returnRelativePath = false)
    {
        // Check if it's a base64 string
        if (!preg_match('/^data:(\w+\/[\w\-\.]+);base64,/', $base64String, $type)) {
            return $base64String; // Return original if not base64 (likely a URL)
        }

        $mimeType = $type[1];
        // Simple extension extraction
        $extension = explode('/', $mimeType)[1];
        // Fix common extensions
        if ($extension === 'jpeg')
            $extension = 'jpg';
        if ($extension === 'svg+xml')
            $extension = 'svg';

        $data = substr($base64String, strpos($base64String, ',') + 1);
        $decodedData = base64_decode($data);

        if ($decodedData === false) {
            return $base64String;
        }

        if ($customFilename) {
            $filename = $customFilename . '.' . $extension;
        } else {
            $filename = \Illuminate\Support\Str::random(40) . '.' . $extension;
        }

        $path = $folder . '/' . $filename;

        \Illuminate\Support\Facades\Storage::disk('public')->put($path, $decodedData);

        if ($returnRelativePath) {
            return $path;
        }

        // Return full URL by default (legacy behavior)
        return \Illuminate\Support\Facades\Storage::url($path);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => __('messages.unauthorized')], 401);
        }

        $validated = $request->validate([
            'name' => 'nullable|string',
            'address' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'notification_settings' => 'nullable|array',
        ]);

        // Update User table
        if ($request->has('name')) {
            $user->name = $validated['name'];
        }
        if ($request->has('password') && !empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        // Update Profile based on role
        $profile = null;
        if ($user->role === 'customer') {
            $profile = $user->customer;
        } elseif ($user->role === 'provider') {
            $profile = $user->provider;
        } elseif ($user->role === 'technician') {
            $profile = $user->technician;
        } elseif ($user->role === 'tow_truck') {
            $profile = $user->towTruck;
        } elseif ($user->role === 'car_provider') {
            $profile = $user->carProvider;
        }

        if ($profile) {
            if ($request->has('name')) {
                $profile->name = $validated['name'];
            }
            if ($request->has('password') && !empty($validated['password'])) {
                $profile->password = $user->password;
            }
            if ($request->has('notification_settings')) {
                $profile->notification_settings = $validated['notification_settings'];
            }

            // Role specific updates
            if ($user->role === 'customer') {
                if ($request->has('address')) {
                    $profile->address = $validated['address'];
                }
            } elseif ($user->role === 'car_provider') {
                if ($request->has('address')) {
                    $profile->address = $validated['address'];
                }
            } elseif ($user->role === 'tow_truck') {
                if ($request->has('vehicleType'))
                    $profile->vehicle_type = $request->vehicleType;
                if ($request->has('city'))
                    $profile->city = $request->city;
                if ($request->has('serviceArea'))
                    $profile->service_area = $request->serviceArea;
                if ($request->has('description'))
                    $profile->description = $request->description;

                if ($request->has('profilePhoto')) {
                    $profile->profile_photo = $this->saveBase64File($request->profilePhoto, 'tow_trucks/profile_photos');
                }

                if ($request->has('gallery') && is_array($request->gallery)) {
                    $processedGallery = [];
                    foreach ($request->gallery as $item) {
                        if (isset($item['data']) && isset($item['type'])) {
                            $item['data'] = $this->saveBase64File($item['data'], 'tow_trucks/gallery');
                            $processedGallery[] = $item;
                        } else {
                            $processedGallery[] = $item;
                        }
                    }
                    $profile->gallery = $processedGallery;
                }

                if ($request->has('socials'))
                    $profile->socials = $request->socials;

                if ($request->has('location') && is_array($request->location)) {
                    $lat = $request->location['latitude'] ?? null;
                    $lng = $request->location['longitude'] ?? null;
                    if ($lat !== null && $lng !== null) {
                        \Illuminate\Support\Facades\DB::table('tow_trucks')
                            ->where('id', $profile->id)
                            ->update(['location' => \Illuminate\Support\Facades\DB::raw("ST_PointFromText('POINT($lng $lat)', 4326)")]);
                    }
                }
            } elseif ($user->role === 'technician') {
                if ($request->has('specialty'))
                    $profile->specialty = $request->specialty;
                if ($request->has('city'))
                    $profile->city = $request->city;
                if ($request->has('workshopAddress'))
                    $profile->workshop_address = $request->workshopAddress;
                if ($request->has('description'))
                    $profile->description = $request->description;

                if ($request->has('profilePhoto')) {
                    $profile->profile_photo = $this->saveBase64File($request->profilePhoto, 'technicians/profile_photos');
                }

                if ($request->has('gallery') && is_array($request->gallery)) {
                    $processedGallery = [];
                    foreach ($request->gallery as $item) {
                        if (isset($item['data']) && isset($item['type'])) {
                            $item['data'] = $this->saveBase64File($item['data'], 'technicians/gallery');
                            $processedGallery[] = $item;
                        } else {
                            $processedGallery[] = $item;
                        }
                    }
                    $profile->gallery = $processedGallery;
                }

                if ($request->has('socials'))
                    $profile->socials = $request->socials;

                if ($request->has('location') && is_array($request->location)) {
                    $lat = $request->location['latitude'] ?? null;
                    $lng = $request->location['longitude'] ?? null;
                    if ($lat !== null && $lng !== null) {
                        \Illuminate\Support\Facades\DB::table('technicians')
                            ->where('id', $profile->id)
                            ->update(['location' => \Illuminate\Support\Facades\DB::raw("ST_PointFromText('POINT($lng $lat)', 4326)")]);
                    }
                }
            }

            $profile->save();
        }

        return response()->json([
            'message' => __('auth.profile_updated'),
            'user' => $profile ?? $user
        ]);
    }


}
