<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarListingAnalytic;
use App\Models\CarListing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarAnalyticsController extends Controller
{
    /**
     * Track event (PUBLIC/AUTHENTICATED)
     * Deduplication: same IP + event + listing within 30 minutes
     */
    public function trackEvent(Request $request)
    {
        $validated = $request->validate([
            'car_listing_id' => 'required|exists:car_listings,id',
            'event_type' => 'required|in:view,contact_phone,contact_whatsapp,favorite,share',
            'metadata' => 'nullable|array'
        ]);

        $userIp = $request->ip();
        $userId = auth('sanctum')->id();

        // Deduplication check (30 minutes)
        $recentEvent = CarListingAnalytic::where('car_listing_id', $validated['car_listing_id'])
            ->where('event_type', $validated['event_type'])
            ->where('user_ip', $userIp)
            ->where('created_at', '>', now()->subMinutes(30))
            ->first();

        if ($recentEvent) {
            return response()->json([
                'success' => true,
                'message' => 'Event already tracked recently',
                'duplicate' => true
            ]);
        }

        // Create analytics event
        CarListingAnalytic::create([
            'car_listing_id' => $validated['car_listing_id'],
            'event_type' => $validated['event_type'],
            'user_ip' => $userIp,
            'user_id' => $userId,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        // If it's a view event, queue increment job (async)
        if ($validated['event_type'] === 'view') {
            dispatch(function () use ($validated) {
                $listing = CarListing::find($validated['car_listing_id']);
                if ($listing) {
                    $listing->increment('views_count');
                }
            })->afterResponse();
        }

        return response()->json([
            'success' => true,
            'message' => 'Event tracked successfully'
        ]);
    }

    /**
     * Get listing analytics (AUTHENTICATED - Owner only)
     */
    public function getListingAnalytics(Request $request, $listingId)
    {
        $listing = CarListing::findOrFail($listingId);

        // Authorization
        if ($listing->owner_id !== auth('sanctum')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $days = $request->days ?? 30;

        // Get event counts
        $eventCounts = CarListingAnalytic::where('car_listing_id', $listingId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->get()
            ->pluck('count', 'event_type');

        // Get daily stats
        $dailyStats = $listing->dailyStats()
            ->where('date', '>=', now()->subDays($days))
            ->orderBy('date')
            ->get();

        // Get unique visitors
        $uniqueVisitors = CarListingAnalytic::where('car_listing_id', $listingId)
            ->where('event_type', 'view')
            ->where('created_at', '>=', now()->subDays($days))
            ->distinct('user_ip')
            ->count('user_ip');

        return response()->json([
            'success' => true,
            'analytics' => [
                'period_days' => $days,
                'total_views' => $listing->views_count,
                'unique_visitors' => $uniqueVisitors,
                'event_counts' => $eventCounts,
                'daily_stats' => $dailyStats,
                'favorites_count' => $listing->favorites()->count(),
            ]
        ]);
    }

    /**
     * Get provider analytics (AUTHENTICATED - Provider only)
     */
    public function getProviderAnalytics(Request $request)
    {
        $user = auth('sanctum')->user();

        if ($user->role !== 'car_provider') {
            return response()->json([
                'success' => false,
                'message' => 'Only car providers can access this endpoint'
            ], 403);
        }

        $days = $request->days ?? 30;

        // Get all provider listings
        $listingIds = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'provider')
            ->pluck('id');

        // Aggregate analytics
        $totalEvents = CarListingAnalytic::whereIn('car_listing_id', $listingIds)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->get()
            ->pluck('count', 'event_type');

        // Top performing listings
        $topListings = CarListing::whereIn('id', $listingIds)
            ->orderBy('views_count', 'desc')
            ->limit(10)
            ->with(['category', 'brand'])
            ->get();

        // Unique visitors
        $uniqueVisitors = CarListingAnalytic::whereIn('car_listing_id', $listingIds)
            ->where('event_type', 'view')
            ->where('created_at', '>=', now()->subDays($days))
            ->distinct('user_ip')
            ->count('user_ip');

        return response()->json([
            'success' => true,
            'analytics' => [
                'period_days' => $days,
                'total_events' => $totalEvents,
                'unique_visitors' => $uniqueVisitors,
                'top_listings' => $topListings,
                'total_favorites' => DB::table('user_car_favorites')
                    ->whereIn('car_listing_id', $listingIds)
                    ->count()
            ]
        ]);
    }
}
