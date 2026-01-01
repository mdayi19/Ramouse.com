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
        Schema::create('auction_cars', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Basic Info
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('condition', ['new', 'used'])->default('used');

            // Vehicle Details
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->integer('year')->nullable();
            $table->string('vin')->nullable();
            $table->integer('mileage')->nullable();
            $table->string('engine_type')->nullable();
            $table->string('transmission')->nullable();
            $table->string('fuel_type')->nullable();
            $table->string('exterior_color')->nullable();
            $table->string('interior_color')->nullable();

            // Features (JSON array)
            $table->json('features')->nullable();

            // Media (JSON: images, videos, inspection_report, documents)
            $table->json('media')->nullable();

            // Location
            $table->string('location')->nullable();

            // Pricing
            $table->decimal('starting_price', 12, 2);
            $table->decimal('reserve_price', 12, 2)->nullable(); // Minimum acceptable price
            $table->decimal('buy_now_price', 12, 2)->nullable(); // Optional instant purchase
            $table->decimal('deposit_amount', 12, 2)->default(0); // Required deposit to bid

            // Seller Info
            $table->enum('seller_type', ['admin', 'user'])->default('admin');
            $table->unsignedBigInteger('seller_id')->nullable(); // User ID if seller_type is 'user'
            $table->string('seller_user_type')->nullable(); // customer, technician, tow_truck
            $table->string('seller_name')->nullable();
            $table->string('seller_phone')->nullable();

            // Status
            $table->enum('status', [
                'draft',
                'pending_approval', // For user-submitted cars
                'approved',
                'in_auction',
                'sold',
                'unsold',
                'cancelled'
            ])->default('draft');

            // Admin notes (for internal use)
            $table->text('admin_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('seller_type');
            $table->index(['seller_id', 'seller_user_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_cars');
    }
};
