<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Auction extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'auction_car_id',
        'title',
        'description',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'starting_bid',
        'current_bid',
        'bid_increment',
        'bid_count',
        'extension_minutes',
        'extension_threshold_seconds',
        'max_extensions',
        'extensions_used',
        'commission_percent',
        'commission_fixed',
        'status',
        'winner_id',
        'winner_type',
        'winner_name',
        'winner_phone',
        'final_price',
        'commission_amount',
        'payment_status',
        'payment_notes',
        'payment_deadline',
        'created_by',
        'cancellation_reason',
        'pause_reason',
        'paused_at',
    ];

    protected $casts = [
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'actual_start' => 'datetime',
        'actual_end' => 'datetime',
        'payment_deadline' => 'datetime',
        'starting_bid' => 'decimal:2',
        'current_bid' => 'decimal:2',
        'bid_increment' => 'decimal:2',
        'final_price' => 'decimal:2',
        'commission_percent' => 'decimal:2',
        'commission_fixed' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'bid_count' => 'integer',
        'extension_minutes' => 'integer',
        'extension_threshold_seconds' => 'integer',
        'max_extensions' => 'integer',
        'extensions_used' => 'integer',
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

    public function car()
    {
        return $this->belongsTo(AuctionCar::class, 'auction_car_id');
    }

    public function bids()
    {
        return $this->hasMany(AuctionBid::class)->orderBy('bid_time', 'desc');
    }

    public function registrations()
    {
        return $this->hasMany(AuctionRegistration::class);
    }

    public function reminders()
    {
        return $this->hasMany(AuctionReminder::class);
    }

    public function winningBid()
    {
        return $this->hasOne(AuctionBid::class)->where('status', 'winning');
    }

    public function winner()
    {
        if ($this->winner_type) {
            switch ($this->winner_type) {
                case 'customer':
                    return $this->belongsTo(Customer::class, 'winner_id', 'id');
                case 'technician':
                    return $this->belongsTo(Technician::class, 'winner_id', 'id');
                case 'tow_truck':
                    return $this->belongsTo(TowTruck::class, 'winner_id', 'id');
            }
        }
        return null;
    }

    // ======== SCOPES ========

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'scheduled')
            ->where('scheduled_start', '>', now());
    }

    public function scopeLive($query)
    {
        return $query->whereIn('status', ['live', 'extended']);
    }

    public function scopeEnded($query)
    {
        return $query->whereIn('status', ['ended', 'completed']);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['scheduled', 'live', 'extended']);
    }

    // ======== ACCESSORS ========

    public function getIsLiveAttribute()
    {
        return in_array($this->status, ['live', 'extended']);
    }

    public function getHasEndedAttribute()
    {
        return in_array($this->status, ['ended', 'completed', 'cancelled']);
    }

    public function getIsUpcomingAttribute()
    {
        return $this->status === 'scheduled' && $this->scheduled_start > now();
    }

    public function getTimeRemainingAttribute()
    {
        if (!$this->isLive) {
            return null;
        }

        $endTime = $this->actual_end ?? $this->scheduled_end;
        return max(0, $endTime->diffInSeconds(now(), false) * -1);
    }

    public function getTimeUntilStartAttribute()
    {
        if ($this->isLive || $this->hasEnded) {
            return 0;
        }
        return max(0, $this->scheduled_start->diffInSeconds(now(), false) * -1);
    }

    public function getMinimumBidAttribute()
    {
        if ($this->current_bid) {
            return $this->current_bid + $this->bid_increment;
        }
        return $this->starting_bid;
    }

    public function getParticipantCountAttribute()
    {
        return $this->registrations()->where('status', 'registered')->count();
    }

    public function getCanExtendAttribute()
    {
        return $this->extensions_used < $this->max_extensions;
    }

    // ======== METHODS ========

    /**
     * Check if a user can bid on this auction
     */
    public function canBid($userId, $userType)
    {
        // Must be live
        if (!$this->isLive) {
            return false;
        }

        // Must be registered
        $registration = $this->registrations()
            ->where('user_id', $userId)
            ->where('user_type', $userType)
            ->where('status', 'registered')
            ->first();

        return $registration !== null;
    }

    /**
     * Check if user is registered
     */
    public function isUserRegistered($userId, $userType)
    {
        return $this->registrations()
            ->where('user_id', $userId)
            ->where('user_type', $userType)
            ->whereIn('status', ['registered', 'participated', 'winner'])
            ->exists();
    }

    /**
     * Check if user has a reminder set
     */
    public function hasUserReminder($userId, $userType)
    {
        return $this->reminders()
            ->where('user_id', $userId)
            ->where('user_type', $userType)
            ->exists();
    }

    /**
     * Start the auction
     */
    public function start()
    {
        $this->update([
            'status' => 'live',
            'actual_start' => now(),
        ]);

        // Also update car status
        $this->car->markInAuction();
    }

    /**
     * Extend the auction
     */
    public function extend()
    {
        if (!$this->canExtend) {
            return false;
        }

        $currentEnd = $this->actual_end ?? $this->scheduled_end;
        $newEnd = $currentEnd->addMinutes($this->extension_minutes);

        $this->update([
            'status' => 'extended',
            'actual_end' => $newEnd,
            'extensions_used' => $this->extensions_used + 1,
        ]);

        return true;
    }

    /**
     * End the auction
     */
    public function end()
    {
        $winningBid = $this->bids()->where('status', 'valid')->first();

        $updateData = [
            'status' => 'ended',
            'actual_end' => now(),
        ];

        if ($winningBid) {
            // Mark the winning bid
            $winningBid->update(['status' => 'winning']);

            // Calculate commission if applicable
            $commission = 0;
            if ($this->commission_percent) {
                $commission += ($winningBid->amount * $this->commission_percent / 100);
            }
            if ($this->commission_fixed) {
                $commission += $this->commission_fixed;
            }

            $updateData['winner_id'] = $winningBid->user_id;
            $updateData['winner_type'] = $winningBid->user_type;
            $updateData['winner_name'] = $winningBid->bidder_name;
            $updateData['winner_phone'] = $winningBid->bidder_phone;
            $updateData['final_price'] = $winningBid->amount;
            $updateData['commission_amount'] = $commission;
            $updateData['payment_status'] = 'awaiting_payment';
            $updateData['payment_deadline'] = now()->addDays(3); // 3 days to pay

            // Mark car as sold
            $this->car->markSold();
        } else {
            // No bids - mark car as unsold
            $this->car->markUnsold();
        }

        $this->update($updateData);
    }

    /**
     * Check if should auto-extend
     */
    public function shouldAutoExtend()
    {
        if (!$this->isLive || !$this->canExtend) {
            return false;
        }

        return $this->timeRemaining <= $this->extension_threshold_seconds;
    }
}
