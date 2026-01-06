<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('reviewable_type'); // Polymorphic: 'App\Models\CarProvider'
            $table->unsignedBigInteger('reviewable_id'); // car_provider.user_id
            $table->integer('rating'); // 1-5
            $table->text('comment');
            $table->boolean('is_approved')->default(true);
            $table->timestamps();

            // Unique constraint: one review per user per provider
            $table->unique(['user_id', 'reviewable_type', 'reviewable_id']);

            // Index for polymorphic relationship
            $table->index(['reviewable_type', 'reviewable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
