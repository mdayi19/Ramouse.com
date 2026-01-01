<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreOrder extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_id',
        'buyer_id',
        'buyer_type',
        'buyer_name',
        'buyer_unique_id',
        'quantity',
        'total_price',
        'shipping_cost',
        'status',
        'delivery_method',
        'shipping_address',
        'contact_phone',
        'payment_method_id',
        'payment_method_name',
        'payment_receipt_url',
        'admin_notes',
        'request_date',
        'decision_date'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'total_price' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'request_date' => 'datetime',
        'decision_date' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
