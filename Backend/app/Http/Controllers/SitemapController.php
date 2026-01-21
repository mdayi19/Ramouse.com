<?php

namespace App\Http\Controllers;

use App\Models\CarListing;
use App\Models\CarProvider;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use OpenApi\Attributes as OA;

class SitemapController extends Controller
{
    /**
     * Sitemap index - lists all sub-sitemaps
     */
    #[OA\Get(
        path: "/api/sitemap.xml",
        operationId: "getSitemapIndex",
        tags: ["GEO"],
        summary: "Get sitemap index",
        description: "Returns the main sitemap index listing all entity-specific sitemaps. This is the entry point for AI crawlers and search engines.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Sitemap index XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(
                        type: "string",
                        example: "<?xml version='1.0' encoding='UTF-8'?><sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>...</sitemapindex>"
                    )
                )
            )
        ]
    )]
    public function index()
    {
        $sitemaps = [
            [
                'loc' => url('/sitemap/car-listings.xml'),
                'lastmod' => CarListing::where('listing_type', 'sale')->max('updated_at')
            ],
            [
                'loc' => url('/sitemap/car-rentals.xml'),
                'lastmod' => CarListing::where('listing_type', 'rent')->max('updated_at')
            ],
            [
                'loc' => url('/sitemap/car-providers.xml'),
                'lastmod' => CarProvider::max('updated_at')
            ],
            [
                'loc' => url('/sitemap/technicians.xml'),
                'lastmod' => Technician::max('updated_at')
            ],
            [
                'loc' => url('/sitemap/tow-trucks.xml'),
                'lastmod' => TowTruck::max('updated_at')
            ],
            [
                'loc' => url('/sitemap/products.xml'),
                'lastmod' => Product::max('updated_at')
            ],
        ];

        return response()->view('sitemaps.index', compact('sitemaps'))
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Car listings for sale sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/car-listings.xml",
        operationId: "getCarListingsSitemap",
        tags: ["GEO"],
        summary: "Get car listings sitemap",
        description: "Returns XML sitemap for all car listings (sale). Includes images, metadata links, and priority indicators.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Car listings sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function carListings()
    {
        $listings = Cache::remember('sitemap:car-listings', 3600, function () {
            return CarListing::where('listing_type', 'sale')
                ->where('is_available', true)
                ->where('is_hidden', false)
                ->with(['brand', 'owner'])
                ->select('id', 'slug', 'title', 'city', 'price', 'brand_id', 'owner_id', 'is_sponsored', 'is_featured', 'photos', 'created_at', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->get();
        });

        return response()->view('sitemaps.car-listings', compact('listings'))
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Car rentals sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/car-rentals.xml",
        operationId: "getCarRentalsSitemap",
        tags: ["GEO"],
        summary: "Get car rentals sitemap",
        description: "Returns XML sitemap for all car rental listings. Includes images, metadata links, and priority indicators.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Car rentals sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function carRentals()
    {
        $listings = Cache::remember('sitemap:car-rentals', 3600, function () {
            return CarListing::where('listing_type', 'rent')
                ->where('is_available', true)
                ->where('is_hidden', false)
                ->with(['brand', 'owner'])
                ->select('id', 'slug', 'title', 'city', 'rental_terms', 'brand_id', 'owner_id', 'is_sponsored', 'is_featured', 'photos', 'created_at', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->get();
        });

        return response()->view('sitemaps.car-rentals', compact('listings'))
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Car providers sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/car-providers.xml",
        operationId: "getCarProvidersSitemap",
        tags: ["GEO"],
        summary: "Get car providers sitemap",
        description: "Returns XML sitemap for all verified car providers and dealerships.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Car providers sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function carProviders()
    {
        $providers = Cache::remember('sitemap:car-providers', 3600, function () {
            return CarProvider::where('is_active', true)
                ->where('is_verified', true)
                ->withCount('listings')
                ->orderBy('updated_at', 'desc')
                ->get();
        });

        return response()->view('sitemaps.car-providers', compact('providers'))
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Technicians sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/technicians.xml",
        operationId: "getTechniciansSitemap",
        tags: ["GEO"],
        summary: "Get technicians sitemap",
        description: "Returns XML sitemap for all verified automotive technicians and repair services.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Technicians sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function technicians()
    {
        $technicians = Cache::remember('sitemap:technicians', 3600, function () {
            return Technician::where('is_active', true)
                ->where('is_verified', true)
                ->orderBy('updated_at', 'desc')
                ->get();
        });

        return response()->view('sitemaps.technicians', compact('technicians'))
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Tow trucks sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/tow-trucks.xml",
        operationId: "getTowTrucksSitemap",
        tags: ["GEO"],
        summary: "Get tow trucks sitemap",
        description: "Returns XML sitemap for all verified tow truck and recovery services.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Tow trucks sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function towTrucks()
    {
        $towTrucks = Cache::remember('sitemap:tow-trucks', 3600, function () {
            return TowTruck::where('is_active', true)
                ->where('is_verified', true)
                ->orderBy('updated_at', 'desc')
                ->get();
        });

        return response()->view('sitemaps.tow-trucks', compact('towTrucks'))
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Products (spare parts) sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/products.xml",
        operationId: "getProductsSitemap",
        tags: ["GEO"],
        summary: "Get products sitemap",
        description: "Returns XML sitemap for all car spare parts and accessories in stock.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Products sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function products()
    {
        $products = Cache::remember('sitemap:products', 3600, function () {
            return Product::with('category')
                ->where('total_stock', '>', 0)
                ->orderBy('updated_at', 'desc')
                ->get();
        });

        return response()->view('sitemaps.products', compact('products'))
            ->header('Content-Type', 'application/xml');
    }
}
