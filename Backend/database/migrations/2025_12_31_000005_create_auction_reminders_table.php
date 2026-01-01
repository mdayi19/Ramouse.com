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
        Schema::create('auction_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Related Auction
            $table->uuid('auction_id');
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');

            // User Info
            $table->unsignedBigInteger('user_id');
            $table->string('user_type'); // customer, technician, tow_truck

            // Reminder Settings
            $table->integer('remind_minutes_before')->default(30); // Remind X minutes before start
            $table->timestamp('remind_at'); // Calculated: scheduled_start - remind_minutes

            // Channels (for PWA/WebPush)
            $table->json('channels')->nullable(); // ['push', 'email', 'sms']

            // Status
            $table->boolean('is_sent')->default(false);
            $table->timestamp('sent_at')->nullable();

            // For WebPush
            $table->string('push_subscription_id')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('auction_id');
            $table->index(['user_id', 'user_type']);
            $table->index('remind_at');
            $table->index(['is_sent', 'remind_at']);
            $table->unique(['auction_id', 'user_id', 'user_type']); // One reminder per user per auction
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_reminders');
    }
};
