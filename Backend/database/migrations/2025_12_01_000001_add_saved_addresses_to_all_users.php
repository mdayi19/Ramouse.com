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
        // Add saved_addresses to customers table
        Schema::table('customers', function (Blueprint $table) {
            $table->json('saved_addresses')->nullable()->after('address');
        });

        // Add saved_addresses to technicians table
        Schema::table('technicians', function (Blueprint $table) {
            $table->json('saved_addresses')->nullable()->after('workshop_address');
        });

        // Add saved_addresses to providers table
        Schema::table('providers', function (Blueprint $table) {
            $table->json('saved_addresses')->nullable()->after('flash_purchases');
        });

        // Add saved_addresses to tow_trucks table
        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->json('saved_addresses')->nullable()->after('flash_purchases');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('saved_addresses');
        });

        Schema::table('technicians', function (Blueprint $table) {
            $table->dropColumn('saved_addresses');
        });

        Schema::table('providers', function (Blueprint $table) {
            $table->dropColumn('saved_addresses');
        });

        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->dropColumn('saved_addresses');
        });
    }
};
