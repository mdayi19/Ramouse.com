<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notification;
use App\Events\UserNotification;

// Your phone number
$phone = $argv[1] ?? '+963912345678';

echo "📱 Sending notification to: {$phone}\n";

// Create notification in database
$notification = Notification::create([
    'user_id' => $phone,
    'title' => '🎉 اختبار النظام',
    'message' => 'مرحباً! نظام الإشعارات يعمل بنجاح الآن',
    'type' => 'success',
    'read' => false,
]);

echo "✅ Notification created with ID: {$notification->id}\n";

// Broadcast in real-time via Reverb
event(new UserNotification($phone, $notification->toArray()));

echo "📡 Notification broadcasted via Reverb\n";
echo "\n";
echo "Now check your browser - you should see:\n";
echo "  - Bell icon 🔔 with badge (1)\n";
echo "  - Console log: 🔔 New notification:\n";
echo "  - Notification in the dropdown\n";
echo "\n";
echo "✨ Done!\n";
