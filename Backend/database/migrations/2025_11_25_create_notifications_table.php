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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('user_id')->index(); // Can be phone number or UUID
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info'); // info, success, warning, error, order, quote, etc.
            $table->json('link')->nullable(); // { view: string, params: object }
            $table->json('context')->nullable(); // Additional metadata
            $table->boolean('read')->default(false)->index();
            $table->timestamps();

            // Add indexes for common queries
            $table->index(['user_id', 'read']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
