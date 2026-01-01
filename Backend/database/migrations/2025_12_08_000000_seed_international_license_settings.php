<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\SystemSetting;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'international_license_settings'],
            [
                'value' => [
                    'syrian_price' => 350,
                    'non_syrian_price' => 650,
                    'license_duration' => '1 Year',
                    'informations' => 'Valid for one year from date of issue.',
                ]
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        SystemSetting::where('key', 'international_license_settings')->delete();
    }
};
