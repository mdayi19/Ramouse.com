<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_provider_phones', function (Blueprint $table) {
            $table->id();
            $table->string('car_provider_id', 20);
            $table->foreign('car_provider_id')->references('id')->on('car_providers')->onDelete('cascade');

            $table->string('phone', 20);
            $table->string('label')->nullable();
            $table->boolean('is_whatsapp')->default(false);
            $table->boolean('is_primary')->default(false);

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_provider_phones');
    }
};
