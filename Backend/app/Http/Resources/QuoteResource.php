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
            'provider_name' => $this->provider_name ?? $this->provider?->name,
            'provider_unique_id' => $this->provider_unique_id ?? $this->provider?->unique_id,

            // CamelCase for frontend
            'providerId' => $this->provider_id,
            'providerName' => $this->provider_name ?? $this->provider?->name,
            'providerUniqueId' => $this->provider_unique_id ?? $this->provider?->unique_id,

            // Pricing
            'price' => (float) $this->price,
            'part_status' => $this->part_status,
            'partStatus' => $this->part_status,
            'part_size_category' => $this->part_size_category,
            'partSizeCategory' => $this->part_size_category,

            // Additional info
            'notes' => $this->notes,

            // Media
            'media' => $this->media,

            // Status
            'viewed_by_customer' => (bool) ($this->viewed_by_customer ?? false),
            'viewedByCustomer' => (bool) ($this->viewed_by_customer ?? false),

            // Computed - Is this the cheapest quote?
            'is_cheapest' => $this->when(isset($this->is_cheapest), $this->is_cheapest),

            // Timestamps
            'timestamp' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Admin Only: Provider Phone

            'providerPhone' => $this->when(
                $request->user() && ($request->user()->is_admin || $request->user()->role === 'admin' || (($this->provider && $request->user()->id === $this->provider->user_id))),
                function () {
                    // 1. Try fetching from Provider -> User relation
                    if ($this->provider && $this->provider->user) {
                        return $this->provider->user->phone;
                    }
                    // 2. Try fetching from Provider model ID (if it's the phone)
                    if ($this->provider) {
                        return $this->provider->id;
                    }
                    // 3. Fallback to foreign key on quote
                    return $this->provider_id;
                }
            ),
            // Snake case alias
            'provider_phone' => $this->when(
                $request->user() && ($request->user()->is_admin || $request->user()->role === 'admin' || (($this->provider && $request->user()->id === $this->provider->user_id))),
                function () {
                    if ($this->provider && $this->provider->user) {
                        return $this->provider->user->phone;
                    }
                    return $this->provider ? $this->provider->id : $this->provider_id;
                }
            ),
        ];
    }
}
