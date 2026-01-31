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
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('preference_key')->index();
            $table->text('preference_value');
            $table->integer('frequency')->default(1); // How many times this preference was seen
            $table->timestamp('last_used_at')->useCurrent();
            $table->timestamps();

            // Unique constraint to prevent duplicate preferences
            $table->unique(['user_id', 'preference_key']);

            // Index for quick lookups
            $table->index(['user_id', 'last_used_at'], 'idx_user_prefs_recent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
