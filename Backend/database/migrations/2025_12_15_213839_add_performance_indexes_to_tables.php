<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adding critical performance indexes to the most-queried tables.
     */
    public function up(): void
    {
        // ORDERS TABLE - Most critical
        Schema::table('orders', function (Blueprint $table) {
            $table->index('user_id', 'idx_orders_user_id');
            $table->index('status', 'idx_orders_status');
            $table->index('created_at', 'idx_orders_created_at');
            $table->index(['user_id', 'status'], 'idx_orders_user_status');
        });

        // QUOTES TABLE
        Schema::table('quotes', function (Blueprint $table) {
            $table->index('order_number', 'idx_quotes_order_number');
            $table->index('provider_id', 'idx_quotes_provider_id');
            $table->index('created_at', 'idx_quotes_created_at');
        });

        // NOTIFICATIONS TABLE  
        Schema::table('notifications', function (Blueprint $table) {
            $table->index('user_id', 'idx_notifications_user_id');
            $table->index('read', 'idx_notifications_read');
            $table->index('created_at', 'idx_notifications_created_at');
            $table->index(['user_id', 'read'], 'idx_notifications_user_read');
        });

        // INTERNATIONAL LICENSE REQUESTS TABLE
        Schema::table('international_license_requests', function (Blueprint $table) {
            $table->index('user_id', 'idx_intl_license_user_id');
            $table->index('status', 'idx_intl_license_status');
            $table->index('created_at', 'idx_intl_license_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_user_id');
            $table->dropIndex('idx_orders_status');
            $table->dropIndex('idx_orders_created_at');
            $table->dropIndex('idx_orders_user_status');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropIndex('idx_quotes_order_number');
            $table->dropIndex('idx_quotes_provider_id');
            $table->dropIndex('idx_quotes_created_at');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_id');
            $table->dropIndex('idx_notifications_read');
            $table->dropIndex('idx_notifications_created_at');
            $table->dropIndex('idx_notifications_user_read');
        });

        Schema::table('international_license_requests', function (Blueprint $table) {
            $table->dropIndex('idx_intl_license_user_id');
            $table->dropIndex('idx_intl_license_status');
            $table->dropIndex('idx_intl_license_created_at');
        });
    }
};
