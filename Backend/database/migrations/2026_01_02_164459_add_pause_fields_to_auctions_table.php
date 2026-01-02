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
        Schema::table('auctions', function (Blueprint $table) {
            $table->text('cancellation_reason')->nullable()->after('payment_notes');
            $table->text('pause_reason')->nullable()->after('cancellation_reason');
            $table->timestamp('paused_at')->nullable()->after('pause_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropColumn(['cancellation_reason', 'pause_reason', 'paused_at']);
        });
    }
};
