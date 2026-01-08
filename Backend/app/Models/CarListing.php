<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CarListing extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id',
        'seller_type',
        'listing_type',
        'car_listing_category_id',
        'car_category_id',
        'title',
        'slug',
        'brand_id',
        'country_id',
        'model',
        'year',
        'mileage',
        'condition',
        'price',
        'is_negotiable',
        'rental_terms',
        'exterior_color',
        'interior_color',
        'transmission',
        'fuel_type',
        'doors_count',
        'seats_count',
        'license_plate',
        'chassis_number',
        'engine_size',
        'horsepower',
        'body_style',
        'body_condition',
        'previous_owners',
        'warranty',
        'features',
        'description',
        'city',
        'address',
        'photos',
        'video_url',
        'contact_phone',
        'contact_whatsapp',
        'is_available',
        'is_hidden',
        'is_sponsored',
        'sponsored_until',
        'is_featured',
        'featured_until',
        'featured_position',
        'views_count'
    ];

    protected $casts = [
        'rental_terms' => 'array',
        'features' => 'array',
        'photos' => 'array',
        'body_condition' => 'array',
        'is_negotiable' => 'boolean',
        'is_available' => 'boolean',
        'is_hidden' => 'boolean',
        'is_sponsored' => 'boolean',
        'is_featured' => 'boolean',
        'sponsored_until' => 'datetime',
        'featured_until' => 'datetime',
        'price' => 'decimal:2',
        'year' => 'integer',
        'mileage' => 'integer',
        'doors_count' => 'integer',
        'seats_count' => 'integer',
        'horsepower' => 'integer',
        'previous_owners' => 'integer',
        'featured_position' => 'integer',
        'views_count' => 'integer',
    ];

    protected $appends = ['is_active_sponsor', 'is_active_featured'];

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($listing) {
            if (empty($listing->slug)) {
                $listing->slug = Str::slug($listing->title) . '-' . Str::random(6);
            }
        });
    }

    // Relationships
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CarListingCategory::class, 'car_listing_category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(CarListingAnalytic::class, 'car_listing_id');
    }

    public function dailyStats(): HasMany
    {
        return $this->hasMany(CarListingDailyStat::class, 'car_listing_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(UserCarFavorite::class, 'car_listing_id');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)->where('is_hidden', false);
    }

    public function scopeSponsored($query)
    {
        return $query->where('is_sponsored', true)
            ->where('sponsored_until', '>', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
            ->where('featured_until', '>', now())
            ->orderBy('featured_position');
    }

    public function scopeForSale($query)
    {
        return $query->where('listing_type', 'sale');
    }

    public function scopeForRent($query)
    {
        return $query->where('listing_type', 'rent');
    }

    public function scopeByProvider($query)
    {
        return $query->where('seller_type', 'provider');
    }

    public function scopeByIndividual($query)
    {
        return $query->where('seller_type', 'individual');
    }

    // Accessors
    public function getIsActiveSponsorAttribute()
    {
        return $this->is_sponsored && $this->sponsored_until && $this->sponsored_until->isFuture();
    }

    public function getIsActiveFeaturedAttribute()
    {
        return $this->is_featured && $this->featured_until && $this->featured_until->isFuture();
    }

    public function getCoverPhotoAttribute()
    {
        return $this->photos[0] ?? null;
    }

    // Methods
    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function isFavoritedBy($userId)
    {
        return $this->favorites()->where('user_id', $userId)->exists();
    }
}
