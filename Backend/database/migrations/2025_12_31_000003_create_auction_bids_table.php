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
        Schema::create('auction_bids', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Related Auction
            $table->uuid('auction_id');
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');

            // Bidder Info
            $table->unsignedBigInteger('user_id');
            $table->string('user_type'); // customer, technician, tow_truck
            $table->string('bidder_name');
            $table->string('bidder_phone')->nullable();

            // Bid Details
            $table->decimal('amount', 12, 2);
            $table->timestamp('bid_time', 6); // With milliseconds for precise ordering

            // Wallet Hold Reference
            $table->uuid('wallet_hold_id')->nullable();
            $table->foreign('wallet_hold_id')->references('id')->on('user_wallet_holds')->onDelete('set null');

            // Status
            $table->enum('status', [
                'valid',      // Current highest bid
                'outbid',     // Was outbid by another
                'winning',    // Final winning bid
                'cancelled',  // Bid was cancelled
                'rejected'    // Rejected for some reason
            ])->default('valid');

            // Audit Info
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();

            // Is this an auto-bid (for future auto-bidding feature)
            $table->boolean('is_auto_bid')->default(false);
            $table->decimal('max_auto_bid', 12, 2)->nullable();

            $table->timestamps();

            // Indexes for fast queries
            $table->index('auction_id');
            $table->index(['user_id', 'user_type']);
            $table->index('status');
            $table->index('bid_time');
            $table->index(['auction_id', 'status', 'bid_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_bids');
    }
};
