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

    public function test_car_listings_feed_loading()
    {
        $response = $this->get('/api/feed/car-listings.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');
    }

    public function test_car_rentals_feed_loading()
    {
        $response = $this->get('/api/feed/car-rentals.xml');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/atom+xml');
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
