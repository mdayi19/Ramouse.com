<?php

namespace App\Http\Controllers;

use App\Models\CarListing;
use App\Models\CarProvider;
use App\Models\Technician;
use App\Models\TowTruck;
use App\Models\Product;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class EntityController extends Controller
{
    /**
     * Get entity by type and ID
     */
    #[OA\Get(
        path: "/api/entity/{type}/{id}",
        operationId: "getEntity",
        tags: ["GEO"],
        summary: "Get entity data",
        description: "Returns raw entity data by type and ID. Supported types: car-listing, car-provider, technician, tow-truck, product.",
        parameters: [
            new OA\Parameter(
                name: "type",
                in: "path",
                required: true,
                description: "Entity type",
                schema: new OA\Schema(
                    type: "string",
                    enum: ["car-listing", "car-provider", "technician", "tow-truck", "product"]
                )
            ),
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Entity ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Entity data",
                content: new OA\JsonContent(type: "object")
            ),
            new OA\Response(
                response: 404,
                description: "Entity not found",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "error", type: "string", example: "Entity not found")
                    ]
                )
            )
        ]
    )]
    public function show($type, $id)
    {
        $entity = $this->getEntity($type, $id);

        if (!$entity) {
            return response()->json(['error' => 'Entity not found'], 404);
        }

        // Add HATEOAS links for API discoverability
        $response = $entity->toArray();
        $response['_links'] = $this->generateHateoasLinks($type, $id, $entity);

        return response()->json($response);
    }

    /**
     * Get entity metadata in JSON-LD format
     */
    #[OA\Get(
        path: "/api/entity/{type}/{id}/metadata",
        operationId: "getEntityMetadata",
        tags: ["GEO"],
        summary: "Get entity JSON-LD metadata",
        description: "Returns Schema.org JSON-LD structured data for the entity. This is the primary endpoint for AI systems to extract semantic information.",
        parameters: [
            new OA\Parameter(
                name: "type",
                in: "path",
                required: true,
                description: "Entity type",
                schema: new OA\Schema(
                    type: "string",
                    enum: ["car-listing", "car-provider", "technician", "tow-truck", "product"]
                )
            ),
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Entity ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "JSON-LD structured data",
                content: new OA\MediaType(
                    mediaType: "application/ld+json",
                    schema: new OA\Schema(
                        type: "object",
                        properties: [
                            new OA\Property(property: "@context", type: "string", example: "https://schema.org"),
                            new OA\Property(property: "@type", type: "string", example: "Car"),
                            new OA\Property(property: "@id", type: "string", example: "https://ramouse.com/entity/car-listing/123"),
                            new OA\Property(property: "identifier", type: "integer", example: 123),
                            new OA\Property(property: "name", type: "string", example: "Toyota Camry 2020"),
                        ]
                    )
                )
            ),
            new OA\Response(
                response: 404,
                description: "Entity not found",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "error", type: "string", example: "Entity not found")
                    ]
                )
            )
        ]
    )]
    public function metadata($type, $id)
    {
        $entity = $this->getEntity($type, $id);

        if (!$entity) {
            return response()->json(['error' => 'Entity not found'], 404);
        }

        $jsonLd = $this->generateJsonLd($type, $entity);

        return response()->json($jsonLd)
            ->header('Content-Type', 'application/ld+json');
    }

    /**
     * Get entity by type
     */
    private function getEntity($type, $id)
    {
        return match ($type) {
            'car-listing' => CarListing::with(['brand', 'owner', 'category'])->find($id),
            'car-provider' => CarProvider::with(['phones', 'listings'])->find($id),
            'technician' => Technician::with('reviews')->find($id),
            'tow-truck' => TowTruck::with('reviews')->find($id),
            'product' => Product::with(['category', 'reviews'])->find($id),
            default => null,
        };
    }

    /**
     * Generate JSON-LD structured data
     */
    private function generateJsonLd($type, $entity)
    {
        return match ($type) {
            'car-listing' => $this->carListingJsonLd($entity),
            'car-provider' => $this->carProviderJsonLd($entity),
            'technician' => $this->technicianJsonLd($entity),
            'tow-truck' => $this->towTruckJsonLd($entity),
            'product' => $this->productJsonLd($entity),
            default => [],
        };
    }

    /**
     * Car listing JSON-LD
     */
    private function carListingJsonLd($listing)
    {
        $baseUrl = config('app.url');

        return [
            '@context' => 'https://schema.org',
            '@type' => $listing->listing_type === 'rent' ? 'RentalCarReservation' : 'Car',
            '@id' => "{$baseUrl}/entity/car-listing/{$listing->id}",
            'identifier' => $listing->id,
            'name' => $listing->title,
            'description' => $listing->description,
            'url' => "{$baseUrl}/car-listings/{$listing->slug}",
            'brand' => [
                '@type' => 'Brand',
                'name' => $listing->brand?->name,
            ],
            'model' => $listing->model,
            'vehicleModelDate' => $listing->year,
            'mileageFromOdometer' => [
                '@type' => 'QuantitativeValue',
                'value' => $listing->mileage,
                'unitCode' => 'KMT',
            ],
            'fuelType' => $listing->fuel_type,
            'vehicleTransmission' => $listing->transmission,
            'numberOfDoors' => $listing->doors_count,
            'seatingCapacity' => $listing->seats_count,
            'color' => $listing->exterior_color,
            'itemCondition' => $listing->condition === 'new'
                ? 'https://schema.org/NewCondition'
                : 'https://schema.org/UsedCondition',
            'offers' => [
                '@type' => 'Offer',
                'price' => $listing->price,
                'priceCurrency' => 'USD',
                'availability' => $listing->is_available
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'seller' => [
                    '@type' => $listing->seller_type === 'provider' ? 'LocalBusiness' : 'Person',
                    '@id' => "{$baseUrl}/entity/car-provider/{$listing->owner_id}",
                    'name' => $listing->owner?->name,
                    'telephone' => $listing->contact_phone,
                ],
            ],
            'image' => collect($listing->photos ?? [])->map(fn($photo) => asset("storage/{$photo}"))->toArray(),
            'location' => [
                '@type' => 'Place',
                'address' => [
                    '@type' => 'PostalAddress',
                    'addressLocality' => $listing->city,
                    'addressCountry' => 'SY',
                ],
            ],
            'datePosted' => $listing->created_at?->toIso8601String(),
            'dateModified' => $listing->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Car provider JSON-LD
     */
    private function carProviderJsonLd($provider)
    {
        $baseUrl = config('app.url');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'AutomotiveBusiness',
            '@id' => "{$baseUrl}/entity/car-provider/{$provider->id}",
            'identifier' => $provider->id,
            'name' => $provider->name,
            'description' => $provider->description,
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => $provider->address,
                'addressLocality' => $provider->city,
                'addressCountry' => 'SY',
            ],
            'geo' => $provider->latitude && $provider->longitude ? [
                '@type' => 'GeoCoordinates',
                'latitude' => $provider->latitude,
                'longitude' => $provider->longitude,
            ] : null,
            'telephone' => $provider->primary_phone?->phone,
            'image' => $provider->profile_photo ? asset("storage/{$provider->profile_photo}") : null,
            'aggregateRating' => $provider->average_rating ? [
                '@type' => 'AggregateRating',
                'ratingValue' => $provider->average_rating,
                'bestRating' => 5,
                'worstRating' => 1,
            ] : null,
            'url' => "{$baseUrl}/car-providers/{$provider->id}",
        ];
    }

    /**
     * Technician JSON-LD
     */
    private function technicianJsonLd($technician)
    {
        $baseUrl = config('app.url');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'AutomotiveBusiness',
            '@id' => "{$baseUrl}/entity/technician/{$technician->id}",
            'identifier' => $technician->id,
            'name' => $technician->name,
            'description' => $technician->description,
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => $technician->workshop_address,
                'addressLocality' => $technician->city,
                'addressCountry' => 'SY',
            ],
            'geo' => $technician->location ? [
                '@type' => 'GeoCoordinates',
                'latitude' => $technician->location['latitude'] ?? null,
                'longitude' => $technician->location['longitude'] ?? null,
            ] : null,
            'telephone' => $technician->user?->phone,
            'image' => $technician->profile_photo ? asset("storage/{$technician->profile_photo}") : null,
            'aggregateRating' => $technician->average_rating ? [
                '@type' => 'AggregateRating',
                'ratingValue' => $technician->average_rating,
                'bestRating' => 5,
                'worstRating' => 1,
            ] : null,
            'url' => "{$baseUrl}/technicians/{$technician->id}",
        ];
    }

    /**
     * Tow truck JSON-LD
     */
    private function towTruckJsonLd($towTruck)
    {
        $baseUrl = config('app.url');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'AutoRepair',
            '@id' => "{$baseUrl}/entity/tow-truck/{$towTruck->id}",
            'identifier' => $towTruck->id,
            'name' => $towTruck->name,
            'description' => $towTruck->description,
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => $towTruck->city,
                'addressCountry' => 'SY',
            ],
            'telephone' => $towTruck->user?->phone,
            'image' => $towTruck->profile_photo ? asset("storage/{$towTruck->profile_photo}") : null,
            'aggregateRating' => $towTruck->average_rating ? [
                '@type' => 'AggregateRating',
                'ratingValue' => $towTruck->average_rating,
                'bestRating' => 5,
                'worstRating' => 1,
            ] : null,
            'url' => "{$baseUrl}/tow-trucks/{$towTruck->id}",
        ];
    }

    /**
     * Product JSON-LD
     */
    private function productJsonLd($product)
    {
        $baseUrl = config('app.url');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            '@id' => "{$baseUrl}/entity/product/{$product->id}",
            'identifier' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'category' => $product->category?->name,
            'offers' => [
                '@type' => 'Offer',
                'price' => $product->price,
                'priceCurrency' => 'USD',
                'availability' => $product->total_stock > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'inventoryLevel' => [
                    '@type' => 'QuantitativeValue',
                    'value' => $product->total_stock,
                ],
            ],
            'image' => is_array($product->media) && count($product->media) > 0
                ? collect($product->media)->map(fn($img) => asset("storage/{$img}"))->toArray()
                : null,
            'aggregateRating' => $product->average_rating ? [
                '@type' => 'AggregateRating',
                'ratingValue' => $product->average_rating,
                'bestRating' => 5,
                'worstRating' => 1,
            ] : null,
            'url' => "{$baseUrl}/store/products/{$product->id}",
        ];
    }

    /**
     * Generate HATEOAS links for API discoverability
     */
    private function generateHateoasLinks($type, $id, $entity): array
    {
        $baseUrl = config('app.url');

        $links = [
            'self' => [
                'href' => "{$baseUrl}/api/entity/{$type}/{$id}",
                'type' => 'application/json'
            ],
            'metadata' => [
                'href' => "{$baseUrl}/api/entity/{$type}/{$id}/metadata",
                'type' => 'application/ld+json',
                'title' => 'JSON-LD Structured Data'
            ],
        ];

        // Add type-specific links
        switch ($type) {
            case 'car-listing':
                $links['web'] = [
                    'href' => "{$baseUrl}/car-listings/{$entity->slug}",
                    'type' => 'text/html',
                    'title' => 'View on website'
                ];
                if ($entity->owner_id) {
                    $links['provider'] = [
                        'href' => "{$baseUrl}/api/entity/car-provider/{$entity->owner_id}",
                        'type' => 'application/json',
                        'title' => 'Car provider'
                    ];
                }
                break;

            case 'car-provider':
                $links['web'] = [
                    'href' => "{$baseUrl}/car-providers/{$id}",
                    'type' => 'text/html',
                    'title' => 'View on website'
                ];
                $links['listings'] = [
                    'href' => "{$baseUrl}/api/car-listings?provider_id={$id}",
                    'type' => 'application/json',
                    'title' => 'Provider listings'
                ];
                break;

            case 'technician':
                $links['web'] = [
                    'href' => "{$baseUrl}/technicians/{$id}",
                    'type' => 'text/html',
                    'title' => 'View on website'
                ];
                break;

            case 'tow-truck':
                $links['web'] = [
                    'href' => "{$baseUrl}/tow-trucks/{$id}",
                    'type' => 'text/html',
                    'title' => 'View on website'
                ];
                break;

            case 'product':
                $links['web'] = [
                    'href' => "{$baseUrl}/store/products/{$id}",
                    'type' => 'text/html',
                    'title' => 'View on website'
                ];
                break;
        }

        // Add sitemap link
        $sitemapType = match ($type) {
            'car-listing' => $entity->listing_type === 'rent' ? 'car-rentals' : 'car-listings',
            'car-provider' => 'car-providers',
            'technician' => 'technicians',
            'tow-truck' => 'tow-trucks',
            'product' => 'products',
            default => null,
        };

        if ($sitemapType) {
            $links['sitemap'] = [
                'href' => "{$baseUrl}/api/sitemap/{$sitemapType}.xml",
                'type' => 'application/xml',
                'title' => 'Entity sitemap'
            ];
        }

        return $links;
    }
}
