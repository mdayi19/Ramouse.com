<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TowTruck;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TowTruckController extends Controller
{
    /**
     * Get dashboard statistics for the authenticated tow truck
     */
    public function getDashboardStats(Request $request)
    {
        $user = Auth::user();

        // Find towing profile
        $towTruck = TowTruck::where('user_id', $user->id)
            ->orWhere('id', $user->phone)
            ->first();

        if (!$towTruck) {
            return response()->json(['error' => 'Tow truck profile not found'], 404);
        }

        // 1. Calculate Average Rating
        // Recalculate to ensure it's fresh
        $towTruck->recalculateAverageRating();

        // 2. Count Reviews
        $totalReviews = $towTruck->reviews()->count();
        $pendingReviews = $towTruck->reviews()->where('status', 'pending')->count();
        $approvedReviews = $towTruck->reviews()->where('status', 'approved')->count();

        // 3. Profile Views (Mock data for now, user didn't ask for implementation of tracking yet)
        $profileViews = 0; // Placeholder

        return response()->json([
            'success' => true,
            'data' => [
                'averageRating' => $towTruck->average_rating,
                'totalReviews' => $totalReviews,
                'pendingReviews' => $pendingReviews,
                'approvedReviews' => $approvedReviews,
                'isVerified' => $towTruck->is_verified,
                'profileViews' => $profileViews
            ]
        ]);
    }
}
