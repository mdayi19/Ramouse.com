<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('summary');
            $table->longText('content'); // Markdown
            $table->string('imageUrl');
            $table->string('author');
            $table->timestamp('published_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
