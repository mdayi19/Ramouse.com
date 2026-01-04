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
// User-specific private channel
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Provider-specific channel for Direct Orders/Quotes
Broadcast::channel('provider.{id}.orders', function ($user, $id) {
    // ID here is the User ID of the provider (since we consistently use User ID for auth now)
    return (int) $user->id === (int) $id && $user->role === 'provider';
});

// General channel for all providers (e.g. Open Market Orders)
Broadcast::channel('providers.updates', function ($user) {
    return $user->role === 'provider';
});

// Order-specific private channel
Broadcast::channel('orders.{orderNumber}', function ($user, $orderNumber) {
    $order = \App\Models\Order::where('order_number', $orderNumber)->first();
    if (!$order) {
        return false;
    }

    // 1. Order Creator
    if ($order->user_id === $user->phone || (int) $order->user_id === (int) $user->id) {
        return true;
    }

    // 2. Quoting Providers
    // We check if this user (via phone) has submitted a quote
    if (
        isset($user->phone) && \App\Models\Quote::where('order_number', $orderNumber)
            ->where('provider_id', $user->phone)
            ->exists()
    ) {
        return true;
    }

    // 3. Admin
    if ($user->role === 'admin') {
        return true;
    }

    return false;
});

// Admin channels
Broadcast::channel('admin.orders', function ($user) {
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
