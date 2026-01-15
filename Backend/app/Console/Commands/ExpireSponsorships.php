<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CarListingSponsorshipHistory;
use App\Models\CarListing;
use Carbon\Carbon;

class ExpireSponsorships extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sponsorships:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire sponsored listings that have passed their sponsored_until date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting sponsorship expiration check...');

        // Find all active sponsorships that have expired
        $expiredSponsorships = CarListingSponsorshipHistory::where('status', 'active')
            ->where('sponsored_until', '<', Carbon::now())
            ->get();

        $count = $expiredSponsorships->count();

        if ($count === 0) {
            $this->info('No expired sponsorships found.');
            return 0;
        }

        $this->info("Found {$count} expired sponsorships. Processing...");

        foreach ($expiredSponsorships as $sponsorship) {
            // Update sponsorship history status
            $sponsorship->update(['status' => 'expired']);

            // Update the car listing
            $listing = CarListing::find($sponsorship->car_listing_id);
            if ($listing) {
                $listing->update([
                    'is_sponsored' => false,
                    'sponsored_until' => null
                ]);

                $this->line("✓ Expired sponsorship for listing #{$listing->id}: {$listing->title}");
            }
        }

        $this->info("Successfully expired {$count} sponsorships.");
        return 0;
    }
}
