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
        Schema::create('international_license_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('full_name');
            $table->string('phone');
            $table->enum('nationality', ['syrian', 'non_syrian']);
            $table->string('personal_photo')->nullable();
            $table->string('id_document')->nullable();
            $table->string('passport_document')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('payment_method')->nullable();
            $table->string('proof_of_payment')->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'rejected'])->default('pending');
            $table->enum('status', ['pending', 'payment_check', 'documents_check', 'in_work', 'ready_to_handle', 'rejected'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->string('order_number')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('international_license_requests');
    }
};
