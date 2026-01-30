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
        Schema::table('car_categories', function (Blueprint $table) {
            // Check if columns don't exist before adding them
            if (!Schema::hasColumn('car_categories', 'telegram_bot_token')) {
                $table->string('telegram_bot_token')->nullable()->after('brands');
            }

            if (!Schema::hasColumn('car_categories', 'telegram_channel_id')) {
                $table->string('telegram_channel_id')->nullable()->after('telegram_bot_token');
            }

            if (!Schema::hasColumn('car_categories', 'telegram_notifications_enabled')) {
                $table->boolean('telegram_notifications_enabled')->default(false)->after('telegram_channel_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_categories', function (Blueprint $table) {
            $table->dropColumn([
                'telegram_bot_token',
                'telegram_channel_id',
                'telegram_notifications_enabled'
            ]);
        });
    }
};
