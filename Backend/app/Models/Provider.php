<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Provider extends Authenticatable
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
        'is_active',
        'wallet_balance',
        'assigned_categories',
        'payment_info',
        'notification_settings',
        'last_login_at',
        'inactivity_warning_sent',
        'average_rating',
        'flash_purchases',
        'saved_addresses'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'wallet_balance' => 'decimal:2',
        'assigned_categories' => 'array',
        'payment_info' => 'array',
        'notification_settings' => 'array',
        'last_login_at' => 'datetime',
        'inactivity_warning_sent' => 'boolean',
        'average_rating' => 'decimal:2',
        'flash_purchases' => 'array',
        'saved_addresses' => 'array',
    ];

    protected $hidden = [
        'password',
    ];

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

        // Fix tokenable_id using raw DB update
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

    public function quotes()
    {
        return $this->hasMany(Quote::class, 'provider_id', 'id');
    }

    public function toArray()
    {
        $array = parent::toArray();
        $array['paymentInfo'] = $this->payment_info;
        $array['notificationSettings'] = $this->notification_settings;
        return $array;
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
