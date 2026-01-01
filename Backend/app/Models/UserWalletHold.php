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

        $broadcastUpdate = function ($model) {
            try {
                // Get active holds count
                $holds = \App\Models\UserWalletHold::where('user_id', $model->user_id)
                    ->where('user_type', $model->user_type)
                    ->where('status', 'active')
                    ->sum('amount');

                // Get current balance (we need to fetch the user profile)
                $profile = null;
                switch ($model->user_type) {
                    case 'customer':
                        $profile = \App\Models\Customer::find($model->user_id);
                        break;
                    case 'technician':
                        $profile = \App\Models\Technician::find($model->user_id);
                        break;
                    case 'tow_truck':
                        $profile = \App\Models\TowTruck::find($model->user_id);
                        break;
                }

                if ($profile) {
                    // Broadcast update
                    event(new \App\Events\WalletBalanceUpdated(
                        $model->user_id,
                        $profile->wallet_balance,
                        (float) $holds
                    ));
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to broadcast wallet hold update: ' . $e->getMessage());
            }
        };

        static::saved($broadcastUpdate);
        static::deleted($broadcastUpdate);
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
