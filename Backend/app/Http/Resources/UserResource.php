<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'role' => $this->role,

            // Profile image
            'profile_image' => $this->profile_image,

            // Wallet (if applicable)
            'wallet_balance' => $this->when(
                isset($this->wallet_balance),
                (float) $this->wallet_balance
            ),

            // Verification status
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),

            // Timestamps
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Never expose these
            // 'password' - excluded
            // 'remember_token' - excluded
            // 'otp_code' - excluded
            // 'otp_expires_at' - excluded
        ];
    }
}
