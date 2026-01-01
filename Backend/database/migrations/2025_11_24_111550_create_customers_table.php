<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->string('id', 20)->primary(); // Phone number
            $table->string('unique_id', 10)->unique();
            $table->string('name')->nullable();
            $table->string('password');
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('garage')->nullable(); // Array of Vehicle objects
            $table->json('notification_settings')->nullable(); // Partial<NotificationSettings>
            $table->json('flash_purchases')->nullable(); // History of flash sale purchases (snapshot)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
