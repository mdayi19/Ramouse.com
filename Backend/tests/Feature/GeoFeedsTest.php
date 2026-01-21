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

    public function test_car_rentals_feed_price_and_media()
    {
        // Mock data
        $mockListing = new \App\Models\CarListing();
        $mockListing->forceFill([
            'id' => 2,
            'title' => 'Rental Car',
            'slug' => 'rental-car',
            'price' => 50, // This is the fix verification
            'city' => 'Aleppo',
            'year' => 2022,
            'transmission' => 'automatic',
            'fuel_type' => 'petrol',
            'photos' => ['rent1.jpg'],
            'created_at' => now(),
            'updated_at' => now(),
            'is_available' => true,
            'is_hidden' => false,
            'listing_type' => 'rent'
        ]);
        $mockListing->setRelation('brand', new \App\Models\Brand(['name' => 'Kia']));
        $mockListing->setRelation('owner', new \App\Models\User(['name' => 'Rental Co']));

        \Illuminate\Support\Facades\Cache::put('feed:car-rentals-data', collect([$mockListing]), 300);

        $response = $this->get('/api/feed/car-rentals.xml');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Check Price (should be 50, not 0)
        $this->assertStringContainsString('Rent for $50/day', $content); // In title/summary
        $this->assertStringContainsString('Daily Rate:</strong> $50 USD', $content);

        // Check Media
        $this->assertStringContainsString('<media:content url="http://localhost:8000/storage/rent1.jpg" medium="image" />', $content);
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
}
