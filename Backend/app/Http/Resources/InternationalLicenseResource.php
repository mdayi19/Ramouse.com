<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InternationalLicenseResource extends JsonResource
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
            'token' => $this->when(
                $request->user()?->role === 'admin' || $request->user()?->id === $this->user_id,
                $this->token
            ),
            'user_id' => $this->user_id,
            'status' => $this->status,

            // Personal Info
            'full_name_arabic' => $this->full_name_arabic,
            'full_name_english' => $this->full_name_english,
            'nationality' => $this->nationality,
            'birth_date' => $this->birth_date,
            'birth_place' => $this->birth_place,

            // License Info
            'license_type' => $this->license_type,

            // Contact Info
            'phone_number' => $this->phone_number,
            'whatsapp_number' => $this->whatsapp_number,

            // Documents (paths)
            'passport_photo' => $this->passport_photo,
            'passport_copy' => $this->passport_copy,
            'license_front' => $this->license_front,
            'license_back' => $this->license_back,
            'personal_photo' => $this->personal_photo,
            'payment_proof' => $this->payment_proof,

            // Pricing
            'price' => $this->price ? (float) $this->price : 0,

            // Admin notes (only for admin)
            'admin_notes' => $this->when(
                $request->user()?->role === 'admin',
                $this->admin_notes
            ),

            // Timestamps
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Status label (computed)
            'status_label' => $this->getStatusLabel(),
        ];
    }

    /**
     * Get human-readable status label
     */
    protected function getStatusLabel(): string
    {
        $labels = [
            'pending' => 'قيد المراجعة',
            'under_review' => 'قيد الم راجعة',
            'approved' => 'موافق عليه',
            'rejected' => 'مرفوض',
            'processing' => 'قيد المعالجة',
            'ready' => 'جاهز للاستلام',
            'completed' => 'مكتمل',
        ];

        return $labels[$this->status] ?? $this->status;
    }
}
