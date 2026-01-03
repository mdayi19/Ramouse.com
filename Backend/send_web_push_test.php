<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Notifications\GenericWebPushNotification;

$userId = $argv[1] ?? null;

if (!$userId) {
    echo "❌ Error: Please provide a User ID or Phone Number.\n";
    echo "Usage: php send_web_push_test.php <user_id_or_phone>\n";
    exit(1);
}

// Try to find user by ID or Phone
$user = User::find($userId) ?? User::where('phone', $userId)->first();

if (!$user) {
    echo "❌ Error: User not found with ID/Phone: {$userId}\n";
    exit(1);
}

echo "📱 Sending WEB PUSH notification to: {$user->name} ({$user->phone})\n";

try {
    $user->notify(new GenericWebPushNotification(
        '🔔 Test Web Push',
        'If you see this, VAPID keys are working correctly!',
        '/',
        'Open App'
    ));
    echo "✅ Notification queued/sent! Check your device.\n";
    echo "NOTE: If it doesn't appear, check:\n";
    echo "  1. 'push_subscriptions' table (must have a record for this user)\n";
    echo "  2. Browser permissions\n";
    echo "  3. VAPID keys match between .env and frontend build\n";
} catch (\Exception $e) {
    echo "❌ Error sending notification: " . $e->getMessage() . "\n";
}
