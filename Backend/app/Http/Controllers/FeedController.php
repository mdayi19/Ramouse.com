<?php

namespace App\Http\Controllers;

use App\Models\CarListing;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use OpenApi\Attributes as OA;
use Carbon\Carbon;

class FeedController extends Controller
{
    /**
     * Helper to generate Atom XML feed
     */
    private function generateFeed($key, $title, $subtitle, $selfLink, $feedLink, $itemsCallback, $entryCallback)
    {
        try {
            // Updated XML building logic manually to avoid Blade issues
            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<feed xmlns="http://www.w3.org/2005/Atom">';
            $xml .= '<title>' . htmlspecialchars($title) . '</title>';
            $xml .= '<link href="' . url($selfLink) . '" rel="self" />';
            $xml .= '<link href="' . url($feedLink) . '" />';
            $xml .= '<id>' . url($selfLink) . '</id>';

            // Execute callback to get items
            $items = $itemsCallback();

            $updated = $items->first() ? $items->first()->updated_at : now();
            $xml .= '<updated>' . $updated->toAtomString() . '</updated>';

            $xml .= '<author>';
            $xml .= '<name>Ramouse.com</name>';
            $xml .= '<uri>https://ramouse.com</uri>';
            $xml .= '</author>';
            $xml .= '<subtitle>' . htmlspecialchars($subtitle) . '</subtitle>';

            foreach ($items as $item) {
                $xml .= $entryCallback($item);
            }

            $xml .= '</feed>';

            return response($xml, 200)->header('Content-Type', 'application/atom+xml');

        } catch (\Exception $e) {
            \Log::error("Feed Error ({$key}): " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Car listings Atom feed (latest 50)
     */
    #[OA\Get(
        path: "/api/feed/car-listings.xml",
        operationId: "getCarListingsFeed",
        tags: ["GEO"],
        summary: "Get car listings Atom feed",
        description: "Returns Atom 1.0 feed with the latest 50 car listings (sale). Updates every 5 minutes.",
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
        return $this->generateFeed(
            'feed:car-listings',
            'Ramouse.com - Latest Car Listings in Syria',
            'Real-time feed of car listings for sale in Syria',
            '/feed/car-listings.xml',
            '/car-marketplace',
            function () {
                return Cache::remember('feed:car-listings-data', 300, function () {
                    return CarListing::where('listing_type', 'sale')
                        ->where('is_available', true)
                        ->where('is_hidden', false)
                        ->with(['brand', 'owner'])
                        ->latest()
                        ->limit(50)
                        ->get();
                });
            },
            function ($listing) {
                $url = url('/car-listings/' . $listing->slug);
                $id = url('/entity/car-listing/' . $listing->id);
                $updated = $listing->updated_at->toAtomString();
                $published = $listing->created_at->toAtomString();
                $title = htmlspecialchars($listing->title);
                $condition = ucfirst($listing->condition);
                $price = number_format($listing->price);
                $mileage = number_format($listing->mileage);
                $transmission = ucfirst($listing->transmission);
                $fuel = ucfirst($listing->fuel_type);

                $summary = htmlspecialchars("{$listing->brand?->name} {$listing->model} {$listing->year} - {$condition} condition. Price: \${$price} USD. Location: {$listing->city}, Syria. Mileage: {$mileage} km. {$transmission} transmission, {$fuel} fuel.");

                // Build HTML content safely
                $contentHtml = "<h2>{$title}</h2>";
                $contentHtml .= "<p><strong>Price:</strong> \${$price} USD</p>";
                $contentHtml .= "<p><strong>Location:</strong> {$listing->city}, Syria</p>";
                $contentHtml .= "<p><strong>Condition:</strong> {$condition}</p>";
                $contentHtml .= "<p><strong>Year:</strong> {$listing->year}</p>";
                $contentHtml .= "<p><strong>Mileage:</strong> {$mileage} km</p>";
                $contentHtml .= "<p><strong>Transmission:</strong> {$transmission}</p>";
                $contentHtml .= "<p><strong>Fuel Type:</strong> {$fuel}</p>";
                $contentHtml .= "<p><strong>Doors:</strong> {$listing->doors_count} | <strong>Seats:</strong> {$listing->seats_count}</p>";
                $contentHtml .= "<p><strong>Color:</strong> {$listing->exterior_color}</p>";

                if ($listing->description) {
                    $desc = htmlspecialchars($listing->description);
                    $contentHtml .= "<h3>Description</h3><p>{$desc}</p>";
                }

                if ($listing->photos && is_array($listing->photos)) {
                    foreach ($listing->photos as $photo) {
                        $imgUrl = asset('storage/' . $photo);
                        $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$title}\" style=\"max-width: 600px; margin: 10px 0;\" />";
                    }
                }

                $contentHtml .= "<p><strong>Seller:</strong> " . htmlspecialchars($listing->owner?->name) . "</p>";
                $contentHtml .= "<p><strong>Contact:</strong> {$listing->contact_phone}</p>";

                $entry = "<entry>";
                $entry .= "<title>{$title}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";
                $entry .= "<category term=\"" . htmlspecialchars($listing->brand?->name) . "\" />";
                $entry .= "<category term=\"{$listing->city}\" />";
                $entry .= "<category term=\"{$listing->listing_type}\" />";
                $entry .= "<category term=\"{$listing->condition}\" />";
                $entry .= "<category term=\"Syria\" />";
                $entry .= "</entry>";
                return $entry;
            }
        );
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
        return $this->generateFeed(
            'feed:car-rentals',
            'Ramouse.com - Latest Car Rentals in Syria',
            'Real-time feed of car rentals available in Syria',
            '/feed/car-rentals.xml',
            '/car-rentals',
            function () {
                return Cache::remember('feed:car-rentals-data', 300, function () {
                    return CarListing::where('listing_type', 'rent')
                        ->where('is_available', true)
                        ->where('is_hidden', false)
                        ->with(['brand', 'owner'])
                        ->latest()
                        ->limit(50)
                        ->get();
                });
            },
            function ($listing) {
                $url = url('/car-rentals/' . $listing->slug);
                $id = url('/entity/car-listing/' . $listing->id);
                $updated = $listing->updated_at->toAtomString();
                $published = $listing->created_at->toAtomString();
                $title = htmlspecialchars($listing->title);
                $price = number_format($listing->daily_price_usd ?? 0);
                $transmission = ucfirst($listing->transmission);
                $fuel = ucfirst($listing->fuel_type);

                $summary = htmlspecialchars("{$listing->brand?->name} {$listing->model} {$listing->year} - Rent for \${$price}/day. Location: {$listing->city}, Syria.");

                $contentHtml = "<h2>{$title}</h2>";
                $contentHtml .= "<p><strong>Daily Rate:</strong> \${$price} USD</p>";
                $contentHtml .= "<p><strong>Location:</strong> {$listing->city}, Syria</p>";
                $contentHtml .= "<p><strong>Year:</strong> {$listing->year}</p>";
                $contentHtml .= "<p><strong>Transmission:</strong> {$transmission}</p>";

                if ($listing->description) {
                    $desc = htmlspecialchars($listing->description);
                    $contentHtml .= "<h3>Description</h3><p>{$desc}</p>";
                }

                if ($listing->photos && is_array($listing->photos)) {
                    foreach ($listing->photos as $photo) {
                        $imgUrl = asset('storage/' . $photo);
                        $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$title}\" style=\"max-width: 600px; margin: 10px 0;\" />";
                    }
                }

                $contentHtml .= "<p><strong>Provider:</strong> " . htmlspecialchars($listing->owner?->name) . "</p>";

                $entry = "<entry>";
                $entry .= "<title>{$title}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";
                $entry .= "<category term=\"" . htmlspecialchars($listing->brand?->name) . "\" />";
                $entry .= "<category term=\"{$listing->city}\" />";
                $entry .= "<category term=\"rent\" />";
                $entry .= "<category term=\"Syria\" />";
                $entry .= "</entry>";
                return $entry;
            }
        );
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
        return $this->generateFeed(
            'feed:products',
            'Ramouse.com - Latest Car Parts & Accessories in Syria',
            'Real-time feed of car parts and accessories available in Syria',
            '/feed/products.xml',
            '/store/products',
            function () {
                return Cache::remember('feed:products-data', 300, function () {
                    return Product::with('category')
                        ->where('total_stock', '>', 0)
                        ->latest()
                        ->limit(50)
                        ->get();
                });
            },
            function ($product) {
                $url = url('/store/products/' . $product->id);
                $id = url('/entity/product/' . $product->id);
                $updated = $product->updated_at->toAtomString();
                $published = $product->created_at->toAtomString();
                $title = htmlspecialchars($product->name);
                $price = number_format($product->price);
                $categoryName = htmlspecialchars($product->category?->name ?? 'Uncategorized');
                $stockStatus = $product->total_stock > 0 ? 'In Stock' : 'Out of Stock';

                $summary = htmlspecialchars("{$title} - {$categoryName}. Price: \${$price} USD. {$stockStatus}.");

                $contentHtml = "<h2>{$title}</h2>";
                $contentHtml .= "<p><strong>Category:</strong> {$categoryName}</p>";
                $contentHtml .= "<p><strong>Price:</strong> \${$price} USD</p>";
                $contentHtml .= "<p><strong>Stock:</strong> " . ($product->total_stock > 0 ? $product->total_stock . ' units available' : 'Out of Stock') . "</p>";

                if ($product->description) {
                    $desc = htmlspecialchars($product->description);
                    $contentHtml .= "<h3>Description</h3><p>{$desc}</p>";
                }

                if (is_array($product->media) && count($product->media) > 0) {
                    foreach ($product->media as $image) {
                        $imgUrl = asset('storage/' . $image);
                        $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$title}\" style=\"max-width: 600px; margin: 10px 0;\" />";
                    }
                }

                $entry = "<entry>";
                $entry .= "<title>{$title}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";
                $entry .= "<category term=\"{$categoryName}\" />";
                $entry .= "<category term=\"car-parts\" />";
                $entry .= "<category term=\"Syria\" />";
                $entry .= "</entry>";
                return $entry;
            }
        );
    }
}
