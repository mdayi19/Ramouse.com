<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'provider_id',
        'provider_name',
        'provider_unique_id',
        'amount',
        'status',
        'payment_method_id',
        'payment_method_name',
        'request_timestamp',
        'decision_timestamp',
        'admin_notes',
        'receipt_url',
    ];

    protected $casts = [
        'request_timestamp' => 'datetime',
        'decision_timestamp' => 'datetime',
        'amount' => 'decimal:2',
    ];
}
