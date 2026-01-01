<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class NotificationException extends Exception
{
    /**
     * Create a new notification exception instance.
     */
    public function __construct(
        string $message = 'فشل إرسال الإشعار',
        int $code = 0,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render($request): JsonResponse
    {
        return response()->json([
            'error' => 'notification_error',
            'message' => $this->getMessage(),
        ], 500);
    }

    /**
     * Report the exception.
     */
    public function report(): void
    {
        \Log::warning('Notification Exception', [
            'message' => $this->getMessage(),
            'trace' => $this->getTraceAsString(),
        ]);
    }
}
