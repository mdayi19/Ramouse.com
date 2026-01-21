<?php

namespace App\Observers;

use App\Models\TowTruck;
use Illuminate\Support\Facades\Cache;

class TowTruckObserver
{
    /**
     * Handle the TowTruck "created" event.
     */
    public function created(TowTruck $towTruck): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the TowTruck "updated" event.
     */
    public function updated(TowTruck $towTruck): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the TowTruck "deleted" event.
     */
    public function deleted(TowTruck $towTruck): void
    {
        $this->clearCaches();
    }

    /**
     * Clear all relevant caches
     */
    private function clearCaches(): void
    {
        Cache::forget('sitemap:tow-trucks');
    }
}
