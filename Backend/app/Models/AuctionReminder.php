<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuctionReminder extends Model
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
        'remind_minutes_before',
        'remind_at',
        'channels',
        'is_sent',
        'sent_at',
        'push_subscription_id',
    ];

    protected $casts = [
        'remind_at' => 'datetime',
        'sent_at' => 'datetime',
        'channels' => 'array',
        'is_sent' => 'boolean',
        'remind_minutes_before' => 'integer',
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

    /**
     * Get the user who set the reminder
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

    public function scopePending($query)
    {
        return $query->where('is_sent', false);
    }

    public function scopeDue($query)
    {
        return $query->where('is_sent', false)
            ->where('remind_at', '<=', now());
    }

    public function scopeForUser($query, $userId, $userType)
    {
        return $query->where('user_id', $userId)->where('user_type', $userType);
    }

    // ======== METHODS ========

    /**
     * Mark as sent
     */
    public function markSent()
    {
        $this->update([
            'is_sent' => true,
            'sent_at' => now(),
        ]);
    }

    /**
     * Check if push notification should be sent
     */
    public function shouldSendPush()
    {
        $channels = $this->channels ?? ['push'];
        return in_array('push', $channels);
    }

    /**
     * Check if email should be sent
     */
    public function shouldSendEmail()
    {
        $channels = $this->channels ?? [];
        return in_array('email', $channels);
    }

    /**
     * Calculate remind_at based on auction start time
     */
    public static function calculateRemindAt($auctionStart, $minutesBefore)
    {
        return $auctionStart->copy()->subMinutes($minutesBefore);
    }
}
