<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserWithdrawal extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'user_type',
        'user_name',
        'amount',
        'status',
        'payment_method_id',
        'payment_method_name',
        'payment_method_details',
        'request_timestamp',
        'decision_timestamp',
        'admin_notes',
        'receipt_url',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'request_timestamp' => 'datetime',
        'decision_timestamp' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->request_timestamp)) {
                $model->request_timestamp = now();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for pending withdrawals
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved withdrawals
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected withdrawals
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    protected $appends = ['receiptUrl', 'userName', 'userType', 'paymentMethodName', 'paymentMethodDetails'];

    public function getReceiptUrlAttribute()
    {
        return $this->attributes['receipt_url'] ?? null;
    }

    public function getUserNameAttribute()
    {
        return $this->attributes['user_name'] ?? null;
    }

    public function getUserTypeAttribute()
    {
        return $this->attributes['user_type'] ?? null;
    }

    public function getPaymentMethodNameAttribute()
    {
        return $this->attributes['payment_method_name'] ?? null;
    }

    public function getPaymentMethodDetailsAttribute()
    {
        return $this->attributes['payment_method_details'] ?? null;
    }
}
