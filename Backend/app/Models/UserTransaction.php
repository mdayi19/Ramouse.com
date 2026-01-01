<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserTransaction extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'user_type',
        'type',
        'amount',
        'description',
        'balance_after',
        'timestamp',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'timestamp' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->timestamp)) {
                $model->timestamp = now();
            }
        });

        static::created(function ($transaction) {
            try {
                // Get active holds count
                $holds = \App\Models\UserWalletHold::where('user_id', $transaction->user_id)
                    ->where('user_type', $transaction->user_type)
                    ->where('status', 'active')
                    ->sum('amount');

                // Broadcast update
                event(new \App\Events\WalletBalanceUpdated(
                    $transaction->user_id,
                    $transaction->balance_after,
                    (float) $holds
                ));
            } catch (\Exception $e) {
                // Log error but don't fail transaction
                \Illuminate\Support\Facades\Log::error('Failed to broadcast user wallet update: ' . $e->getMessage());
            }
        });
    }

    /**
     * Get the user profile model based on user_type
     */
    public function getUserProfileAttribute()
    {
        return match ($this->user_type) {
            'customer' => Customer::whereHas('user', fn($q) => $q->where('id', $this->user_id))->first(),
            'technician' => Technician::whereHas('user', fn($q) => $q->where('id', $this->user_id))->first(),
            'tow_truck' => TowTruck::whereHas('user', fn($q) => $q->where('id', $this->user_id))->first(),
            default => null,
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
