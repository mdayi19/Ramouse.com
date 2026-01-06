<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarListingAnalytic extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'car_listing_id',
        'event_type',
        'user_ip',
        'user_id',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function listing(): BelongsTo
    {
        return $this->belongsTo(CarListing::class, 'car_listing_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Scopes
    public function scopeByEvent($query, $eventType)
    {
        return $query->where('event_type', $eventType);
    }

    public function scopeForListing($query, $listingId)
    {
        return $query->where('car_listing_id', $listingId);
    }

    public function scopeInDateRange($query, $from, $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }
}
