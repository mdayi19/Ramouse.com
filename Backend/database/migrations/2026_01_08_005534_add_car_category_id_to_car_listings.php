<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('car_listings', function (Blueprint $table) {
            // Car category (German, Japanese, Korean, etc.) - stored as string ID
            $table->string('car_category_id', 10)->nullable()->after('car_listing_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('car_listings', function (Blueprint $table) {
            $table->dropColumn('car_category_id');
        });
    }
};
