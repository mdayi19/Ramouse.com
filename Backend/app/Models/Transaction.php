<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'provider_id',
        'type',
        'amount',
        'description',
        'balance_after',
        'timestamp',
        'related_order_id',
        'related_withdrawal_id',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];
}
