<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// User-specific private channels
// User-specific private channels
Broadcast::channel('user.{userId}', function ($user, $userId) {
    // Check if authenticated user matches the channel ID
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Provider-specific private channels (for review notifications)
Broadcast::channel('provider.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Order-specific private channels
Broadcast::channel('orders.{orderNumber}', function ($user, $orderNumber) {
    // Get the order
    $order = \App\Models\Order::where('order_number', $orderNumber)->first();

    if (!$order) {
        return false;
    }

    // Allow if user is the order creator
    // Order uses phone number as user_id
    if ($order->user_id === $user->phone) {
        return true;
    }

    // Allow if user is a provider who submitted a quote
    // Quote uses provider phone number as provider_id
    if (
        isset($user->phone) && \App\Models\Quote::where('order_number', $orderNumber)
            ->where('provider_id', $user->phone)
            ->exists()
    ) {
        return true;
    }

    // Allow if user is admin
    if (isset($user->is_admin) && $user->is_admin) {
        return true;
    }

    return false;
});

// Provider category channels (for new order notifications)
// These are public channels - no authorization needed
// Broadcast::channel('orders.category.{category}', function ($user, $category) {
//     return true; // Public channel
// });

// Admin channel for dashboard updates
Broadcast::channel('admin.dashboard', function ($user) {
    return $user->role === 'admin';
});

// Admin channel for international license updates
Broadcast::channel('admin.international-licenses', function ($user) {
    return $user->role === 'admin';
});

// Presence channel example (for online users)
Broadcast::channel('online', function ($user) {
    if ($user) {
        return [
            'id' => $user->id ?? $user->phone,
            'name' => $user->name,
            'role' => $user->role ?? 'customer',
        ];
    }
    return false;
});

// Auction presence channel (for live auction rooms)
Broadcast::channel('auction.{auctionId}', function ($user, $auctionId) {
    // Providers cannot participate in auctions
    if ($user->role === 'provider') {
        return false;
    }

    $auction = \App\Models\Auction::find($auctionId);
    if (!$auction) {
        return false;
    }

    // Must be registered to participate
    $profile = null;
    $userType = null;

    if ($user->customer) {
        $profile = $user->customer;
        $userType = 'customer';
    } elseif ($user->technician) {
        $profile = $user->technician;
        $userType = 'technician';
    } elseif ($user->towTruck) {
        $profile = $user->towTruck;
        $userType = 'tow_truck';
    }

    if (!$profile) {
        return false;
    }

    $isRegistered = $auction->registrations()
        ->where('user_id', $profile->id)
        ->where('user_type', $userType)
        ->where('status', 'registered')
        ->exists();

    if (!$isRegistered) {
        return false;
    }

    return [
        'id' => $profile->id,
        'name' => mb_substr($profile->name, 0, 1) . '***', // Anonymized
        'type' => $userType,
    ];
});

// Public auction updates channel (for listing pages)
Broadcast::channel('auctions', function () {
    return true; // Public channel
});

// Single auction public updates channel (for list items)
Broadcast::channel('auction-updates.{auctionId}', function () {
    return true; // Public channel
});
