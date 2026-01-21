<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Middleware\HandleCors as Middleware;

class SmartCors extends Middleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Skip standard CORS for public feeds and sitemaps
        // This allows the AllowPublicFeed middleware (or simple access) to handle headers
        // without the global strictly-configured CORS middleware interfering.
        if ($request->is('api/feed/*') || $request->is('api/sitemap*') || $request->is('sitemap*')) {
            return $next($request);
        }

        return parent::handle($request, $next);
    }
}
