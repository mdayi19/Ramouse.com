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
        // Drop existing table to avoid complex data migration
        Schema::dropIfExists('notifications');

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->json('link')->nullable();
            $table->json('context')->nullable();
            $table->boolean('read')->default(false)->index();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Indexes
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

        // Recreate original schema (without FK)
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('user_id')->index(); // Revert to string
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->json('link')->nullable();
            $table->json('context')->nullable();
            $table->boolean('read')->default(false)->index();
            $table->timestamps();

            $table->index(['user_id', 'read']);
            $table->index(['user_id', 'created_at']);
        });
    }
};
