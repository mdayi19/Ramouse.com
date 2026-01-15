<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarListingSponsorshipHistory extends Model
{
    protected $fillable = [
        'car_listing_id',
        'sponsored_by_user_id',
        'sponsored_from',
        'sponsored_until',
        'price',
        'duration_days',
        'status',
        'refund_amount',
        'refunded_at',
        'is_admin_sponsored',
    ];

    protected $casts = [
        'sponsored_from' => 'datetime',
        'sponsored_until' => 'datetime',
        'refunded_at' => 'datetime',
        'price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'is_admin_sponsored' => 'boolean',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(CarListing::class, 'car_listing_id');
    }

    public function sponsoredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sponsored_by_user_id');
    }
}
