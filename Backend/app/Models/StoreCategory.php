<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreCategory extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'icon',
        'subcategories',
        'is_featured'
    ];

    protected $casts = [
        'subcategories' => 'array',
        'is_featured' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'store_category_id');
    }
}
