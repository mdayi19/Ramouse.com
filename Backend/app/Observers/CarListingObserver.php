<?php

namespace App\Observers;

use App\Models\CarListing;
use Illuminate\Support\Facades\Cache;

class CarListingObserver
{
    /**
     * Handle the CarListing "created" event.
     */
    public function created(CarListing $listing): void
    {
        $this->clearCaches($listing);
    }

    /**
     * Handle the CarListing "updated" event.
     */
    public function updated(CarListing $listing): void
    {
        $this->clearCaches($listing);
    }

    /**
     * Handle the CarListing "deleted" event.
     */
    public function deleted(CarListing $listing): void
    {
        $this->clearCaches($listing);
    }

    /**
     * Clear all relevant caches
     */
    private function clearCaches(CarListing $listing): void
    {
        // Clear sitemap caches
        Cache::forget('sitemap:car-listings');
        Cache::forget('sitemap:car-rentals');

        // Clear feed caches
        Cache::forget('feed:car-listings');
        Cache::forget('feed:car-rentals');

        // Clear provider cache if this listing belongs to a provider
        if ($listing->seller_type === 'provider') {
            Cache::forget('sitemap:car-providers');
        }
    }
}
