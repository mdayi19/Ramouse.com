<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'slug',
        'title',
        'summary',
        'content',
        'imageUrl',
        'author',
        'published_at'
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    // Override toArray to convert snake_case to camelCase for API responses
    public function toArray()
    {
        $array = parent::toArray();

        // Convert published_at to publishedAt
        if (isset($array['published_at'])) {
            $array['publishedAt'] = $array['published_at'];
            unset($array['published_at']);
        }

        return $array;
    }
}
