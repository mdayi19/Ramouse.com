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
// ===== FEED VANITY URLS (SEO) =====
// Served directly from web routes for better SEO and AI discovery
Route::get('/feed/car-listings.xml', [App\Http\Controllers\FeedController::class, 'carListings']);
Route::get('/feed/car-rentals.xml', [App\Http\Controllers\FeedController::class, 'carRentals']);
Route::get('/feed/products.xml', [App\Http\Controllers\FeedController::class, 'products']);
Route::get('/feed/car-providers.xml', [App\Http\Controllers\FeedController::class, 'carProviders']);
Route::get('/feed/technicians.xml', [App\Http\Controllers\FeedController::class, 'technicians']);
Route::get('/feed/tow-trucks.xml', [App\Http\Controllers\FeedController::class, 'towTrucks']);

// Redirect legacy/generic feed URLs to the main car listings feed
Route::redirect('/feed', '/feed/car-listings.xml');
Route::redirect('/feeds', '/feed/car-listings.xml');
Route::redirect('/rss', '/feed/car-listings.xml');
Route::redirect('/atom', '/feed/car-listings.xml');

// ===== SITEMAPS (DIRECT ROOT ACCESS FOR SEO) =====
// Served directly from web routes to avoid redirects and satisfy strict crawlers (Bing)
Route::get('/sitemap.xml', [App\Http\Controllers\SitemapController::class, 'index']);
Route::get('/sitemap/static-pages.xml', [App\Http\Controllers\SitemapController::class, 'staticPages']);
Route::get('/sitemap/car-listings.xml', [App\Http\Controllers\SitemapController::class, 'carListings']);
Route::get('/sitemap/car-rentals.xml', [App\Http\Controllers\SitemapController::class, 'carRentals']);
Route::get('/sitemap/car-providers.xml', [App\Http\Controllers\SitemapController::class, 'carProviders']);
Route::get('/sitemap/technicians.xml', [App\Http\Controllers\SitemapController::class, 'technicians']);
Route::get('/sitemap/tow-trucks.xml', [App\Http\Controllers\SitemapController::class, 'towTrucks']);
Route::get('/sitemap/products.xml', [App\Http\Controllers\SitemapController::class, 'products']);
Route::get('/sitemap/blog-posts.xml', [App\Http\Controllers\SitemapController::class, 'blogPosts']);

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
