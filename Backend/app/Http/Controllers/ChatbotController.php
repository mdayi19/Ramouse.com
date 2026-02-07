<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiSearchService;
use App\Models\ChatHistory;
use App\Models\ChatAnalytics;
use App\Models\ChatFeedback;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Gemini\Data\Content;
use Gemini\Data\Part;
use Gemini\Enums\Role;

class ChatbotController extends Controller
{
    // Removed Constructor Injection to prevent 500 crash on resolution
    // protected $aiService;
    // public function __construct(AiSearchService $aiService) ...

    public function sendMessage(Request $request)
    {
        // 1. Validation
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        // Track start time for performance analytics
        $startTime = microtime(true);

        try {
            // Pre-check for API Key to avoid hard crash in Service
            // Use config() instead of env() because env() returns null when config is cached
            if (!config('gemini.api_key')) {
                throw new \Exception("GEMINI_API_KEY is missing in .env");
            }

            // Resolve Service Manually safely
            $aiService = app(AiSearchService::class);

            $message = $request->input('message');
            $sessionId = $request->input('session_id') ?? (string) Str::uuid();

            // Explicitly check sanctum guard since route is public (not behind auth:sanctum middleware)
            $user = auth('sanctum')->user();
            $userId = $user ? $user->id : null;

            // 2. Rate Limiting Logic...
            $limitKey = 'chat_limit_' . ($userId ? "user_{$userId}" : "ip_" . $request->ip());
            $dailyCount = Cache::get($limitKey, 0);
            $maxDaily = $userId ? 100 : 5;

            if ($dailyCount >= $maxDaily) {
                return response()->json([
                    'error' => 'Daily limit reached.',
                    'message' => $userId
                        ? 'لقد تجاوزت الحد اليومي للرسائل (100). يرجى العودة غداً.'
                        : 'لقد وصلت للحد المجاني (5 رسائل يومياً). سجّل دخول للمتابعة والحصول على رسائل غير محدودة! 🚀'
                ], 429);
            }

            // Increment count
            Cache::put($limitKey, $dailyCount + 1, now()->addDay());

            // 3. Context - Extended to 20 messages for better conversation flow
            $history = ChatHistory::where('session_id', $sessionId)
                ->orderBy('created_at', 'desc')
                ->take(20)
                ->get()
                ->reverse()
                ->filter(function ($chat) {
                    // Skip messages with empty content (Gemini SDK rejects them)
                    return !empty(trim($chat->content ?? ''));
                })
                ->map(function ($chat) {
                    $role = $chat->role === 'user' ? Role::USER : Role::MODEL;
                    $content = (string) ($chat->content ?? '');

                    if ($role === Role::USER) {
                        return new Content([new Part($content)], $role);
                    } else {
                        return new Content([new Part($content)], $role);
                    }
                })
                ->values()
                ->toArray();

            // 4. Call Service with user context


            $responseContent = $aiService->sendMessage(
                $history,
                $message,
                $request->input('latitude'),
                $request->input('longitude'),
                $userId
            );

            // 5. Save Logs
            ChatHistory::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => 'user',
                'content' => $message
            ]);


            // Convert JSON tool results to text summary for history
            // This allows the AI to know what it previously showed the user without breaking SDK with JSON
            $contentToSave = $responseContent;

            $parsedJson = json_decode($responseContent, true);
            $isToolResult = (json_last_error() === JSON_ERROR_NONE && isset($parsedJson['type']));

            if ($isToolResult) {
                // It's a JSON tool result - save a text summary instead
                $count = $parsedJson['count'] ?? 0;
                $type = $parsedJson['type'] ?? 'results';
                // Summary in Arabic so the Arabic AI understands context naturally
                $contentToSave = "تم عرض {$count} نتائج من نوع {$type}";
            }

            // Save AI response (either full text or summary)
            ChatHistory::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => 'model',
                'content' => $contentToSave
            ]);


            // Track analytics
            $responseTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

            ChatAnalytics::create([
                'session_id' => $sessionId,
                'user_id' => $userId,
                'event_type' => 'message_sent',
                'event_data' => json_encode([
                    'message_length' => strlen($message),
                    'had_location' => !is_null($request->input('latitude')),
                    'has_result_cards' => str_contains($responseContent, '"type"')
                ]),
                'response_time_ms' => $responseTime
            ]);

            return response()->json([
                'response' => $responseContent,
                'session_id' => $sessionId,
                'remaining' => $maxDaily - ($dailyCount + 1)
            ]);

        } catch (\Throwable $e) {
            Log::error("Chatbot Error: " . $e->getMessage(), [
                'user_id' => $userId,
                'session_id' => $sessionId,
                'message' => $message,
                'trace' => $e->getTraceAsString()
            ]);

            // User-friendly error messages in Arabic
            $errorMessages = [
                'Could not connect' => [
                    'message' => 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة بعد قليل.',
                    'suggestions' => ['جرب لاحقاً', 'تواصل مع الدعم الفني']
                ],
                'Database' => [
                    'message' => 'عذراً، هناك مشكلة في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.',
                    'suggestions' => ['أعد المحاولة', 'تواصل مع الدعم']
                ],
                'Timeout' => [
                    'message' => 'عذراً، استغرق البحث وقتاً طويلاً. يرجى تبسيط سؤالك.',
                    'suggestions' => ['اطرح سؤالاً أبسط', 'حدد مدينة معينة']
                ],
                'Rate limit' => [
                    'message' => 'لقد تجاوزت الحد المسموح. يرجى الانتظار قليلاً.',
                    'suggestions' => ['سجل دخول للحصول على حد أعلى']
                ],
                'GEMINI_API_KEY' => [
                    'message' => 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.',
                    'suggestions' => ['تواصل مع الدعم الفني']
                ]
            ];

            $userMessage = 'عذراً، حدث خطأ تقني. يرجى المحاولة لاحقاً.';
            $suggestions = ['حاول البحث بطريقة مختلفة', 'تواصل مع الدعم الفني'];

            foreach ($errorMessages as $key => $errorData) {
                if (str_contains($e->getMessage(), $key)) {
                    $userMessage = $errorData['message'];
                    $suggestions = $errorData['suggestions'];
                    break;
                }
            }

            // Track error analytics
            ChatAnalytics::create([
                'session_id' => $sessionId ?? 'unknown',
                'user_id' => $userId ?? null,
                'event_type' => 'error',
                'event_data' => json_encode([
                    'error_type' => get_class($e),
                    'error_message' => substr($e->getMessage(), 0, 255)
                ])
            ]);

            // Return JSON error instead of 500 page
            return response()->json([
                'error' => 'Backend Error',
                'message' => $userMessage,
                'suggestions' => $suggestions
            ], 500);
        }
    }

    /**
     * Submit feedback for a chatbot message
     */
    public function submitFeedback(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'timestamp' => 'required|integer',
            'is_positive' => 'required|boolean',
            'comment' => 'nullable|string|max:500'
        ]);

        $user = auth('sanctum')->user();
        $userId = $user ? $user->id : null;

        // Find the message by session and timestamp
        $chatMessage = ChatHistory::where('session_id', $request->session_id)
            ->where('role', 'model')
            ->whereBetween('created_at', [
                now()->subMinutes(30), // Only allow feedback on recent messages
                now()
            ])
            ->orderBy('created_at', 'desc')
            ->first();

        // Save feedback
        $feedback = ChatFeedback::create([
            'session_id' => $request->session_id,
            'message_id' => $chatMessage?->id,
            'user_id' => $userId,
            'is_positive' => $request->is_positive,
            'comment' => $request->comment,
            'feedback_context' => [
                'timestamp' => $request->timestamp,
                'message_preview' => $chatMessage ? substr($chatMessage->content, 0, 100) : null
            ]
        ]);

        // Track in analytics
        ChatAnalytics::create([
            'session_id' => $request->session_id,
            'user_id' => $userId,
            'event_type' => 'feedback',
            'event_data' => json_encode([
                'is_positive' => $request->is_positive,
                'has_comment' => !empty($request->comment)
            ])
        ]);

        return response()->json([
            'message' => $request->is_positive ? 'شكراً لتقييمك الإيجابي!' : 'شكراً لملاحظاتك، سنعمل على التحسين',
            'success' => true
        ]);
    }

    /**
     * Stream chatbot messages using Server-Sent Events (SSE)
     */
    public function streamMessage(Request $request)
    {
        // Validation
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $message = $request->input('message');
        $sessionId = $request->input('session_id') ?? Str::uuid()->toString();
        $user = auth('sanctum')->user();
        $userId = $user ? $user->id : null;

        // Rate limiting
        $limitKey = 'chat_limit_' . ($userId ? "user_{$userId}" : "ip_" . $request->ip());
        $dailyCount = Cache::get($limitKey, 0);
        $maxDaily = $userId ? 100 : 50;

        if ($dailyCount >= $maxDaily) {
            return response()->json([
                'error' => 'Daily limit reached.',
                'message' => $userId
                    ? 'لقد تجاوزت الحد اليومي للرسائل (100). يرجى العودة غداً.'
                    : 'لقد تجاوزت الحد اليومي كزائر (50). يرجى تسجيل الدخول للمتابعة.'
            ], 429);
        }

        Cache::put($limitKey, $dailyCount + 1, now()->addDay());

        // Set headers for SSE
        return response()->stream(function () use ($message, $sessionId, $userId, $request) {
            // Disable output buffering
            if (ob_get_level())
                ob_end_clean();

            $startTime = microtime(true);
            $aiService = new AiSearchService();

            try {
                // Get chat history
                $history = ChatHistory::where('session_id', $sessionId)
                    ->orderBy('created_at', 'desc')
                    ->take(20)
                    ->get()
                    ->reverse()
                    ->filter(function ($chat) {
                        // Skip messages with empty content (Gemini SDK rejects them)
                        return !empty(trim($chat->content ?? ''));
                    })
                    ->map(function ($chat) {
                        $role = $chat->role === 'user' ? Role::USER : Role::MODEL;
                        $content = (string) ($chat->content ?? '');

                        if ($role === Role::USER) {
                            return new Content([new Part($content)], $role);
                        } else {
                            return new Content([new Part($content)], $role);
                        }
                    })
                    ->values()
                    ->toArray();

                // Send status update
                echo "data: " . json_encode(['type' => 'status', 'message' => 'جارٍ التفكير...']) . "\n\n";
                flush();

                // Get AI response
                $responseContent = $aiService->sendMessage(
                    $history,
                    $message,
                    $request->input('latitude'),
                    $request->input('longitude'),
                    $userId
                );

                // Save user message
                ChatHistory::create([
                    'user_id' => $userId,
                    'session_id' => $sessionId,
                    'role' => 'user',
                    'content' => $message
                ]);

                // Stream response word by word for better UX
                $words = preg_split('/(\s+)/u', $responseContent, -1, PREG_SPLIT_DELIM_CAPTURE);
                foreach ($words as $word) {
                    echo "data: " . json_encode([
                        'type' => 'chunk',
                        'content' => $word
                    ]) . "\n\n";
                    flush();
                    usleep(30000); // 30ms delay between words for smooth streaming
                }

                // Convert JSON tool results to text summary for history
                $contentToSave = $responseContent;

                $parsedJson = json_decode($responseContent, true);
                $isToolResult = (json_last_error() === JSON_ERROR_NONE && isset($parsedJson['type']));

                if ($isToolResult) {
                    $count = $parsedJson['count'] ?? 0;
                    $type = $parsedJson['type'] ?? 'results';
                    $contentToSave = "تم عرض {$count} نتائج من نوع {$type}";
                }

                // Save AI response
                ChatHistory::create([
                    'user_id' => $userId,
                    'session_id' => $sessionId,
                    'role' => 'model',
                    'content' => $contentToSave
                ]);

                // Calculate response time
                $responseTime = (microtime(true) - $startTime) * 1000;

                // Track analytics
                ChatAnalytics::create([
                    'session_id' => $sessionId,
                    'user_id' => $userId,
                    'event_type' => 'message_sent',
                    'event_data' => json_encode([
                        'message_length' => strlen($message),
                        'had_location' => !empty($request->input('latitude')),
                        'has_result_cards' => str_contains($responseContent, '"type"'),
                        'streaming' => true
                    ]),
                    'response_time_ms' => $responseTime
                ]);

                // Send completion
                echo "data: " . json_encode([
                    'type' => 'done',
                    'session_id' => $sessionId
                ]) . "\n\n";
                flush();

            } catch (\Exception $e) {
                Log::error('Streaming chat error', [
                    'user_id' => $userId,
                    'session_id' => $sessionId,
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                // Track error
                ChatAnalytics::create([
                    'session_id' => $sessionId,
                    'user_id' => $userId,
                    'event_type' => 'error',
                    'event_data' => json_encode([
                        'error_type' => get_class($e),
                        'error_message' => substr($e->getMessage(), 0, 255),
                        'streaming' => true
                    ])
                ]);

                // Send error to client
                echo "data: " . json_encode([
                    'type' => 'error',
                    'message' => 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
                ]) . "\n\n";
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no', // Disable nginx buffering
            'Connection' => 'keep-alive',
        ]);
    }
}
