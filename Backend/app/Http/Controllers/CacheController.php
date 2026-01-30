<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class CacheController extends Controller
{
    /**
     * Clear application cache
     */
    public function clear(Request $request)
    {
        try {
            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Application cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear configuration cache
     */
    public function clearConfig(Request $request)
    {
        try {
            Artisan::call('config:clear');

            return response()->json([
                'success' => true,
                'message' => 'Configuration cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear config cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear route cache
     */
    public function clearRoutes(Request $request)
    {
        try {
            Artisan::call('route:clear');

            return response()->json([
                'success' => true,
                'message' => 'Route cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear route cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear view cache
     */
    public function clearViews(Request $request)
    {
        try {
            Artisan::call('view:clear');

            return response()->json([
                'success' => true,
                'message' => 'View cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear view cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all caches
     */
    public function clearAll(Request $request)
    {
        try {
            // Clear application cache
            Cache::flush();

            // Clear Laravel caches
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');
            Artisan::call('cache:clear');

            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully',
                'cleared' => [
                    'application_cache',
                    'config_cache',
                    'route_cache',
                    'view_cache',
                    'general_cache'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear all caches: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cache statistics
     */
    public function stats(Request $request)
    {
        try {
            // Get basic cache info
            $stats = [
                'driver' => config('cache.default'),
                'prefix' => config('cache.prefix'),
                'opcache_enabled' => function_exists('opcache_get_status') && opcache_get_status(),
            ];

            // Get OPcache statistics if available
            if ($stats['opcache_enabled']) {
                $opcacheStats = opcache_get_status();
                $stats['opcache'] = [
                    'enabled' => true,
                    'memory_usage' => $opcacheStats['memory_usage'] ?? null,
                    'opcache_statistics' => $opcacheStats['opcache_statistics'] ?? null,
                ];
            } else {
                $stats['opcache'] = [
                    'enabled' => false
                ];
            }

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get cache stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
