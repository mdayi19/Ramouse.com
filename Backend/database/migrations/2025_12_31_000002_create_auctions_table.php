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
        Schema::create('auctions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Related Car
            $table->uuid('auction_car_id');
            $table->foreign('auction_car_id')->references('id')->on('auction_cars')->onDelete('cascade');

            // Auction Info
            $table->string('title');
            $table->text('description')->nullable();

            // Schedule
            $table->timestamp('scheduled_start');
            $table->timestamp('scheduled_end');
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();

            // Bidding Configuration (Admin sets these)
            $table->decimal('starting_bid', 12, 2);
            $table->decimal('current_bid', 12, 2)->nullable();
            $table->decimal('bid_increment', 12, 2)->default(100); // Minimum bid increase
            $table->integer('bid_count')->default(0);

            // Extension Rules
            $table->integer('extension_minutes')->default(2); // Auto-extend if bid in last X minutes
            $table->integer('extension_threshold_seconds')->default(120); // Extend if bid within last X seconds
            $table->integer('max_extensions')->default(10); // Maximum number of extensions allowed
            $table->integer('extensions_used')->default(0);

            // Commission (Optional - Admin sets)
            $table->decimal('commission_percent', 5, 2)->nullable(); // e.g., 5.00 for 5%
            $table->decimal('commission_fixed', 12, 2)->nullable(); // Fixed commission amount

            // Status
            $table->enum('status', [
                'draft',
                'scheduled',
                'live',
                'extended', // When auto-extended
                'ended',
                'completed', // After payment confirmed
                'cancelled'
            ])->default('draft');

            // Winner Info
            $table->unsignedBigInteger('winner_id')->nullable();
            $table->string('winner_type')->nullable(); // customer, technician, tow_truck
            $table->string('winner_name')->nullable();
            $table->string('winner_phone')->nullable();
            $table->decimal('final_price', 12, 2)->nullable();
            $table->decimal('commission_amount', 12, 2)->nullable();

            // Payment Tracking
            $table->enum('payment_status', [
                'pending',
                'awaiting_payment',
                'payment_received',
                'completed',
                'refunded'
            ])->default('pending');
            $table->text('payment_notes')->nullable();
            $table->timestamp('payment_deadline')->nullable();

            // Admin who created
            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('scheduled_start');
            $table->index('scheduled_end');
            $table->index(['winner_id', 'winner_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
