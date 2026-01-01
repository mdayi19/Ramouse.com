<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('technicians', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('unique_id', 10)->unique();
            $table->string('name');
            $table->string('password');
            $table->string('specialty'); // Mechanic, Electrician...
            $table->string('city');
            $table->text('workshop_address')->nullable();
            // MySQL POINT for "Nearest Me" features (stored as geometry)
            $table->geometry('location', 'point', 4326)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('profile_photo')->nullable();
            $table->json('gallery')->nullable(); // GalleryItem[]
            $table->json('socials')->nullable();
            $table->string('qr_code_url')->nullable();
            $table->json('notification_settings')->nullable();
            $table->json('flash_purchases')->nullable();
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->timestamp('registration_date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technicians');
    }
};
