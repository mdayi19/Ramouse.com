<?php

namespace App\Http\Controllers\Traits;

use App\Models\Customer;
use App\Models\Technician;
use App\Models\TowTruck;

/**
 * Shared trait for getting user profile from authenticated user
 * Used by AuctionController and BidController
 */
trait GetUserProfileTrait
{
    /**
     * Get user profile and type from authenticated user
     *
     * @param \App\Models\User $user
     * @return array [$profile, $userType]
     */
    protected function getUserProfile($user): array
    {
        $profile = null;
        $userType = null;

        if ($user && $user->customer) {
            $profile = $user->customer;
            $userType = 'customer';
        } elseif ($user && $user->technician) {
            $profile = $user->technician;
            $userType = 'technician';
        } elseif ($user && $user->towTruck) {
            $profile = $user->towTruck;
            $userType = 'tow_truck';
        }

        return [$profile, $userType];
    }
}
