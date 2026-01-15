<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarListing;
use App\Models\CarListingSponsorshipHistory;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarListingController extends Controller
{
    /**
     * Browse marketplace (PUBLIC) - with filters
     */
    public function index(Request $request)
    {
        $query = CarListing::with(['owner', 'category', 'brand'])
            ->available();

        // Listing type filter
        if ($request->listing_type) {
            $query->where('listing_type', $request->listing_type);
        }

        // Category filter
        if ($request->category_id) {
            $query->where('car_listing_category_id', $request->category_id);
        }

        // Brand filter
        if ($request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        // Price range
        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        // Year range
        if ($request->min_year) {
            $query->where('year', '>=', $request->min_year);
        }
        if ($request->max_year) {
            $query->where('year', '<=', $request->max_year);
        }

        // Transmission
        if ($request->transmission) {
            $query->where('transmission', $request->transmission);
        }

        // Fuel type
        if ($request->fuel_type) {
            $query->where('fuel_type', $request->fuel_type);
        }

        // Condition
        if ($request->condition) {
            $query->where('condition', $request->condition);
        }

        // Seller type
        if ($request->seller_type) {
            $query->where('seller_type', $request->seller_type);
        }

        // Sort
        $sortBy = $request->sort_by ?? 'created_at';
        $sortDir = $request->sort_dir ?? 'desc';

        if ($sortBy === 'sponsored') {
            // Sponsored first, then by created_at
            $query->orderByRaw('is_sponsored DESC, sponsored_until DESC')
                ->orderBy('created_at', 'desc');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        // Pagination
        $perPage = min($request->per_page ?? 20, 50);
        $listings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'listings' => $listings
        ]);
    }

    /**
     * Get listing by slug (PUBLIC)
     */
    public function show($slug)
    {
        $listing = CarListing::with(['owner.carProvider', 'category', 'brand', 'analytics', 'dailyStats'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Check if available
        if (!$listing->is_available || $listing->is_hidden) {
            // Only owner or admin can view unavailable/hidden
            $user = auth('sanctum')->user();
            if (!$user || ($user->id !== $listing->owner_id && !$user->is_admin)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Listing not available'
                ], 404);
            }
        }

        return response()->json([
            'success' => true,
            'listing' => $listing
        ]);
    }

    /**
     * FULLTEXT search (PUBLIC)
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $searchTerm = $request->q;

        $results = CarListing::with(['owner', 'category', 'brand'])
            ->available()
            ->whereRaw("MATCH(title, description, model) AGAINST(? IN NATURAL LANGUAGE MODE)", [$searchTerm])
            ->paginate(20);

        return response()->json([
            'success' => true,
            'query' => $searchTerm,
            'results' => $results
        ]);
    }

    /**
     * Create listing (AUTHENTICATED - Individual or Provider)
     */
    public function store(Request $request)
    {
        $user = auth('sanctum')->user();

        // Check individual limit (max 3)
        if ($user->role === 'customer') {
            $count = CarListing::where('owner_id', $user->id)
                ->where('seller_type', 'individual')
                ->count();

            if ($count >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have reached the maximum limit of 3 listings. Upgrade to Car Provider for unlimited listings.'
                ], 403);
            }
        }

        // Validate
        $validated = $request->validate([
            'listing_type' => 'required|in:sale,rent',
            'car_listing_category_id' => 'nullable|exists:car_listing_categories,id',
            'title' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
            'model' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'mileage' => 'required|integer|min:0',
            'condition' => 'required|in:new,used,certified_pre_owned',
            'price' => 'required|numeric|min:0',
            'is_negotiable' => 'boolean',
            'rental_terms' => 'nullable|array',
            'exterior_color' => 'nullable|string',
            'interior_color' => 'nullable|string',
            'transmission' => 'nullable|in:automatic,manual',
            'fuel_type' => 'nullable|in:gasoline,diesel,electric,hybrid',
            'doors_count' => 'nullable|integer|min:2|max:5',
            'seats_count' => 'nullable|integer|min:2|max:9',
            'license_plate' => 'nullable|string',
            'chassis_number' => 'nullable|string|size:17',
            'engine_size' => 'nullable|string',
            'horsepower' => 'nullable|integer',
            'body_style' => 'nullable|string',
            'body_condition' => 'nullable|array',
            'previous_owners' => 'nullable|integer|min:0',
            'warranty' => 'nullable|string',
            'features' => 'nullable|array',
            'description' => 'nullable|string',
            'city' => 'required|string|max:50',
            'address' => 'nullable|string|max:500',
            'car_category_id' => 'nullable|string|max:10',
            'country_id' => 'nullable|exists:countries,id',
            'photos' => 'required|array|min:1|max:20',
            'photos.*' => 'string', // URLs
            'video_url' => 'nullable|url',
            'contact_phone' => 'nullable|string',
            'contact_whatsapp' => 'nullable|string',
        ]);

        // Determine seller type
        $sellerType = $user->role === 'car_provider' ? 'provider' : 'individual';

        $listing = CarListing::create(array_merge($validated, [
            'owner_id' => $user->id,
            'seller_type' => $sellerType,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Listing created successfully',
            'listing' => $listing->load(['category', 'brand'])
        ], 201);
    }

    /**
     * Update listing (AUTHENTICATED - Owner only)
     */
    public function update(Request $request, $id)
    {
        $listing = CarListing::findOrFail($id);

        // Authorization
        if ($listing->owner_id !== auth('sanctum')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Validate all fields similar to store method
        $validated = $request->validate([
            'listing_type' => 'sometimes|in:sale,rent',
            'car_listing_category_id' => 'nullable|exists:car_listing_categories,id',
            'title' => 'sometimes|string|max:255',
            'brand_id' => 'sometimes|exists:brands,id',
            'model' => 'sometimes|string|max:255',
            'year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'mileage' => 'sometimes|integer|min:0',
            'condition' => 'sometimes|in:new,used,certified_pre_owned',
            'price' => 'nullable|numeric|min:0', // Can be nullable for rent
            'is_negotiable' => 'boolean',
            'rental_terms' => 'nullable|array',
            'exterior_color' => 'nullable|string',
            'interior_color' => 'nullable|string',
            'transmission' => 'nullable|in:automatic,manual',
            'fuel_type' => 'nullable|in:gasoline,diesel,electric,hybrid',
            'doors_count' => 'nullable|integer|min:2|max:5',
            'seats_count' => 'nullable|integer|min:2|max:9',
            'license_plate' => 'nullable|string',
            'chassis_number' => 'nullable|string',
            'engine_size' => 'nullable|string',
            'horsepower' => 'nullable|integer',
            'body_style' => 'nullable|string',
            'body_condition' => 'nullable|array',
            'previous_owners' => 'nullable|integer|min:0',
            'warranty' => 'nullable|string',
            'features' => 'nullable|array',
            'description' => 'nullable|string',
            'city' => 'sometimes|string|max:50',
            'address' => 'nullable|string|max:500',
            'car_category_id' => 'nullable|string',
            'country_id' => 'nullable|exists:countries,id',
            'photos' => 'sometimes|array|min:1|max:20',
            'photos.*' => 'string',
            'video_url' => 'nullable|url',
            'contact_phone' => 'nullable|string',
            'contact_whatsapp' => 'nullable|string',
            'is_available' => 'boolean',
            'is_hidden' => 'boolean'
        ]);

        $listing->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Listing updated successfully',
            'listing' => $listing->fresh(['category', 'brand'])
        ]);
    }

    /**
     * Soft delete listing (AUTHENTICATED - Owner only)
     */
    public function destroy($id)
    {
        $listing = CarListing::findOrFail($id);

        // Authorization
        if ($listing->owner_id !== auth('sanctum')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $listing->delete();

        return response()->json([
            'success' => true,
            'message' => 'Listing deleted successfully'
        ]);
    }

    /**
     * Toggle availability (AUTHENTICATED - Owner only)
     */
    public function toggleAvailability($id)
    {
        $listing = CarListing::findOrFail($id);

        // Authorization
        if ($listing->owner_id !== auth('sanctum')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Toggle is_hidden for visibility control
        $listing->update([
            'is_hidden' => !$listing->is_hidden
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Visibility updated',
            'is_hidden' => $listing->is_hidden
        ]);
    }

    /**
     * Calculate sponsor price based on duration
     */
    public function calculateSponsorPrice(Request $request)
    {
        $validated = $request->validate(['days' => 'required|integer|min:1|max:90']);
        $days = $validated['days'];

        $settings = \App\Models\SystemSettings::getSetting('sponsorSettings');
        if (!$settings || !($settings['enabled'] ?? true)) {
            return response()->json(['error' => 'Sponsorship is currently disabled'], 400);
        }

        $pricing = [
            'daily' => $settings['dailyPrice'] ?? 10,
            'weekly' => $settings['weeklyPrice'] ?? 60,
            'monthly' => $settings['monthlyPrice'] ?? 200,
        ];

        if ($days >= 30) {
            $price = $pricing['monthly'] * ceil($days / 30);
            $tier = 'monthly';
        } elseif ($days >= 7) {
            $price = $pricing['weekly'] * ceil($days / 7);
            $tier = 'weekly';
        } else {
            $price = $pricing['daily'] * $days;
            $tier = 'daily';
        }

        return response()->json([
            'price' => $price,
            'days' => $days,
            'tier' => $tier,
            'breakdown' => $pricing
        ]);
    }

    /**
     * Sponsor a listing (Provider pays from wallet)
     */
    public function sponsorListing(Request $request, $id)
    {
        $validated = $request->validate(['duration_days' => 'required|integer|min:1|max:90']);
        $listing = CarListing::findOrFail($id);
        $user = auth('sanctum')->user();

        if ($listing->owner_id !== $user->id) {
            return response()->json(['error' => 'غير مصرح لك برعاية هذا الإعلان'], 403);
        }

        if ($listing->is_sponsored && $listing->sponsored_until && $listing->sponsored_until->isFuture()) {
            return response()->json(['error' => 'الإعلان مرعي بالفعل حتى ' . $listing->sponsored_until->format('Y-m-d')], 400);
        }

        $provider = $user->carProvider;
        if (!$provider) {
            return response()->json(['error' => 'حساب مزود السيارات غير موجود'], 404);
        }

        $priceResponse = $this->calculateSponsorPrice(new Request(['days' => $validated['duration_days']]));
        $priceData = json_decode($priceResponse->getContent(), true);

        if (isset($priceData['error'])) {
            return response()->json($priceData, 400);
        }

        $price = $priceData['price'];

        if ($provider->wallet_balance < $price) {
            return response()->json([
                'error' => 'رصيد المحفظة غير كافٍ',
                'required' => $price,
                'current_balance' => $provider->wallet_balance,
            ], 400);
        }

        DB::transaction(function () use ($listing, $provider, $price, $validated, $user) {
            $provider->decrement('wallet_balance', $price);
            $provider->refresh();

            \App\Models\UserTransaction::create([
                'user_id' => $user->id,
                'user_type' => 'car_provider',
                'type' => 'payment',
                'amount' => -$price,
                'description' => "رعاية إعلان: {$listing->title} لمدة {$validated['duration_days']} يوم",
                'balance_after' => $provider->wallet_balance,
                'reference_type' => 'car_listing_sponsorship',
                'reference_id' => $listing->id,
            ]);

            $sponsoredUntil = now()->addDays($validated['duration_days']);
            $listing->update(['is_sponsored' => true, 'sponsored_until' => $sponsoredUntil]);

            \App\Models\CarListingSponsorshipHistory::create([
                'car_listing_id' => $listing->id,
                'sponsored_by_user_id' => $user->id,
                'sponsored_from' => now(),
                'sponsored_until' => $sponsoredUntil,
                'price' => $price,
                'duration_days' => $validated['duration_days'],
                'status' => 'active',
                'is_admin_sponsored' => false,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم تفعيل الرعاية بنجاح',
            'listing' => $listing->fresh(),
            'new_balance' => $provider->wallet_balance,
            'amount_paid' => $price,
        ]);
    }

    /**
     * Unsponsor a listing with pro-rated refund
     */
    public function unsponsorListing($id)
    {
        $listing = CarListing::findOrFail($id);
        $user = auth('sanctum')->user();

        if ($listing->owner_id !== $user->id) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        if (!$listing->is_sponsored) {
            return response()->json(['error' => 'الإعلان غير مرعي'], 400);
        }

        $provider = $user->carProvider;
        $history = $listing->sponsorshipHistories()->where('status', 'active')->first();

        if (!$history) {
            return response()->json(['error' => 'لا توجد رعاية نشطة'], 404);
        }

        if ($history->is_admin_sponsored) {
            return response()->json(['error' => 'لا يمكن إلغاء الرعاية الإدارية'], 400);
        }

        $remainingDays = now()->diffInDays($listing->sponsored_until, false);
        $refundAmount = 0;

        if ($remainingDays > 0 && $history->price > 0) {
            $refundAmount = round(($history->price / $history->duration_days) * $remainingDays, 2);
        }

        DB::transaction(function () use ($listing, $provider, $history, $refundAmount, $user) {
            if ($refundAmount > 0) {
                $provider->increment('wallet_balance', $refundAmount);
                $provider->refresh();

                \App\Models\UserTransaction::create([
                    'user_id' => $user->id,
                    'user_type' => 'car_provider',
                    'type' => 'refund',
                    'amount' => $refundAmount,
                    'description' => "استرجاع رعاية: {$listing->title}",
                    'balance_after' => $provider->wallet_balance,
                    'reference_type' => 'car_listing_sponsorship',
                    'reference_id' => $listing->id,
                ]);
            }

            $listing->update(['is_sponsored' => false, 'sponsored_until' => null]);
            $history->update(['status' => 'cancelled', 'refund_amount' => $refundAmount, 'refunded_at' => now()]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الرعاية',
            'refund_amount' => $refundAmount,
            'new_balance' => $provider->wallet_balance,
        ]);
    }

    /**
     * Get provider's sponsorship history
     */
    public function getSponsorships()
    {
        $user = auth('sanctum')->user();
        $provider = $user->carProvider;

        if (!$provider) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $sponsorships = CarListingSponsorshipHistory::whereHas('carListing', function ($query) use ($provider) {
            $query->where('owner_id', $provider->user_id);
        })
            ->with('carListing:id,title')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($history) {
                return [
                    'id' => $history->id,
                    'car_listing_id' => $history->car_listing_id,
                    'listing_title' => $history->carListing->title ?? 'غير معروف',
                    'sponsored_from' => $history->sponsored_from,
                    'sponsored_until' => $history->sponsored_until,
                    'price' => $history->price,
                    'duration_days' => $history->duration_days,
                    'status' => $history->status,
                    'refund_amount' => $history->refund_amount,
                    'is_admin_sponsored' => $history->is_admin_sponsored,
                    'created_at' => $history->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $sponsorships,
        ]);
    }
}
