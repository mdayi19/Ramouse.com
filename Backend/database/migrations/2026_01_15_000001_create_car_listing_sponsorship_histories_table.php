<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_listing_sponsorship_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_listing_id')->constrained('car_listings')->onDelete('cascade');
            $table->foreignId('sponsored_by_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('sponsored_from');
            $table->timestamp('sponsored_until');
            $table->decimal('price', 10, 2); // Amount paid (0 for admin)
            $table->integer('duration_days');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->boolean('is_admin_sponsored')->default(false);
            $table->timestamps();

            $table->index(['car_listing_id', 'status']);
            $table->index('sponsored_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_listing_sponsorship_histories');
    }
};
