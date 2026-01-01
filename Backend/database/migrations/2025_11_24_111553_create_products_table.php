<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->json('media'); // GalleryItem[]

            // Targeting & Stock
            $table->string('target_audience')->default('all'); // all, technicians, providers, tow_trucks, customers
            $table->string('specialty')->nullable(); // If target is technicians
            $table->integer('total_stock');
            $table->integer('purchase_limit_per_buyer');

            // Type
            $table->boolean('is_flash')->default(false);
            $table->timestamp('expires_at')->nullable();

            // Store Categorization
            $table->string('store_category_id')->nullable();
            $table->foreign('store_category_id')->references('id')->on('store_categories');
            $table->string('store_subcategory_id')->nullable();

            // Logistics
            $table->string('shipping_size')->nullable(); // xs, s, m, l, vl
            $table->decimal('static_shipping_cost', 10, 2)->nullable();
            $table->json('allowed_payment_methods')->nullable(); // Array of IDs

            // Stats
            $table->decimal('average_rating', 3, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
