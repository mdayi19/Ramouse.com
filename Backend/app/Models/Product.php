<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'price',
        'media',
        'target_audience',
        'specialty',
        'total_stock',
        'purchase_limit_per_buyer',
        'is_flash',
        'expires_at',
        'store_category_id',
        'store_subcategory_id',
        'shipping_size',
        'static_shipping_cost',
        'allowed_payment_methods',
        'average_rating'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'media' => 'array',
        'is_flash' => 'boolean',
        'expires_at' => 'datetime',
        'static_shipping_cost' => 'decimal:2',
        'allowed_payment_methods' => 'array',
        'average_rating' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(StoreCategory::class, 'store_category_id');
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }
}
