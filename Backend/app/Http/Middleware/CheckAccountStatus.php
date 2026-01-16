<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class CheckAccountStatus
{
    /**
     * Handle an incoming request.
     * 
     * Checks if the authenticated user's account is active and verified (for providers).
     * This ensures that even if a user has a valid token, they cannot access the API
     * if their account has been deactivated or unverified by an admin.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            // No authenticated user, let auth:sanctum middleware handle it
            return $next($request);
        }

        // Load profile based on role
        $profile = null;

        if ($user->role === 'customer') {
            $profile = $user->customer;
        } elseif ($user->role === 'provider') {
            $profile = $user->provider;
        } elseif ($user->role === 'car_provider') {
            $profile = $user->carProvider;
        } elseif ($user->role === 'technician') {
            $profile = $user->technician;
        } elseif ($user->role === 'tow_truck') {
            $profile = $user->towTruck;
        } elseif ($user->is_admin) {
            // Admins don't have profiles, allow access
            return $next($request);
        }

        // If profile doesn't exist, block access
        if (!$profile) {
            Log::warning('API access blocked: Profile not found', [
                'user_id' => $user->id,
                'phone' => $user->phone,
                'role' => $user->role,
                'ip' => $request->ip(),
                'endpoint' => $request->path(),
            ]);

            return response()->json([
                'message' => __('auth.profile_not_found'),
                'error' => __('auth.profile_not_found')
            ], 404);
        }

        // Check is_active status (applies to ALL user types)
        if (!$profile->is_active) {
            Log::warning('API access blocked: Account inactive', [
                'user_id' => $user->id,
                'phone' => $user->phone,
                'role' => $user->role,
                'ip' => $request->ip(),
                'endpoint' => $request->path(),
            ]);

            // Revoke the current token since account is deactivated
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => __('auth.account_blocked'),
                'error' => __('auth.account_blocked'),
                'token_revoked' => true
            ], 403);
        }

        // Check is_verified for provider types (technician, tow_truck, car_provider)
        if (in_array($user->role, ['technician', 'tow_truck', 'car_provider'])) {
            if (!$profile->is_verified) {
                Log::warning('API access blocked: Account not verified', [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'ip' => $request->ip(),
                    'endpoint' => $request->path(),
                ]);

                // Revoke the token for unverified providers
                $request->user()->currentAccessToken()->delete();

                return response()->json([
                    'message' => __('auth.account_under_review'),
                    'error' => __('auth.account_under_review'),
                    'token_revoked' => true
                ], 403);
            }
        }

        // All checks passed, allow request to proceed
        return $next($request);
    }
}
