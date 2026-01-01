<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductReview extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_id',
        'user_id',
        'user_name',
        'rating',
        'comment',
        'date'
    ];

    protected $casts = [
        'rating' => 'integer',
        'date' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
