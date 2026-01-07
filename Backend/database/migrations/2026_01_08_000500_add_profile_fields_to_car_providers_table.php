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
        Schema::table('car_providers', function (Blueprint $table) {
            $table->string('cover_photo')->nullable()->after('profile_photo');
            $table->string('working_hours')->nullable()->after('description');
            $table->string('website')->nullable()->after('working_hours');
            $table->string('public_email')->nullable()->after('website'); // Contact email, different from login
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_providers', function (Blueprint $table) {
            $table->dropColumn(['cover_photo', 'working_hours', 'website', 'public_email']);
        });
    }
};
