<?php

namespace App\Http\Controllers;

use App\Models\CarListing;
use App\Models\Product;
use App\Models\CarProvider;
use App\Models\Technician;
use App\Models\TowTruck;
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
            $baseUrl = 'https://ramouse.com';

            // Updated XML building logic manually to avoid Blade issues
            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:georss="http://www.georss.org/georss" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">';
            $xml .= '<title>' . htmlspecialchars($title, ENT_XML1, 'UTF-8') . '</title>';
            $xml .= '<link href="' . $baseUrl . $selfLink . '" rel="self" />';
            $xml .= '<link href="' . $baseUrl . $feedLink . '" />';
            $xml .= '<id>' . $baseUrl . $selfLink . '</id>';

            // Execute callback to get items
            $items = $itemsCallback();

            $updated = $items->first() ? \Carbon\Carbon::parse($items->first()->updated_at) : now();
            $xml .= '<updated>' . $updated->toIso8601String() . '</updated>';

            $xml .= '<author>';
            $xml .= '<name>Ramouse.com</name>';
            $xml .= '<uri>https://ramouse.com</uri>';
            $xml .= '</author>';
            $xml .= '<subtitle>' . htmlspecialchars($subtitle, ENT_XML1, 'UTF-8') . '</subtitle>';

            foreach ($items as $item) {
                $xml .= $entryCallback($item);
            }

            $xml .= '</feed>';

            return response($xml, 200)->header('Content-Type', 'application/atom+xml; charset=UTF-8');

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
                $baseUrl = 'https://ramouse.com';
                $url = $baseUrl . '/car-listings/' . $listing->slug;
                $id = $baseUrl . '/entity/car-listing/' . $listing->id;
                $updated = \Carbon\Carbon::parse($listing->updated_at)->toIso8601String();
                $published = \Carbon\Carbon::parse($listing->created_at)->toIso8601String();
                $title = htmlspecialchars($listing->title, ENT_XML1, 'UTF-8');
                $condition = ucfirst($listing->condition);
                $price = number_format($listing->price);
                $mileage = number_format($listing->mileage);
                $transmission = ucfirst($listing->transmission);
                $fuel = ucfirst($listing->fuel_type);

                $summary = htmlspecialchars("{$listing->brand?->name} {$listing->model} {$listing->year} - {$condition} condition. Price: \${$price} USD. Location: {$listing->city}, Syria. Mileage: {$mileage} km. {$transmission} transmission, {$fuel} fuel.", ENT_XML1, 'UTF-8');

                // Build HTML content safely
                $contentHtml = "<h2>{$title}</h2>";
                $contentHtml .= "<p><strong>Price:</strong> \${$price} USD</p>";
                $contentHtml .= "<p><strong>Location:</strong> {$listing->city}, Syria" . ($listing->address ? " - " . htmlspecialchars($listing->address, ENT_XML1, 'UTF-8') : "") . "</p>";
                $contentHtml .= "<p><strong>Condition:</strong> {$condition}</p>";
                $contentHtml .= "<p><strong>Year:</strong> {$listing->year}</p>";
                $contentHtml .= "<p><strong>Mileage:</strong> {$mileage} km</p>";
                $contentHtml .= "<p><strong>Transmission:</strong> {$transmission}</p>";
                $contentHtml .= "<p><strong>Fuel Type:</strong> {$fuel}</p>";

                // Enhanced Specs
                if ($listing->engine_size)
                    $contentHtml .= "<p><strong>Engine Size:</strong> " . htmlspecialchars($listing->engine_size, ENT_XML1, 'UTF-8') . "</p>";
                if ($listing->horsepower)
                    $contentHtml .= "<p><strong>Horsepower:</strong> {$listing->horsepower} HP</p>";
                if ($listing->body_style)
                    $contentHtml .= "<p><strong>Body Style:</strong> " . htmlspecialchars($listing->body_style, ENT_XML1, 'UTF-8') . "</p>";
                if ($listing->interior_color)
                    $contentHtml .= "<p><strong>Interior Color:</strong> " . htmlspecialchars($listing->interior_color, ENT_XML1, 'UTF-8') . "</p>";
                if ($listing->warranty)
                    $contentHtml .= "<p><strong>Warranty:</strong> " . htmlspecialchars($listing->warranty, ENT_XML1, 'UTF-8') . "</p>";

                $contentHtml .= "<p><strong>Doors:</strong> {$listing->doors_count} | <strong>Seats:</strong> {$listing->seats_count}</p>";
                $contentHtml .= "<p><strong>Color:</strong> {$listing->exterior_color}</p>";

                // Safely handle features
                $features = $listing->features;
                if (is_string($features)) {
                    $features = json_decode($features, true);
                }

                // Features List
                if ($features && is_array($features) && count($features) > 0) {
                    $contentHtml .= "<h3>Key Features</h3><ul>";
                    foreach ($features as $feature) {
                        $fStr = is_array($feature) ? (implode(' ', $feature) ?: json_encode($feature)) : $feature;
                        $contentHtml .= "<li>" . htmlspecialchars($fStr, ENT_XML1, 'UTF-8') . "</li>";
                    }
                    $contentHtml .= "</ul>";
                }

                if ($listing->description) {
                    $desc = htmlspecialchars($listing->description, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<h3>Description</h3><p>{$desc}</p>";
                }

                // Safely handle photos
                $photos = $listing->photos;
                if (is_string($photos)) {
                    $photos = json_decode($photos, true);
                }

                if ($photos && is_array($photos)) {
                    foreach ($photos as $photo) {
                        $imgUrl = $baseUrl . '/storage/' . $photo;
                        $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$title}\" style=\"max-width: 600px; margin: 10px 0;\" />";
                    }
                }

                $contentHtml .= "<p><strong>Seller:</strong> " . htmlspecialchars($listing->owner?->name ?? 'Unknown', ENT_XML1, 'UTF-8') . "</p>";
                $contentHtml .= "<p><strong>Contact:</strong> {$listing->contact_phone}</p>";
                if ($listing->contact_whatsapp) {
                    $contentHtml .= "<p><strong>WhatsApp:</strong> {$listing->contact_whatsapp}</p>";
                }

                $entry = "<entry>";
                $entry .= "<title>{$title}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Metadata Link
                $entry .= '<link rel="alternate" type="application/ld+json" href="' . $baseUrl . "/entity/car-listing/{$listing->id}/metadata" . '" />';

                // Media RSS Tags
                if ($listing->video_url) {
                    $entry .= '<media:content url="' . htmlspecialchars($listing->video_url) . '" medium="video" />';
                }

                if ($photos && is_array($photos)) {
                    foreach ($photos as $index => $photo) {
                        $imgUrl = $baseUrl . '/storage/' . $photo;
                        // First photo as enclosure
                        if ($index === 0) {
                            $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                        }
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"" . htmlspecialchars($listing->brand?->name ?? 'Unknown') . "\" />";
                $entry .= "<category term=\"" . htmlspecialchars($listing->model) . "\" />";
                $entry .= "<category term=\"{$listing->year}\" />";
                $entry .= "<category term=\"{$listing->fuel_type}\" />";
                $entry .= "<category term=\"{$listing->transmission}\" />";
                if ($listing->exterior_color)
                    $entry .= "<category term=\"" . htmlspecialchars($listing->exterior_color) . "\" />";
                $entry .= "<category term=\"{$listing->city}\" />";
                $entry .= "<category term=\"{$listing->listing_type}\" />";
                $entry .= "<category term=\"{$listing->condition}\" />";
                $entry .= "<category term=\"Syria\" />";
                // GeoRSS
    
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
                $baseUrl = 'https://ramouse.com';
                $url = $baseUrl . '/car-rentals/' . $listing->slug;
                $id = $baseUrl . '/entity/car-listing/' . $listing->id;
                $updated = \Carbon\Carbon::parse($listing->updated_at)->toIso8601String();
                $published = \Carbon\Carbon::parse($listing->created_at)->toIso8601String();
                $title = htmlspecialchars($listing->title, ENT_XML1, 'UTF-8');

                // Fix: Check rental_terms if price is 0 (Quick Edit stores rates there)
                $priceValue = $listing->price;
                if ((empty($priceValue) || $priceValue == 0) && !empty($listing->rental_terms)) {
                    $terms = is_string($listing->rental_terms) ? json_decode($listing->rental_terms, true) : $listing->rental_terms;
                    $priceValue = $terms['daily_rate'] ?? $terms['daily_price'] ?? $terms['price'] ?? 0;
                }
                $price = number_format((float) $priceValue);

                $transmission = ucfirst($listing->transmission);
                $fuel = ucfirst($listing->fuel_type);

                $summary = htmlspecialchars("{$listing->brand?->name} {$listing->model} {$listing->year} - Rent for \${$price}/day. Location: {$listing->city}, Syria.", ENT_XML1, 'UTF-8');

                $contentHtml = "<h2>{$title}</h2>";
                $contentHtml .= "<p><strong>Daily Rate:</strong> \${$price} USD</p>";
                $contentHtml .= "<p><strong>Location:</strong> {$listing->city}, Syria" . ($listing->address ? " - " . htmlspecialchars($listing->address, ENT_XML1, 'UTF-8') : "") . "</p>";
                $contentHtml .= "<p><strong>Year:</strong> {$listing->year}</p>";
                $contentHtml .= "<p><strong>Mileage:</strong> {$listing->mileage} km</p>";
                $contentHtml .= "<p><strong>Transmission:</strong> {$transmission}</p>";
                $contentHtml .= "<p><strong>Fuel Type:</strong> {$fuel}</p>";

                // Enhanced Specs
                if ($listing->engine_size)
                    $contentHtml .= "<p><strong>Engine Size:</strong> " . htmlspecialchars($listing->engine_size, ENT_XML1, 'UTF-8') . "</p>";
                if ($listing->horsepower)
                    $contentHtml .= "<p><strong>Horsepower:</strong> {$listing->horsepower} HP</p>";
                if ($listing->body_style)
                    $contentHtml .= "<p><strong>Body Style:</strong> " . htmlspecialchars($listing->body_style, ENT_XML1, 'UTF-8') . "</p>";
                if ($listing->interior_color)
                    $contentHtml .= "<p><strong>Interior Color:</strong> " . htmlspecialchars($listing->interior_color, ENT_XML1, 'UTF-8') . "</p>";

                $contentHtml .= "<p><strong>Doors:</strong> {$listing->doors_count} | <strong>Seats:</strong> {$listing->seats_count}</p>";
                $contentHtml .= "<p><strong>Color:</strong> {$listing->exterior_color}</p>";

                // Safely handle features
                $features = $listing->features;
                if (is_string($features)) {
                    $features = json_decode($features, true);
                }

                // Features List
                if ($features && is_array($features) && count($features) > 0) {
                    $contentHtml .= "<h3>Key Features</h3><ul>";
                    foreach ($features as $feature) {
                        $fStr = is_array($feature) ? (implode(' ', $feature) ?: json_encode($feature)) : $feature;
                        $contentHtml .= "<li>" . htmlspecialchars($fStr, ENT_XML1, 'UTF-8') . "</li>";
                    }
                    $contentHtml .= "</ul>";
                }

                if ($listing->description) {
                    $desc = htmlspecialchars($listing->description, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<h3>Description</h3><p>{$desc}</p>";
                }

                // Rental Terms (if available)
                if (!empty($listing->rental_terms)) {
                    $terms = is_string($listing->rental_terms) ? json_decode($listing->rental_terms, true) : $listing->rental_terms;
                    if (isset($terms['requirements'])) {
                        $contentHtml .= "<h3>Rental Requirements</h3><p>" . htmlspecialchars($terms['requirements'], ENT_XML1, 'UTF-8') . "</p>";
                    }
                }

                // Safely handle photos
                $photos = $listing->photos;
                if (is_string($photos)) {
                    $photos = json_decode($photos, true);
                }

                if ($photos && is_array($photos)) {
                    foreach ($photos as $photo) {
                        $imgUrl = $baseUrl . '/storage/' . $photo;
                        $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$title}\" style=\"max-width: 600px; margin: 10px 0;\" />";
                    }
                }

                $contentHtml .= "<p><strong>Provider:</strong> " . htmlspecialchars($listing->owner?->name ?? 'Unknown', ENT_XML1, 'UTF-8') . "</p>";
                if ($listing->contact_whatsapp) {
                    $contentHtml .= "<p><strong>WhatsApp:</strong> {$listing->contact_whatsapp}</p>";
                }

                $entry = "<entry>";
                $entry .= "<title>{$title}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Metadata Link
                $entry .= '<link rel="alternate" type="application/ld+json" href="' . $baseUrl . "/entity/car-listing/{$listing->id}/metadata" . '" />';

                // Media RSS Tags
                if ($photos && is_array($photos)) {
                    foreach ($photos as $index => $photo) {
                        $imgUrl = $baseUrl . '/storage/' . $photo;
                        if ($index === 0) {
                            $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                        }
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"" . htmlspecialchars($listing->brand?->name ?? 'Unknown') . "\" />";
                $entry .= "<category term=\"" . htmlspecialchars($listing->model) . "\" />";
                $entry .= "<category term=\"{$listing->year}\" />";
                $entry .= "<category term=\"{$listing->fuel_type}\" />";
                $entry .= "<category term=\"{$listing->transmission}\" />";
                if ($listing->exterior_color)
                    $entry .= "<category term=\"" . htmlspecialchars($listing->exterior_color) . "\" />";
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
                $baseUrl = 'https://ramouse.com';
                $url = $baseUrl . '/store/products/' . $product->id;
                $id = $baseUrl . '/entity/product/' . $product->id;
                $updated = \Carbon\Carbon::parse($product->updated_at)->toIso8601String();
                $published = \Carbon\Carbon::parse($product->created_at)->toIso8601String();
                $title = htmlspecialchars($product->name, ENT_XML1, 'UTF-8');
                $price = number_format($product->price);
                $categoryName = htmlspecialchars($product->category?->name ?? 'Uncategorized', ENT_XML1, 'UTF-8');
                $stockStatus = $product->total_stock > 0 ? 'In Stock' : 'Out of Stock';

                $summary = htmlspecialchars("{$title} - {$categoryName}. Price: \${$price} USD. {$stockStatus}.", ENT_XML1, 'UTF-8');

                $contentHtml = "<h2>{$title}</h2>";
                $contentHtml .= "<p><strong>Category:</strong> {$categoryName}</p>";
                $contentHtml .= "<p><strong>Price:</strong> \${$price} USD</p>";
                $contentHtml .= "<p><strong>Stock:</strong> " . ($product->total_stock > 0 ? $product->total_stock . ' units available' : 'Out of Stock') . "</p>";
                if ($product->average_rating)
                    $contentHtml .= "<p><strong>Rating:</strong> {$product->average_rating} / 5</p>";
                if ($product->static_shipping_cost)
                    $contentHtml .= "<p><strong>Shipping Cost:</strong> \${$product->static_shipping_cost}</p>";
                if ($product->shipping_size) {
                    $size = is_array($product->shipping_size) ? implode('x', $product->shipping_size) : $product->shipping_size;
                    $contentHtml .= "<p><strong>Shipping Size:</strong> " . htmlspecialchars($size, ENT_XML1, 'UTF-8') . "</p>";
                }

                if ($product->description) {
                    $desc = htmlspecialchars($product->description, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<h3>Description</h3><p>{$desc}</p>";
                }

                // Safely handle media
                $media = $product->media;
                if (is_string($media)) {
                    $media = json_decode($media, true);
                }

                if (is_array($media) && count($media) > 0) {
                    foreach ($media as $image) {
                        $imgUrl = $baseUrl . '/storage/' . $image;
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

                // Metadata Link
                $entry .= '<link rel="alternate" type="application/ld+json" href="' . $baseUrl . "/entity/product/{$product->id}/metadata" . '" />';

                // Media RSS Tags
                if (is_array($media) && count($media) > 0) {
                    foreach ($media as $index => $image) {
                        $imgUrl = $baseUrl . '/storage/' . $image;
                        if ($index === 0) {
                            $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                        }
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"{$categoryName}\" />";
                $entry .= "<category term=\"" . ($product->total_stock > 0 ? 'In Stock' : 'Out of Stock') . "\" />";
                $entry .= "<category term=\"car-parts\" />";
                $entry .= "<category term=\"Syria\" />";
                $entry .= "</entry>";
                return $entry;
            }
        );
    }


    /**
     * Car Providers Atom feed (latest 20)
     */
    #[OA\Get(
        path: "/api/feed/car-providers.xml",
        operationId: "getCarProvidersFeed",
        tags: ["GEO"],
        summary: "Get car providers Atom feed",
        description: "Returns Atom 1.0 feed with the latest 20 registered car providers. Updates every 5 minutes.",
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
    public function carProviders()
    {
        return $this->generateFeed(
            'feed:car-providers',
            'Ramouse.com - Newest Car Providers in Syria',
            'Real-time feed of newly registered car dealerships and providers in Syria',
            '/feed/car-providers.xml',
            '/car-providers',
            function () {
                return Cache::remember('feed:car-providers-data', 300, function () {
                    return CarProvider::where('is_active', true)
                        ->where('is_verified', true)
                        ->latest('created_at')
                        ->limit(20)
                        ->get();
                });
            },
            function ($provider) {
                $baseUrl = 'https://ramouse.com';
                $url = $baseUrl . '/car-providers/' . $provider->id;
                $id = $baseUrl . '/entity/car-provider/' . $provider->id;
                $updated = \Carbon\Carbon::parse($provider->updated_at)->toIso8601String();
                $published = \Carbon\Carbon::parse($provider->created_at)->toIso8601String();
                $name = htmlspecialchars($provider->name, ENT_XML1, 'UTF-8');
                $city = htmlspecialchars($provider->city, ENT_XML1, 'UTF-8');

                $summary = htmlspecialchars("New Car Provider in {$city}: {$name}. Visit their profile for latest listings.", ENT_XML1, 'UTF-8');

                $contentHtml = "<h2>{$name}</h2>";
                $contentHtml .= "<p><strong>Location:</strong> {$city}, Syria" . ($provider->address ? " - " . htmlspecialchars($provider->address, ENT_XML1, 'UTF-8') : "") . "</p>";

                if ($provider->working_hours) {
                    $contentHtml .= "<p><strong>Working Hours:</strong> " . htmlspecialchars($provider->working_hours, ENT_XML1, 'UTF-8') . "</p>";
                }
                if ($provider->website) {
                    $website = htmlspecialchars($provider->website, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<p><strong>Website:</strong> <a href=\"" . $website . "\">" . $website . "</a></p>";
                }
                if ($provider->public_email) {
                    $contentHtml .= "<p><strong>Email:</strong> " . htmlspecialchars($provider->public_email, ENT_XML1, 'UTF-8') . "</p>";
                }

                if ($provider->description) {
                    $desc = htmlspecialchars($provider->description, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<h3>About</h3><p>{$desc}</p>";
                }

                if ($provider->profile_photo) {
                    $imgUrl = $baseUrl . '/storage/' . $provider->profile_photo;
                    $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$name}\" style=\"max-width: 300px; margin: 10px 0;\" />";
                }

                if ($provider->business_type) {
                    $contentHtml .= "<p><strong>Type:</strong> " . ucfirst($provider->business_type) . "</p>";
                }

                if ($provider->socials) {
                    $socials = is_string($provider->socials) ? json_decode($provider->socials, true) : $provider->socials;
                    if (is_array($socials)) {
                        $contentHtml .= "<p><strong>Socials:</strong> " . implode(', ', array_keys($socials)) . "</p>";
                    }
                }

                $entry = "<entry>";
                $entry .= "<title>{$name}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Metadata Link
                $entry .= '<link rel="alternate" type="application/ld+json" href="' . $baseUrl . "/entity/car-provider/{$provider->id}/metadata" . '" />';

                // Media RSS Tags
                if ($provider->profile_photo) {
                    $imgUrl = $baseUrl . '/storage/' . $provider->profile_photo;
                    $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                    $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                }

                // Safely handle gallery
                $gallery = $provider->gallery;
                if (is_string($gallery)) {
                    $gallery = json_decode($gallery, true);
                }

                if ($gallery && is_array($gallery)) {
                    foreach ($gallery as $image) {
                        $imgUrl = $baseUrl . '/storage/' . $image;
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"Car Provider\" />";
                if ($provider->business_type)
                    $entry .= "<category term=\"" . ucfirst($provider->business_type) . "\" />";
                $entry .= "<category term=\"{$city}\" />";
                $entry .= "<category term=\"Syria\" />";

                // GeoRSS
                if ($provider->latitude && $provider->longitude) {
                    $entry .= '<georss:point>' . $provider->latitude . ' ' . $provider->longitude . '</georss:point>';
                }

                $entry .= "</entry>";
                return $entry;
            }
        );
    }

    /**
     * Technicians Atom feed (latest 20)
     */
    #[OA\Get(
        path: "/api/feed/technicians.xml",
        operationId: "getTechniciansFeed",
        tags: ["GEO"],
        summary: "Get technicians Atom feed",
        description: "Returns Atom 1.0 feed with the latest 20 registered technicians. Updates every 5 minutes.",
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
    public function technicians()
    {
        return $this->generateFeed(
            'feed:technicians',
            'Ramouse.com - Newest Technicians in Syria',
            'Real-time feed of newly registered automotive technicians in Syria',
            '/feed/technicians.xml',
            '/technicians',
            function () {
                return Cache::remember('feed:technicians-data', 300, function () {
                    return Technician::where('is_active', true)
                        ->where('is_verified', true)
                        ->latest('created_at')
                        ->limit(20)
                        ->get();
                });
            },
            function ($tech) {
                $baseUrl = 'https://ramouse.com';
                $url = $baseUrl . '/technicians/' . $tech->id;
                $id = $baseUrl . '/entity/technician/' . $tech->id;
                $updated = \Carbon\Carbon::parse($tech->updated_at)->toIso8601String();
                $published = \Carbon\Carbon::parse($tech->created_at)->toIso8601String();
                $name = htmlspecialchars($tech->name, ENT_XML1, 'UTF-8');
                $city = htmlspecialchars($tech->city, ENT_XML1, 'UTF-8');
                $specialty = htmlspecialchars($tech->specialty ?? 'General Mechanic', ENT_XML1, 'UTF-8');

                $summary = htmlspecialchars("New Technician in {$city}: {$name}. Specialty: {$specialty}.", ENT_XML1, 'UTF-8');

                $contentHtml = "<h2>{$name}</h2>";
                $contentHtml .= "<p><strong>Location:</strong> {$city}, Syria" . ($tech->workshop_address ? " - " . htmlspecialchars($tech->workshop_address, ENT_XML1, 'UTF-8') : "") . "</p>";
                $contentHtml .= "<p><strong>Specialty:</strong> {$specialty}</p>";
                if ($tech->average_rating)
                    $contentHtml .= "<p><strong>Rating:</strong> {$tech->average_rating} / 5</p>";

                if ($tech->description) {
                    $desc = htmlspecialchars($tech->description, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<h3>About</h3><p>{$desc}</p>";
                }

                if ($tech->profile_photo) {
                    $imgUrl = $baseUrl . '/storage/' . $tech->profile_photo;
                    $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$name}\" style=\"max-width: 300px; margin: 10px 0;\" />";
                }

                if ($tech->socials) {
                    $socials = is_string($tech->socials) ? json_decode($tech->socials, true) : $tech->socials;
                    if (is_array($socials)) {
                        $contentHtml .= "<p><strong>Socials:</strong> " . implode(', ', array_keys($socials)) . "</p>";
                    }
                }

                $entry = "<entry>";
                $entry .= "<title>{$name}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Metadata Link
                $entry .= '<link rel="alternate" type="application/ld+json" href="' . $baseUrl . "/entity/technician/{$tech->id}/metadata" . '" />';

                // Media RSS Tags
                if ($tech->profile_photo) {
                    $imgUrl = $baseUrl . '/storage/' . $tech->profile_photo;
                    $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                    $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                }

                // Safely handle gallery
                $gallery = $tech->gallery;
                if (is_string($gallery)) {
                    $gallery = json_decode($gallery, true);
                }

                if ($gallery && is_array($gallery)) {
                    foreach ($gallery as $image) {
                        $imgUrl = $baseUrl . '/storage/' . $image;
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"Technician\" />";
                $entry .= "<category term=\"Verified\" />";
                $entry .= "<category term=\"{$specialty}\" />";
                $entry .= "<category term=\"{$city}\" />";
                $entry .= "<category term=\"Syria\" />";

                // GeoRSS
                $loc = $tech->location;
                if (is_string($loc)) {
                    $loc = json_decode($loc, true);
                }
                if (is_array($loc) && isset($loc['latitude']) && isset($loc['longitude'])) {
                    $entry .= '<georss:point>' . $loc['latitude'] . ' ' . $loc['longitude'] . '</georss:point>';
                }

                $entry .= "</entry>";
                return $entry;
            }
        );
    }

    /**
     * Tow Trucks Atom feed (latest 20)
     */
    #[OA\Get(
        path: "/api/feed/tow-trucks.xml",
        operationId: "getTowTrucksFeed",
        tags: ["GEO"],
        summary: "Get tow trucks Atom feed",
        description: "Returns Atom 1.0 feed with the latest 20 registered tow trucks. Updates every 5 minutes.",
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
    public function towTrucks()
    {
        return $this->generateFeed(
            'feed:tow-trucks',
            'Ramouse.com - Newest Tow Trucks in Syria',
            'Real-time feed of newly registered tow truck services in Syria',
            '/feed/tow-trucks.xml',
            '/tow-trucks',
            function () {
                return Cache::remember('feed:tow-trucks-data', 300, function () {
                    return TowTruck::where('is_active', true)
                        ->where('is_verified', true)
                        ->latest('created_at')
                        ->limit(20)
                        ->get();
                });
            },
            function ($truck) {
                $baseUrl = 'https://ramouse.com';
                $url = $baseUrl . '/tow-trucks/' . $truck->id;
                $id = $baseUrl . '/entity/tow-truck/' . $truck->id;
                $updated = \Carbon\Carbon::parse($truck->updated_at)->toIso8601String();
                $published = \Carbon\Carbon::parse($truck->created_at)->toIso8601String();
                $name = htmlspecialchars($truck->name, ENT_XML1, 'UTF-8');
                $city = htmlspecialchars($truck->city, ENT_XML1, 'UTF-8');
                $vehicleType = htmlspecialchars($truck->vehicle_type ?? 'Standard Tow Truck', ENT_XML1, 'UTF-8');

                $summary = htmlspecialchars("New Tow Truck in {$city}: {$name}. Vehicle Type: {$vehicleType}.", ENT_XML1, 'UTF-8');

                $contentHtml = "<h2>{$name}</h2>";
                $contentHtml .= "<p><strong>Location:</strong> {$city}, Syria</p>";
                $contentHtml .= "<p><strong>Vehicle Type:</strong> {$vehicleType}</p>";
                if ($truck->service_area) {
                    $area = is_array($truck->service_area) ? implode(', ', $truck->service_area) : $truck->service_area;
                    $contentHtml .= "<p><strong>Service Area:</strong> " . htmlspecialchars($area, ENT_XML1, 'UTF-8') . "</p>";
                }
                if ($truck->average_rating)
                    $contentHtml .= "<p><strong>Rating:</strong> {$truck->average_rating} / 5</p>";

                if ($truck->description) {
                    $desc = htmlspecialchars($truck->description, ENT_XML1, 'UTF-8');
                    $contentHtml .= "<h3>About</h3><p>{$desc}</p>";
                }

                if ($truck->profile_photo) {
                    $imgUrl = $baseUrl . '/storage/' . $truck->profile_photo;
                    $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$name}\" style=\"max-width: 300px; margin: 10px 0;\" />";
                }

                if ($truck->socials) {
                    $socials = is_string($truck->socials) ? json_decode($truck->socials, true) : $truck->socials;
                    if (is_array($socials)) {
                        $contentHtml .= "<p><strong>Socials:</strong> " . implode(', ', array_keys($socials)) . "</p>";
                    }
                }


                $entry = "<entry>";
                $entry .= "<title>{$name}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Metadata Link
                $entry .= '<link rel="alternate" type="application/ld+json" href="' . $baseUrl . "/entity/tow-truck/{$truck->id}/metadata" . '" />';

                // Media RSS Tags
                if ($truck->profile_photo) {
                    $imgUrl = $baseUrl . '/storage/' . $truck->profile_photo;
                    $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                    $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                }

                // Safely handle gallery
                $gallery = $truck->gallery;
                if (is_string($gallery)) {
                    $gallery = json_decode($gallery, true);
                }

                if ($gallery && is_array($gallery)) {
                    foreach ($gallery as $image) {
                        $imgUrl = $baseUrl . '/storage/' . $image;
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"Tow Truck\" />";
                $entry .= "<category term=\"" . htmlspecialchars($truck->vehicle_type ?? 'Standard') . "\" />";
                $entry .= "<category term=\"{$city}\" />";
                $entry .= "<category term=\"Syria\" />";

                // GeoRSS
                $loc = $truck->location;
                if (is_string($loc)) {
                    $loc = json_decode($loc, true);
                }
                if (is_array($loc) && isset($loc['latitude']) && isset($loc['longitude'])) {
                    $entry .= '<georss:point>' . $loc['latitude'] . ' ' . $loc['longitude'] . '</georss:point>';
                }

                $entry .= "</entry>";
                return $entry;
            }
        );
    }
}
