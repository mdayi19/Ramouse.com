<?php

use Illuminate\Support\Facades\Route;
use App\Models\Notification;

Route::get('/', function () {
    return view('home');
})->name('home');



Route::get('/test-notifications/{userId}', function ($userId) {
    $notifications = Notification::forUser($userId)->recent()->limit(10)->get();
    return response()->json([
        'total' => $notifications->count(),
        'notifications' => $notifications->map(fn($n) => [
            'id' => $n->id,
            'title' => $n->title,
            'message' => substr($n->message, 0, 50),
            'created_at' => $n->created_at,
            'read' => $n->read,
        ])
    ]);
});

Route::post('/test-send-notification', function (Illuminate\Http\Request $request) {
    $userId = $request->input('user_id', '+905319624826');

    // Create notification
    $notification = Notification::create([
        'user_id' => $userId,
        'title' => '🔔 Test Real-Time Notification',
        'message' => 'This is a test notification to verify real-time broadcasting is working! 🎉',
        'type' => 'info',
        'read' => false,
    ]);

    // Broadcast real-time
    event(new \App\Events\UserNotification($userId, $notification->toArray()));

    return response()->json([
        'success' => true,
        'message' => 'Test notification sent!',
        'notification' => $notification,
        'user_id' => $userId,
    ]);
});

Route::get('/test-notifications/{userId}', function ($userId) {
    $notifications = Notification::forUser($userId)->recent()->limit(10)->get();
    return response()->json([
        'total' => $notifications->count(),
        'notifications' => $notifications->map(fn($n) => [
            'id' => $n->id,
            'title' => $n->title,
            'message' => substr($n->message, 0, 50),
            'created_at' => $n->created_at,
            'read' => $n->read,
        ])
    ]);
});

// ===== SOCIAL MEDIA PREVIEW ROUTES =====
// Serve HTML with Open Graph meta tags for social media crawlers
use App\Http\Controllers\Api\SocialShareController;

Route::get('/car-listings/{slug}', [SocialShareController::class, 'getCarListingMeta']);
Route::get('/rent-car/{slug}', [SocialShareController::class, 'getRentCarListingMeta']);
Route::get('/car-providers/{id}', [SocialShareController::class, 'getProviderMeta']);
Route::get('/store/products/{id}', [SocialShareController::class, 'getProductMeta']);

