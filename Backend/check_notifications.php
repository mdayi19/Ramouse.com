<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notification;

echo "=== CHECKING NOTIFICATIONS IN DATABASE ===\n\n";

$notifications = Notification::all();

echo "Total notifications: " . $notifications->count() . "\n\n";

if ($notifications->count() > 0) {
    echo "Listing all notifications:\n";
    echo str_repeat("-", 80) . "\n";

    foreach ($notifications as $notif) {
        echo "ID: {$notif->id}\n";
        echo "User ID: {$notif->user_id}\n";
        echo "Title: {$notif->title}\n";
        echo "Message: {$notif->message}\n";
        echo "Type: {$notif->type}\n";
        echo "Read: " . ($notif->read ? 'Yes' : 'No') . "\n";
        echo "Created: {$notif->created_at}\n";
        echo str_repeat("-", 80) . "\n";
    }
} else {
    echo "No notifications found in database.\n";
}

echo "\n=== CHECKING USER ===\n\n";

// Check if user exists
$phone = '+905319624826';
$customer = \App\Models\Customer::where('phone', $phone)->first();
$admin = \App\Models\User::where('phone', $phone)->first();

if ($customer) {
    echo "✅ Found as Customer\n";
    echo "   Phone: {$customer->phone}\n";
    echo "   Name: {$customer->name}\n";
} elseif ($admin) {
    echo "✅ Found as Admin\n";
    echo "   Phone: {$admin->phone}\n";
    echo "   Email: {$admin->email}\n";
} else {
    echo "❌ User not found with phone: {$phone}\n";
}
