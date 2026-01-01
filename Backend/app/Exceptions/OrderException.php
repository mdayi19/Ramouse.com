<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class OrderException extends Exception
{
    /**
     * Create a new order exception instance.
     */
    public function __construct(
        string $message = 'خطأ في معالجة الطلب',
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
            'error' => 'order_error',
            'message' => $this->getMessage(),
        ], 400);
    }

    /**
     * Report the exception.
     */
    public function report(): void
    {
        \Log::error('Order Exception', [
            'message' => $this->getMessage(),
            'trace' => $this->getTraceAsString(),
        ]);
    }
}
