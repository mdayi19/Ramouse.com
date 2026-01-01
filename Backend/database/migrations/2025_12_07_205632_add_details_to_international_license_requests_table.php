<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('international_license_requests', function (Blueprint $table) {
            $table->date('birthdate')->nullable()->after('nationality');
            $table->string('address')->nullable()->after('birthdate');
        });

        // Seed default prices
        \App\Models\SystemSetting::updateOrCreate(
            ['key' => 'international_license_syrian_price'],
            ['value' => 350]
        );
        \App\Models\SystemSetting::updateOrCreate(
            ['key' => 'international_license_non_syrian_price'],
            ['value' => 650]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('international_license_requests', function (Blueprint $table) {
            //
        });
    }
};
