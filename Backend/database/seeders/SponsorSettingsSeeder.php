<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSettings;

class SponsorSettingsSeeder extends Seeder
{
    public function run(): void
    {
        SystemSettings::updateOrCreate(
            ['key' => 'sponsorSettings'],
            [
                'value' => json_encode([
                    'dailyPrice' => 10,
                    'weeklyPrice' => 60,
                    'monthlyPrice' => 200,
                    'maxDuration' => 90,
                    'minDuration' => 1,
                    'enabled' => true,
                ])
            ]
        );
    }
}
