<?php

namespace App\Console\Commands;

use App\Jobs\CleanupExpiredWalletHolds;
use Illuminate\Console\Command;

class CleanupExpiredWalletHoldsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'wallet:cleanup-expired-holds';

    /**
     * The console command description.
     */
    protected $description = 'Release expired wallet holds and notify users';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting cleanup of expired wallet holds...');

        // Dispatch the job synchronously
        (new CleanupExpiredWalletHolds())->handle();

        $this->info('Cleanup completed.');

        return Command::SUCCESS;
    }
}
