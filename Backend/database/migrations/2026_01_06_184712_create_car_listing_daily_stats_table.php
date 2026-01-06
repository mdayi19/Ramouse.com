<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_listing_daily_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_listing_id')->constrained('car_listings')->onDelete('cascade');
            $table->date('date');
            $table->integer('total_views')->default(0);
            $table->integer('unique_visitors')->default(0);
            $table->integer('contact_phone_clicks')->default(0);
            $table->integer('contact_whatsapp_clicks')->default(0);
            $table->integer('favorites')->default(0);
            $table->integer('shares')->default(0);
            $table->timestamps();

            // Unique constraint to prevent duplicates
            $table->unique(['car_listing_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_listing_daily_stats');
    }
};
