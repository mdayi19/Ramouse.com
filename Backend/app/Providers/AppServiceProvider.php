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
    }
}
