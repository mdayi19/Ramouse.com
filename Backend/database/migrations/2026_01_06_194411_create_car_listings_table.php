<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_listings', function (Blueprint $table) {
            $table->id();

            // SIMPLIFIED OWNERSHIP MODEL
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->enum('seller_type', ['individual', 'provider']);

            // Listing info
            $table->enum('listing_type', ['sale', 'rent']);
            $table->foreignId('car_listing_category_id')->nullable()->constrained('car_listing_categories')->onDelete('set null');

            // Car details - USING EXISTING brands table
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('brand_id'); // FK to existing brands.id
            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('restrict');
            $table->string('model');
            $table->year('year');
            $table->integer('mileage');
            $table->enum('condition', ['new', 'used', 'certified_pre_owned']);

            // Pricing
            $table->decimal('price', 10, 2);
            $table->boolean('is_negotiable')->default(false);
            $table->json('rental_terms')->nullable();

            // Colors
            $table->string('exterior_color')->nullable();
            $table->string('interior_color')->nullable();

            // Specs
            $table->enum('transmission', ['automatic', 'manual'])->nullable();
            $table->enum('fuel_type', ['gasoline', 'diesel', 'electric', 'hybrid'])->nullable();
            $table->integer('doors_count')->nullable();
            $table->integer('seats_count')->nullable();
            $table->string('license_plate')->nullable();
            $table->string('chassis_number', 17)->nullable();
            $table->string('engine_size')->nullable();
            $table->integer('horsepower')->nullable();
            $table->string('body_style')->nullable();
            $table->json('body_condition')->nullable();
            $table->integer('previous_owners')->nullable();
            $table->string('warranty')->nullable();

            // Content
            $table->json('features')->nullable();
            $table->text('description')->nullable();
            $table->json('photos');
            $table->string('video_url')->nullable();

            // Contact
            $table->string('contact_phone')->nullable();
            $table->string('contact_whatsapp')->nullable();

            // Status
            $table->boolean('is_available')->default(true);
            $table->boolean('is_hidden')->default(false);

            // Sponsorship
            $table->boolean('is_sponsored')->default(false);
            $table->timestamp('sponsored_until')->nullable();

            // Featured (admin)
            $table->boolean('is_featured')->default(false);
            $table->timestamp('featured_until')->nullable();
            $table->integer('featured_position')->nullable();

            // Analytics
            $table->integer('views_count')->default(0);

            // Soft delete
            $table->softDeletes();
            $table->timestamps();

            // INDEXES
            $table->index(['owner_id', 'seller_type']);
            $table->index('listing_type');
            $table->index('car_listing_category_id');
            $table->index('brand_id');
            $table->index('price');
            $table->index(['is_sponsored', 'sponsored_until']);
            $table->index(['is_featured', 'featured_position']);
            $table->index('is_available');
            $table->index('is_hidden');
            $table->index('created_at');
            $table->index('deleted_at');
        });

        // FULLTEXT index
        DB::statement('ALTER TABLE car_listings ADD FULLTEXT INDEX ft_search (title, description, model)');
    }

    public function down(): void
    {
        Schema::dropIfExists('car_listings');
    }
};
