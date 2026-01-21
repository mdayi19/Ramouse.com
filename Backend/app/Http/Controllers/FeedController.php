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
            // Updated XML building logic manually to avoid Blade issues
            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">';
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

                // Media RSS Tags
                if ($listing->video_url) {
                    $entry .= '<media:content url="' . htmlspecialchars($listing->video_url) . '" medium="video" />';
                }

                if ($listing->photos && is_array($listing->photos)) {
                    foreach ($listing->photos as $index => $photo) {
                        $imgUrl = asset('storage/' . $photo);
                        // First photo as enclosure
                        if ($index === 0) {
                            $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                        }
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"" . htmlspecialchars($listing->brand?->name ?? 'Unknown') . "\" />";
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
                $price = number_format($listing->price ?? 0);
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

                // Media RSS Tags
                if ($listing->photos && is_array($listing->photos)) {
                    foreach ($listing->photos as $index => $photo) {
                        $imgUrl = asset('storage/' . $photo);
                        if ($index === 0) {
                            $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                        }
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"" . htmlspecialchars($listing->brand?->name ?? 'Unknown') . "\" />";
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

                // Media RSS Tags
                if (is_array($product->media) && count($product->media) > 0) {
                    foreach ($product->media as $index => $image) {
                        $imgUrl = asset('storage/' . $image);
                        if ($index === 0) {
                            $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                        }
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"{$categoryName}\" />";
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
                $url = url('/car-providers/' . $provider->id);
                $id = url('/entity/car-provider/' . $provider->id);
                $updated = $provider->updated_at->toAtomString();
                $published = $provider->created_at->toAtomString();
                $name = htmlspecialchars($provider->name);
                $city = htmlspecialchars($provider->city);

                $summary = htmlspecialchars("New Car Provider in {$city}: {$name}. Visit their profile for latest listings.");

                $contentHtml = "<h2>{$name}</h2>";
                $contentHtml .= "<p><strong>Location:</strong> {$city}, Syria</p>";

                if ($provider->description) {
                    $desc = htmlspecialchars($provider->description);
                    $contentHtml .= "<h3>About</h3><p>{$desc}</p>";
                }

                if ($provider->profile_photo) {
                    $imgUrl = asset('storage/' . $provider->profile_photo);
                    $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$name}\" style=\"max-width: 300px; margin: 10px 0;\" />";
                }

                if ($provider->business_type) {
                    $contentHtml .= "<p><strong>Type:</strong> " . ucfirst($provider->business_type) . "</p>";
                }

                $entry = "<entry>";
                $entry .= "<title>{$name}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Media RSS Tags
                if ($provider->profile_photo) {
                    $imgUrl = asset('storage/' . $provider->profile_photo);
                    $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                    $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                }

                if ($provider->gallery && is_array($provider->gallery)) {
                    foreach ($provider->gallery as $image) {
                        $imgUrl = asset('storage/' . $image);
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"Car Provider\" />";
                $entry .= "<category term=\"{$city}\" />";
                $entry .= "<category term=\"Syria\" />";
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
                $url = url('/technicians/' . $tech->id);
                $id = url('/entity/technician/' . $tech->id);
                $updated = $tech->updated_at->toAtomString();
                $published = $tech->created_at->toAtomString();
                $name = htmlspecialchars($tech->name);
                $city = htmlspecialchars($tech->city);
                $specialty = htmlspecialchars($tech->specialty ?? 'General Mechanic');

                $summary = htmlspecialchars("New Technician in {$city}: {$name}. Specialty: {$specialty}.");

                $contentHtml = "<h2>{$name}</h2>";
                $contentHtml .= "<p><strong>Location:</strong> {$city}, Syria</p>";
                $contentHtml .= "<p><strong>Specialty:</strong> {$specialty}</p>";

                if ($tech->description) {
                    $desc = htmlspecialchars($tech->description);
                    $contentHtml .= "<h3>About</h3><p>{$desc}</p>";
                }

                if ($tech->profile_photo) {
                    $imgUrl = asset('storage/' . $tech->profile_photo);
                    $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$name}\" style=\"max-width: 300px; margin: 10px 0;\" />";
                }

                $entry = "<entry>";
                $entry .= "<title>{$name}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Media RSS Tags
                if ($tech->profile_photo) {
                    $imgUrl = asset('storage/' . $tech->profile_photo);
                    $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                    $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                }

                if ($tech->gallery && is_array($tech->gallery)) {
                    foreach ($tech->gallery as $image) {
                        $imgUrl = asset('storage/' . $image);
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"Technician\" />";
                $entry .= "<category term=\"{$specialty}\" />";
                $entry .= "<category term=\"{$city}\" />";
                $entry .= "<category term=\"Syria\" />";
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
                $url = url('/tow-trucks/' . $truck->id);
                $id = url('/entity/tow-truck/' . $truck->id);
                $updated = $truck->updated_at->toAtomString();
                $published = $truck->created_at->toAtomString();
                $name = htmlspecialchars($truck->name);
                $city = htmlspecialchars($truck->city);
                $vehicleType = htmlspecialchars($truck->vehicle_type ?? 'Standard Tow Truck');

                $summary = htmlspecialchars("New Tow Truck in {$city}: {$name}. Vehicle Type: {$vehicleType}.");

                $contentHtml = "<h2>{$name}</h2>";
                $contentHtml .= "<p><strong>Location:</strong> {$city}, Syria</p>";
                $contentHtml .= "<p><strong>Vehicle Type:</strong> {$vehicleType}</p>";

                if ($truck->description) {
                    $desc = htmlspecialchars($truck->description);
                    $contentHtml .= "<h3>About</h3><p>{$desc}</p>";
                }

                if ($truck->profile_photo) {
                    $imgUrl = asset('storage/' . $truck->profile_photo);
                    $contentHtml .= "<img src=\"{$imgUrl}\" alt=\"{$name}\" style=\"max-width: 300px; margin: 10px 0;\" />";
                }

                $entry = "<entry>";
                $entry .= "<title>{$name}</title>";
                $entry .= "<link href=\"{$url}\" />";
                $entry .= "<id>{$id}</id>";
                $entry .= "<updated>{$updated}</updated>";
                $entry .= "<published>{$published}</published>";
                $entry .= "<summary type=\"text\">{$summary}</summary>";
                $entry .= "<content type=\"html\"><![CDATA[{$contentHtml}]]></content>";

                // Media RSS Tags
                if ($truck->profile_photo) {
                    $imgUrl = asset('storage/' . $truck->profile_photo);
                    $entry .= '<link rel="enclosure" href="' . $imgUrl . '" type="image/jpeg" />';
                    $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                }

                if ($truck->gallery && is_array($truck->gallery)) {
                    foreach ($truck->gallery as $image) {
                        $imgUrl = asset('storage/' . $image);
                        $entry .= '<media:content url="' . $imgUrl . '" medium="image" />';
                    }
                }
                $entry .= "<category term=\"Tow Truck\" />";
                $entry .= "<category term=\"{$city}\" />";
                $entry .= "<category term=\"Syria\" />";
                $entry .= "</entry>";
                return $entry;
            }
        );
    }
}
