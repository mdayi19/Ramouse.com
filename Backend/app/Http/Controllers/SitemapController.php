<?php

namespace App\Http\Controllers;

use App\Models\CarListing;
use App\Models\CarProvider;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Product;
use App\Models\BlogPost;
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
        try {
            // Get last modified dates safely
            $lastMods = [
                'car-listings' => CarListing::where('listing_type', 'sale')->max('updated_at'),
                'car-rentals' => CarListing::where('listing_type', 'rent')->max('updated_at'),
                'car-providers' => CarProvider::max('updated_at'),
                'technicians' => Technician::max('updated_at'),
                'tow-trucks' => TowTruck::max('updated_at'),
                'products' => Product::max('updated_at'),
                'blog-posts' => BlogPost::max('updated_at'),
            ];

            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

            $sitemaps = [
                'static-pages',
                'car-listings',
                'car-rentals',
                'car-providers',
                'technicians',
                'tow-trucks',
                'products',
                'blog-posts'
            ];

            foreach ($sitemaps as $type) {
                $xml .= '<sitemap>';
                // SOLID FIX: Force Frontend URL
                $xml .= '<loc>https://ramouse.com/sitemap/' . $type . '.xml</loc>';
                if ($type === 'static-pages') {
                    $xml .= "<lastmod>" . now()->toAtomString() . "</lastmod>";
                } elseif (!empty($lastMods[$type])) {
                    $date = \Carbon\Carbon::parse($lastMods[$type])->toAtomString();
                    $xml .= "<lastmod>{$date}</lastmod>";
                } else {
                    $xml .= "<lastmod>" . now()->toAtomString() . "</lastmod>";
                }
                $xml .= '</sitemap>';
            }

            // ADDED: Include Feeds in Sitemap Index for AI Discovery
            $feeds = [
                'car-listings',
                'car-rentals',
                'products',
                'car-providers',
                'technicians',
                'tow-trucks'
            ];

            foreach ($feeds as $type) {
                $xml .= '<sitemap>';
                // SOLID FIX: Force Frontend URL
                $xml .= '<loc>https://ramouse.com/feed/' . $type . '.xml</loc>';
                $xml .= "<lastmod>" . now()->toAtomString() . "</lastmod>"; // Feeds are real-time
                $xml .= '</sitemap>';
            }

            $xml .= '</sitemapindex>';

            return response($xml, 200)->header('Content-Type', 'application/xml');

        } catch (\Exception $e) {
            \Log::error('Sitemap Index Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Static Pages Sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/static-pages.xml",
        operationId: "getStaticPagesSitemap",
        tags: ["GEO"],
        summary: "Get static pages sitemap",
        description: "Returns XML sitemap for all public static pages (Home, About, Services, etc.).",
        responses: [
            new OA\Response(
                response: 200,
                description: "Static pages sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function staticPages()
    {
        $pages = [
            '/' => ['priority' => '1.0', 'freq' => 'daily'],
            '/blog' => ['priority' => '0.8', 'freq' => 'daily'],
            '/faq' => ['priority' => '0.5', 'freq' => 'weekly'],
            '/privacy' => ['priority' => '0.3', 'freq' => 'monthly'],
            '/terms' => ['priority' => '0.3', 'freq' => 'monthly'],
            '/contact' => ['priority' => '0.7', 'freq' => 'monthly'],
            '/services' => ['priority' => '0.9', 'freq' => 'weekly'],
            '/technicians' => ['priority' => '0.9', 'freq' => 'daily'],
            '/tow-trucks' => ['priority' => '0.9', 'freq' => 'daily'],
            '/car-providers' => ['priority' => '0.9', 'freq' => 'daily'],
            '/car-listings' => ['priority' => '1.0', 'freq' => 'hourly'],
            '/rent-car' => ['priority' => '1.0', 'freq' => 'hourly'],
            '/auctions' => ['priority' => '0.8', 'freq' => 'hourly'],
            '/store' => ['priority' => '0.9', 'freq' => 'daily'],
            '/register-technician' => ['priority' => '0.6', 'freq' => 'monthly'],
            '/register-tow-truck' => ['priority' => '0.6', 'freq' => 'monthly'],
            '/register-car-provider' => ['priority' => '0.6', 'freq' => 'monthly'],
            '/announcements' => ['priority' => '0.7', 'freq' => 'daily'],
        ];

        try {
            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

            foreach ($pages as $path => $meta) {
                // Determine absolute URL - in Laravel `url()` helper works for backend routes,
                // but these are Frontend routes.
                // Assuming backend and frontend are same domain in prod (ramouse.com),
                // `url('/')` returns `https://ramouse.com`.
                $loc = url($path);

                $xml .= '<url>';
                $xml .= "<loc>{$loc}</loc>";
                $xml .= "<lastmod>" . now()->startOfDay()->toAtomString() . "</lastmod>"; // Static pages assumed updated today
                $xml .= "<changefreq>{$meta['freq']}</changefreq>";
                $xml .= "<priority>{$meta['priority']}</priority>";
                $xml .= '</url>';
            }

            $xml .= '</urlset>';

            return response($xml, 200)->header('Content-Type', 'application/xml');

        } catch (\Exception $e) {
            \Log::error('Static Sitemap Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error generating static sitemap'], 500);
        }
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
        return $this->generateXml('car-listings', function () {
            return CarListing::where('listing_type', 'sale')
                ->where('is_available', true)
                ->where('is_hidden', false)
                ->with(['brand', 'owner'])
                ->select('id', 'slug', 'title', 'city', 'price', 'brand_id', 'owner_id', 'is_sponsored', 'is_featured', 'photos', 'created_at', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->get();
        });
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
        return $this->generateXml('car-rentals', function () {
            return CarListing::where('listing_type', 'rent')
                ->where('is_available', true)
                ->where('is_hidden', false)
                ->with(['brand', 'owner'])
                ->select('id', 'slug', 'title', 'city', 'rental_terms', 'brand_id', 'owner_id', 'is_sponsored', 'is_featured', 'photos', 'created_at', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->get();
        });
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
        return $this->generateXml('car-providers', function () {
            return CarProvider::where('is_active', true)
                ->where('is_verified', true)
                ->withCount('listings')
                ->orderBy('updated_at', 'desc')
                ->get();
        });
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
        return $this->generateXml('technicians', function () {
            return Technician::where('is_active', true)
                ->where('is_verified', true)
                ->orderBy('updated_at', 'desc')
                ->get();
        });
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
        return $this->generateXml('tow-trucks', function () {
            return TowTruck::where('is_active', true)
                ->where('is_verified', true)
                ->orderBy('updated_at', 'desc')
                ->get();
        });
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
        return $this->generateXml('products', function () {
            return Product::where('total_stock', '>', 0)
                ->with('category')
                ->orderBy('updated_at', 'desc')
                ->get();
        });
    }

    /**
     * Blog Posts sitemap
     */
    #[OA\Get(
        path: "/api/sitemap/blog-posts.xml",
        operationId: "getBlogPostsSitemap",
        tags: ["GEO"],
        summary: "Get blog posts sitemap",
        description: "Returns XML sitemap for all published blog posts.",
        responses: [
            new OA\Response(
                response: 200,
                description: "Blog posts sitemap XML",
                content: new OA\MediaType(
                    mediaType: "application/xml",
                    schema: new OA\Schema(type: "string")
                )
            )
        ]
    )]
    public function blogPosts()
    {
        return $this->generateXml('blog-posts', function () {
            // Updated_at is used for lastmod, published_at is for ordering
            return BlogPost::orderBy('published_at', 'desc')->get();
        });
    }

    /**
     * Helper to generate XML sitemap directly without Blade
     */
    private function generateXml($type, $callback)
    {
        try {
            $xml = Cache::remember("sitemap:{$type}", 3600, function () use ($type, $callback) {
                $items = $callback();

                $xml = '<?xml version="1.0" encoding="UTF-8"?>';
                $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';

                foreach ($items as $item) {
                    $loc = '';
                    $images = [];
                    $lastmod = $item->updated_at ? $item->updated_at->toAtomString() : now()->toAtomString();

                    // Logic based on type
                    switch ($type) {
                        case 'car-listings':
                        case 'car-rentals':
                            $loc = 'https://ramouse.com/car-listings/' . $item->slug;
                            $photos = is_array($item->photos) ? $item->photos : [];
                            foreach ($photos as $photo) {
                                $images[] = [
                                    'loc' => asset('storage/' . $photo),
                                    'title' => $item->title
                                ];
                            }
                            break;

                        case 'car-providers':
                            $loc = 'https://ramouse.com/car-providers/' . $item->id;
                            if ($item->profile_photo) {
                                $images[] = [
                                    'loc' => asset('storage/' . $item->profile_photo),
                                    'title' => $item->name
                                ];
                            }
                            break;

                        case 'technicians':
                            $loc = 'https://ramouse.com/technicians/' . $item->id;
                            if ($item->profile_photo) {
                                $images[] = [
                                    'loc' => asset('storage/' . $item->profile_photo),
                                    'title' => $item->name
                                ];
                            }
                            break;

                        case 'tow-trucks':
                            $loc = 'https://ramouse.com/tow-trucks/' . $item->id;
                            if ($item->profile_photo) {
                                $images[] = [
                                    'loc' => asset('storage/' . $item->profile_photo),
                                    'title' => $item->name
                                ];
                            }
                            break;

                        case 'products':
                            $loc = 'https://ramouse.com/store/products/' . $item->id;
                            $media = is_array($item->media) ? $item->media : [];
                            foreach ($media as $img) {
                                $images[] = [
                                    'loc' => asset('storage/' . $img),
                                    'title' => $item->name
                                ];
                            }
                            break;

                        case 'blog-posts':
                            $loc = 'https://ramouse.com/blog/' . $item->slug;
                            if ($item->imageUrl) {
                                $images[] = [
                                    'loc' => asset('storage/' . $item->imageUrl), // Asset helper points to storage correctly? Usually asset() points to public.
                                    // If asset() returns backend URL, we might need a fix here too.
                                    'title' => $item->title
                                ];
                            }
                            break;
                    }

                    // FALLBACK FOR LOC IF NOT SET ABOVE
                    if (empty($loc)) {
                        // Generic fallback if needed, but we should handle all cases
                        continue;
                    }

                    $xml .= '<url>';
                    $xml .= "<loc>{$loc}</loc>";
                    $xml .= "<lastmod>{$lastmod}</lastmod>";
                    $xml .= "<changefreq>weekly</changefreq>";

                    foreach ($images as $img) {
                        $xml .= '<image:image>';
                        $xml .= "<image:loc>{$img['loc']}</image:loc>";
                        $xml .= "<image:title>" . htmlspecialchars($img['title']) . "</image:title>";
                        $xml .= '</image:image>';
                    }

                    $xml .= '</url>';
                }

                $xml .= '</urlset>';
                return $xml;
            });

            return response($xml, 200)->header('Content-Type', 'application/xml');

        } catch (\Exception $e) {
            \Log::error("Sitemap XML Error ({$type}): " . $e->getMessage());
            return response()->json(['error' => 'Error generating sitemap'], 500);
        }
    }
}
