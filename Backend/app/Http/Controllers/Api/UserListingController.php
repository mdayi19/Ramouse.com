<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarListing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserListingController extends Controller
{
    /**
     * Get authenticated user's listings (works for customers, technicians, tow_trucks)
     */
    public function getMyListings(Request $request)
    {
        $user = auth('sanctum')->user();

        $listings = CarListing::with(['category', 'brand'])
            ->where('owner_id', $user->id)
            ->where('seller_type', 'individual')
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
     * Get user dashboard stats
     */
    public function getStats(Request $request)
    {
        $user = auth('sanctum')->user();

        // Get listings count
        $totalListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
            ->count();

        $activeListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
            ->where('is_available', true)
            ->count();

        $sponsoredListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
            ->where('is_sponsored', true)
            ->where('sponsored_until', '>', now())
            ->count();

        // Get total views
        $totalViews = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
            ->sum('views_count');

        // Get this month's listings
        $thisMonthListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
            ->whereMonth('created_at', now()->month)
            ->count();

        // Get wallet balance based on user role
        $walletBalance = 0;
        switch ($user->role) {
            case 'customer':
                $walletBalance = $user->customer?->wallet_balance ?? 0;
                break;
            case 'technician':
                $walletBalance = $user->technician?->wallet_balance ?? 0;
                break;
            case 'tow_truck':
                $walletBalance = $user->towTruck?->wallet_balance ?? 0;
                break;
        }

        // Listing limit info
        $listingLimit = 3;
        $remainingListings = max(0, $listingLimit - $totalListings);

        return response()->json([
            'success' => true,
            'stats' => [
                'total_listings' => $totalListings,
                'active_listings' => $activeListings,
                'sponsored_listings' => $sponsoredListings,
                'total_views' => $totalViews,
                'this_month_listings' => $thisMonthListings,
                'wallet_balance' => $walletBalance,
                'listing_limit' => $listingLimit,
                'remaining_listings' => $remainingListings,
            ]
        ]);
    }

    /**
     * Get analytics for user's listings
     */
    public function getAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();
        $days = $request->days ?? 30;
        $now = now();

        // Get all user listing IDs
        $listingIds = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
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

        // Current period analytics
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

        // Views history (daily breakdown for chart)
        $viewsHistory = collect();
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $dailyViews = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $listingIds)
                ->where('event_type', 'view')
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

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

        // Total favorites
        $totalFavorites = DB::table('user_car_favorites')
            ->whereIn('car_listing_id', $listingIds)
            ->count();

        // Events breakdown
        $eventsBreakdown = [
            ['name' => 'مشاهدات', 'name_en' => 'Views', 'value' => $currentViews, 'color' => '#3b82f6'],
            ['name' => 'اتصال هاتف', 'name_en' => 'Phone Calls', 'value' => $currentEvents['contact_phone'] ?? 0, 'color' => '#22c55e'],
            ['name' => 'واتساب', 'name_en' => 'WhatsApp', 'value' => $currentEvents['contact_whatsapp'] ?? 0, 'color' => '#25d366'],
            ['name' => 'مفضلة', 'name_en' => 'Favorites', 'value' => $currentEvents['favorite'] ?? 0, 'color' => '#ef4444'],
            ['name' => 'مشاركة', 'name_en' => 'Shares', 'value' => $currentEvents['share'] ?? 0, 'color' => '#8b5cf6'],
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
                'events_breakdown' => $eventsBreakdown,
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
            ->where('seller_type', 'individual')
            ->with(['category', 'brand'])
            ->withCount([
                'analytics as period_views' => function ($query) use ($startDate) {
                    $query->where('event_type', 'view')->where('created_at', '>=', $startDate);
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
     * Export analytics data
     */
    public function exportAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();
        $days = $request->input('days', 30);
        $format = $request->input('format', 'json');

        $listingIds = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
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

        return response()->json([
            'success' => true,
            'export' => [
                'period_days' => $days,
                'generated_at' => now()->toIso8601String(),
                'listings' => $listingsData
            ]
        ]);
    }
}
