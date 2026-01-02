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
        Schema::create('auction_watchlist', function (Blueprint $table) {
            $table->id();

            // Use unsignedBigInteger for user_id, uuid for auction_id (matches auctions table)
            $table->unsignedBigInteger('user_id');
            $table->uuid('auction_id');

            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');

            // Ensure a user can only add an auction to watchlist once
            $table->unique(['user_id', 'auction_id']);

            // Index for faster queries
            $table->index('user_id');
            $table->index('auction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_watchlist');
    }
};
