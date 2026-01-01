<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orderNumber' => $this->order_number, // camelCase for frontend
            'userId' => $this->user_id,
            'userType' => $this->user_type,
            'status' => $this->status,
            'formData' => $this->form_data, // camelCase for frontend

            // Customer info
            'customerName' => $this->customer_name,
            'customerAddress' => $this->customer_address,
            'customerPhone' => $this->customer_phone,

            // Payment info
            'paymentMethodId' => $this->payment_method_id,
            'paymentMethodName' => $this->payment_method_name,
            'paymentReceiptUrl' => $this->payment_receipt_url,

            // Delivery
            'deliveryMethod' => $this->delivery_method,
            'shippingPrice' => $this->shipping_price ? (float) $this->shipping_price : 0,
            'shippingNotes' => $this->shipping_notes,

            // Status info
            'rejectionReason' => $this->rejection_reason,
            'cancellationReason' => $this->when($this->status === 'cancelled', $this->cancellation_reason),

            // Relationships
            'quotes' => QuoteResource::collection($this->whenLoaded('quotes')),
            'acceptedQuote' => new QuoteResource($this->whenLoaded('acceptedQuote')),

            // Computed properties
            'quotesCount' => $this->when(isset($this->quotes_count), $this->quotes_count),
            'hasNewQuotes' => $this->when(
                $this->relationLoaded('quotes'),
                $this->quotes?->some(fn($q) => !$q->viewed_by_customer) ?? false
            ),

            // Timestamps
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'date' => $this->created_at?->toIso8601String(), // For backwards compatibility
        ];
    }
}
