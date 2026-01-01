<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number');
            $table->foreign('order_number')->references('order_number')->on('orders')->onDelete('cascade');
            $table->string('provider_id');
            $table->foreign('provider_id')->references('id')->on('providers');
            $table->string('provider_name'); // Snapshot
            $table->string('provider_unique_id'); // Snapshot

            $table->decimal('price', 10, 2);
            $table->string('part_status'); // new, used
            $table->string('part_size_category')->nullable(); // xs, s, m, l, vl
            $table->text('notes')->nullable();
            $table->json('media')->nullable(); // {images: [], video, voiceNote}
            $table->boolean('viewed_by_customer')->default(false);

            $table->timestamp('timestamp')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
