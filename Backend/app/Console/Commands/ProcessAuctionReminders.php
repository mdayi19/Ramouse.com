<?php

namespace App\Console\Commands;

use App\Jobs\SendAuctionReminders;
use Illuminate\Console\Command;

class ProcessAuctionReminders extends Command
{
    protected $signature = 'auction:send-reminders';
    protected $description = 'Send due auction reminders to users';

    public function handle(): int
    {
        $this->info('Processing auction reminders...');

        SendAuctionReminders::dispatch();

        $this->info('Auction reminder processing dispatched.');
        return Command::SUCCESS;
    }
}
