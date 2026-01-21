<?php

namespace App\Http\Controllers;

use App\Models\CarListing;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use OpenApi\Attributes as OA;

class FeedController extends Controller
{
    /**
     * Car listings Atom feed (latest 50)
     */
    #[OA\Get(
        path: "/api/feed/car-listings.xml",
        operationId: "getCarListingsFeed",
        tags: ["GEO"],
        summary: "Get car listings Atom feed",
        description: "Returns Atom 1.0 feed with the latest 50 car listings (sale). Updates every 5 minutes. Ideal for AI systems tracking new inventory.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Atom feed XML",
                content: new OA\MediaType(
                    mediaType: "application/atom+xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function carListings()
    {
        $listings = Cache::remember('feed:car-listings', 300, function () {
            return CarListing::where('listing_type', 'sale')
                ->where('is_available', true)
                ->where('is_hidden', false)
                ->with(['brand', 'owner'])
                ->latest()
                ->limit(50)
                ->get();
        });

        return response()->view('feeds.car-listings', compact('listings'))
            ->header('Content-Type', 'application/atom+xml');
    }

    /**
     * Car rentals Atom feed (latest 50)
     */
    #[OA\Get(
        path: "/api/feed/car-rentals.xml",
        operationId: "getCarRentalsFeed",
        tags: ["GEO"],
        summary: "Get car rentals Atom feed",
        description: "Returns Atom 1.0 feed with the latest 50 car rental listings. Updates every 5 minutes.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Atom feed XML",
                content: new OA\MediaType(
                    mediaType: "application/atom+xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function carRentals()
    {
        $listings = Cache::remember('feed:car-rentals', 300, function () {
            return CarListing::where('listing_type', 'rent')
                ->where('is_available', true)
                ->where('is_hidden', false)
                ->with(['brand', 'owner'])
                ->latest()
                ->limit(50)
                ->get();
        });

        return response()->view('feeds.car-rentals', compact('listings'))
            ->header('Content-Type', 'application/atom+xml');
    }

    /**
     * Products Atom feed (latest 50)
     */
    #[OA\Get(
        path: "/api/feed/products.xml",
        operationId: "getProductsFeed",
        tags: ["GEO"],
        summary: "Get products Atom feed",
        description: "Returns Atom 1.0 feed with the latest 50 car spare parts and accessories. Updates every 5 minutes.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Atom feed XML",
                content: new OA\MediaType(
                    mediaType: "application/atom+xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function products()
    {
        $products = Cache::remember('feed:products', 300, function () {
            return Product::with('category')
                ->where('total_stock', '>', 0)
                ->latest()
                ->limit(50)
                ->get();
        });

        return response()->view('feeds.products', compact('products'))
            ->header('Content-Type', 'application/atom+xml');
    }
}
