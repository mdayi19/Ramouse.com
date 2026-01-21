<?php

use Illuminate\Support\Facades\Route;
use App\Models\Notification;
use App\Http\Controllers\Api\SocialShareController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('home');
})->name('home');

// ===== FEED VANITY URLS (SEO) =====
// Redirect standard feed guesses to actual endpoints
Route::redirect('/feed', '/api/feed/car-listings.xml');
Route::redirect('/feeds', '/api/feed/car-listings.xml');
Route::redirect('/rss', '/api/feed/car-listings.xml');
Route::redirect('/atom', '/api/feed/car-listings.xml');
Route::redirect('/sitemap.xml', '/api/sitemap.xml'); // Root sitemap redirect

// ===== SOCIAL MEDIA PREVIEW ROUTES =====
// Serve HTML with Open Graph meta tags for social media crawlers
Route::get('/car-listings/{slug}', [SocialShareController::class, 'getCarListingMeta']);
Route::get('/rent-car/{slug}', [SocialShareController::class, 'getRentCarListingMeta']);
Route::get('/car-providers/{id}', [SocialShareController::class, 'getProviderMeta']);
Route::get('/store/products/{id}', [SocialShareController::class, 'getProductMeta']);

// ===== TEST ROUTES =====
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
            'payload' => $n->data
        ])
    ]);
});

Route::post('/test-send-notification', function (Illuminate\Http\Request $request) {
    try {
        $userId = $request->input('user_id', '+905319624826');

        $notification = Notification::create([
            'user_id' => $userId,
            'title' => '🔔 Test Notification',
            'message' => 'Real-time broadcast test ' . now()->toTimeString(),
            'type' => 'info',
            'read' => false,
            'data' => ['test_id' => uniqid()]
        ]);

        broadcast(new \App\Events\UserNotification($userId, $notification->toArray()))->toOthers();

        return response()->json(['success' => true, 'id' => $notification->id]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});
