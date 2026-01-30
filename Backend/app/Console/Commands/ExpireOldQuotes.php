<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Quote;
use App\Models\SystemSettings;
use Carbon\Carbon;

class ExpireOldQuotes extends Command
{
    protected $signature = 'quotes:expire-old';
    protected $description = 'Expire old quotes based on configured validity days';

    public function handle()
    {
        $limitSettings = SystemSettings::getSetting('limitSettings');
        $days = $limitSettings['quoteValidityDays'] ?? 7;

        $cutoffDate = Carbon::now()->subDays($days);

        // Only expire quotes where order is still pending/quoted
        $expiredCount = Quote::where('created_at', '<', $cutoffDate)
            ->whereHas('order', function ($q) {
                $q->whereIn('status', ['pending', 'quoted']);
            })
            ->whereNull('expired_at')
            ->update([
                'expired_at' => now(),
                'updated_at' => now()
            ]);

        $this->info("Expired {$expiredCount} quotes older than {$days} days.");

        return 0;
    }
}
