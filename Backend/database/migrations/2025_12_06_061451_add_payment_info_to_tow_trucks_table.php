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
        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->json('payment_info')->nullable()->after('wallet_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tow_trucks', function (Blueprint $table) {
            $table->dropColumn('payment_info');
        });
    }
};
