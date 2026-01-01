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
        Schema::create('auction_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Related Auction
            $table->uuid('auction_id');
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');

            // User Info
            $table->unsignedBigInteger('user_id');
            $table->string('user_type'); // customer, technician, tow_truck
            $table->string('user_name');
            $table->string('user_phone')->nullable();

            // Deposit
            $table->decimal('deposit_amount', 12, 2);
            $table->uuid('wallet_hold_id')->nullable();
            $table->foreign('wallet_hold_id')->references('id')->on('user_wallet_holds')->onDelete('set null');

            // Status
            $table->enum('status', [
                'pending',           // Waiting for deposit
                'registered',        // Deposit held, can participate
                'participated',      // Participated but didn't win
                'winner',            // Won the auction
                'deposit_released',  // Deposit returned (didn't win)
                'deposit_forfeited', // Deposit kept (winner didn't pay)
                'cancelled'          // Registration cancelled
            ])->default('pending');

            // Timestamps
            $table->timestamp('registered_at')->nullable();
            $table->timestamp('deposit_released_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('auction_id');
            $table->index(['user_id', 'user_type']);
            $table->index('status');
            $table->unique(['auction_id', 'user_id', 'user_type']); // One registration per user per auction
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_registrations');
    }
};
