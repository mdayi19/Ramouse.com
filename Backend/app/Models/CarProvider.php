<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarProvider extends Model
{
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'unique_id',
        'name',
        'password',
        'business_type',
        'business_license',
        'city',
        'address',
        'latitude',
        'longitude',
        'description',
        'is_verified',
        'is_active',
        'is_trusted',
        'verified_at',
        'verified_by',
        'profile_photo',
        'gallery',
        'socials',
        'qr_code_url',
        'notification_settings',
        'flash_purchases',
        'average_rating',
        'wallet_balance',
        'saved_addresses',
        'payment_info'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'gallery' => 'array',
        'socials' => 'array',
        'notification_settings' => 'array',
        'flash_purchases' => 'array',
        'saved_addresses' => 'array',
        'payment_info' => 'array',
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
        'is_trusted' => 'boolean',
        'verified_at' => 'datetime',
        'average_rating' => 'decimal:2',
        'wallet_balance' => 'decimal:2',
    ];

    protected $hidden = ['password'];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function phones(): HasMany
    {
        return $this->hasMany(CarProviderPhone::class, 'car_provider_id');
    }

    public function listings(): HasMany
    {
        return $this->hasMany(CarListing::class, 'owner_id', 'user_id')
            ->where('seller_type', 'provider');
    }

    public function reviews()
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeTrusted($query)
    {
        return $query->where('is_trusted', true);
    }

    // Accessors
    public function getPrimaryPhoneAttribute()
    {
        return $this->phones()->where('is_primary', true)->first() ?? $this->phones()->first();
    }

    public function getWhatsappPhoneAttribute()
    {
        return $this->phones()->where('is_whatsapp', true)->first();
    }

    // Methods
    public function updateAverageRating()
    {
        $this->average_rating = $this->reviews()->avg('rating') ?? 0;
        $this->save();
    }
}
