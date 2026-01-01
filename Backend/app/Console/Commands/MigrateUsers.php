<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Customer;
use App\Models\Provider;
use App\Models\Technician;
use App\Models\TowTruck;
use Illuminate\Support\Facades\DB;

class MigrateUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing users from profile tables to the main users table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting user migration...');

        DB::transaction(function () {
            // Migrate Customers
            $this->migrateProfile(Customer::class, 'customer');

            // Migrate Providers
            $this->migrateProfile(Provider::class, 'provider');

            // Migrate Technicians
            $this->migrateProfile(Technician::class, 'technician');

            // Migrate Tow Trucks
            $this->migrateProfile(TowTruck::class, 'tow_truck');
        });

        $this->info('User migration completed successfully.');
    }

    private function migrateProfile($modelClass, $role)
    {
        $this->info("Migrating {$role}s...");
        $profiles = $modelClass::whereNull('user_id')->get();

        foreach ($profiles as $profile) {
            // Check if user already exists (by phone)
            $user = User::where('phone', $profile->id)->first();

            if (!$user) {
                $user = User::create([
                    'name' => $profile->name,
                    'phone' => $profile->id,
                    'email' => null, // Or generate a dummy email if needed
                    'password' => $profile->password,
                    'role' => $role,
                    'is_admin' => false,
                ]);
            } else {
                // Update existing user role if needed, or handle conflict
                // For now, we assume phone numbers are unique across the system or belong to the same person
                if ($user->role === 'user') {
                    $user->role = $role;
                    $user->save();
                }
            }

            // Link profile to user
            $profile->user_id = $user->id;
            $profile->save();
        }
        $this->info("Migrated " . $profiles->count() . " {$role}s.");
    }
}
