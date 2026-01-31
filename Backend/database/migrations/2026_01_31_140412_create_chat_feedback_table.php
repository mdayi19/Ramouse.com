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
        Schema::create('chat_feedback', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->index();
            $table->unsignedBigInteger('message_id')->nullable(); // Reference to chat_histories
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->boolean('is_positive');
            $table->text('comment')->nullable();
            $table->json('feedback_context')->nullable(); // Store message content, timestamp, etc.
            $table->timestamps();

            // Indexes for analytics
            $table->index(['is_positive', 'created_at'], 'idx_feedback_sentiment_date');
            $table->index('created_at', 'idx_feedback_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_feedback');
    }
};
