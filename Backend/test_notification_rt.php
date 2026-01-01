<?php

use App\Models\User;
use App\Models\Notification;
use App\Models\InternationalLicenseRequest;
use App\Notifications\InternationalLicenseNotification;
use Illuminate\Support\Facades\DB;
use App\Events\UserNotification;

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Starting REAL-TIME Verification Script ---\n";

// 1. Find a user
$user = User::first();
if (!$user) {
    die("Error: No users found in database.\n");
}
echo "Target User: {$user->email} (ID: {$user->id})\n";

// 2. Mock a Request
$request = new InternationalLicenseRequest();
$request->id = 99999;
$request->user_id = $user->id;
$request->order_number = 'IL-RT-TEST-' . time();
$request->full_name = 'RealTime User';
$request->status = 'pending';
$request->setRelation('user', $user);

echo "Mock Request Created: Order #{$request->order_number}\n";

// 3. Simulate New Controller Logic
try {
    echo "Simulating notification logic...\n";
    $notificationInstance = new InternationalLicenseNotification($request, 'new');
    $notificationData = $notificationInstance->toArray($user);

    // 1. Manual Creation
    echo "Creating DB Notification...\n";
    $dbNotification = Notification::create([
        'user_id' => $user->id,
        'title' => $notificationData['title'],
        'message' => $notificationData['message'],
        'type' => 'INTERNATIONAL_LICENSE_NEW_RT',
        'link' => ['view' => 'userDashboard', 'params' => ['page' => 'international-licenses']],
        'context' => $notificationData,
        'read' => false,
    ]);
    echo "DB Notification created with ID: {$dbNotification->id}\n";

    // 2. Broadcast Event (New Logic)
    echo "Dispatching 'UserNotification' Event...\n";
    event(new UserNotification($user->id, [
        'id' => $dbNotification->id,
        'title' => $dbNotification->title,
        'message' => $dbNotification->message,
        'type' => $dbNotification->type,
        'timestamp' => $dbNotification->created_at->toIso8601String(),
        'read' => false,
        'link' => $dbNotification->link,
    ]));
    echo "Event dispatched successfully.\n";

} catch (\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

// 4. Verify Database
echo "Verifying 'notifications' table...\n";
$latest = DB::table('notifications')
    ->where('id', $dbNotification->id)
    ->first();

if ($latest) {
    echo "SUCCESS: Notification found in database!\n";
    echo "ID: " . $latest->id . "\n";
    echo "Type: " . $latest->type . "\n";
} else {
    echo "FAILURE: Notification NOT found in database.\n";
}

echo "--- Verification Finished ---\n";
