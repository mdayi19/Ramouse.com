<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiSearchService;
use App\Models\ChatHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatbotController extends Controller
{
    protected $aiService;

    public function __construct(AiSearchService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function sendMessage(Request $request)
    {
        // 1. Validation
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $message = $request->input('message');
        $sessionId = $request->input('session_id') ?? (string) Str::uuid();
        $user = Auth::user();
        $userId = $user ? $user->id : null;

        // 2. Rate Limiting (Throttle) - 5 per minute
        // We use the middleware in api.php usually, but can enforce here too if needed specific logic.
        // Assuming 'throttle:60,1' is applied on route.

        // 3. Daily Usage Limit
        $limitKey = 'chat_limit_' . ($userId ? "user_{$userId}" : "ip_" . $request->ip());
        $dailyCount = Cache::get($limitKey, 0);
        $maxDaily = $userId ? 100 : 50; // Increased for testing (was 50/5)

        if ($dailyCount >= $maxDaily) {
            return response()->json([
                'error' => 'Daily limit reached.',
                'message' => $userId
                    ? 'لقد تجاوزت الحد اليومي للرسائل (50). يرجى العودة غداً.'
                    : 'لقد تجاوزت الحد اليومي كزائر (5). يرجى تسجيل الدخول للمتابعة.'
            ], 429);
        }

        // Increment count (expire at midnight or 24h)
        Cache::put($limitKey, $dailyCount + 1, now()->addDay());

        try {
            // 4. Retrieve/Build Context (Simplified)
            // Ideally fetch last 5-10 messages from ChatHistory where session_id matches
            $history = ChatHistory::where('session_id', $sessionId)
                ->orderBy('created_at', 'desc')
                ->take(6)
                ->get()
                ->reverse()
                ->map(function ($chat) {
                    return [
                        'role' => $chat->role === 'user' ? 'user' : 'model',
                        'parts' => [['text' => $chat->content]]
                    ];
                })
                ->values()
                ->toArray();

            // 5. Call AI Service
            $responseContent = $this->aiService->sendMessage(
                $history,
                $message,
                $request->input('latitude'),
                $request->input('longitude')
            );

            // 6. Save User Message
            ChatHistory::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => 'user',
                'content' => $message
            ]);

            // 7. Save AI Response
            ChatHistory::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => 'model',
                'content' => $responseContent
            ]);

            return response()->json([
                'response' => $responseContent,
                'session_id' => $sessionId,
                'remaining' => $maxDaily - ($dailyCount + 1)
            ]);

        } catch (\Exception $e) {
            Log::error("Chatbot Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Something went wrong.',
                'message' => 'عذراً، حدث خطأ أثناء المعالجة. يرجى المحاولة لاحقاً.'
            ], 500);
        }
    }
}
