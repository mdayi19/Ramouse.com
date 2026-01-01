<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'order_number',
        'provider_id',
        'provider_name',
        'provider_unique_id',
        'price',
        'part_status',
        'part_size_category',
        'notes',
        'media',
        'viewed_by_customer'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'media' => 'array',
        'viewed_by_customer' => 'boolean',
        'timestamp' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_number', 'order_number');
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class, 'provider_id');
    }
}
