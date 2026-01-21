<?php

namespace App\Observers;

use App\Models\Technician;
use Illuminate\Support\Facades\Cache;

class TechnicianObserver
{
    /**
     * Handle the Technician "created" event.
     */
    public function created(Technician $technician): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Technician "updated" event.
     */
    public function updated(Technician $technician): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Technician "deleted" event.
     */
    public function deleted(Technician $technician): void
    {
        $this->clearCaches();
    }

    /**
     * Clear all relevant caches
     */
    private function clearCaches(): void
    {
        Cache::forget('sitemap:technicians');
    }
}
