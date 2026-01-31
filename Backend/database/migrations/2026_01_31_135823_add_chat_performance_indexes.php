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
        // Add indexes for better query performance - using checks to prevent duplicates

        if (Schema::hasTable('car_listings')) {
            Schema::table('car_listings', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('car_listings');

                if (!array_key_exists('idx_car_listing_search', $indexes)) {
                    $table->index(['listing_type', 'is_available', 'is_hidden', 'city'], 'idx_car_listing_search');
                }
                if (!array_key_exists('idx_car_listing_filters', $indexes)) {
                    $table->index(['brand_id', 'year', 'transmission', 'fuel_type', 'condition'], 'idx_car_listing_filters');
                }
                if (!array_key_exists('idx_car_listing_price', $indexes)) {
                    $table->index('price', 'idx_car_listing_price');
                }
            });
        }

        if (Schema::hasTable('technicians')) {
            Schema::table('technicians', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('technicians');

                if (!array_key_exists('idx_technicians_search', $indexes)) {
                    $table->index(['is_active', 'is_verified', 'city'], 'idx_technicians_search');
                }
                if (!array_key_exists('idx_technicians_specialty', $indexes)) {
                    $table->index('specialty', 'idx_technicians_specialty');
                }
                if (!array_key_exists('idx_technicians_rating', $indexes)) {
                    $table->index('average_rating', 'idx_technicians_rating');
                }
            });
        }

        if (Schema::hasTable('tow_trucks')) {
            Schema::table('tow_trucks', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('tow_trucks');

                if (!array_key_exists('idx_tow_trucks_search', $indexes)) {
                    $table->index(['is_active', 'is_verified', 'city'], 'idx_tow_trucks_search');
                }
                if (!array_key_exists('idx_tow_trucks_type', $indexes)) {
                    $table->index('vehicle_type', 'idx_tow_trucks_type');
                }
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('products');

                if (!array_key_exists('idx_products_name', $indexes)) {
                    $table->index('name', 'idx_products_name');
                }
                if (!array_key_exists('idx_products_price', $indexes)) {
                    $table->index('price', 'idx_products_price');
                }
            });
        }

        if (Schema::hasTable('chat_histories')) {
            Schema::table('chat_histories', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('chat_histories');

                if (!array_key_exists('idx_chat_history_session_date', $indexes)) {
                    $table->index(['session_id', 'created_at'], 'idx_chat_history_session_date');
                }
            });
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
