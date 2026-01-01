<?php

namespace App\Console\Commands;

use App\Jobs\ProcessAuctionEnd;
use Illuminate\Console\Command;

class EndScheduledAuctions extends Command
{
    protected $signature = 'auction:end-scheduled';
    protected $description = 'End auctions that have reached their scheduled end time';

    public function handle(): int
    {
        $this->info('Processing scheduled auction ends...');

        ProcessAuctionEnd::dispatch();

        $this->info('Auction end processing dispatched.');
        return Command::SUCCESS;
    }
}
