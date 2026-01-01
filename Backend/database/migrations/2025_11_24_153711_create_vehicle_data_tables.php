<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_categories', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('flag');
            $table->json('brands')->nullable(); // Array of brand names associated
            $table->string('telegram_bot_token')->nullable();
            $table->string('telegram_channel_id')->nullable();
            $table->boolean('telegram_notifications_enabled')->default(false);
            $table->timestamps();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->text('logo')->nullable(); // Base64 or URL
            $table->timestamps();
        });

        Schema::create('car_models', function (Blueprint $table) {
            $table->id(); // Auto-increment ID for internal use, or string if we want UUIDs
            $table->string('brand_name'); // Linking by name as per frontend logic, or we can use brand_id if we enforce it
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('part_types', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_types');
        Schema::dropIfExists('car_models');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('car_categories');
    }
};
