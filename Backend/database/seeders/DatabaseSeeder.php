<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed in order of dependencies

        // 1. Foundational data (no dependencies)
        $this->call([
            VehicleDataSeeder::class,
            TechnicianSpecialtySeeder::class,
            StoreCategorySeeder::class,
        ]);

        // 2. Products (depends on store categories)
        $this->call([
            ProductSeeder::class,
        ]);

        // 3. Users (depends on categories and specialties)
        $this->call([
            UserSeeder::class,
            AdminUserSeeder::class,
        ]);

        // 4. Content and settings (no dependencies)
        $this->call([
            ContentSeeder::class,
            SystemSettingSeeder::class,
        ]);

        $this->command->info('Database seeding completed successfully!');
    }
}
