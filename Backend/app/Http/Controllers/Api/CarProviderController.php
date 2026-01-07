<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarProvider;
use App\Models\CarListing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarProviderController extends Controller
{
    /**
     * Get authenticated provider profile
     */
    public function getProfile(Request $request)
    {
        $user = auth('sanctum')->user();

        $provider = CarProvider::with(['phones', 'user'])
            ->where('user_id', $user->id)
            ->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'provider' => $provider
        ]);
    }

    /**
     * Update provider profile
     */
    public function updateProfile(Request $request)
    {
        $user = auth('sanctum')->user();
        $provider = CarProvider::where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'string|max:255',
            'business_name' => 'string|max:255',
            'business_type' => 'in:dealership,individual,rental_agency',
            'city' => 'string|max:255',
            'address' => 'string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'description' => 'nullable|string',
            'website' => 'nullable|url',
            'working_hours' => 'nullable|string',
            'public_email' => 'nullable|email',
            // File validations
            'profile_photo' => 'nullable|image|max:5120', // logo
            'cover_photo' => 'nullable|image|max:10240',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|max:5120',
            // Existing gallery URLs to keep (if managing via frontend array)
            'existing_gallery' => 'nullable|array',
            'socials' => 'nullable', // can be JSON string or array
        ]);

        $data = $request->only([
            'name',
            'business_name',
            'business_type',
            'city',
            'address',
            'latitude',
            'longitude',
            'description',
            'website',
            'working_hours',
            'public_email'
        ]);

        // Handle Logo Upload (profile_photo)
        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('providers/logos', 'public');
            $data['profile_photo'] = '/storage/' . $path;
        }

        // Handle Cover Photo Upload
        if ($request->hasFile('cover_photo')) {
            $path = $request->file('cover_photo')->store('providers/covers', 'public');
            $data['cover_photo'] = '/storage/' . $path;
        }

        // Handle Gallery Uploads
        $currentGallery = $provider->gallery ?? [];

        // If frontend sends 'existing_gallery', we use that to filter out removed images
        if ($request->has('existing_gallery')) {
            $existing = $request->input('existing_gallery');
            // Ensure $existing is array
            if (is_string($existing)) {
                $existing = json_decode($existing, true) ?? [];
            }
            // Keep only those in currentGallery that are also in existing_gallery
            $currentGallery = array_values(array_intersect($currentGallery, $existing));
        }

        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $image) {
                $path = $image->store('providers/gallery', 'public');
                $currentGallery[] = '/storage/' . $path;
            }
        }

        $data['gallery'] = $currentGallery;

        // Handle Socials (could be JSON string from FormData)
        if ($request->has('socials')) {
            $socials = $request->input('socials');
            if (is_string($socials)) {
                $data['socials'] = json_decode($socials, true);
            } else {
                $data['socials'] = $socials;
            }
        }

        $provider->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'provider' => $provider->fresh(['phones'])
        ]);
    }

    /**
     * Get provider dashboard stats
     */
    public function getStats(Request $request)
    {
        $user = auth('sanctum')->user();

        $provider = CarProvider::where('user_id', $user->id)->firstOrFail();

        // Get listings count
        $totalListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->count();

        $activeListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->where('is_available', true)
            ->count();

        $sponsoredListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->where('is_sponsored', true)
            ->where('sponsored_until', '>', now())
            ->count();

        // Get total views
        $totalViews = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->sum('views_count');

        // Get this month's analytics
        $thisMonthListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->whereMonth('created_at', now()->month)
            ->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_listings' => $totalListings,
                'active_listings' => $activeListings,
                'sponsored_listings' => $sponsoredListings,
                'total_views' => $totalViews,
                'this_month_listings' => $thisMonthListings,
                'wallet_balance' => $provider->wallet_balance,
                'average_rating' => $provider->average_rating,
                'is_verified' => $provider->is_verified,
                'is_trusted' => $provider->is_trusted,
            ]
        ]);
    }

    /**
     * Get authenticated provider's listings (Dashboard)
     */
    public function getMyListings(Request $request)
    {
        $user = auth('sanctum')->user();

        $listings = CarListing::with(['category', 'brand'])
            ->where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'listings' => $listings->items(),
            'total' => $listings->total(),
            'current_page' => $listings->currentPage(),
            'per_page' => $listings->perPage(),
        ]);
    }

    /**
     * Get provider analytics (detailed)
     */
    public function getAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();

        $days = $request->days ?? 30;

        $listings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->with([
                'dailyStats' => function ($q) use ($days) {
                    $q->where('date', '>=', now()->subDays($days));
                }
            ])
            ->get();

        // Aggregate daily stats
        $dailyData = DB::table('car_listing_daily_stats')
            ->join('car_listings', 'car_listings.id', '=', 'car_listing_daily_stats.car_listing_id')
            ->where('car_listings.owner_id', $user->id)
            ->where('car_listings.seller_type', 'provider')
            ->where('car_listing_daily_stats.date', '>=', now()->subDays($days))
            ->select(
                'car_listing_daily_stats.date',
                DB::raw('SUM(total_views) as views'),
                DB::raw('SUM(unique_visitors) as visitors'),
                DB::raw('SUM(contact_phone_clicks) as phone_clicks'),
                DB::raw('SUM(contact_whatsapp_clicks) as whatsapp_clicks'),
                DB::raw('SUM(favorites) as favorites'),
                DB::raw('SUM(shares) as shares')
            )
            ->groupBy('car_listing_daily_stats.date')
            ->orderBy('car_listing_daily_stats.date')
            ->get();

        return response()->json([
            'success' => true,
            'analytics' => [
                'period_days' => $days,
                'daily_data' => $dailyData,
                'listings' => $listings
            ]
        ]);
    }

    /**
     * Get public profile (PUBLIC)
     */
    public function getPublicProfile($id)
    {
        $provider = CarProvider::with([
            'phones' => function ($q) {
                // Only show primary phone publicly
                $q->where('is_primary', true);
            }
        ])
            ->where('id', $id)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'provider' => $provider->makeHidden(['password', 'wallet_balance', 'payment_info'])
        ]);
    }

    /**
     * Get provider's public listings (PUBLIC)
     */
    public function getProviderListings($id)
    {
        $provider = CarProvider::where('id', $id)
            ->where('is_active', true)
            ->firstOrFail();

        $listings = CarListing::with(['category', 'brand'])
            ->where('owner_id', $provider->user_id)
            ->where('seller_type', 'provider')
            ->available()
            ->orderBy('is_sponsored', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'provider' => $provider->makeHidden(['password', 'wallet_balance', 'payment_info']),
            'listings' => $listings
        ]);
    }
}
