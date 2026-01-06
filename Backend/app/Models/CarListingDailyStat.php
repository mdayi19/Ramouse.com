<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarListingDailyStat extends Model
{
    protected $fillable = [
        'car_listing_id',
        'date',
        'total_views',
        'unique_visitors',
        'contact_phone_clicks',
        'contact_whatsapp_clicks',
        'favorites',
        'shares'
    ];

    protected $casts = [
        'date' => 'date',
        'total_views' => 'integer',
        'unique_visitors' => 'integer',
        'contact_phone_clicks' => 'integer',
        'contact_whatsapp_clicks' => 'integer',
        'favorites' => 'integer',
        'shares' => 'integer',
    ];

    // Relationships
    public function listing(): BelongsTo
    {
        return $this->belongsTo(CarListing::class, 'car_listing_id');
    }

    // Scopes
    public function scopeForListing($query, $listingId)
    {
        return $query->where('car_listing_id', $listingId)->orderBy('date', 'desc');
    }

    public function scopeInDateRange($query, $from, $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }
}
