<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_orders', function (Blueprint $table) {
            $table->string('order_group_id')->nullable()->after('id');
            $table->string('tracking_number')->nullable()->after('payment_receipt_url');
            $table->index('order_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_orders', function (Blueprint $table) {
            $table->dropIndex(['order_group_id']);
            $table->dropColumn(['order_group_id', 'tracking_number']);
        });
    }
};
