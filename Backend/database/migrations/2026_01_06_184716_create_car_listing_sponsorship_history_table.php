<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_listing_sponsorship_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_listing_id')->constrained('car_listings')->onDelete('cascade');
            $table->timestamp('sponsored_from');
            $table->timestamp('sponsored_until');
            $table->foreignId('sponsored_by_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('price', 10, 2)->default(0); // 0 if admin sponsored for free
            $table->integer('duration_days');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_listing_sponsorship_history');
    }
};
