<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarListing;
use Illuminate\Http\Request;

class SocialShareController extends Controller
{
    /**
     * Generate meta tags for social media sharing
     * This endpoint returns HTML with proper Open Graph tags for crawlers
     */
    public function getCarListingMeta($slug)
    {
        $listing = CarListing::with(['brand', 'category', 'owner.car_provider'])
            ->where('slug', $slug)
            ->first();

        if (!$listing) {
            abort(404);
        }

        // Build meta tags
        $title = $listing->title;
        $description = substr($listing->description, 0, 160) . '...';
        $image = $listing->photos && count($listing->photos) > 0
            ? $listing->photos[0]
            : asset('images/default-car.jpg');
        $url = url("/car-listings/{$slug}");
        $price = number_format($listing->price, 0) . ' ل.س';

        // Return HTML with meta tags that redirect to SPA
        return response()->view('social-meta', compact(
            'title',
            'description',
            'image',
            'url',
            'price',
            'listing'
        ));
    }

    /**
     * Generate meta tags for rent car listings
     */
    public function getRentCarListingMeta($slug)
    {
        $listing = CarListing::with(['brand', 'category', 'owner.car_provider'])
            ->where('slug', $slug)
            ->where('listing_type', 'rent')
            ->first();

        if (!$listing) {
            abort(404);
        }

        $title = $listing->title;
        $description = substr($listing->description, 0, 160) . '...';
        $image = $listing->photos && count($listing->photos) > 0
            ? $listing->photos[0]
            : asset('images/default-car.jpg');
        $url = url("/rent-car/{$slug}");
        $price = number_format($listing->daily_rate, 0) . ' ل.س/يوم';

        return response()->view('social-meta', compact(
            'title',
            'description',
            'image',
            'url',
            'price',
            'listing'
        ));
    }
}
