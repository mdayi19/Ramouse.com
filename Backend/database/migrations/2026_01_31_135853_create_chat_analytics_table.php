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
        Schema::create('chat_analytics', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->index();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('event_type', ['message_sent', 'tool_called', 'feedback', 'error', 'rate_limit'])->index();
            $table->json('event_data')->nullable();
            $table->integer('response_time_ms')->nullable();
            $table->timestamps();

            // Composite index for analytics queries
            $table->index(['event_type', 'created_at'], 'idx_analytics_type_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_analytics');
    }
};
