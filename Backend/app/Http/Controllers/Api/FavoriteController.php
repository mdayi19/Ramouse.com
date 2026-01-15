<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCarFavorite;
use App\Models\CarListing;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * Toggle favorite (AUTHENTICATED)
     */
    public function toggle(Request $request, $listingId)
    {
        $user = auth('sanctum')->user();

        // Check if listing exists
        $listing = CarListing::findOrFail($listingId);

        // Toggle
        $isFavorited = UserCarFavorite::toggle($user->id, $listingId);

        // Track analytics if added
        if ($isFavorited) {
            \App\Models\CarListingAnalytic::create([
                'car_listing_id' => $listingId,
                'event_type' => 'favorite',
                'user_id' => $user->id,
                'user_ip' => $request->ip(),
                'metadata' => ['source' => 'toggle_favorite']
            ]);
        }

        return response()->json([
            'success' => true,
            'is_favorited' => $isFavorited,
            'message' => $isFavorited ? 'Added to favorites' : 'Removed from favorites'
        ]);
    }

    /**
     * Get my favorites (AUTHENTICATED)
     */
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();

        $favorites = UserCarFavorite::with(['listing.category', 'listing.brand', 'listing.owner'])
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'favorites' => $favorites
        ]);
    }

    /**
     * Check if listing is favorited (AUTHENTICATED)
     */
    public function check(Request $request, $listingId)
    {
        $user = auth('sanctum')->user();

        $isFavorited = UserCarFavorite::check($user->id, $listingId);

        return response()->json([
            'success' => true,
            'is_favorited' => $isFavorited
        ]);
    }

    /**
     * Get favorites count for a listing (PUBLIC)
     */
    public function count($listingId)
    {
        $count = UserCarFavorite::where('car_listing_id', $listingId)->count();

        return response()->json([
            'success' => true,
            'count' => $count
        ]);
    }
}
