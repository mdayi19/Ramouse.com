# Car Listings Scheduler & Background Jobs

## 🕐 Automated Tasks & Cron Jobs

Complete documentation for all scheduled tasks, background jobs, and queue workers.

---

## 1. Laravel Scheduler Setup

### app/Console/Kernel.php

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\CarListing;
use App\Models\CarListingAnalytics;
use App\Models\CarListingDailyStats;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ===================================
        // 1. EXPIRE SPONSORED LISTINGS
        // ===================================
        // Run: Daily at 00:01 AM
        // Purpose: Auto-expire sponsored listings
        $schedule->call(function () {
            $expired = CarListing::where('is_sponsored', true)
                ->where('sponsored_until', '<=', now())
                ->update([
                    'is_sponsored' => false,
                    'sponsored_until' => null
                ]);
            
            \Log::info("Expired {$expired} sponsored listings");
        })
        ->dailyAt('00:01')
        ->name('expire-sponsored-listings')
        ->withoutOverlapping()
        ->onOneServer();
        
        
        // ===================================
        // 2. EXPIRE FEATURED LISTINGS
        // ===================================
        // Run: Daily at 00:02 AM
        // Purpose: Auto-expire admin featured listings
        $schedule->call(function () {
            $expired = CarListing::where('is_featured', true)
                ->where('featured_until', '<=', now())
                ->update([
                    'is_featured' => false,
                    'featured_until' => null,
                    'featured_position' => null
                ]);
            
            \Log::info("Expired {$expired} featured listings");
        })
        ->dailyAt('00:02')
        ->name('expire-featured-listings')
        ->withoutOverlapping()
        ->onOneServer();
        
        
        // ===================================
        // 3. AGGREGATE DAILY ANALYTICS
        // ===================================
        // Run: Daily at 02:00 AM
        // Purpose: Aggregate raw analytics into daily stats
        $schedule->call(function () {
            $yesterday = Carbon::yesterday()->format('Y-m-d');
            
            // Get all listings that had activity yesterday
            $listings = CarListingAnalytics::whereDate('created_at', $yesterday)
                ->distinct()
                ->pluck('car_listing_id');
            
            foreach ($listings as $listingId) {
                // Aggregate stats for this listing
                $stats = CarListingAnalytics::where('car_listing_id', $listingId)
                    ->whereDate('created_at', $yesterday)
                    ->select([
                        DB::raw('COUNT(*) as total_events'),
                        DB::raw("SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as total_views"),
                        DB::raw("COUNT(DISTINCT user_ip) as unique_visitors"),
                        DB::raw("SUM(CASE WHEN event_type = 'contact_phone' THEN 1 ELSE 0 END) as contact_phone_clicks"),
                        DB::raw("SUM(CASE WHEN event_type = 'contact_whatsapp' THEN 1 ELSE 0 END) as contact_whatsapp_clicks"),
                        DB::raw("SUM(CASE WHEN event_type = 'favorite' THEN 1 ELSE 0 END) as favorites"),
                        DB::raw("SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END) as shares"),
                    ])
                    ->first();
                
                // Create or update daily stats
                CarListingDailyStats::updateOrCreate(
                    [
                        'car_listing_id' => $listingId,
                        'date' => $yesterday
                    ],
                    [
                        'total_views' => $stats->total_views ?? 0,
                        'unique_visitors' => $stats->unique_visitors ?? 0,
                        'contact_phone_clicks' => $stats->contact_phone_clicks ?? 0,
                        'contact_whatsapp_clicks' => $stats->contact_whatsapp_clicks ?? 0,
                        'favorites' => $stats->favorites ?? 0,
                        'shares' => $stats->shares ?? 0,
                    ]
                );
            }
            
            \Log::info("Aggregated daily stats for {$listings->count()} listings");
        })
        ->dailyAt('02:00')
        ->name('aggregate-daily-analytics')
        ->withoutOverlapping()
        ->onOneServer();
        
        
        // ===================================
        // 4. ARCHIVE OLD ANALYTICS
        // ===================================
        // Run: Monthly on 1st at 03:00 AM
        // Purpose: Delete raw analytics older than 6 months
        $schedule->command('analytics:archive-old')
            ->monthlyOn(1, '03:00')
            ->name('archive-old-analytics')
            ->withoutOverlapping()
            ->onOneServer();
        
        
        // ===================================
        // 5. CLEANUP SOFT DELETED LISTINGS
        // ===================================
        // Run: Daily at 04:00 AM
        // Purpose: Permanently delete soft-deleted listings after 30 days
        $schedule->call(function () {
            $deleted = CarListing::onlyTrashed()
                ->where('deleted_at', '<=', now()->subDays(30))
                ->forceDelete();
            
            \Log::info("Permanently deleted {$deleted} old soft-deleted listings");
        })
        ->dailyAt('04:00')
        ->name('cleanup-soft-deleted')
        ->withoutOverlapping()
        ->onOneServer();
        
        
        // ===================================
        // 6. NOTIFY LOW WALLET BALANCE
        // ===================================
        // Run: Weekly on Monday at 09:00 AM
        // Purpose: Notify providers with low wallet balance
        $schedule->call(function () {
            $providers = \App\Models\CarProvider::where('wallet_balance', '<', 50)
                ->where('wallet_balance', '>', 0)
                ->get();
            
            foreach ($providers as $provider) {
                // Send notification
                $provider->user->notify(new \App\Notifications\LowWalletBalance($provider));
            }
            
            \Log::info("Sent low balance notifications to {$providers->count()} providers");
        })
        ->weeklyOn(1, '09:00')
        ->name('notify-low-wallet-balance')
        ->withoutOverlapping()
        ->onOneServer();
        
        
        // ===================================
        // 7. GENERATE SITEMAP
        // ===================================
        // Run: Daily at 05:00 AM
        // Purpose: Regenerate sitemap.xml for SEO
        $schedule->command('sitemap:generate')
            ->dailyAt('05:00')
            ->name('generate-sitemap')
            ->withoutOverlapping()
            ->onOneServer();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
```

---

## 2. Custom Artisan Commands

### app/Console/Commands/ArchiveOldAnalytics.php

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CarListingAnalytics;
use Carbon\Carbon;

class ArchiveOldAnalytics extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'analytics:archive-old {--days=180}';

    /**
     * The console command description.
     */
    protected $description = 'Archive and delete old analytics data (default: 180 days)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $cutoffDate = Carbon::now()->subDays($days);
        
        $this->info("Archiving analytics older than {$cutoffDate->format('Y-m-d')}");
        
        // Count records to be deleted
        $count = CarListingAnalytics::where('created_at', '<', $cutoffDate)->count();
        
        if ($count === 0) {
            $this->info('No old analytics to archive.');
            return 0;
        }
        
        // Confirm before deleting
        if (!$this->confirm("This will delete {$count} analytics records. Continue?", true)) {
            $this->warn('Operation cancelled.');
            return 1;
        }
        
        // Delete old records
        $deleted = CarListingAnalytics::where('created_at', '<', $cutoffDate)->delete();
        
        $this->info("Successfully archived and deleted {$deleted} analytics records.");
        
        // Log the action
        \Log::info("Archived old analytics", [
            'cutoff_date' => $cutoffDate,
            'records_deleted' => $deleted
        ]);
        
        return 0;
    }
}
```

---

### app/Console/Commands/GenerateSitemap.php

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CarListing;
use App\Models\CarProvider;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';
    protected $description = 'Generate sitemap.xml for SEO';

    public function handle()
    {
        $this->info('Generating sitemap...');
        
        $sitemap = Sitemap::create();
        
        // Add static pages
        $sitemap->add(Url::create('/')
            ->setPriority(1.0)
            ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));
        
        $sitemap->add(Url::create('/car-marketplace')
            ->setPriority(0.9)
            ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));
        
        $sitemap->add(Url::create('/rent-car')
            ->setPriority(0.9)
            ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));
        
        // Add car listings
        CarListing::where('is_available', true)
            ->where('is_hidden', false)
            ->whereNull('deleted_at')
            ->chunk(500, function($listings) use ($sitemap) {
                foreach ($listings as $listing) {
                    $sitemap->add(Url::create("/car-listings/{$listing->slug}")
                        ->setLastModificationDate($listing->updated_at)
                        ->setPriority(0.8)
                        ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY));
                }
            });
        
        // Add car provider profiles
        CarProvider::where('is_verified', true)
            ->where('is_active', true)
            ->chunk(200, function($providers) use ($sitemap) {
                foreach ($providers as $provider) {
                    $sitemap->add(Url::create("/car-providers/{$provider->id}")
                        ->setLastModificationDate($provider->updated_at)
                        ->setPriority(0.7)
                        ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY));
                }
            });
        
        // Write to public directory
        $sitemap->writeToFile(public_path('sitemap.xml'));
        
        $this->info('Sitemap generated successfully!');
        
        return 0;
    }
}
```

---

## 3. Queue Jobs

### app/Jobs/IncrementViewsCount.php

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\CarListing;

class IncrementViewsCount implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $listingId;

    /**
     * Create a new job instance.
     */
    public function __construct($listingId)
    {
        $this->listingId = $listingId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        CarListing::where('id', $this->listingId)
            ->increment('views_count');
    }
    
    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;
    
    /**
     * The number of seconds to wait before retrying.
     */
    public $backoff = [10, 30, 60];
}
```

**Usage:**
```php
// In CarListingController::show()
IncrementViewsCount::dispatch($listing->id);
```

---

### app/Jobs/ProcessCarImages.php

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\ImageProcessingService;

class ProcessCarImages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $images;
    public $listingId;

    public function __construct($images, $listingId)
    {
        $this->images = $images;
        $this->listingId = $listingId;
    }

    public function handle(ImageProcessingService $imageService): void
    {
        $processed = [];
        
        foreach ($this->images as $index => $base64Image) {
            // Resize, compress, remove EXIF
            $path = $imageService->processCarImage(
                $base64Image,
                $this->listingId,
                $index
            );
            
            $processed[] = $path;
        }
        
        // Update listing with processed images
        \App\Models\CarListing::where('id', $this->listingId)
            ->update(['photos' => $processed]);
    }
    
    public $tries = 2;
    public $timeout = 120; // 2 minutes for image processing
}
```

---

### app/Jobs/SendSponsorshipExpiredNotification.php

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\CarListing;
use App\Notifications\SponsorshipExpired;

class SendSponsorshipExpiredNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $listingId;

    public function __construct($listingId)
    {
        $this->listingId = $listingId;
    }

    public function handle(): void
    {
        $listing = CarListing::find($this->listingId);
        
        if (!$listing) {
            return;
        }
        
        // Notify provider
        $listing->owner->notify(new SponsorshipExpired($listing));
    }
}
```

---

## 4. Server Cron Configuration

### On Production Server (crontab -e)

```bash
# Laravel Scheduler
* * * * * cd /path/to/ramouse/Backend && php artisan schedule:run >> /dev/null 2>&1
```

**That's it!** Laravel will handle all scheduled tasks automatically.

---

## 5. Queue Workers Configuration

### Supervisor Configuration

**File:** `/etc/supervisor/conf.d/ramouse-worker.conf`

```ini
[program:ramouse-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/ramouse/Backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/path/to/ramouse/Backend/storage/logs/worker.log
stopwaitsecs=3600
```

**Commands:**
```bash
# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start workers
sudo supervisorctl start ramouse-worker:*

# Check status
sudo supervisorctl status
```

---

## 6. Monitoring & Logging

### Schedule Output Logging

Laravel automatically logs scheduled tasks to `storage/logs/laravel.log`

**Custom logging:**
```php
$schedule->call(function () {
    // Your task
})
->onSuccess(function () {
    \Log::info('Task completed successfully');
})
->onFailure(function () {
    \Log::error('Task failed');
});
```

---

### Failed Jobs Monitoring

```bash
# View failed jobs
php artisan queue:failed

# Retry failed job
php artisan queue:retry {job-id}

# Retry all failed jobs
php artisan queue:retry all

# Flush failed jobs
php artisan queue:flush
```

---

### Health Check Endpoint

```php
// routes/api.php
Route::get('/health/scheduler', function () {
    $lastRun = Cache::get('scheduler_last_run');
    
    if (!$lastRun || $lastRun->diffInMinutes(now()) > 5) {
        return response()->json([
            'status' => 'error',
            'message' => 'Scheduler not running'
        ], 503);
    }
    
    return response()->json([
        'status' => 'ok',
        'last_run' => $lastRun
    ]);
});

// In Kernel.php schedule()
$schedule->call(function () {
    Cache::put('scheduler_last_run', now(), 3600);
})->everyMinute();
```

---

## 7. Schedule Summary

| Task | Frequency | Time | Purpose |
|------|-----------|------|---------|
| **Expire Sponsored** | Daily | 00:01 | Auto-expire sponsored listings |
| **Expire Featured** | Daily | 00:02 | Auto-expire featured listings |
| **Aggregate Analytics** | Daily | 02:00 | Create daily stats |
| **Archive Analytics** | Monthly | 1st @ 03:00 | Delete old raw data (6mo+) |
| **Cleanup Soft Deleted** | Daily | 04:00 | Permanent delete after 30d |
| **Generate Sitemap** | Daily | 05:00 | Update SEO sitemap |
| **Low Wallet Notification** | Weekly | Mon @ 09:00 | Notify low balance |

---

## 8. Queue Jobs Summary

| Job | Priority | Timeout | Retries |
|-----|----------|---------|---------|
| **IncrementViewsCount** | Medium | 30s | 3 |
| **ProcessCarImages** | High | 120s | 2 |
| **SendSponsorshipExpiredNotification** | Low | 30s | 3 |

---

## 9. Performance Optimization

### Chunking Large Datasets

```php
// Process in chunks to avoid memory issues
CarListing::where('is_available', true)
    ->chunk(500, function($listings) {
        foreach ($listings as $listing) {
            // Process each listing
        }
    });
```

### Using `onOneServer()`

```php
// Prevent duplicate execution on multi-server setup
$schedule->call(/* ... */)
    ->daily()
    ->onOneServer(); // ✅ Only runs on one server
```

### Using `withoutOverlapping()`

```php
// Prevent task from running if previous instance is still running
$schedule->call(/* ... */)
    ->daily()
    ->withoutOverlapping(); // ✅ Skip if already running
```

---

## 10. Testing Scheduled Tasks

### Run Scheduler Manually

```bash
# Run all scheduled tasks due now
php artisan schedule:run

# List all scheduled tasks
php artisan schedule:list

# Test specific command
php artisan analytics:archive-old --days=180
```

---

### Test Queue Jobs

```php
// In tests/Feature/QueueJobsTest.php
public function test_increment_views_count_job()
{
    $listing = CarListing::factory()->create(['views_count' => 0]);
    
    IncrementViewsCount::dispatch($listing->id);
    
    // Assert job was pushed to queue
    Queue::assertPushed(IncrementViewsCount::class);
    
    // Process queue
    $this->artisan('queue:work --once');
    
    // Assert views count incremented
    $this->assertEquals(1, $listing->fresh()->views_count);
}
```

---

## 11. Troubleshooting

### Scheduler Not Running

**Check:**
1. Is cron job set up? `crontab -l`
2. Is Laravel writing to log? `tail -f storage/logs/laravel.log`
3. Is timezone correct? Check `config/app.php`

**Solution:**
```bash
# Test manually
php artisan schedule:run

# Check what would run
php artisan schedule:list
```

---

### Queue Worker Not Processing

**Check:**
1. Is supervisor running? `sudo supervisorctl status`
2. Are there failed jobs? `php artisan queue:failed`
3. Is Redis running? `redis-cli ping`

**Solution:**
```bash
# Restart workers
sudo supervisorctl restart ramouse-worker:*

# Check queue size
redis-cli llen queues:default
```

---

## Summary

**Automated Tasks:** 7 scheduled tasks
**Background Jobs:** 3+ queue jobs
**Monitoring:** Health checks + logging
**Performance:** Chunking, onOneServer, withoutOverlapping

**Everything runs automatically!** ⚙️
