<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->text('message');
            $table->string('target'); // all, customers, providers...
            $table->text('image_url')->nullable();
            $table->timestamp('timestamp')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
