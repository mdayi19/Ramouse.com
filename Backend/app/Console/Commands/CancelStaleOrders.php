<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\SystemSettings;
use Carbon\Carbon;

class CancelStaleOrders extends Command
{
    protected $signature = 'orders:cancel-stale';
    protected $description = 'Auto-cancel old pending orders based on configured days';

    public function handle()
    {
        $limitSettings = SystemSettings::getSetting('limitSettings');
        $days = $limitSettings['orderAutoCancelDays'] ?? 30;

        $cutoffDate = Carbon::now()->subDays($days);

        $cancelledCount = Order::where('created_at', '<', $cutoffDate)
            ->whereIn('status', ['pending', 'open'])
            ->update([
                'status' => 'auto_cancelled',
                'updated_at' => now()
            ]);

        $this->info("Cancelled {$cancelledCount} stale orders older than {$days} days.");

        return 0;
    }
}
