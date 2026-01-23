<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\CarListing;
use App\Models\CarProvider;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GeoFeedsTest extends TestCase
{
    // Use RefreshDatabase if you want to run against a clean DB, 
    // but for now we might just want to check routes exist. 
    // If we use RefreshDatabase, we need to seed data.
    // Let's assume we want to test with existing data or just empty responses, 
    // but the endpoints must not error.

    // Feeds Tests

    public function test_car_listings_feed_structure_and_media()
    {
        // Mock data to bypass DB connection issue
        $mockListing = new \App\Models\CarListing();
        $mockListing->forceFill([
            'id' => 1,
            'title' => 'Test Car',
            'slug' => 'test-car',
            'price' => 15000,
            'city' => 'Damascus',
            'condition' => 'used',
            'year' => 2020,
            'mileage' => 50000,
            'transmission' => 'automatic',
            'fuel_type' => 'petrol',
            'photos' => ['car1.jpg', 'car2.jpg'],
            'video_url' => 'https://youtube.com/watch?v=123',
            'created_at' => now(),
            'updated_at' => now(),
            'is_available' => true,
            'is_hidden' => false,
            'listing_type' => 'sale'
        ]);
        // Mock relations
        $mockListing->setRelation('brand', new \App\Models\Brand(['name' => 'Toyota']));
        $mockListing->setRelation('owner', new \App\Models\User(['name' => 'John Doe']));

        // Seed Cache
        \Illuminate\Support\Facades\Cache::put('feed:car-listings-data', collect([$mockListing]), 300);

        $response = $this->get('/api/feed/car-listings.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');

        // precise assertions
        $content = $response->getContent();
        $this->assertStringContainsString('xmlns:media="http://search.yahoo.com/mrss/"', $content);
        $this->assertStringContainsString('<media:content url="http://localhost:8000/storage/car1.jpg" medium="image" />', $content);
        $this->assertStringContainsString('<media:content url="https://youtube.com/watch?v=123" medium="video" />', $content);
        $this->assertStringContainsString('<link rel="enclosure" href="http://localhost:8000/storage/car1.jpg" type="image/jpeg" />', $content);
    }

    public function test_car_rentals_feed_price_logic()
    {
        // Case 1: Price in 'price' column
        $listing1 = new \App\Models\CarListing();
        $listing1->forceFill([
            'id' => 101,
            'title' => 'Price Column Car',
            'slug' => 'price-column-car',
            'listing_type' => 'rent',
            'price' => 100,
            'rental_terms' => null,
            'is_available' => true,
            'is_hidden' => false,
            'city' => 'Damascus',
            'year' => 2020,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Case 2: Price in rental_terms['daily_rate'] (Simulating Quick Edit)
        $listing2 = new \App\Models\CarListing();
        $listing2->forceFill([
            'id' => 102,
            'title' => 'Rental Terms Car',
            'slug' => 'rental-terms-car',
            'listing_type' => 'rent',
            'price' => 0,
            'rental_terms' => ['daily_rate' => 200],
            'is_available' => true,
            'is_hidden' => false,
            'city' => 'Damascus',
            'year' => 2020,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        \Illuminate\Support\Facades\Cache::put('feed:car-rentals-data', collect([$listing1, $listing2]), 300);

        $response = $this->get('/api/feed/car-rentals.xml');
        $response->assertStatus(200);
        $content = $response->getContent();

        // Assert 1: Should show $100
        $this->assertStringContainsString('Daily Rate:</strong> $100 USD', $content);

        // Assert 2: Should show $200 (This is expected to FAIL currently)
        $this->assertStringContainsString('Daily Rate:</strong> $200 USD', $content);
    }

    public function test_feed_photos_rendering()
    {
        $listing = new \App\Models\CarListing();
        $listing->forceFill([
            'id' => 201,
            'title' => 'Photo Car',
            'slug' => 'photo-car',
            'listing_type' => 'sale',
            'price' => 1000,
            'photos' => ['test-image.jpg'],
            'is_available' => true,
            'is_hidden' => false,
            'city' => 'Damascus',
            'year' => 2020,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        \Illuminate\Support\Facades\Cache::put('feed:car-listings-data', collect([$listing]), 300);

        $response = $this->get('/api/feed/car-listings.xml');
        $content = $response->getContent();

        // Verify Image Tag
        $this->assertStringContainsString('<img src=', $content);
        $this->assertStringContainsString('test-image.jpg', $content);

        // Verify Media RSS
        $this->assertStringContainsString('<media:content', $content);
    }

    public function test_products_feed_loading()
    {
        $response = $this->get('/api/feed/products.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');
    }

    public function test_car_providers_feed_loading()
    {
        $response = $this->get('/api/feed/car-providers.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');
    }

    public function test_technicians_feed_loading()
    {
        $response = $this->get('/api/feed/technicians.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');
    }

    public function test_tow_trucks_feed_loading()
    {
        $response = $this->get('/api/feed/tow-trucks.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');
    }

    // Sitemaps Tests (Bonus Check)

    public function test_main_sitemap_loading()
    {
        $response = $this->get('/api/sitemap.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');
    }
    public function test_feed_enrichment_checks()
    {
        // Mock Rental with Terms
        $rental = new \App\Models\CarListing();
        $rental->forceFill([
            'id' => 301,
            'title' => 'Enriched Rental',
            'slug' => 'enriched-rental',
            'listing_type' => 'rent',
            'price' => 0,
            'rental_terms' => ['daily_rate' => 50, 'requirements' => 'Passport required'],
            'engine_size' => '2.0L',
            'features' => ['AC', 'GPS'],
            'city' => 'Damascus',
            'year' => 2022,
            'is_available' => true,
            'is_hidden' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        \Illuminate\Support\Facades\Cache::put('feed:car-rentals-data', collect([$rental]), 300);

        $response = $this->get('/api/feed/car-rentals.xml');
        $content = $response->getContent();
        $this->assertStringContainsString('Passport required', $content);
        $this->assertStringContainsString('Engine Size:</strong> 2.0L', $content);
        $this->assertStringContainsString('<li>AC</li>', $content);
        $this->assertStringContainsString('application/ld+json', $content);

        // Mock Provider with GeoRSS
        $provider = new \App\Models\CarProvider();
        $provider->forceFill([
            'id' => 401,
            'name' => 'Test Provider',
            'city' => 'Aleppo',
            'location' => ['latitude' => 36.2, 'longitude' => 37.1],
            'working_hours' => '9AM - 5PM',
            'is_active' => true,
            'is_verified' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        \Illuminate\Support\Facades\Cache::put('feed:car-providers-data', collect([$provider]), 300);

        $response = $this->get('/api/feed/car-providers.xml');
        $content = $response->getContent();
        $this->assertStringContainsString('<georss:point>36.2 37.1</georss:point>', $content);
        $this->assertStringContainsString('Working Hours:</strong> 9AM - 5PM', $content);
        $this->assertStringContainsString('application/ld+json', $content);
    }
}
