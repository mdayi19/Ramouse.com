<?php

namespace App\Console\Commands;

use App\Models\CarListing;
use App\Models\CarListingAnalytic;
use App\Models\CarListingDailyStat;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AggregateCarAnalytics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:aggregate 
                            {--date= : Specific date to aggregate (YYYY-MM-DD format)}
                            {--days=1 : Number of days to look back from today}
                            {--force : Force re-aggregation even if data exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Aggregate car listing analytics events into daily statistics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $startTime = microtime(true);

        // Determine which date(s) to process
        if ($this->option('date')) {
            $dates = [Carbon::parse($this->option('date'))];
        } else {
            $daysBack = (int) $this->option('days');
            $dates = [];
            for ($i = 1; $i <= $daysBack; $i++) {
                $dates[] = Carbon::today()->subDays($i);
            }
        }

        $totalProcessed = 0;
        $totalCreated = 0;
        $totalUpdated = 0;

        foreach ($dates as $date) {
            $this->info("Processing analytics for: {$date->toDateString()}");
            
            $result = $this->aggregateForDate($date);
            
            $totalProcessed += $result['processed'];
            $totalCreated += $result['created'];
            $totalUpdated += $result['updated'];
        }

        $duration = round(microtime(true) - $startTime, 2);

        $this->info("✅ Analytics aggregation completed in {$duration}s");
        $this->info("   Listings processed: {$totalProcessed}");
        $this->info("   Stats created: {$totalCreated}");
        $this->info("   Stats updated: {$totalUpdated}");

        Log::info("[Analytics] Aggregation completed", [
            'processed' => $totalProcessed,
            'created' => $totalCreated,
            'updated' => $totalUpdated,
            'duration_seconds' => $duration
        ]);

        return Command::SUCCESS;
    }

    /**
     * Aggregate analytics for a specific date
     */
    private function aggregateForDate(Carbon $date): array
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();
        $forceUpdate = $this->option('force');

        $result = [
            'processed' => 0,
            'created' => 0,
            'updated' => 0
        ];

        // Get all listings that had analytics events on this date
        $listingsWithEvents = CarListingAnalytic::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->distinct()
            ->pluck('car_listing_id');

        if ($listingsWithEvents->isEmpty()) {
            $this->line("   No analytics events found for {$date->toDateString()}");
            return $result;
        }

        $this->info("   Found {$listingsWithEvents->count()} listings with events");

        foreach ($listingsWithEvents as $listingId) {
            // Check if stat already exists
            $existingStat = CarListingDailyStat::where('car_listing_id', $listingId)
                ->where('date', $date->toDateString())
                ->first();

            if ($existingStat && !$forceUpdate) {
                $this->line("   Skipping listing #{$listingId} - stats already exist");
                continue;
            }

            // Aggregate events for this listing
            $events = CarListingAnalytic::where('car_listing_id', $listingId)
                ->whereBetween('created_at', [$startOfDay, $endOfDay])
                ->get();

            // Calculate metrics
            $totalViews = $events->where('event_type', 'view')->count();
            $uniqueVisitors = $events->where('event_type', 'view')->unique('user_ip')->count();
            $phoneClicks = $events->where('event_type', 'contact_phone')->count();
            $whatsappClicks = $events->where('event_type', 'contact_whatsapp')->count();
            $favorites = $events->where('event_type', 'favorite')->count();
            $shares = $events->where('event_type', 'share')->count();

            // Create or update daily stat
            $data = [
                'total_views' => $totalViews,
                'unique_visitors' => $uniqueVisitors,
                'contact_phone_clicks' => $phoneClicks,
                'contact_whatsapp_clicks' => $whatsappClicks,
                'favorites' => $favorites,
                'shares' => $shares,
            ];

            if ($existingStat) {
                $existingStat->update($data);
                $result['updated']++;
            } else {
                CarListingDailyStat::create([
                    'car_listing_id' => $listingId,
                    'date' => $date->toDateString(),
                    ...$data
                ]);
                $result['created']++;
            }

            $result['processed']++;
        }

        return $result;
    }
}
