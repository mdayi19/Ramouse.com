<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_listing_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_listing_id')->constrained('car_listings')->onDelete('cascade');
            $table->enum('event_type', ['view', 'contact_phone', 'contact_whatsapp', 'favorite', 'share']);
            $table->string('user_ip', 45)->nullable(); // IPv4 or IPv6
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Indexes for fast queries
            $table->index(['car_listing_id', 'event_type']);
            $table->index('created_at');
            $table->index(['user_ip', 'created_at']); // For deduplication
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_listing_analytics');
    }
};
