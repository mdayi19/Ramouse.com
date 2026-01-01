<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->string('order_number')->primary(); // ORD-Timestamp
            $table->string('user_id'); // Polymorphic ID (Customer/Tech/Tow)
            $table->string('user_type'); // customer, technician, tow_truck
            $table->string('status')->default('قيد المراجعة'); // See OrderStatus type
            $table->json('form_data'); // StoredFormData (Vehicle details, part description, media paths)

            // Shipping & Logistics
            $table->string('customer_name')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('delivery_method')->default('shipping'); // shipping, pickup
            $table->decimal('shipping_price', 10, 2)->default(0);
            $table->text('shipping_notes')->nullable();

            // Payment
            $table->string('payment_method_id')->nullable();
            $table->string('payment_method_name')->nullable();
            $table->string('payment_receipt_url')->nullable();
            $table->text('rejection_reason')->nullable();

            // Relations
            $table->uuid('accepted_quote_id')->nullable();
            $table->json('review')->nullable(); // OrderReview {rating, comment}
            $table->boolean('stale_notified')->default(false);

            $table->timestamp('date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
