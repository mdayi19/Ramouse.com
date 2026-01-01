<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('provider_id');
            // $table->foreign('provider_id')->references('id')->on('providers'); // Optional: enforce FK
            $table->decimal('amount', 10, 2);
            $table->string('status'); // Pending, Approved, Rejected
            $table->string('payment_method_id');
            $table->string('payment_method_name');
            $table->timestamp('request_timestamp');
            $table->timestamp('decision_timestamp')->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('receipt_url')->nullable();
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('provider_id');
            $table->string('type'); // deposit, withdrawal, etc.
            $table->decimal('amount', 10, 2);
            $table->string('description');
            $table->decimal('balance_after', 10, 2);
            $table->timestamp('timestamp');
            $table->string('related_order_id')->nullable();
            $table->string('related_withdrawal_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('withdrawals');
    }
};
