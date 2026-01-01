<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship to technician or tow_truck
            $table->string('reviewable_type'); // 'App\Models\Technician' or 'App\Models\TowTruck'
            $table->string('reviewable_id'); // Phone number ID of technician/tow_truck

            // Reviewer information
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('customer_name'); // Cached for display

            // Review content
            $table->integer('rating'); // 1-5
            $table->text('comment');

            // Moderation workflow
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            // Provider response
            $table->text('provider_response')->nullable();
            $table->timestamp('responded_at')->nullable();

            // Moderation tracking
            $table->foreignId('moderated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('moderated_at')->nullable();
            $table->text('moderation_notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['reviewable_type', 'reviewable_id']);
            $table->index('status');
            $table->index('user_id');

            // Ensure one review per customer per provider
            $table->unique(['reviewable_type', 'reviewable_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
