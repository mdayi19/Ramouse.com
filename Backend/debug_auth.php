<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Notification;

$phone = '+905319624826';

echo "=== AUTHENTICATION & AUTHORIZATION DEBUG ===\n\n";

// 1. Check if admin user exists
echo "1. Checking Admin User:\n";
$admin = User::where('phone', $phone)->first();
if ($admin) {
    echo "   ✅ Admin found\n";
    echo "   - ID: {$admin->id}\n";
    echo "   - Email: {$admin->email}\n";
    echo "   - Phone: " . ($admin->phone ?? 'NULL') . "\n";
    echo "   - is_admin: " . ($admin->is_admin ?? 'NULL') . "\n";
} else {
    echo "   ❌ Admin NOT FOUND\n";
    exit(1);
}

// 2. Check notifications for this user
echo "\n2. Checking Notifications:\n";
$notifications = Notification::where('user_id', $phone)->get();
echo "   Total notifications for {$phone}: " . $notifications->count() . "\n";
foreach ($notifications as $notif) {
    echo "   - {$notif->title} (Read: " . ($notif->read ? 'Yes' : 'No') . ")\n";
}

// 3. Test channel authorization logic
echo "\n3. Testing Channel Authorization Logic:\n";
$userId = $phone;

// Simulate the authorization check from channels.php
$authorized = $admin->id === $userId ||
    ($admin->phone ?? null) === $userId ||
    ($admin->email ?? null) === $userId;

echo "   Checking if user can access channel 'user.{$userId}':\n";
echo "   - admin->id === userId: " . ($admin->id === $userId ? 'TRUE' : 'FALSE') . "\n";
echo "   - admin->phone === userId: " . (($admin->phone ?? null) === $userId ? 'TRUE' : 'FALSE') . "\n";
echo "   - admin->email === userId: " . (($admin->email ?? null) === $userId ? 'TRUE' : 'FALSE') . "\n";
echo "   - RESULT: " . ($authorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED') . "\n";

// 4. Check tokens
echo "\n4. Checking Sanctum Tokens:\n";
$tokens = \DB::table('personal_access_tokens')
    ->where('tokenable_type', 'App\\Models\\User')
    ->where('tokenable_id', $admin->id)
    ->get();

echo "   Total tokens for this admin: " . $tokens->count() . "\n";
if ($tokens->count() > 0) {
    foreach ($tokens as $token) {
        echo "   - Token: " . substr($token->token, 0, 20) . "...\n";
        echo "     Last used: " . ($token->last_used_at ?? 'Never') . "\n";
    }
} else {
    echo "   ⚠️ NO TOKENS FOUND - User needs to login!\n";
}

// 5. Problem diagnosis
echo "\n=== DIAGNOSIS ===\n\n";

if ($tokens->count() === 0) {
    echo "❌ PROBLEM: No auth tokens exist\n";
    echo "   SOLUTION: Login to the app to create a token\n";
    echo "   The user is probably just viewing the welcome page, not logged in.\n";
} elseif (!$authorized) {
    echo "❌ PROBLEM: Channel authorization failing\n";
    echo "   The admin ID ({$admin->id}) doesn't match the user_id in notifications ({$phone})\n";
    echo "   SOLUTION: Update notifications to use admin->id instead of admin->phone\n";
} else {
    echo "✅ AUTH LOOKS GOOD\n";
    echo "   POSSIBLE ISSUES:\n";
    echo "   1. Frontend Echo config wrong\n";
    echo "   2. Token not being sent with requests\n";
    echo "   3. Browser console showing errors\n";
}

echo "\n=== RECOMMENDED USER_ID FOR NOTIFICATIONS ===\n";
echo "Use THIS as user_id: {$admin->id}\n";
echo "(Currently using: {$phone})\n\n";

// Fix: Update existing notifications
echo "=== FIXING EXISTING NOTIFICATIONS ===\n";
$updated = Notification::where('user_id', $phone)->update(['user_id' => $admin->id]);
echo "Updated {$updated} notifications from '{$phone}' to '{$admin->id}'\n\n";

// Verify
$count = Notification::where('user_id', $admin->id)->count();
echo "✅ Admin now has {$count} notifications\n";
