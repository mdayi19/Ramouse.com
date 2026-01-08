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

    /**
     * Generate meta tags for car provider profiles
     */
    public function getProviderMeta($id)
    {
        $provider = \App\Models\CarProvider::with(['user', 'phones'])->findOrFail($id);

        $title = $provider->company_name ?? $provider->user->name ?? 'مزود خدمة سيارات';
        $description = $provider->bio ?? 'مزود معتمد لخدمات السيارات على منصة رماوس';
        $image = $provider->profile_photo ?? asset('images/default-provider.jpg');
        $url = url("/car-providers/{$id}");
        $price = null;

        return response()->view('social-meta', compact('title', 'description', 'image', 'url', 'price'))
            ->with('listing', null);
    }

    /**
     * Generate meta tags for store products
     */
    public function getProductMeta($id)
    {
        $product = \App\Models\Product::findOrFail($id);

        $title = $product->name_ar ?? $product->name;
        $description = substr($product->description_ar ?? $product->description ?? '', 0, 160);
        $image = $product->image ?? asset('images/default-product.jpg');
        $url = url("/store/products/{$id}");
        $price = number_format($product->price, 0) . ' ل.س';

        return response()->view('social-meta', compact('title', 'description', 'image', 'url', 'price'))
            ->with('listing', null);
    }
}

