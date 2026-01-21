<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register observer to fix tokenable_id for phone number-based models
        \Laravel\Sanctum\PersonalAccessToken::observe(\App\Observers\PersonalAccessTokenObserver::class);

        // Register GEO observers for automatic sitemap/feed cache invalidation
        \App\Models\CarListing::observe(\App\Observers\CarListingObserver::class);
        \App\Models\CarProvider::observe(\App\Observers\CarProviderObserver::class);
        \App\Models\Technician::observe(\App\Observers\TechnicianObserver::class);
        \App\Models\TowTruck::observe(\App\Observers\TowTruckObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);
    }

}
