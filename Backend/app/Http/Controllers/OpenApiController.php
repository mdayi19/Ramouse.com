<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\OpenApi(
    openapi: "3.1.0",
    info: new OA\Info(
        version: "1.0.0",
        title: "Ramouse.com API",
        description: "Syria's leading automotive marketplace API for car sales, rentals, spare parts, technicians, and tow services. This API provides programmatic access to all marketplace data with AI-optimized structured responses.",
        termsOfService: "https://ramouse.com/terms",
        contact: new OA\Contact(
            email: "api@ramouse.com",
            name: "Ramouse API Support",
            url: "https://ramouse.com/support"
        ),
        license: new OA\License(
            name: "Proprietary",
            url: "https://ramouse.com/license"
        )
    ),
    servers: [
        new OA\Server(
            url: "https://ramouse.com",
            description: "Ramouse.com API Server"
        )
    ],
    externalDocs: new OA\ExternalDocumentation(
        description: "Find out more about Ramouse.com",
        url: "https://ramouse.com/about"
    ),
    tags: [
        new OA\Tag(
            name: "GEO",
            description: "Generative Engine Optimization endpoints (sitemaps, feeds, metadata)",
            externalDocs: new OA\ExternalDocumentation(
                description: "GEO Documentation",
                url: "https://ramouse.com/docs/geo"
            )
        ),
        new OA\Tag(
            name: "Car Listings",
            description: "Operations for car sales and rentals",
            externalDocs: new OA\ExternalDocumentation(
                description: "Browse car listings",
                url: "https://ramouse.com/car-marketplace"
            )
        ),
        new OA\Tag(name: "Car Providers", description: "Car dealerships and rental agencies"),
        new OA\Tag(name: "Technicians", description: "Automotive repair and maintenance services"),
        new OA\Tag(name: "Tow Trucks", description: "Vehicle towing and recovery services"),
        new OA\Tag(name: "Products", description: "Car spare parts and accessories"),
    ]
)]
#[OA\SecurityScheme(
    securityScheme: "sanctum",
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description: "Enter your bearer token in the format: Bearer {token}"
)]
class OpenApiController extends Controller
{
    // This class exists solely for OpenAPI annotations
    // No actual methods needed
}
