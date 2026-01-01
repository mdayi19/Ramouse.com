<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuctionBid extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'auction_id',
        'user_id',
        'user_type',
        'bidder_name',
        'bidder_phone',
        'amount',
        'bid_time',
        'wallet_hold_id',
        'status',
        'ip_address',
        'user_agent',
        'is_auto_bid',
        'max_auto_bid',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'max_auto_bid' => 'decimal:2',
        'bid_time' => 'datetime:Y-m-d H:i:s.u',
        'is_auto_bid' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->bid_time)) {
                $model->bid_time = now();
            }
        });
    }

    // ======== RELATIONSHIPS ========

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function walletHold()
    {
        return $this->belongsTo(UserWalletHold::class, 'wallet_hold_id');
    }

    /**
     * Get the bidder (polymorphic based on user_type)
     */
    public function bidder()
    {
        switch ($this->user_type) {
            case 'customer':
                return $this->belongsTo(Customer::class, 'user_id', 'id');
            case 'technician':
                return $this->belongsTo(Technician::class, 'user_id', 'id');
            case 'tow_truck':
                return $this->belongsTo(TowTruck::class, 'user_id', 'id');
            default:
                return null;
        }
    }

    // ======== SCOPES ========

    public function scopeValid($query)
    {
        return $query->where('status', 'valid');
    }

    public function scopeWinning($query)
    {
        return $query->where('status', 'winning');
    }

    public function scopeByUser($query, $userId, $userType)
    {
        return $query->where('user_id', $userId)->where('user_type', $userType);
    }

    // ======== ACCESSORS ========

    public function getIsWinningAttribute()
    {
        return $this->status === 'winning';
    }

    public function getIsOutbidAttribute()
    {
        return $this->status === 'outbid';
    }

    /**
     * Get anonymized bidder name for display
     */
    public function getAnonymizedNameAttribute()
    {
        $name = $this->bidder_name;
        if (strlen($name) <= 2) {
            return '***';
        }
        return mb_substr($name, 0, 1) . '***' . mb_substr($name, -1);
    }

    // ======== METHODS ========

    /**
     * Mark as outbid
     */
    public function markOutbid()
    {
        $this->update(['status' => 'outbid']);
    }

    /**
     * Mark as winning
     */
    public function markWinning()
    {
        $this->update(['status' => 'winning']);
    }
}
