<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Log slow requests (> 1 second)
        if ($duration > 1000) {
            Log::warning('Slow API Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'duration_ms' => $duration,
                'status' => $response->getStatusCode(),
                'user_id' => auth()->id(),
                'ip' => $request->ip(),
            ]);
        }

        // Log errors
        if ($response->getStatusCode() >= 400) {
            Log::info('API Error Response', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status' => $response->getStatusCode(),
                'user_id' => auth()->id(),
                'ip' => $request->ip(),
            ]);
        }

        return $response;
    }
}
