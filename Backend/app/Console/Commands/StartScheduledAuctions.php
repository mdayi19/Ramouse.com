<?php

namespace App\Console\Commands;

use App\Jobs\ProcessAuctionStart;
use Illuminate\Console\Command;

class StartScheduledAuctions extends Command
{
    protected $signature = 'auction:start-scheduled';
    protected $description = 'Start auctions that have reached their scheduled start time';

    public function handle(): int
    {
        $this->info('Processing scheduled auction starts...');

        ProcessAuctionStart::dispatch();

        $this->info('Auction start processing dispatched.');
        return Command::SUCCESS;
    }
}
