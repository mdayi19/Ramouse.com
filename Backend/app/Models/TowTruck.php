<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class TowTruck extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'unique_id',
        'name',
        'password',
        'vehicle_type',
        'city',
        'service_area',
        'location',
        'description',
        'is_verified',
        'is_active',
        'profile_photo',
        'gallery',
        'socials',
        'qr_code_url',
        'notification_settings',
        'flash_purchases',
        'average_rating',
        'saved_addresses',
        'wallet_balance',
        'payment_info'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['location'];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
        'gallery' => 'array',
        'socials' => 'array',
        'notification_settings' => 'array',
        'flash_purchases' => 'array',
        'average_rating' => 'decimal:2',
        'registration_date' => 'datetime',
        'saved_addresses' => 'array',
        'wallet_balance' => 'decimal:2',
        'payment_info' => 'array',
    ];

    public function getLocationAttribute($value)
    {
        // If value is already an array (e.g. manually set), return it
        if (is_array($value))
            return $value;

        // If we already have lat/lng loaded (e.g. via custom query)
        if (isset($this->attributes['lat']) && isset($this->attributes['lng'])) {
            return ['latitude' => $this->attributes['lat'], 'longitude' => $this->attributes['lng']];
        }

        // Fallback: Fetch from DB using MySQL spatial functions
        if ($this->exists) {
            try {
                // Use MySQL spatial functions (no ::geometry casting needed)
                $result = \Illuminate\Support\Facades\DB::selectOne(
                    "SELECT ST_Y(location) as lat, ST_X(location) as lng FROM tow_trucks WHERE id = ?",
                    [$this->id]
                );
                return $result ? ['latitude' => $result->lat, 'longitude' => $result->lng] : null;
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Override createToken to ensure tokenable_id is stored correctly with + sign
     */
    public function createToken(string $name, array $abilities = ['*'])
    {
        $token = $this->tokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken = \Illuminate\Support\Str::random(40)),
            'abilities' => $abilities,
        ]);

        $correctId = $this->getKey();
        if ($token->tokenable_id !== $correctId) {
            \DB::table('personal_access_tokens')
                ->where('id', $token->id)
                ->update(['tokenable_id' => $correctId]);
            $token->refresh();
        }

        return new \Laravel\Sanctum\NewAccessToken($token, $token->getKey() . '|' . $plainTextToken);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get reviews for this tow truck
     */
    public function reviews()
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    /**
     * Recalculate and update average rating from approved reviews
     */
    public function recalculateAverageRating()
    {
        $avgRating = $this->reviews()->where('status', 'approved')->avg('rating');
        $this->average_rating = $avgRating ? (float) round($avgRating, 2) : 0.0;
        $this->save();

        return $this->average_rating;
    }

    /**
     * Get the most recently saved address
     */
    public function getLastSavedAddress()
    {
        if (!$this->saved_addresses || empty($this->saved_addresses)) {
            return null;
        }

        $addresses = $this->saved_addresses;
        usort($addresses, function ($a, $b) {
            $timeA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
            $timeB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
            return $timeB - $timeA;
        });

        return $addresses[0] ?? null;
    }

    /**
     * Save a new address to the saved_addresses array
     */
    public function saveAddress($city, $address, $phone)
    {
        $addresses = $this->saved_addresses ?? [];

        $addresses[] = [
            'city' => $city,
            'address' => $address,
            'phone' => $phone,
            'created_at' => now()->toISOString(),
        ];

        if (count($addresses) > 5) {
            usort($addresses, function ($a, $b) {
                $timeA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
                $timeB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
                return $timeB - $timeA;
            });
            $addresses = array_slice($addresses, 0, 5);
        }

        $this->saved_addresses = $addresses;
        $this->save();
    }
}
