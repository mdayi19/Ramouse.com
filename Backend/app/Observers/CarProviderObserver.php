<?php

namespace App\Observers;

use App\Models\CarProvider;
use Illuminate\Support\Facades\Cache;

class CarProviderObserver
{
    /**
     * Handle the CarProvider "created" event.
     */
    public function created(CarProvider $provider): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the CarProvider "updated" event.
     */
    public function updated(CarProvider $provider): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the CarProvider "deleted" event.
     */
    public function deleted(CarProvider $provider): void
    {
        $this->clearCaches();
    }

    /**
     * Clear all relevant caches
     */
    private function clearCaches(): void
    {
        Cache::forget('sitemap:car-providers');
    }
}
