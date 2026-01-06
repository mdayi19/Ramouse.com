<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarProviderPhone extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'car_provider_id',
        'phone',
        'label',
        'is_whatsapp',
        'is_primary'
    ];

    protected $casts = [
        'is_whatsapp' => 'boolean',
        'is_primary' => 'boolean',
    ];

    // Relationships
    public function provider(): BelongsTo
    {
        return $this->belongsTo(CarProvider::class, 'car_provider_id');
    }
}
