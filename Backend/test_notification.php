<?php

use App\Models\User;
use App\Models\InternationalLicenseRequest;
use App\Notifications\InternationalLicenseNotification;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Starting Notification Test ---\n";

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
$request->order_number = 'IL-TEST-' . time();
$request->full_name = 'Debug User';
$request->status = 'pending';
$request->admin_note = null;
// We need to set relations if accessed, but here it's just passed to notification constructor

echo "Mock Request Created: Order #{$request->order_number}\n";

// 3. Send Notification
echo "Dispatching Notification...\n";
try {
    $user->notify(new InternationalLicenseNotification($request, 'new'));
    echo "Notify method called successfully.\n";
} catch (\Throwable $e) {
    echo "EXCEPTION calling notify(): " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

// 4. Verify Database
echo "Checking 'notifications' table...\n";
$latest = DB::table('notifications')
    ->where('notifiable_id', $user->id)
    ->where('type', 'App\Notifications\InternationalLicenseNotification')
    ->latest()
    ->first();

if ($latest) {
    echo "SUCCESS: Notification found in database!\n";
    echo "ID: " . $latest->id . "\n";
    echo "Data: " . $latest->data . "\n";
} else {
    echo "FAILURE: Notification NOT found in database.\n";
    // Check if it's queued
    $jobs = DB::table('jobs')->count();
    echo "Pending Jobs in 'jobs' table: $jobs\n";
    
    $failed = DB::table('failed_jobs')->latest()->first();
    if ($failed) {
        echo "Latest Failed Job ({$failed->failed_at}): {$failed->exception}\n";
    }
}
echo "--- Test Finished ---\n";
