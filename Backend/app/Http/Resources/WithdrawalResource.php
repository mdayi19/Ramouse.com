<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WithdrawalResource extends JsonResource
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
            'providerId' => $this->provider_id,
            'providerName' => $this->provider_name,
            'providerUniqueId' => $this->provider_unique_id,
            'amount' => $this->amount,
            'status' => $this->status,
            'requestTimestamp' => $this->request_timestamp,
            'decisionTimestamp' => $this->decision_timestamp,
            'adminNotes' => $this->admin_notes,
            'paymentMethodId' => $this->payment_method_id,
            'paymentMethodName' => $this->payment_method_name,
            'receiptUrl' => $this->receipt_url,
        ];
    }
}
