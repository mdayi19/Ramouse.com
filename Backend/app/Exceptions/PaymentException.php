<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class PaymentException extends Exception
{
    /**
     * Create a new payment exception instance.
     */
    public function __construct(
        string $message = 'فشلت عملية الدفع',
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
            'error' => 'payment_error',
            'message' => $this->getMessage(),
        ], 422);
    }

    /**
     * Report the exception.
     */
    public function report(): void
    {
        \Log::error('Payment Exception', [
            'message' => $this->getMessage(),
            'trace' => $this->getTraceAsString(),
        ]);
    }
}
