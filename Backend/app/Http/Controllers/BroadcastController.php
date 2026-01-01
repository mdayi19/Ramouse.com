<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

class BroadcastController extends Controller
{
    public function authenticate(Request $request)
    {
        Log::info('Custom Broadcast Auth Hit');
        try {
            if ($request->hasSession()) {
                $request->session()->reflash();
            }

            $user = $request->user();
            Log::info('Broadcast Auth User', ['id' => $user ? $user->id : 'null']);

            return Broadcast::auth($request);
        } catch (\Throwable $e) {
            Log::error('Broadcast Auth Failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
