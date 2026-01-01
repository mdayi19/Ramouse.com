<?php

namespace App\Http\Controllers;

use App\Models\AuctionWatchlist;
use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WatchlistController extends Controller
{
    /**
     * Get user's watchlist
     */
    public function index()
    {
        $user = Auth::user();

        $watchlist = AuctionWatchlist::where('user_id', $user->id)
            ->with([
                'auction' => function ($query) {
                    $query->with(['car.media']);
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($watchlist);
    }

    /**
     * Add auction to watchlist
     */
    public function store($auctionId)
    {
        $user = Auth::user();

        // Check if auction exists
        $auction = Auction::findOrFail($auctionId);

        // Check if already in watchlist
        $exists = AuctionWatchlist::where('user_id', $user->id)
            ->where('auction_id', $auctionId)
            ->exists();

        if ($exists) {
            return response()->json([
                'error' => 'المزاد موجود بالفعل في المفضلة',
                'error_code' => 'ALREADY_IN_WATCHLIST'
            ], 400);
        }

        // Add to watchlist
        $watchlistItem = AuctionWatchlist::create([
            'user_id' => $user->id,
            'auction_id' => $auctionId,
        ]);

        // Load auction relationship
        $watchlistItem->load(['auction.car.media']);

        return response()->json($watchlistItem, 201);
    }

    /**
     * Remove auction from watchlist
     */
    public function destroy($auctionId)
    {
        $user = Auth::user();

        $deleted = AuctionWatchlist::where('user_id', $user->id)
            ->where('auction_id', $auctionId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'error' => 'المزاد غير موجود في المفضلة',
                'error_code' => 'NOT_IN_WATCHLIST'
            ], 404);
        }

        return response()->json([
            'message' => 'تمت الإزالة من المفضلة بنجاح'
        ]);
    }

    /**
     * Check if auction is in watchlist
     */
    public function check($auctionId)
    {
        $user = Auth::user();

        $inWatchlist = AuctionWatchlist::where('user_id', $user->id)
            ->where('auction_id', $auctionId)
            ->exists();

        return response()->json([
            'in_watchlist' => $inWatchlist
        ]);
    }
}
