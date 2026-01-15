<?php

use Illuminate\Contracts\Console\Kernel;

require __DIR__ . '/../../Backend/vendor/autoload.php';

$app = require_once __DIR__ . '/../../Backend/bootstrap/app.php';

$app->make(Kernel::class)->bootstrap();

// Debug Logic
try {
    echo "<h1>Analytics Debug</h1>";

    $providerCount = \App\Models\CarProvider::count();
    echo "<p>Total Providers: $providerCount</p>";

    $listingCount = \App\Models\CarListing::count();
    echo "<p>Total Listings: $listingCount</p>";

    $analyticsCount = \App\Models\CarListingAnalytic::count();
    echo "<p>Total Analytics Events: $analyticsCount</p>";

    // Check specific user if we knew the ID, but for now just general stats
    $providerListings = \App\Models\CarListing::where('seller_type', 'provider')->count();
    echo "<p>Provider Listings: $providerListings</p>";

    // Check if any analytics exist for provider listings
    $providerListingIds = \App\Models\CarListing::where('seller_type', 'provider')->pluck('id');
    $providerAnalytics = \App\Models\CarListingAnalytic::whereIn('car_listing_id', $providerListingIds)->count();
    echo "<p>Analytics for Provider Listings: $providerAnalytics</p>";

    // Show last 5 analytics entries
    $lastEvents = \App\Models\CarListingAnalytic::latest('created_at')->take(5)->get();
    echo "<h3>Last 5 Events:</h3>";
    echo "<pre>";
    foreach ($lastEvents as $event) {
        echo "ID: {$event->id}, Type: {$event->event_type}, Created: {$event->created_at}\n";
    }
    echo "</pre>";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
