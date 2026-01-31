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
        // Add indexes for better query performance
        Schema::table('car_listings', function (Blueprint $table) {
            $table->index(['listing_type', 'is_available', 'is_hidden', 'city'], 'idx_car_listing_search');
            $table->index(['brand_id', 'year', 'transmission', 'fuel_type', 'condition'], 'idx_car_listing_filters');
            $table->index('price', 'idx_car_listing_price');
        });

        Schema::table('technicians', function (Blueprint $table) {
            $table->index(['is_active', 'is_verified', 'city'], 'idx_technicians_search');
            $table->index('specialty', 'idx_technicians_specialty');
            $table->index('average_rating', 'idx_technicians_rating');
        });

        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->index(['is_active', 'is_verified', 'city'], 'idx_tow_trucks_search');
            $table->index('vehicle_type', 'idx_tow_trucks_type');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('name', 'idx_products_name');
            $table->index('price', 'idx_products_price');
        });

        Schema::table('chat_histories', function (Blueprint $table) {
            $table->index(['session_id', 'created_at'], 'idx_chat_history_session_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_listings', function (Blueprint $table) {
            $table->dropIndex('idx_car_listing_search');
            $table->dropIndex('idx_car_listing_filters');
            $table->dropIndex('idx_car_listing_price');
        });

        Schema::table('technicians', function (Blueprint $table) {
            $table->dropIndex('idx_technicians_search');
            $table->dropIndex('idx_technicians_specialty');
            $table->dropIndex('idx_technicians_rating');
        });

        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->dropIndex('idx_tow_trucks_search');
            $table->dropIndex('idx_tow_trucks_type');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_name');
            $table->dropIndex('idx_products_price');
        });

        Schema::table('chat_histories', function (Blueprint $table) {
            $table->dropIndex('idx_chat_history_session_date');
        });
    }
};
