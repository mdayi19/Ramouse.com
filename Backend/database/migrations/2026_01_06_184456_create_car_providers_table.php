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
        Schema::create('car_providers', function (Blueprint $table) {
            // Primary key (phone number)
            $table->string('id', 20)->primary(); // Phone number

            // User relationship
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Basic info
            $table->string('unique_id', 10)->unique();
            $table->string('name');
            $table->string('password');
            $table->enum('business_type', ['dealership', 'individual', 'rental_agency']);
            $table->string('business_license')->nullable();

            // Location
            $table->string('city');
            $table->text('address');
            $table->point('location')->nullable(); // For "Near Me" feature
            $table->spatialIndex('location'); // Spatial index

            // Details
            $table->text('description')->nullable();

            // Verification
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_trusted')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');

            // Media
            $table->string('profile_photo')->nullable();
            $table->json('gallery')->nullable();
            $table->json('socials')->nullable();
            $table->string('qr_code_url')->nullable();

            // Settings
            $table->json('notification_settings')->nullable();
            $table->json('flash_purchases')->nullable();

            // Ratings & Wallet
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->decimal('wallet_balance', 10, 2)->default(0);

            // Additional
            $table->json('saved_addresses')->nullable();
            $table->json('payment_info')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('car_providers');
    }
};
