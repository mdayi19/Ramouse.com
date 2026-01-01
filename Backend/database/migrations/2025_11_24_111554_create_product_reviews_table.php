<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('product_id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->string('user_id');
            $table->string('user_name');
            $table->integer('rating');
            $table->text('comment');
            $table->timestamp('date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
