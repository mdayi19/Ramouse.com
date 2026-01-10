<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Config\API;

class QuoteResource extends JsonResource
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
            'order_number' => $this->order_number,
            'provider_id' => $this->provider_id,
            'provider_name' => $this->provider_name,
            'provider_unique_id' => $this->provider_unique_id,

            // Pricing
            'price' => (float) $this->price,
            'part_status' => $this->part_status,
            'part_size_category' => $this->part_size_category,

            // Additional info
            'notes' => $this->notes,

            // Media
            'media' => $this->media,

            // Status
            'viewed_by_customer' => (bool) ($this->viewed_by_customer ?? false),

            // Computed - Is this the cheapest quote?
            'is_cheapest' => $this->when(isset($this->is_cheapest), $this->is_cheapest),

            // Timestamps
            'timestamp' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Admin Only: Provider Phone
            'provider_phone' => $this->when(
                $request->user() && ($request->user()->role === 'admin' || $request->user()->id === $this->provider->user_id),
                function () {
                    // Since provider ID IS the phone number in many cases in this app design:
                    return $this->provider ? $this->provider->id : $this->provider_id;
                }
            ),
        ];
    }
}
