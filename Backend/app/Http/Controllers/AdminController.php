<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Provider;
use App\Models\SystemSetting;
use App\Models\BlogPost;
use App\Models\FaqItem;
use App\Models\Announcement;
use App\Models\Product;
use App\Models\StoreCategory;
use App\Models\StoreOrder;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find user by phone number
        $user = User::where('phone', $request->phone)->first();

        // Check if user exists, password is correct, and user is admin
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_admin) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        // Create Sanctum token
        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user_type' => 'admin',
            'role' => 'admin',
            'is_admin' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'is_admin' => $user->is_admin,
            ],
            'token' => $token,
        ]);
    }

    public function stats()
    {
        $last7Days = \Carbon\Carbon::today()->subDays(6);

        // 1. Basic Counts
        $ordersCount = \App\Models\Order::count();
        $providersCount = \App\Models\Provider::where('is_active', true)->count();
        $carProvidersCount = \App\Models\CarProvider::where('is_active', true)->count();
        $customersCount = \App\Models\Customer::count();
        $pendingWithdrawals = \App\Models\Withdrawal::where('status', 'Pending')->count();

        // 2. Revenue Calculation (Total price of completed orders)
        $completedStatus = ['delivered', 'completed', 'shipped', 'تم التوصيل', 'تم الشحن للعميل'];
        // $revenue = \App\Models\Order::whereIn('status', $completedStatus)->sum('total_price'); // Column missing
        $revenue = 0;

        // 3. Weekly Activity for Chart (PostgreSQL compatible)
        // Use DATE() function which works in both MySQL and PostgreSQL
        $weeklyActivity = \App\Models\Order::selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->where('created_at', '>=', $last7Days)
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get();

        // Calculate revenue per day separately for cleaner code
        // $revenueByDay = \App\Models\Order::selectRaw("DATE(created_at) as date, SUM(total_price) as revenue")
        //     ->where('created_at', '>=', $last7Days)
        //     ->whereIn('status', $completedStatus)
        //     ->groupByRaw('DATE(created_at)')
        //     ->pluck('revenue', 'date');
        $revenueByDay = [];

        // Fill in missing days
        $chartData = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $last7Days->copy()->addDays($i)->format('Y-m-d');
            $dayData = $weeklyActivity->firstWhere('date', $date);
            $chartData[] = [
                'date' => $date,
                'orders' => $dayData ? $dayData->count : 0,
                'revenue' => $revenueByDay[$date] ?? 0,
                'name' => \Carbon\Carbon::parse($date)->locale('ar')->format('D'),
            ];
        }

        // 4. Order Status Distribution
        $statusDistribution = \App\Models\Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->status, // Mapper should be handled in frontend for labels
                    'value' => $item->count
                ];
            });

        return response()->json([
            'total_orders' => $ordersCount,
            'active_providers' => $providersCount + $carProvidersCount,
            'total_customers' => $customersCount,
            'pending_withdrawals' => $pendingWithdrawals,
            'total_revenue' => $revenue,
            'weekly_activity' => $chartData,
            'status_distribution' => $statusDistribution,
            'low_stock_count' => \App\Models\Product::where('total_stock', '<', 5)->count()
        ]);
    }

    public function listWithdrawals()
    {
        // Mock implementation
        return response()->json(['data' => []]);
    }

    public function updateWithdrawal(Request $request, $id)
    {
        return response()->json(['message' => 'Withdrawal updated']);
    }

    /**
     * Get sponsor settings
     */
    public function getSponsorSettings()
    {
        $settings = \App\Models\SystemSetting::getSetting('sponsorSettings');

        if (!$settings) {
            $settings = [
                'dailyPrice' => 10,
                'weeklyPrice' => 60,
                'monthlyPrice' => 200,
                'maxDuration' => 90,
                'minDuration' => 1,
                'enabled' => true,
            ];
        }

        return response()->json(['settings' => $settings]);
    }

    /**
     * Update sponsor settings
     */
    public function updateSponsorSettings(Request $request)
    {
        $validated = $request->validate([
            'dailyPrice' => 'required|numeric|min:0',
            'weeklyPrice' => 'required|numeric|min:0',
            'monthlyPrice' => 'required|numeric|min:0',
            'maxDuration' => 'required|integer|min:1|max:365',
            'minDuration' => 'required|integer|min:1',
            'enabled' => 'required|boolean',
        ]);

        \App\Models\SystemSetting::updateOrCreate(
            ['key' => 'sponsorSettings'],
            ['value' => json_encode($validated)]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث إعدادات الرعاية بنجاح'
        ]);
    }

    /**
     * Admin sponsor listing (FREE)
     */
    public function adminSponsorListing(Request $request, $id)
    {
        $validated = $request->validate([
            'duration_days' => 'required|integer|min:1|max:365'
        ]);

        $listing = \App\Models\CarListing::findOrFail($id);

        DB::transaction(function () use ($listing, $validated, $request) {
            $sponsoredUntil = now()->addDays($validated['duration_days']);

            // Cancel any existing active sponsorship
            $listing->sponsorshipHistories()
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            $listing->update([
                'is_sponsored' => true,
                'sponsored_until' => $sponsoredUntil,
            ]);

            \App\Models\CarListingSponsorshipHistory::create([
                'car_listing_id' => $listing->id,
                'sponsored_by_user_id' => $request->user()->id,
                'sponsored_from' => now(),
                'sponsored_until' => $sponsoredUntil,
                'price' => 0, // Free for admin
                'duration_days' => $validated['duration_days'],
                'status' => 'active',
                'is_admin_sponsored' => true,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم تفعيل الرعاية بنجاح'
        ]);
    }

    /**
     * Get all sponsorships (history)
     */
    public function getAllSponsorships(Request $request)
    {
        $sponsorships = \App\Models\CarListingSponsorshipHistory::with([
            'listing:id,title,price',
            'sponsoredBy:id,name'
        ])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($sponsorships);
    }

    /**
     * Get sponsorship revenue analytics
     */
    public function getSponsorshipRevenue(Request $request)
    {
        // Total revenue (exclude admin-sponsored)
        $totalRevenue = \App\Models\CarListingSponsorshipHistory::where('is_admin_sponsored', false)
            ->sum('price');

        // Monthly revenue
        $monthlyRevenue = \App\Models\CarListingSponsorshipHistory::where('is_admin_sponsored', false)
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('price');

        // Active sponsorships count
        $activeSponsorships = \App\Models\CarListingSponsorshipHistory::where('status', 'active')->count();

        // This week revenue
        $weeklyRevenue = \App\Models\CarListingSponsorshipHistory::where('is_admin_sponsored', false)
            ->where('created_at', '>=', now()->startOfWeek())
            ->sum('price');

        return response()->json([
            'totalRevenue' => (float) $totalRevenue,
            'monthlyRevenue' => (float) $monthlyRevenue,
            'weeklyRevenue' => (float) $weeklyRevenue,
            'activeSponsorships' => $activeSponsorships,
        ]);
    }

    public function getSettings()
    {
        $settings = \App\Models\SystemSettings::getAllFlat();
        return response()->json(['data' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        // Handle nested settings structure from frontend
        $data = $request->all();

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                // Determine group based on key
                $group = match ($key) {
                    'verificationApis', 'notificationApis' => 'whatsapp',
                    'messageTemplates' => 'templates',
                    'limitSettings' => 'limits',
                    default => 'general'
                };

                \App\Models\SystemSettings::setSetting($key, $value);
            } else {
                \App\Models\SystemSettings::setSetting($key, $value);
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => \App\Models\SystemSettings::getAllFlat()
        ]);
    }

    public function createBlogPost(Request $request)
    {
        $data = $request->all();

        // Handle base64 image upload
        if (isset($data['imageUrl']) && !empty($data['imageUrl'])) {
            $imageData = $data['imageUrl'];

            // Check if it's a base64 string
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                // Extract base64 data
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif

                // Decode base64
                $imageData = base64_decode($imageData);

                if ($imageData === false) {
                    return response()->json(['error' => 'Base64 decode failed'], 400);
                }

                // Generate unique filename
                $filename = 'blog/' . Str::uuid() . '.' . $type;

                // Save to storage/app/public
                Storage::disk('public')->put($filename, $imageData, 'public');

                // Update data with storage URL
                $data['imageUrl'] = '/storage/' . $filename;
            }
        }

        $post = BlogPost::create(array_merge($data, [
            'id' => Str::uuid(),
            'published_at' => now()
        ]));
        return response()->json(['success' => true, 'data' => $post]);
    }

    public function updateBlogPost(Request $request, $id)
    {
        $post = BlogPost::findOrFail($id);
        $data = $request->all();

        // Handle base64 image upload
        if (isset($data['imageUrl']) && !empty($data['imageUrl'])) {
            $imageData = $data['imageUrl'];

            // Check if it's a base64 string (new upload)
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                // Delete old image if exists
                if ($post->imageUrl && str_starts_with($post->imageUrl, '/storage/')) {
                    $filePath = str_replace('/storage/', '', $post->imageUrl);
                    Storage::disk('public')->delete($filePath);
                }

                // Extract base64 data
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif

                // Decode base64
                $imageData = base64_decode($imageData);

                if ($imageData === false) {
                    return response()->json(['error' => 'Base64 decode failed'], 400);
                }

                // Generate unique filename
                $filename = 'blog/' . Str::uuid() . '.' . $type;

                // Save to storage/app/public
                Storage::disk('public')->put($filename, $imageData, 'public');

                // Update data with storage URL
                $data['imageUrl'] = '/storage/' . $filename;
            }
        }

        $post->update($data);
        return response()->json(['success' => true, 'data' => $post]);
    }

    public function deleteBlogPost($id)
    {
        $post = BlogPost::findOrFail($id);

        // Delete associated image file if it exists
        if ($post->imageUrl && str_starts_with($post->imageUrl, '/storage/')) {
            $filePath = str_replace('/storage/', '', $post->imageUrl);
            Storage::disk('public')->delete($filePath);
        }

        $post->delete();
        return response()->json(['success' => true, 'message' => 'Blog post deleted successfully']);
    }

    public function createFaq(Request $request)
    {
        $faq = FaqItem::create(array_merge($request->all(), ['id' => Str::uuid()]));
        return response()->json(['success' => true, 'data' => $faq]);
    }

    public function updateFaq(Request $request, $id)
    {
        $faq = FaqItem::findOrFail($id);
        $faq->update($request->only(['question', 'answer']));
        return response()->json(['success' => true, 'data' => $faq]);
    }

    public function deleteFaq($id)
    {
        $faq = FaqItem::findOrFail($id);
        $faq->delete();
        return response()->json(['success' => true, 'message' => 'FAQ deleted successfully']);
    }

    public function createAnnouncement(Request $request)
    {
        $data = $request->all();

        // Handle base64 image upload
        if (isset($data['image_url']) && !empty($data['image_url'])) {
            $imageData = $data['image_url'];

            // Check if it's a base64 string
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                // Extract base64 data
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif

                // Decode base64
                $imageData = base64_decode($imageData);

                if ($imageData === false) {
                    return response()->json(['error' => 'Base64 decode failed'], 400);
                }

                // Generate unique filename
                $filename = 'announcements/' . Str::uuid() . '.' . $type;

                // Save to storage/app/public
                \Storage::disk('public')->put($filename, $imageData, 'public');

                // Update data with storage URL
                $data['image_url'] = '/storage/' . $filename;
            }
        }

        $announcement = Announcement::create(array_merge($data, [
            'id' => Str::uuid(),
            'timestamp' => now()
        ]));

        // Send notifications to targeted users
        try {
            $target = $announcement->target; // 'all', 'customer', 'provider', 'technician', 'tow_truck'

            // Determine notification type based on target
            $notificationTypes = [
                'customer' => 'NEW_ANNOUNCEMENT_CUSTOMER',
                'provider' => 'NEW_ANNOUNCEMENT_PROVIDER',
                'technician' => 'NEW_ANNOUNCEMENT_TECHNICIAN',
                'tow_truck' => 'NEW_ANNOUNCEMENT_TOW_TRUCK',
                'car_provider' => 'NEW_ANNOUNCEMENT_CAR_PROVIDER',
            ];

            $usersToNotify = [];

            if ($target === 'all') {
                // Notify all users
                $usersToNotify = \App\Models\User::all();
            } elseif (in_array($target, ['customer', 'provider', 'technician', 'tow_truck', 'car_provider'])) {
                // Notify specific user role
                $usersToNotify = \App\Models\User::where('role', $target)->get();
            }

            foreach ($usersToNotify as $user) {
                // Determine the notification type for this user
                $notifType = $notificationTypes[$user->role] ?? 'NEW_ANNOUNCEMENT_CUSTOMER';

                \App\Models\Notification::create([
                    'user_id' => $user->id,
                    'title' => $announcement->title,
                    'message' => $announcement->message,
                    'type' => $notifType,
                    'context' => ['announcement_id' => $announcement->id],
                    'read' => false,
                ]);

                event(new \App\Events\UserNotification($user->id, [
                    'title' => $announcement->title,
                    'message' => $announcement->message,
                    'type' => $notifType,
                    'link' => ['view' => 'announcements'],
                ]));
            }

            \Log::info("Sent announcement notifications to " . count($usersToNotify) . " users");
        } catch (\Exception $e) {
            \Log::error('Failed to send announcement notifications: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'data' => $announcement]);
    }

    public function deleteAnnouncement($id)
    {
        $announcement = Announcement::findOrFail($id);

        // Delete associated image file if it exists
        if ($announcement->image_url && str_starts_with($announcement->image_url, '/storage/')) {
            $filePath = str_replace('/storage/', '', $announcement->image_url);
            Storage::disk('public')->delete($filePath);
        }

        $announcement->delete();
        return response()->json(['success' => true, 'message' => 'Announcement deleted successfully']);
    }

    public function createProduct(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'totalStock' => 'required|integer|min:0',
                'purchaseLimitPerBuyer' => 'required|integer|min:1',
            ]);

            // Process media - convert base64 to storage URLs
            $processedMedia = [];
            if ($request->has('media') && is_array($request->media)) {
                foreach ($request->media as $mediaItem) {
                    if (isset($mediaItem['data']) && isset($mediaItem['type'])) {
                        $data = $mediaItem['data'];

                        // Check if it's base64 encoded
                        if (preg_match('/^data:(image|video)\/(\w+);base64,/', $data, $type)) {
                            // Extract base64 data
                            $data = substr($data, strpos($data, ',') + 1);
                            $fileType = strtolower($type[2]); // jpg, png, gif, mp4, etc.
                            $mediaType = $type[1]; // image or video

                            // Decode base64
                            $decodedData = base64_decode($data);

                            if ($decodedData !== false) {
                                // Generate unique filename
                                $filename = 'products/' . Str::uuid() . '.' . $fileType;

                                // Save to storage/app/public
                                Storage::disk('public')->put($filename, $decodedData, 'public');

                                // Add to processed media with storage URL
                                $processedMedia[] = [
                                    'type' => $mediaType,
                                    'data' => '/storage/' . $filename
                                ];
                            }
                        } else {
                            // Already a URL, keep as is
                            $processedMedia[] = $mediaItem;
                        }
                    }
                }
            }

            // Transform camelCase to snake_case
            $productData = [
                'id' => Str::uuid(),
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'media' => $processedMedia,
                'target_audience' => $request->targetAudience ?? 'all',
                'specialty' => $request->specialty ?? null,
                'total_stock' => $request->totalStock,
                'purchase_limit_per_buyer' => $request->purchaseLimitPerBuyer,
                'is_flash' => $request->isFlash ?? false,
                'expires_at' => $request->expiresAt ?? null,
                'store_category_id' => $request->storeCategoryId ?? null,
                'store_subcategory_id' => $request->storeSubcategoryId ?? null,
                'shipping_size' => $request->shippingSize ?? 'm',
                'static_shipping_cost' => $request->staticShippingCost ?? null,
                'allowed_payment_methods' => $request->allowedPaymentMethods ?? [],
            ];

            $product = Product::create($productData);
            return response()->json(['data' => $product]);
        } catch (\Exception $e) {
            \Log::error('Failed to create product: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Failed to create product: ' . $e->getMessage()], 500);
        }
    }

    public function listProducts()
    {
        try {
            $products = Product::with(['category', 'reviews'])->get();

            // Transform media paths for each product
            $transformedProducts = $products->map(function ($product) {
                $productArray = $product->toArray();

                // Transform media paths to accessible URLs
                if (isset($productArray['media']) && is_array($productArray['media'])) {
                    $productArray['media'] = array_map(function ($item) {
                        if (isset($item['data']) && is_string($item['data'])) {
                            // If it's already a full URL (http/https) or base64, keep it
                            if (preg_match('/^(https?:\/\/|data:)/', $item['data'])) {
                                return $item;
                            }

                            // If it starts with /storage/, it's correct
                            if (str_starts_with($item['data'], '/storage/')) {
                                return $item;
                            }

                            // If it doesn't have /storage/, add it
                            if (!str_starts_with($item['data'], '/')) {
                                $item['data'] = '/storage/' . $item['data'];
                            } else {
                                $item['data'] = '/storage' . $item['data'];
                            }
                        }
                        return $item;
                    }, $productArray['media']);
                }

                return $productArray;
            });

            return response()->json(['data' => $transformedProducts]);
        } catch (\Exception $e) {
            \Log::error('Failed to list products: ' . $e->getMessage());
            return response()->json([
                'message' => 'فشل تحميل المنتجات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Process media - convert base64 to storage URLs
        $processedMedia = null;
        if ($request->has('media') && is_array($request->media)) {
            $processedMedia = [];
            $oldMedia = $product->media ?? [];

            foreach ($request->media as $mediaItem) {
                if (isset($mediaItem['data']) && isset($mediaItem['type'])) {
                    $data = $mediaItem['data'];

                    // Check if it's base64 encoded
                    if (preg_match('/^data:(image|video)\/(\w+);base64,/', $data, $type)) {
                        // Extract base64 data
                        $data = substr($data, strpos($data, ',') + 1);
                        $fileType = strtolower($type[2]);
                        $mediaType = $type[1];

                        // Decode base64
                        $decodedData = base64_decode($data);

                        if ($decodedData !== false) {
                            // Generate unique filename
                            $filename = 'products/' . Str::uuid() . '.' . $fileType;

                            // Save to storage
                            Storage::disk('public')->put($filename, $decodedData, 'public');

                            // Add to processed media
                            $processedMedia[] = [
                                'type' => $mediaType,
                                'data' => '/storage/' . $filename
                            ];
                        }
                    } else {
                        // Already a URL, keep as is
                        $processedMedia[] = $mediaItem;
                    }
                }
            }

            // Delete old media files that are no longer in use
            foreach ($oldMedia as $oldItem) {
                if (isset($oldItem['data']) && str_starts_with($oldItem['data'], '/storage/')) {
                    $stillInUse = false;
                    foreach ($processedMedia as $newItem) {
                        if ($newItem['data'] === $oldItem['data']) {
                            $stillInUse = true;
                            break;
                        }
                    }
                    if (!$stillInUse) {
                        $filePath = str_replace('/storage/', '', $oldItem['data']);
                        Storage::disk('public')->delete($filePath);
                    }
                }
            }
        }

        // Transform camelCase to snake_case
        $productData = [];

        if ($request->has('name'))
            $productData['name'] = $request->name;
        if ($request->has('description'))
            $productData['description'] = $request->description;
        if ($request->has('price'))
            $productData['price'] = $request->price;
        if ($processedMedia !== null)
            $productData['media'] = $processedMedia;
        if ($request->has('targetAudience'))
            $productData['target_audience'] = $request->targetAudience;
        if ($request->has('specialty'))
            $productData['specialty'] = $request->specialty;
        if ($request->has('totalStock'))
            $productData['total_stock'] = $request->totalStock;
        if ($request->has('purchaseLimitPerBuyer'))
            $productData['purchase_limit_per_buyer'] = $request->purchaseLimitPerBuyer;
        if ($request->has('isFlash'))
            $productData['is_flash'] = $request->isFlash;
        if ($request->has('expiresAt'))
            $productData['expires_at'] = $request->expiresAt;
        if ($request->has('storeCategoryId'))
            $productData['store_category_id'] = $request->storeCategoryId;
        if ($request->has('storeSubcategoryId'))
            $productData['store_subcategory_id'] = $request->storeSubcategoryId;
        if ($request->has('shippingSize'))
            $productData['shipping_size'] = $request->shippingSize;
        if ($request->has('staticShippingCost'))
            $productData['static_shipping_cost'] = $request->staticShippingCost;
        if ($request->has('allowedPaymentMethods'))
            $productData['allowed_payment_methods'] = $request->allowedPaymentMethods;

        $product->update($productData);
        return response()->json(['data' => $product]);
    }

    public function deleteProduct($id)
    {
        $product = Product::findOrFail($id);

        // Delete associated media files
        if ($product->media && is_array($product->media)) {
            foreach ($product->media as $mediaItem) {
                if (isset($mediaItem['data']) && str_starts_with($mediaItem['data'], '/storage/')) {
                    $filePath = str_replace('/storage/', '', $mediaItem['data']);
                    Storage::disk('public')->delete($filePath);
                }
            }
        }

        $product->delete();
        return response()->json(['success' => true, 'message' => 'Product deleted successfully']);
    }

    public function createStoreCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'required|string|max:50',
        ]);

        $category = StoreCategory::create([
            'id' => $request->id ?? \Illuminate\Support\Str::uuid(),
            'name' => $request->name,
            'icon' => $request->icon,
            'subcategories' => $request->subcategories ?? [],
            'is_featured' => $request->isFeatured ?? false,
        ]);

        return response()->json(['success' => true, 'data' => $category]);
    }

    public function updateStoreCategory(Request $request, $id)
    {
        $category = StoreCategory::findOrFail($id);

        $data = [];
        if ($request->has('name'))
            $data['name'] = $request->name;
        if ($request->has('icon'))
            $data['icon'] = $request->icon;
        if ($request->has('subcategories'))
            $data['subcategories'] = $request->subcategories;
        if ($request->has('isFeatured'))
            $data['is_featured'] = $request->isFeatured;

        $category->update($data);

        return response()->json(['success' => true, 'data' => $category]);
    }

    public function deleteStoreCategory($id)
    {
        $category = StoreCategory::findOrFail($id);
        $category->delete();

        return response()->json(['success' => true, 'message' => 'Category deleted successfully']);
    }

    public function listStoreCategories()
    {
        $categories = StoreCategory::all();
        return response()->json(['data' => $categories]);
    }

    public function listAllStoreOrders(Request $request)
    {
        $query = StoreOrder::with('product');

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('buyer_name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('request_date', 'desc')->get();

        return response()->json(['data' => $orders]);
    }

    public function updateStoreOrder(Request $request, $id)
    {
        $order = StoreOrder::findOrFail($id);

        $oldStatus = $order->status;
        $order->update($request->only(['status', 'admin_notes']));

        // If status changed, send notification to buyer
        if ($request->has('status') && $oldStatus !== $request->status) {
            $product = Product::find($order->product_id);

            $statusLabel = match ($request->status) {
                'pending' => 'قيد الانتظار',
                'payment_verification' => 'التحقق من الدفع',
                'preparing' => 'جاري التجهيز',
                'shipped' => 'تم الشحن',
                'delivered' => 'تم التوصيل',
                'rejected' => 'مرفوض',
                'cancelled' => 'ملغي',
                'approved' => 'مقبول',
                default => $request->status
            };

            $isRejection = $request->status === 'rejected';
            $message = $isRejection
                ? "عذراً، تم رفض طلبك للمنتج {$product->name}. السبب: " . ($request->admin_notes ?? 'غير محدد')
                : "تم تحديث حالة طلبك للمنتج {$product->name} إلى: {$statusLabel}";

            // Verify user exists before sending notification
            $buyerUser = \App\Models\User::where('phone', $order->buyer_id)->first();

            if ($buyerUser) {
                // Check if this is a flash product to use appropriate notification type
                $isFlashProduct = $product && $product->is_flash;
                $isApproval = $request->status === 'approved';

                // Determine title and type based on flash product status
                if ($isFlashProduct) {
                    if ($isApproval) {
                        $title = 'تم قبول طلب المنتج الفوري';
                        $notifType = 'FLASH_PRODUCT_REQUEST_APPROVED';
                    } elseif ($isRejection) {
                        $title = 'تم رفض طلب المنتج الفوري';
                        $notifType = 'FLASH_PRODUCT_REQUEST_REJECTED';
                    } else {
                        $title = $isRejection ? 'رفض طلب المتجر' : 'تحديث حالة الطلب';
                        $notifType = $isRejection ? 'STORE_ORDER_REJECTED' : 'STORE_ORDER_UPDATE';
                    }
                } else {
                    $title = $isRejection ? 'رفض طلب المتجر' : 'تحديث حالة الطلب';
                    $notifType = $isRejection ? 'STORE_ORDER_REJECTED' : 'STORE_ORDER_UPDATE';
                }

                // Create notification in database
                \App\Models\Notification::create([
                    'user_id' => $buyerUser->id,
                    'title' => $title,
                    'message' => $message,
                    'type' => $notifType,
                    'link' => json_encode(['view' => 'store', 'params' => []]),
                    'read' => false,
                ]);

                // Broadcast real-time notification
                event(new \App\Events\UserNotification($buyerUser->id, [
                    'title' => $title,
                    'message' => $message,
                    'type' => $notifType,
                    'link' => json_encode(['view' => 'store', 'params' => []]),
                ]));
            }
        }

        return response()->json(['data' => $order]);
    }

    public function getStoreStats()
    {
        $totalRevenue = StoreOrder::whereIn('status', ['delivered', 'approved'])->sum('total_price');
        $pendingCount = StoreOrder::whereIn('status', ['pending', 'payment_verification'])->count();
        $processingCount = StoreOrder::whereIn('status', ['preparing', 'shipped'])->count();
        $completedCount = StoreOrder::where('status', 'delivered')->count();

        return response()->json([
            'data' => [
                'totalRevenue' => $totalRevenue,
                'pendingCount' => $pendingCount,
                'processingCount' => $processingCount,
                'completedCount' => $completedCount,
            ]
        ]);
    }

    public function updateProviderStatus(Request $request, $id)
    {
        $provider = Provider::findOrFail($id);
        $provider->update(['is_active' => $request->is_active]);
        return response()->json(['message' => 'Provider status updated']);
    }

    // Provider Management
    public function listProviders()
    {
        try {
            \Log::info('listProviders called');
            $providers = Provider::all()->map(function ($provider) {
                return [
                    'id' => $provider->id,
                    'uniqueId' => $provider->unique_id,
                    'name' => $provider->name,
                    'assignedCategories' => $provider->assigned_categories ?? [],
                    'isActive' => $provider->is_active,
                    'walletBalance' => $provider->wallet_balance,
                    'lastLoginTimestamp' => $provider->last_login_at ? $provider->last_login_at->toIso8601String() : null,
                    'paymentInfo' => $provider->payment_info ?? [],
                    'notificationSettings' => $provider->notification_settings ?? [],
                ];
            });
            \Log::info('listProviders success, count: ' . $providers->count());
            return response()->json(['data' => $providers]);
        } catch (\Exception $e) {
            \Log::error('listProviders error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function createProvider(Request $request)
    {
        $request->validate([
            'id' => 'required|string|unique:users,phone', // Phone is ID
            'name' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        // Generate unique 6-digit ID
        do {
            $uniqueId = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $exists = Provider::where('unique_id', $uniqueId)->first();
        } while ($exists);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Create User
            $user = User::create([
                'name' => $request->name,
                'phone' => $request->id,
                'password' => Hash::make($request->password),
                'role' => 'provider',
                'is_admin' => false,
            ]);

            // Create Provider Profile
            $provider = Provider::create([
                'id' => $request->id,
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'assigned_categories' => $request->assignedCategories ?? [],
                'is_active' => true,
                'wallet_balance' => 0,
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $provider->id,
                    'uniqueId' => $provider->unique_id,
                    'name' => $provider->name,
                    'assignedCategories' => $provider->assigned_categories,
                    'isActive' => $provider->is_active,
                    'walletBalance' => $provider->wallet_balance,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to create provider: ' . $e->getMessage()], 500);
        }
    }

    public function updateProvider(Request $request, $id)
    {
        $provider = Provider::where('id', $id)->first();

        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $user = User::find($provider->user_id);
        if (!$user) {
            $user = User::where('phone', $provider->id)->first();
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $data = [];
            $userData = [];

            if ($request->has('name')) {
                $data['name'] = $request->name;
                $userData['name'] = $request->name;
            }
            if ($request->has('assignedCategories')) {
                $data['assigned_categories'] = $request->assignedCategories;
            }
            if ($request->has('isActive')) {
                $data['is_active'] = $request->isActive;
            }

            if ($request->has('password') && !empty($request->password)) {
                $hashedPassword = Hash::make($request->password);
                $data['password'] = $hashedPassword;
                $userData['password'] = $hashedPassword;
            }

            $provider->update($data);
            if ($user && !empty($userData)) {
                $user->update($userData);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $provider->id,
                    'uniqueId' => $provider->unique_id,
                    'name' => $provider->name,
                    'assignedCategories' => $provider->assigned_categories,
                    'isActive' => $provider->is_active,
                    'walletBalance' => $provider->wallet_balance,
                    'lastLoginTimestamp' => $provider->last_login_at ? $provider->last_login_at->toISOString() : null,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to update provider: ' . $e->getMessage()], 500);
        }
    }

    public function deleteProvider($id)
    {
        $provider = Provider::where('id', $id)->first();

        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $user = User::find($provider->user_id);
            if (!$user) {
                $user = User::where('phone', $provider->id)->first();
            }

            $provider->delete();
            if ($user) {
                $user->delete();
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Provider deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to delete provider'], 500);
        }
    }

    public function verifyTechnician(Request $request, $id)
    {
        $tech = Technician::findOrFail($id);
        $tech->update(['is_verified' => true]);

        // Send notification
        try {
            \App\Models\Notification::create([
                'user_id' => $tech->user_id,
                'title' => 'تم توثيق حسابك!',
                'message' => 'تم توثيق حسابك كفني بنجاح. يمكنك الآن استقبال الطلبات.',
                'type' => 'TECHNICIAN_VERIFIED',
                'read' => false,
            ]);

            event(new \App\Events\UserNotification($tech->user_id, [
                'title' => 'تم توثيق حسابك!',
                'message' => 'تم توثيق حسابك كفني بنجاح. يمكنك الآن استقبال الطلبات.',
                'type' => 'TECHNICIAN_VERIFIED',
            ]));
        } catch (\Exception $e) {
            \Log::warning('Failed to send verification notification: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Technician verified']);
    }

    // Technician Management
    public function listTechnicians()
    {
        $technicians = Technician::select('id', 'unique_id', 'name', 'specialty', 'city', 'workshop_address', 'description', 'is_verified', 'is_active', 'profile_photo', 'qr_code_url', 'created_at', 'average_rating')
            ->get()
            ->map(function ($tech) {
                return [
                    'id' => $tech->id,
                    'uniqueId' => $tech->unique_id,
                    'name' => $tech->name,
                    'specialty' => $tech->specialty,
                    'city' => $tech->city,
                    'workshopAddress' => $tech->workshop_address,
                    'description' => $tech->description,
                    'isVerified' => $tech->is_verified,
                    'isActive' => $tech->is_active,
                    'profilePhoto' => $tech->profile_photo,
                    'qrCodeUrl' => $tech->qr_code_url,
                    'registrationDate' => $tech->created_at->toISOString(),
                    'averageRating' => $tech->average_rating,
                ];
            });

        return response()->json(['data' => $technicians]);
    }

    public function createTechnician(Request $request)
    {
        $request->validate([
            'id' => 'required|string|unique:users,phone', // Check users table for uniqueness
            'name' => 'required|string',
            'password' => 'required|string|min:6',
            'specialty' => 'required|string',
            'city' => 'required|string',
        ]);

        // Generate unique 6-digit ID
        do {
            $uniqueId = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $exists = Technician::where('unique_id', $uniqueId)->first();
        } while ($exists);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Create User
            $user = User::create([
                'name' => $request->name,
                'phone' => $request->id,
                'password' => Hash::make($request->password),
                'role' => 'technician',
                'is_admin' => false,
            ]);

            // Create Technician Profile
            $technician = Technician::create([
                'id' => $request->id,
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'specialty' => $request->specialty,
                'city' => $request->city,
                'workshop_address' => $request->workshopAddress ?? '',
                'description' => $request->description ?? '',
                'is_verified' => true,
                'is_active' => true,
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $technician->id,
                    'uniqueId' => $technician->unique_id,
                    'name' => $technician->name,
                    'specialty' => $technician->specialty,
                    'city' => $technician->city,
                    'workshopAddress' => $technician->workshop_address,
                    'description' => $technician->description,
                    'isVerified' => $technician->is_verified,
                    'isActive' => $technician->is_active,
                    'registrationDate' => $technician->created_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to create technician: ' . $e->getMessage()], 500);
        }
    }

    public function updateTechnician(Request $request, $id)
    {
        $technician = Technician::where('id', $id)->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician not found'], 404);
        }

        $user = User::find($technician->user_id);
        if (!$user) {
            // Fallback if user_id is missing or user deleted (shouldn't happen with proper constraints)
            $user = User::where('phone', $technician->id)->first();
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $data = [];
            $userData = [];

            if ($request->has('name')) {
                $data['name'] = $request->name;
                $userData['name'] = $request->name;
            }
            if ($request->has('specialty'))
                $data['specialty'] = $request->specialty;
            if ($request->has('city'))
                $data['city'] = $request->city;
            if ($request->has('workshopAddress'))
                $data['workshop_address'] = $request->workshopAddress;
            if ($request->has('description'))
                $data['description'] = $request->description;
            if ($request->has('isActive'))
                $data['is_active'] = $request->isActive;
            if ($request->has('isVerified')) {
                $wasVerified = $technician->is_verified;
                $data['is_verified'] = $request->isVerified;

                // Send notification if being verified
                if (!$wasVerified && $request->isVerified) {
                    // Create notification
                    \App\Models\Notification::create([
                        'user_id' => $technician->user_id,
                        'title' => 'تم توثيق حسابك!',
                        'message' => 'تم توثيق حسابك كفني بنجاح. يمكنك الآن استقبال الطلبات.',
                        'type' => 'TECHNICIAN_VERIFIED',
                        'read' => false,
                    ]);

                    // Broadcast real-time notification
                    event(new \App\Events\UserNotification($technician->user_id, [
                        'title' => 'تم توثيق حسابك!',
                        'message' => 'تم توثيق حسابك كفني بنجاح. يمكنك الآن استقبال الطلبات.',
                        'type' => 'TECHNICIAN_VERIFIED',
                    ]));
                }
            }

            if ($request->has('password') && !empty($request->password)) {
                $hashedPassword = Hash::make($request->password);
                $data['password'] = $hashedPassword;
                $userData['password'] = $hashedPassword;
            }

            $technician->update($data);
            if ($user && !empty($userData)) {
                $user->update($userData);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $technician->id,
                    'uniqueId' => $technician->unique_id,
                    'name' => $technician->name,
                    'specialty' => $technician->specialty,
                    'city' => $technician->city,
                    'workshopAddress' => $technician->workshop_address,
                    'description' => $technician->description,
                    'isVerified' => $technician->is_verified,
                    'isActive' => $technician->is_active,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to update technician: ' . $e->getMessage()], 500);
        }
    }

    public function deleteTechnician($id)
    {
        $technician = Technician::where('id', $id)->first();

        if (!$technician) {
            return response()->json(['error' => 'Technician not found'], 404);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $user = User::find($technician->user_id);
            if (!$user) {
                $user = User::where('phone', $technician->id)->first();
            }

            $technician->delete();
            if ($user) {
                $user->delete();
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Technician deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to delete technician'], 500);
        }
    }

    public function listUsers()
    {
        $customers = Customer::select('id', 'unique_id', 'name', 'address', 'is_active', 'created_at')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id, // Phone number is the ID
                    'uniqueId' => $customer->unique_id,
                    'phone' => $customer->id,
                    'name' => $customer->name,
                    'address' => $customer->address,
                    'isActive' => $customer->is_active,
                ];
            });

        return response()->json(['data' => $customers]);
    }

    public function updateUser(Request $request, $id)
    {
        // Find customer by phone (id in frontend)
        $customer = Customer::where('id', $id)->first();

        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $data = $request->only(['name', 'address']);

        // Handle isActive toggle (frontend sends isActive, backend uses is_active)
        if ($request->has('isActive')) {
            $data['is_active'] = $request->isActive;
        }

        $customer->update($data);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'uniqueId' => $customer->unique_id,
                'phone' => $customer->id,
                'name' => $customer->name,
                'address' => $customer->address,
                'isActive' => $customer->is_active,
            ]
        ]);
    }

    public function resetUserPassword(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        // Find customer by phone
        $customer = Customer::where('id', $id)->first();

        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $customer->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
    }

    public function deleteUser($id)
    {
        // Find customer by phone
        $customer = Customer::where('id', $id)->first();

        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully'
        ]);
    }

    // Tow Truck Management
    public function listTowTrucks()
    {
        $towTrucks = TowTruck::select('id', 'unique_id', 'name', 'vehicle_type', 'city', 'service_area', 'description', 'is_verified', 'is_active', 'profile_photo', 'qr_code_url', 'created_at', 'average_rating')
            ->get()
            ->map(function ($truck) {
                return [
                    'id' => $truck->id,
                    'uniqueId' => $truck->unique_id,
                    'name' => $truck->name,
                    'vehicleType' => $truck->vehicle_type,
                    'city' => $truck->city,
                    'serviceArea' => $truck->service_area,
                    'description' => $truck->description,
                    'isVerified' => $truck->is_verified,
                    'isActive' => $truck->is_active,
                    'profilePhoto' => $truck->profile_photo,
                    'qrCodeUrl' => $truck->qr_code_url,
                    'registrationDate' => $truck->created_at->toISOString(),
                    'averageRating' => $truck->average_rating,
                ];
            });

        return response()->json(['data' => $towTrucks]);
    }

    public function createTowTruck(Request $request)
    {
        $request->validate([
            'id' => 'required|string|unique:users,phone', // Check users table for uniqueness
            'name' => 'required|string',
            'password' => 'required|string|min:6',
            'vehicleType' => 'required|string',
            'city' => 'required|string',
        ]);

        // Generate unique 6-digit ID
        do {
            $uniqueId = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $exists = TowTruck::where('unique_id', $uniqueId)->first();
        } while ($exists);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Create User
            $user = User::create([
                'name' => $request->name,
                'phone' => $request->id,
                'password' => Hash::make($request->password),
                'role' => 'tow_truck',
                'is_admin' => false,
            ]);

            // Create Tow Truck Profile
            $towTruck = TowTruck::create([
                'id' => $request->id,
                'user_id' => $user->id,
                'unique_id' => $uniqueId,
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'vehicle_type' => $request->vehicleType,
                'city' => $request->city,
                'service_area' => $request->serviceArea ?? '',
                'description' => $request->description ?? '',
                'is_verified' => true,
                'is_active' => true,
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $towTruck->id,
                    'uniqueId' => $towTruck->unique_id,
                    'name' => $towTruck->name,
                    'vehicleType' => $towTruck->vehicle_type,
                    'city' => $towTruck->city,
                    'serviceArea' => $towTruck->service_area,
                    'description' => $towTruck->description,
                    'isVerified' => $towTruck->is_verified,
                    'isActive' => $towTruck->is_active,
                    'registrationDate' => $towTruck->created_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to create tow truck: ' . $e->getMessage()], 500);
        }
    }

    public function updateTowTruck(Request $request, $id)
    {
        $towTruck = TowTruck::where('id', $id)->first();

        if (!$towTruck) {
            return response()->json(['error' => 'Tow truck not found'], 404);
        }

        $user = User::find($towTruck->user_id);
        if (!$user) {
            // Fallback if user_id is missing or user deleted (shouldn't happen with proper constraints)
            $user = User::where('phone', $towTruck->id)->first();
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $data = [];
            $userData = [];

            if ($request->has('name')) {
                $data['name'] = $request->name;
                $userData['name'] = $request->name;
            }
            if ($request->has('vehicleType'))
                $data['vehicle_type'] = $request->vehicleType;
            if ($request->has('city'))
                $data['city'] = $request->city;
            if ($request->has('serviceArea'))
                $data['service_area'] = $request->serviceArea;
            if ($request->has('description'))
                $data['description'] = $request->description;
            if ($request->has('isActive'))
                $data['is_active'] = $request->isActive;
            if ($request->has('isVerified')) {
                $wasVerified = $towTruck->is_verified;
                $data['is_verified'] = $request->isVerified;

                // Send notification if being verified
                if (!$wasVerified && $request->isVerified) {
                    try {
                        \App\Models\Notification::create([
                            'user_id' => $towTruck->user_id,
                            'title' => 'تم توثيق حسابك!',
                            'message' => 'تم توثيق حسابك وونش بنجاح. يمكنك الآن استقبال الطلبات.',
                            'type' => 'TOW_TRUCK_VERIFIED',
                            'read' => false,
                        ]);

                        event(new \App\Events\UserNotification($towTruck->user_id, [
                            'title' => 'تم توثيق حسابك!',
                            'message' => 'تم توثيق حسابك وونش بنجاح. يمكنك الآن استقبال الطلبات.',
                            'type' => 'TOW_TRUCK_VERIFIED',
                        ]));
                    } catch (\Exception $e) {
                        \Log::warning('Failed to send verification notification: ' . $e->getMessage());
                    }
                }
            }

            if ($request->has('password') && !empty($request->password)) {
                $hashedPassword = Hash::make($request->password);
                $data['password'] = $hashedPassword;
                $userData['password'] = $hashedPassword;
            }

            $towTruck->update($data);
            if ($user && !empty($userData)) {
                $user->update($userData);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $towTruck->id,
                    'uniqueId' => $towTruck->unique_id,
                    'name' => $towTruck->name,
                    'vehicleType' => $towTruck->vehicle_type,
                    'city' => $towTruck->city,
                    'serviceArea' => $towTruck->service_area,
                    'description' => $towTruck->description,
                    'isVerified' => $towTruck->is_verified,
                    'isActive' => $towTruck->is_active,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to update tow truck: ' . $e->getMessage()], 500);
        }
    }

    public function deleteTowTruck($id)
    {
        $towTruck = TowTruck::where('id', $id)->first();

        if (!$towTruck) {
            return response()->json(['error' => 'Tow truck not found'], 404);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $user = User::find($towTruck->user_id);
            if (!$user) {
                $user = User::where('phone', $towTruck->id)->first();
            }

            $towTruck->delete();
            if ($user) {
                $user->delete();
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tow truck deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to delete tow truck'], 500);
        }
    }

    public function verifyTowTruck(Request $request, $id)
    {
        $truck = TowTruck::findOrFail($id);
        $truck->update(['is_verified' => true]);

        // Send notification
        try {
            \App\Models\Notification::create([
                'user_id' => $truck->user_id,
                'title' => 'تم توثيق حسابك!',
                'message' => 'تم توثيق حسابك وونش بنجاح. يمكنك الآن استقبال الطلبات.',
                'type' => 'TOW_TRUCK_VERIFIED',
                'read' => false,
            ]);

            event(new \App\Events\UserNotification($truck->user_id, [
                'title' => 'تم توثيق حسابك!',
                'message' => 'تم توثيق حسابك وونش بنجاح. يمكنك الآن استقبال الطلبات.',
                'type' => 'TOW_TRUCK_VERIFIED',
            ]));
        } catch (\Exception $e) {
            \Log::warning('Failed to send verification notification: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Tow Truck verified']);
    }
    public function searchUsers(Request $request)
    {
        $query = $request->get('query');

        if (empty($query) || strlen($query) < 2) {
            return response()->json(['data' => []]);
        }

        $results = collect();

        // Search Customers
        $customers = Customer::where('name', 'like', "%{$query}%")
            ->orWhere('id', 'like', "%{$query}%") // id is phone
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => 'customer',
                    'phone' => $user->id
                ];
            });
        $results = $results->concat($customers);

        // Search Providers
        $providers = Provider::where('name', 'like', "%{$query}%")
            ->orWhere('id', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => 'provider',
                    'phone' => $user->id
                ];
            });
        $results = $results->concat($providers);

        // Search Technicians
        $technicians = Technician::where('name', 'like', "%{$query}%")
            ->orWhere('id', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => 'technician',
                    'phone' => $user->id
                ];
            });
        $results = $results->concat($technicians);

        // Search Tow Trucks
        $towTrucks = TowTruck::where('name', 'like', "%{$query}%")
            ->orWhere('id', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => 'tow_truck',
                    'phone' => $user->id
                ];
            });
        $results = $results->concat($towTrucks);

        // Limit total results
        return response()->json(['data' => $results->take(10)->values()]);



    }

    // ======== CAR PROVIDER MANAGEMENT ========

    public function listCarProviders(Request $request)
    {
        $query = \App\Models\CarProvider::with(['user', 'phones']);

        if ($request->is_verified) {
            $query->where('is_verified', $request->is_verified === 'true');
        }
        if ($request->is_trusted) {
            $query->where('is_trusted', $request->is_trusted === 'true');
        }
        if ($request->is_active) {
            $query->where('is_active', $request->is_active === 'true');
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('id', 'like', '%' . $request->search . '%');
            });
        }

        $providers = $query->orderBy('created_at', 'desc')->paginate(50);

        // Transform the collection to include phone field
        $providers->getCollection()->transform(function ($provider) {
            $data = $provider->toArray();
            // In this system, the ID is the phone number
            $data['phone'] = $provider->id;
            return $data;
        });

        return response()->json($providers);
    }

    public function verifyCarProvider(Request $request, $id)
    {
        $provider = \App\Models\CarProvider::findOrFail($id);
        $provider->update([
            'is_verified' => true,
            'verified_at' => now(),
            'verified_by' => auth()->id()
        ]);
        return response()->json(['success' => true, 'message' => 'Car provider verified']);
    }

    public function toggleTrustedProvider(Request $request, $id)
    {
        $provider = \App\Models\CarProvider::findOrFail($id);
        $provider->update(['is_trusted' => !$provider->is_trusted]);
        return response()->json(['success' => true, 'is_trusted' => $provider->is_trusted]);
    }

    public function listCarListings(Request $request)
    {
        $query = \App\Models\CarListing::with(['owner', 'category', 'brand']);

        if ($request->listing_type)
            $query->where('listing_type', $request->listing_type);
        if ($request->seller_type)
            $query->where('seller_type', $request->seller_type);
        if ($request->is_hidden !== null)
            $query->where('is_hidden', $request->is_hidden === 'true');
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->with_trashed)
            $query->withTrashed();

        $listings = $query->orderBy('created_at', 'desc')->paginate(50);
        return response()->json($listings);
    }

    public function toggleHideListing(Request $request, $id)
    {
        $listing = \App\Models\CarListing::withTrashed()->findOrFail($id);
        $listing->update(['is_hidden' => !$listing->is_hidden]);
        return response()->json(['success' => true, 'is_hidden' => $listing->is_hidden]);
    }

    public function featureListing(Request $request, $id)
    {
        $validated = $request->validate(['days' => 'required|integer|min:1|max:365', 'position' => 'nullable|integer']);
        $listing = \App\Models\CarListing::findOrFail($id);
        $listing->update([
            'is_featured' => true,
            'featured_until' => now()->addDays($validated['days']),
            'featured_position' => $validated['position'] ?? null
        ]);
        return response()->json(['success' => true]);
    }

    public function sponsorListing(Request $request, $id)
    {
        $validated = $request->validate(['days' => 'required|integer|min:1|max:365']);
        $listing = \App\Models\CarListing::findOrFail($id);
        $listing->update([
            'is_sponsored' => true,
            'sponsored_until' => now()->addDays($validated['days'])
        ]);
        return response()->json(['success' => true]);
    }

    public function deleteCarListing($id)
    {
        $listing = \App\Models\CarListing::withTrashed()->findOrFail($id);
        $listing->forceDelete();
        return response()->json(['success' => true]);
    }

    public function listCarCategories()
    {
        return response()->json(\App\Models\CarListingCategory::orderBy('sort_order')->get());
    }

    public function createCarCategory(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string',
            'name_en' => 'required|string',
            'icon' => 'nullable|string',
            'sort_order' => 'integer'
        ]);
        return response()->json(['success' => true, 'category' => \App\Models\CarListingCategory::create($validated)]);
    }

    public function updateCarCategory(Request $request, $id)
    {
        $category = \App\Models\CarListingCategory::findOrFail($id);
        $category->update($request->only(['name_ar', 'name_en', 'icon', 'sort_order', 'is_active']));
        return response()->json(['success' => true, 'category' => $category]);
    }

    public function deleteCarCategory($id)
    {
        \App\Models\CarListingCategory::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
