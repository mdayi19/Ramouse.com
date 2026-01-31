<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes for better query performance - using checks to prevent duplicates

        $addIndex = function ($table, $indexName, $columns) {
            $exists = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            if (empty($exists)) {
                Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                    $table->index($columns, $indexName);
                });
            }
        };

        if (Schema::hasTable('car_listings')) {
            $addIndex('car_listings', 'idx_car_listing_search', ['listing_type', 'is_available', 'is_hidden', 'city']);
            $addIndex('car_listings', 'idx_car_listing_filters', ['brand_id', 'year', 'transmission', 'fuel_type', 'condition']);
            $addIndex('car_listings', 'idx_car_listing_price', 'price');
        }

        if (Schema::hasTable('technicians')) {
            $addIndex('technicians', 'idx_technicians_search', ['is_active', 'is_verified', 'city']);
            $addIndex('technicians', 'idx_technicians_specialty', 'specialty');
            $addIndex('technicians', 'idx_technicians_rating', 'average_rating');
        }

        if (Schema::hasTable('tow_trucks')) {
            $addIndex('tow_trucks', 'idx_tow_trucks_search', ['is_active', 'is_verified', 'city']);
            $addIndex('tow_trucks', 'idx_tow_trucks_type', 'vehicle_type');
        }

        if (Schema::hasTable('products')) {
            $addIndex('products', 'idx_products_name', 'name');
            $addIndex('products', 'idx_products_price', 'price');
        }

        if (Schema::hasTable('chat_histories')) {
            $addIndex('chat_histories', 'idx_chat_history_session_date', ['session_id', 'created_at']);
        }
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
