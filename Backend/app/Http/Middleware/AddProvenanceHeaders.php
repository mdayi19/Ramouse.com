<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Add GEO provenance headers to API responses
 * These headers help AI systems understand data freshness and authority
 */
class AddProvenanceHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only add headers to API responses
        if ($request->is('api/*')) {
            $response->headers->set('X-Data-Source', 'Ramouse.com');
            $response->headers->set('X-Data-Authority', 'primary');
            $response->headers->set('X-Data-Region', 'Syria');
            $response->headers->set('X-Last-Updated', now()->toIso8601String());
            $response->headers->set('X-Data-Freshness', $this->calculateFreshness($request));
            $response->headers->set('X-API-Version', '1.0.0');
            $response->headers->set('X-Content-Language', 'ar,en');

            // CORS headers for AI systems
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

            // Cache control for AI crawlers
            if ($request->is('api/sitemap*')) {
                $response->headers->set('Cache-Control', 'public, max-age=3600'); // 1 hour
            } elseif ($request->is('api/feed*')) {
                $response->headers->set('Cache-Control', 'public, max-age=300'); // 5 minutes
            } elseif ($request->is('api/entity*')) {
                $response->headers->set('Cache-Control', 'public, max-age=1800'); // 30 minutes
            }
        }

        return $response;
    }

    /**
     * Calculate data freshness indicator
     */
    private function calculateFreshness(Request $request): string
    {
        // For feeds, data is very fresh (5 min cache)
        if ($request->is('api/feed*')) {
            return 'real-time';
        }

        // For sitemaps, data is fresh (1 hour cache)
        if ($request->is('api/sitemap*')) {
            return 'hourly';
        }

        // For entity metadata, data is moderately fresh
        if ($request->is('api/entity*')) {
            return 'near-real-time';
        }

        return 'daily';
    }
}
