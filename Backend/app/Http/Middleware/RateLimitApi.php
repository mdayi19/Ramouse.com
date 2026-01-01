<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\SystemSetting;

class RateLimitApi
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $key = 'api'): Response
    {
        // Get rate limit settings from database (with fallback defaults)
        $settings = SystemSetting::where('key', 'limitSettings')->first();
        $limits = $settings ? json_decode($settings->value, true) : [];

        $maxAttempts = $limits['apiRateLimitPerMinute'] ?? 60;
        $decaySeconds = $limits['apiRateLimitDecaySeconds'] ?? 60;

        $identifier = $request->ip();

        if (auth()->check()) {
            $identifier = auth()->id();
        }

        $limiterKey = "{$key}:{$identifier}";

        if (RateLimiter::tooManyAttempts($limiterKey, $maxAttempts)) {
            return response()->json([
                'message' => 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
                'retry_after' => RateLimiter::availableIn($limiterKey)
            ], 429);
        }

        RateLimiter::hit($limiterKey, $decaySeconds);

        $response = $next($request);

        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($limiterKey, $maxAttempts));

        return $response;
    }
}
