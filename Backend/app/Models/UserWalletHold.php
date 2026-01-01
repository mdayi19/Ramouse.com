<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * UserWalletHold - For reserving funds during auction bids (FUTURE USE)
 */
class UserWalletHold extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'user_type',
        'amount',
        'reason',
        'reference_type',
        'reference_id',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expires_at' => 'datetime',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for active holds
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for non-expired active holds
     */
    public function scopeValidHolds($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Release the wallet hold
     * 
     * @return bool True if released successfully, false if already released or invalid
     */
    public function release(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        return $this->update(['status' => 'released']);
    }
}
