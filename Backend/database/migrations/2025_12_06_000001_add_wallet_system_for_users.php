<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Adds wallet system for customers, technicians, and tow trucks
     */
    public function up(): void
    {
        // Add wallet_balance to customers
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('wallet_balance', 10, 2)->default(0)->after('saved_addresses');
        });

        // Add wallet_balance to technicians
        Schema::table('technicians', function (Blueprint $table) {
            $table->decimal('wallet_balance', 10, 2)->default(0)->after('saved_addresses');
        });

        // Add wallet_balance to tow_trucks
        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->decimal('wallet_balance', 10, 2)->default(0)->after('saved_addresses');
        });

        // User transactions - extensible for future features (auctions, orders)
        Schema::create('user_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->string('user_type');  // 'customer', 'technician', 'tow_truck'
            $table->string('type');       // 'deposit', 'withdrawal', 'payment', 'refund', 'hold', 'release'
            $table->decimal('amount', 10, 2);
            $table->string('description');
            $table->decimal('balance_after', 10, 2);
            $table->timestamp('timestamp');

            // Extensible reference pattern - links to any entity
            $table->string('reference_type')->nullable();  // 'order', 'auction', 'deposit', 'withdrawal'
            $table->string('reference_id')->nullable();    // ID of the related entity

            $table->timestamps();

            $table->index(['user_id', 'user_type']);
            $table->index(['reference_type', 'reference_id']);
        });

        // User deposits - for self-deposit requests
        Schema::create('user_deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->string('user_type');  // 'customer', 'technician', 'tow_truck'
            $table->string('user_name');  // Snapshot
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // 'pending', 'approved', 'rejected'
            $table->string('payment_method_id');
            $table->string('payment_method_name');
            $table->string('receipt_url');  // Uploaded proof of payment
            $table->timestamp('request_timestamp');
            $table->timestamp('decision_timestamp')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'user_type']);
            $table->index('status');
        });

        // User withdrawals
        Schema::create('user_withdrawals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->string('user_type');  // 'customer', 'technician', 'tow_truck'
            $table->string('user_name');  // Snapshot
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // 'pending', 'approved', 'rejected'
            $table->string('payment_method_id');
            $table->string('payment_method_name');
            $table->timestamp('request_timestamp');
            $table->timestamp('decision_timestamp')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('receipt_url')->nullable();  // Admin uploads after sending payment
            $table->timestamps();

            $table->index(['user_id', 'user_type']);
            $table->index('status');
        });

        // User wallet holds - for auction bids (FUTURE USE)
        Schema::create('user_wallet_holds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->string('user_type');
            $table->decimal('amount', 10, 2);
            $table->string('reason');               // 'auction_bid', etc.
            $table->string('reference_type');       // 'auction'
            $table->string('reference_id');         // auction_id
            $table->string('status')->default('active'); // 'active', 'released', 'captured'
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'user_type']);
            $table->index(['reference_type', 'reference_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_wallet_holds');
        Schema::dropIfExists('user_withdrawals');
        Schema::dropIfExists('user_deposits');
        Schema::dropIfExists('user_transactions');

        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->dropColumn('wallet_balance');
        });

        Schema::table('technicians', function (Blueprint $table) {
            $table->dropColumn('wallet_balance');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('wallet_balance');
        });
    }
};
