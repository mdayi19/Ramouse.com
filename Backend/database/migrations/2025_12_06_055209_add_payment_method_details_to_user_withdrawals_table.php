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
        Schema::table('user_withdrawals', function (Blueprint $table) {
            $table->text('payment_method_details')->nullable()->after('payment_method_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_withdrawals', function (Blueprint $table) {
            $table->dropColumn('payment_method_details');
        });
    }
};
