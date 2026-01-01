<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('store_orders', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('product_id');
            $table->foreign('product_id')->references('id')->on('products');

            // Buyer
            $table->string('buyer_id');
            $table->string('buyer_type');
            $table->string('buyer_name'); // Snapshot
            $table->string('buyer_unique_id'); // Snapshot

            // Order Details
            $table->integer('quantity');
            $table->decimal('total_price', 10, 2);
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->string('status'); // pending, payment_verification, preparing, shipped, delivered, rejected, cancelled, approved

            // Fulfillment
            $table->string('delivery_method'); // shipping, pickup
            $table->text('shipping_address')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('payment_method_id')->nullable();
            $table->string('payment_method_name')->nullable();
            $table->string('payment_receipt_url')->nullable();

            $table->text('admin_notes')->nullable();
            $table->timestamp('request_date')->useCurrent();
            $table->timestamp('decision_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_orders');
    }
};
