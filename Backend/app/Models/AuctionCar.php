<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class AuctionCar extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'description',
        'condition',
        'brand',
        'model',
        'year',
        'body_type',
        'vin',
        'mileage',
        'engine_type',
        'transmission',
        'fuel_type',
        'exterior_color',
        'interior_color',
        'features',
        'media',
        'location',
        'starting_price',
        'reserve_price',
        'buy_now_price',
        'deposit_amount',
        'seller_type',
        'seller_id',
        'seller_user_type',
        'seller_name',
        'seller_phone',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'features' => 'array',
        'media' => 'array',
        'starting_price' => 'decimal:2',
        'reserve_price' => 'decimal:2',
        'buy_now_price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'year' => 'integer',
        'mileage' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // ======== RELATIONSHIPS ========

    /**
     * Get the auction for this car
     */
    public function auction()
    {
        return $this->hasOne(Auction::class, 'auction_car_id');
    }

    /**
     * Get the seller (morphTo based on seller_type)
     */
    public function seller()
    {
        if ($this->seller_type === 'user' && $this->seller_user_type) {
            switch ($this->seller_user_type) {
                case 'customer':
                    return $this->belongsTo(Customer::class, 'seller_id', 'id');
                case 'technician':
                    return $this->belongsTo(Technician::class, 'seller_id', 'id');
                case 'tow_truck':
                    return $this->belongsTo(TowTruck::class, 'seller_id', 'id');
            }
        }
        return null;
    }

    // ======== SCOPES ========

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeAvailable($query)
    {
        return $query->whereIn('status', ['approved', 'in_auction']);
    }

    public function scopeSold($query)
    {
        return $query->where('status', 'sold');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeByAdmin($query)
    {
        return $query->where('seller_type', 'admin');
    }

    public function scopeByUser($query)
    {
        return $query->where('seller_type', 'user');
    }

    // ======== ACCESSORS ========

    /**
     * Get the primary image URL
     */
    public function getPrimaryImageAttribute()
    {
        $media = $this->media;
        if ($media && isset($media['images']) && count($media['images']) > 0) {
            return $media['images'][0];
        }
        return null;
    }

    /**
     * Get all images
     */
    public function getImagesAttribute()
    {
        $media = $this->media;
        return $media['images'] ?? [];
    }

    /**
     * Get all videos
     */
    public function getVideosAttribute()
    {
        $media = $this->media;
        return $media['videos'] ?? [];
    }

    /**
     * Check if car has buy now option
     */
    public function getHasBuyNowAttribute()
    {
        return $this->buy_now_price !== null && $this->buy_now_price > 0;
    }

    /**
     * Check if car is available for auction
     */
    public function getIsAvailableAttribute()
    {
        return in_array($this->status, ['approved', 'in_auction']);
    }

    // ======== METHODS ========

    /**
     * Mark as in auction
     */
    public function markInAuction()
    {
        $this->update(['status' => 'in_auction']);
    }

    /**
     * Mark as sold
     */
    public function markSold()
    {
        $this->update(['status' => 'sold']);
    }

    /**
     * Mark as unsold
     */
    public function markUnsold()
    {
        $this->update(['status' => 'unsold']);
    }
}
