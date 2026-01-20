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
     * Get authenticated provider's phone numbers
     */
    public function getPhones(Request $request)
    {
        $user = auth('sanctum')->user();

        $provider = CarProvider::with('phones')
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
            'phones' => $provider->phones
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
        $now = now();

        // Get all provider listing IDs
        $listingIds = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->pluck('id');

        if ($listingIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'analytics' => [
                    'period_days' => $days,
                    'total_events' => [],
                    'total_favorites' => 0,
                    'unique_visitors' => 0,
                    'views_history' => [],
                    'top_performing_listings' => [],
                    'growth' => [
                        'views' => 0,
                        'contacts' => 0,
                        'favorites' => 0
                    ]
                ]
            ]);
        }

        // Current period analytics from raw events table (more accurate)
        $currentPeriodStart = $now->copy()->subDays($days);
        $previousPeriodStart = $now->copy()->subDays($days * 2);
        $previousPeriodEnd = $now->copy()->subDays($days);

        // Get current period event counts
        $currentEvents = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $listingIds)
            ->where('created_at', '>=', $currentPeriodStart)
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->get()
            ->pluck('count', 'event_type');

        // Get previous period event counts for growth calculation
        $previousEvents = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $listingIds)
            ->whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->get()
            ->pluck('count', 'event_type');

        // Calculate growth percentages
        $calculateGrowth = function ($current, $previous) {
            if ($previous == 0)
                return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };

        $currentViews = $currentEvents['view'] ?? 0;
        $previousViews = $previousEvents['view'] ?? 0;
        $currentContacts = ($currentEvents['contact_phone'] ?? 0) + ($currentEvents['contact_whatsapp'] ?? 0);
        $previousContacts = ($previousEvents['contact_phone'] ?? 0) + ($previousEvents['contact_whatsapp'] ?? 0);
        $currentFavorites = $currentEvents['favorite'] ?? 0;
        $previousFavorites = $previousEvents['favorite'] ?? 0;

        // Unique visitors in current period
        $uniqueVisitors = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $listingIds)
            ->where('event_type', 'view')
            ->where('created_at', '>=', $currentPeriodStart)
            ->distinct('user_ip')
            ->count('user_ip');

        // Views history (daily breakdown for chart) - last N days
        $viewsHistory = collect();
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            // First try daily_stats table
            $dailyViews = DB::table('car_listing_daily_stats')
                ->whereIn('car_listing_id', $listingIds)
                ->where('date', $date->toDateString())
                ->sum('total_views');

            // If no data in daily_stats, fallback to raw events
            if ($dailyViews == 0) {
                $dailyViews = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $listingIds)
                    ->where('event_type', 'view')
                    ->whereBetween('created_at', [$dayStart, $dayEnd])
                    ->count();
            }

            $viewsHistory->push([
                'date' => $date->format('M d'),
                'value' => (int) $dailyViews
            ]);
        }

        // Limit to last 14 entries for chart readability
        if ($viewsHistory->count() > 14) {
            $viewsHistory = $viewsHistory->slice(-14)->values();
        }

        // Top performing listings
        $topListings = CarListing::whereIn('id', $listingIds)
            ->orderBy('views_count', 'desc')
            ->limit(5)
            ->with(['category', 'brand'])
            ->get()
            ->map(function ($listing) use ($currentPeriodStart) {
                $contacts = \App\Models\CarListingAnalytic::where('car_listing_id', $listing->id)
                    ->whereIn('event_type', ['contact_phone', 'contact_whatsapp'])
                    ->where('created_at', '>=', $currentPeriodStart)
                    ->count();

                return [
                    'id' => $listing->id,
                    'title' => $listing->title,
                    'views' => $listing->views_count,
                    'contacts' => $contacts,
                    'price' => $listing->price,
                    'listing_type' => $listing->listing_type,
                    'image' => ($listing->photos ?? [])[0] ?? null,
                    'is_available' => $listing->is_available
                ];
            });

        // Total favorites from favorites table
        $totalFavorites = DB::table('user_car_favorites')
            ->whereIn('car_listing_id', $listingIds)
            ->count();

        // Calculate conversion rates
        $viewToContactRate = $currentViews > 0
            ? round(($currentContacts / $currentViews) * 100, 1)
            : 0;
        $viewToFavoriteRate = $currentViews > 0
            ? round(($currentFavorites / $currentViews) * 100, 1)
            : 0;

        // Events breakdown for visualization
        $eventsBreakdown = [
            ['name' => 'مشاهدات', 'name_en' => 'Views', 'value' => $currentViews, 'color' => '#3b82f6'],
            ['name' => 'اتصال هاتف', 'name_en' => 'Phone Calls', 'value' => $currentEvents['contact_phone'] ?? 0, 'color' => '#22c55e'],
            ['name' => 'واتساب', 'name_en' => 'WhatsApp', 'value' => $currentEvents['contact_whatsapp'] ?? 0, 'color' => '#25d366'],
            ['name' => 'مفضلة', 'name_en' => 'Favorites', 'value' => $currentEvents['favorite'] ?? 0, 'color' => '#ef4444'],
            ['name' => 'مشاركة', 'name_en' => 'Shares', 'value' => $currentEvents['share'] ?? 0, 'color' => '#8b5cf6'],
        ];

        // Listings by type breakdown
        $listingsByType = [
            'sale' => CarListing::whereIn('id', $listingIds)->where('listing_type', 'sale')->count(),
            'rent' => CarListing::whereIn('id', $listingIds)->where('listing_type', 'rent')->count(),
        ];

        return response()->json([
            'success' => true,
            'analytics' => [
                'period_days' => $days,
                'total_events' => $currentEvents,
                'total_favorites' => $totalFavorites,
                'unique_visitors' => $uniqueVisitors,
                'views_history' => $viewsHistory,
                'top_performing_listings' => $topListings,
                'growth' => [
                    'views' => $calculateGrowth($currentViews, $previousViews),
                    'contacts' => $calculateGrowth($currentContacts, $previousContacts),
                    'favorites' => $calculateGrowth($currentFavorites, $previousFavorites),
                    'shares' => $calculateGrowth($currentEvents['share'] ?? 0, $previousEvents['share'] ?? 0)
                ],
                'conversion_rates' => [
                    'view_to_contact' => $viewToContactRate,
                    'view_to_favorite' => $viewToFavoriteRate
                ],
                'events_breakdown' => $eventsBreakdown,
                'listings_by_type' => $listingsByType
            ]
        ]);
    }

    /**
     * Get detailed analytics for listings (paginated)
     */
    public function getDetailedAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();
        $days = (int) ($request->days ?? 30);
        $perPage = (int) ($request->per_page ?? 10);

        $startDate = now()->subDays($days);

        $listings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->with(['category', 'brand'])
            ->withCount([
                'analytics as period_views' => function ($query) use ($startDate) {
                    $query->where('event_type', 'view')->where('created_at', '>=', $startDate);
                },
                'analytics as period_unique_visitors' => function ($query) use ($startDate) {
                    $query->where('event_type', 'view')
                        ->where('created_at', '>=', $startDate)
                        ->select(DB::raw('count(distinct user_ip)'));
                },
                'analytics as period_contact_phone' => function ($query) use ($startDate) {
                    $query->where('event_type', 'contact_phone')->where('created_at', '>=', $startDate);
                },
                'analytics as period_contact_whatsapp' => function ($query) use ($startDate) {
                    $query->where('event_type', 'contact_whatsapp')->where('created_at', '>=', $startDate);
                },
                'analytics as period_favorites' => function ($query) use ($startDate) {
                    $query->where('event_type', 'favorite')->where('created_at', '>=', $startDate);
                },
                'analytics as period_shares' => function ($query) use ($startDate) {
                    $query->where('event_type', 'share')->where('created_at', '>=', $startDate);
                }
            ])
            ->orderBy('period_views', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $listings
        ]);
    }

    /**
     * Export analytics data as CSV
     */
    public function exportAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();
        $days = $request->input('days', 30);
        $format = $request->input('format', 'csv');

        // Get all provider listing IDs
        $listingIds = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->pluck('id');

        if ($listingIds->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'لا توجد إعلانات للتصدير'
            ], 404);
        }

        $now = now();
        $currentPeriodStart = $now->copy()->subDays($days);

        // Get per-listing analytics
        $listingsData = CarListing::whereIn('id', $listingIds)
            ->with(['category', 'brand'])
            ->get()
            ->map(function ($listing) use ($currentPeriodStart) {
                $events = \App\Models\CarListingAnalytic::where('car_listing_id', $listing->id)
                    ->where('created_at', '>=', $currentPeriodStart)
                    ->select('event_type', DB::raw('count(*) as count'))
                    ->groupBy('event_type')
                    ->get()
                    ->pluck('count', 'event_type');

                return [
                    'id' => $listing->id,
                    'title' => $listing->title,
                    'type' => $listing->listing_type === 'sale' ? 'بيع' : 'إيجار',
                    'brand' => $listing->brand->name ?? '-',
                    'category' => $listing->category->name ?? '-',
                    'price' => $listing->price,
                    'views' => $events['view'] ?? 0,
                    'phone_clicks' => $events['contact_phone'] ?? 0,
                    'whatsapp_clicks' => $events['contact_whatsapp'] ?? 0,
                    'favorites' => $events['favorite'] ?? 0,
                    'shares' => $events['share'] ?? 0,
                    'total_views' => $listing->views_count,
                    'created_at' => $listing->created_at->format('Y-m-d'),
                ];
            });

        // Get daily summary
        $dailyData = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $events = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $listingIds)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->select('event_type', DB::raw('count(*) as count'))
                ->groupBy('event_type')
                ->get()
                ->pluck('count', 'event_type');

            $dailyData[] = [
                'date' => $date->format('Y-m-d'),
                'views' => $events['view'] ?? 0,
                'phone_clicks' => $events['contact_phone'] ?? 0,
                'whatsapp_clicks' => $events['contact_whatsapp'] ?? 0,
                'favorites' => $events['favorite'] ?? 0,
                'shares' => $events['share'] ?? 0,
            ];
        }

        if ($format === 'json') {
            return response()->json([
                'success' => true,
                'export' => [
                    'period_days' => $days,
                    'generated_at' => now()->toIso8601String(),
                    'listings' => $listingsData,
                    'daily_summary' => $dailyData
                ]
            ]);
        }

        // CSV format
        $csvRows = [];

        // Listings sheet
        $csvRows[] = "=== تقرير أداء الإعلانات ===";
        $csvRows[] = "الفترة: آخر {$days} يوم";
        $csvRows[] = "تاريخ التصدير: " . now()->format('Y-m-d H:i');
        $csvRows[] = "";
        $csvRows[] = "العنوان,النوع,الماركة,الفئة,السعر,المشاهدات (الفترة),اتصال هاتف,واتساب,مفضلة,مشاركة,إجمالي المشاهدات,تاريخ الإنشاء";

        foreach ($listingsData as $listing) {
            $csvRows[] = implode(',', [
                '"' . str_replace('"', '""', $listing['title']) . '"',
                $listing['type'],
                $listing['brand'],
                $listing['category'],
                $listing['price'],
                $listing['views'],
                $listing['phone_clicks'],
                $listing['whatsapp_clicks'],
                $listing['favorites'],
                $listing['shares'],
                $listing['total_views'],
                $listing['created_at'],
            ]);
        }

        $csvRows[] = "";
        $csvRows[] = "=== الملخص اليومي ===";
        $csvRows[] = "التاريخ,المشاهدات,اتصال هاتف,واتساب,مفضلة,مشاركة";

        foreach ($dailyData as $day) {
            $csvRows[] = implode(',', [
                $day['date'],
                $day['views'],
                $day['phone_clicks'],
                $day['whatsapp_clicks'],
                $day['favorites'],
                $day['shares'],
            ]);
        }

        $csvContent = implode("\n", $csvRows);

        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="analytics_report_' . now()->format('Y-m-d') . '.csv"');
    }

    /**
     * Get public profile (PUBLIC)
     * Lookup by user_id
     */
    public function getPublicProfile($identifier)
    {
        $provider = CarProvider::with([
            'phones' => function ($q) {
                $q->where('is_primary', true);
            }
        ])
            ->where('is_active', true)
            ->where(function ($query) use ($identifier) {
                $query->where('unique_id', $identifier)
                    ->orWhere('user_id', $identifier);
            })
            ->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider not found'
            ], 404);
        }

        // Calculate stats
        $totalListings = CarListing::where('owner_id', $provider->user_id)
            ->where('seller_type', 'provider')
            ->count();

        $activeListings = CarListing::where('owner_id', $provider->user_id)
            ->where('seller_type', 'provider')
            ->where('is_available', true)
            ->count();

        $totalViews = CarListing::where('owner_id', $provider->user_id)
            ->where('seller_type', 'provider')
            ->sum('views_count') ?? 0;

        // Build response with all required fields
        $providerData = $provider->makeHidden(['password', 'wallet_balance', 'payment_info'])->toArray();

        // Add computed/alias fields for frontend compatibility
        // Add computed/alias fields for frontend compatibility
        $providerData['phone'] = (string) (optional($provider->phones->first())->phone ?? $provider->id);
        $providerData['business_name'] = $provider->business_name ?? $provider->name ?? 'Car Provider';
        $providerData['logo_url'] = $provider->profile_photo;
        $providerData['trust_score'] = $provider->average_rating ?? 0;
        $providerData['member_since'] = $provider->created_at;
        $providerData['total_listings'] = $totalListings;
        $providerData['active_listings'] = $activeListings;
        $providerData['total_views'] = $totalViews;
        $providerData['email'] = $provider->public_email;

        return response()->json([
            'success' => true,
            'data' => $providerData
        ]);
    }

    /**
     * Get provider's public listings (PUBLIC)
     * Supports both unique_id and user_id for backward compatibility
     */
    public function getProviderListings($identifier)
    {
        $provider = CarProvider::where('is_active', true)
            ->where(function ($query) use ($identifier) {
                $query->where('unique_id', $identifier)
                    ->orWhere('user_id', $identifier);
            })
            ->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider not found'
            ], 404);
        }

        $listings = CarListing::with(['category', 'brand'])
            ->where('owner_id', $provider->user_id)
            ->where('seller_type', 'provider')
            ->available()
            ->orderBy('is_sponsored', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $listings
        ]);
    }

    /**
     * Bulk hide listings
     */
    public function bulkHide(Request $request)
    {
        $validated = $request->validate([
            'listing_ids' => 'required|array',
            'listing_ids.*' => 'integer|exists:car_listings,id'
        ]);

        $user = auth('sanctum')->user();

        // Verify ownership and update
        $updated = CarListing::whereIn('id', $validated['listing_ids'])
            ->where('owner_id', $user->id)
            ->update(['is_hidden' => true]);

        return response()->json([
            'success' => true,
            'hidden_count' => $updated,
            'message' => "تم إخفاء {$updated} إعلانات بنجاح"
        ]);
    }

    /**
     * Bulk show listings
     */
    public function bulkShow(Request $request)
    {
        $validated = $request->validate([
            'listing_ids' => 'required|array',
            'listing_ids.*' => 'integer|exists:car_listings,id'
        ]);

        $user = auth('sanctum')->user();

        $updated = CarListing::whereIn('id', $validated['listing_ids'])
            ->where('owner_id', $user->id)
            ->update(['is_hidden' => false]);

        return response()->json([
            'success' => true,
            'shown_count' => $updated,
            'message' => "تم إظهار {$updated} إعلانات بنجاح"
        ]);
    }

    /**
     * Bulk delete listings
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'listing_ids' => 'required|array',
            'listing_ids.*' => 'integer|exists:car_listings,id'
        ]);

        $user = auth('sanctum')->user();

        $deleted = CarListing::whereIn('id', $validated['listing_ids'])
            ->where('owner_id', $user->id)
            ->delete();

        return response()->json([
            'success' => true,
            'deleted_count' => $deleted,
            'message' => "تم حذف {$deleted} إعلانات بنجاح"
        ]);
    }

    /**
     * Quick edit listing (price, availability, etc.)
     */
    public function quickEdit(Request $request, $id)
    {
        $listing = CarListing::findOrFail($id);
        $user = auth('sanctum')->user();

        // Verify ownership
        if ($listing->owner_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validated = $request->validate([
            'price' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'weekly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'is_negotiable' => 'nullable|boolean',
        ]);

        // Filter valid keys that are present in the request
        $updateData = [];
        $rentalRates = [];

        foreach ($validated as $key => $value) {
            if ($request->has($key)) {
                if (in_array($key, ['daily_rate', 'weekly_rate', 'monthly_rate'])) {
                    $rentalRates[$key] = $value;
                } else {
                    $updateData[$key] = $value;
                }
            }
        }

        // Handle rental terms update if any rates are provided
        if (!empty($rentalRates)) {
            $currentTerms = $listing->rental_terms ?? [];
            if (!is_array($currentTerms)) {
                $currentTerms = [];
            }

            $updateData['rental_terms'] = array_merge($currentTerms, $rentalRates);
        }

        if (empty($updateData)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid fields provided for update'
            ], 422);
        }

        $listing->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'تم التحديث بنجاح',
            'listing' => $listing->fresh()
        ]);
    }

    /**
     * Duplicate listing
     */
    public function duplicateListing(Request $request, $id)
    {
        $listing = CarListing::with(['features'])->findOrFail($id);
        $user = auth('sanctum')->user();

        // Verify ownership
        if ($listing->owner_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Create duplicate
        $newListing = $listing->replicate();
        $newListing->title = $listing->title . ' (نسخة)';
        $newListing->is_sponsored = false;
        $newListing->is_featured = false;
        $newListing->views_count = 0;
        $newListing->slug = null; // Will auto-generate new slug
        $newListing->save();

        // Note: Features duplication can be added if needed

        return response()->json([
            'success' => true,
            'new_listing_id' => $newListing->id,
            'message' => 'تم نسخ الإعلان بنجاح',
            'listing' => $newListing->load(['category', 'brand'])
        ]);
    }
}
