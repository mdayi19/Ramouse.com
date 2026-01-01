<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuctionRegistration extends Model
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
        'user_name',
        'user_phone',
        'deposit_amount',
        'wallet_hold_id',
        'status',
        'registered_at',
        'deposit_released_at',
    ];

    protected $casts = [
        'deposit_amount' => 'decimal:2',
        'registered_at' => 'datetime',
        'deposit_released_at' => 'datetime',
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

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function walletHold()
    {
        return $this->belongsTo(UserWalletHold::class, 'wallet_hold_id');
    }

    /**
     * Get the registered user
     */
    public function user()
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

    public function scopeActive($query)
    {
        return $query->where('status', 'registered');
    }

    public function scopeWithDeposit($query)
    {
        return $query->whereNotNull('wallet_hold_id');
    }

    // ======== METHODS ========

    /**
     * Mark as participated (didn't win)
     */
    public function markParticipated()
    {
        $this->update(['status' => 'participated']);
    }

    /**
     * Mark as winner
     */
    public function markWinner()
    {
        $this->update(['status' => 'winner']);
    }

    /**
     * Release the deposit
     */
    public function releaseDeposit()
    {
        if ($this->walletHold) {
            $this->walletHold->update(['status' => 'released']);
        }

        $this->update([
            'status' => 'deposit_released',
            'deposit_released_at' => now(),
        ]);
    }

    /**
     * Forfeit the deposit (winner didn't pay)
     */
    public function forfeitDeposit()
    {
        if ($this->walletHold) {
            $this->walletHold->update(['status' => 'forfeited']);
        }

        $this->update(['status' => 'deposit_forfeited']);
    }
}
