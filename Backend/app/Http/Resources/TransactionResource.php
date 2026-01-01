<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
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
            'type' => $this->type,
            'amount' => $this->amount,
            'timestamp' => $this->timestamp,
            'description' => $this->description,
            'relatedOrderId' => $this->related_order_id,
            'relatedWithdrawalId' => $this->related_withdrawal_id,
            'balanceAfter' => $this->balance_after,
        ];
    }
}
