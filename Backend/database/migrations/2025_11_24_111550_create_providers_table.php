<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('providers', function (Blueprint $table) {
            $table->string('id', 20)->primary(); // Phone
            $table->string('unique_id', 10)->unique();
            $table->string('name');
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->decimal('wallet_balance', 10, 2)->default(0);
            $table->json('assigned_categories'); // ['German', 'Korean']
            $table->json('payment_info')->nullable(); // ProviderPaymentInfo[]
            $table->json('notification_settings')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('inactivity_warning_sent')->default(false);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->json('flash_purchases')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
