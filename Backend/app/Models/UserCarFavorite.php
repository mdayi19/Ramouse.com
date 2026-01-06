<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCarFavorite extends Model
{
    public $timestamps = false;
    protected $fillable = ['user_id', 'car_listing_id'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(CarListing::class, 'car_listing_id');
    }

    // Methods
    public static function toggle($userId, $listingId)
    {
        $favorite = static::where('user_id', $userId)
            ->where('car_listing_id', $listingId)
            ->first();

        if ($favorite) {
            $favorite->delete();
            return false;
        } else {
            static::create([
                'user_id' => $userId,
                'car_listing_id' => $listingId,
            ]);
            return true;
        }
    }

    public static function check($userId, $listingId)
    {
        return static::where('user_id', $userId)
            ->where('car_listing_id', $listingId)
            ->exists();
    }
}
