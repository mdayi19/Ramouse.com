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
        Schema::table('car_listings', function (Blueprint $table) {
            // Location fields
            $table->string('city', 50)->nullable()->after('description');
            $table->text('address')->nullable()->after('city');

            // Car origin country - references countries table
            $table->string('country_id', 3)->nullable()->after('brand_id');
            $table->foreign('country_id')->references('id')->on('countries')->onDelete('set null');

            // Add index for city searches
            $table->index('city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_listings', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropIndex(['city']);
            $table->dropColumn(['city', 'address', 'country_id']);
        });
    }
};
