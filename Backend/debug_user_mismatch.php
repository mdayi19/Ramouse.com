<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Customer;
use App\Models\Notification;

echo "=== CHECKING YOUR LOGIN ===\n\n";

// Check all customers
$customers = Customer::all();
echo "Total customers: " . $customers->count() . "\n\n";

foreach ($customers as $customer) {
    echo "Customer ID (phone): {$customer->id}\n";
    echo "Name: {$customer->name}\n";

    // Count notifications for this customer
    $notifCount = Notification::where('user_id', $customer->id)->count();
    echo "Notifications: {$notifCount}\n";
    echo str_repeat("-", 80) . "\n";
}

echo "\n=== ALL NOTIFICATIONS ===\n\n";
$allNotifs = Notification::all();
foreach ($allNotifs as $notif) {
    echo "User: {$notif->user_id} | Title: {$notif->title}\n";
}

echo "\n=== SOLUTION ===\n\n";
echo "It looks like you're logged in as one phone number,\n";
echo "but notifications were created for a different number!\n\n";
echo "Which customer ID (phone number) are you logged in as?\n";
echo "Check the browser console or localStorage.getItem('userPhone')\n";
