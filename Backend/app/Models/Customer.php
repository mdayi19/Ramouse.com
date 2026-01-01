<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
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
        'address',
        'is_active',
        'garage',
        'notification_settings',
        'flash_purchases',
        'saved_addresses',
        'wallet_balance',
        'payment_info'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'garage' => 'array',
        'notification_settings' => 'array',
        'flash_purchases' => 'array',
        'saved_addresses' => 'array',
        'wallet_balance' => 'decimal:2',
        'payment_info' => 'array',
    ];

    /**
     * Override createToken to ensure tokenable_id is stored correctly with + sign
     * The + sign gets URL-decoded during Eloquent's save, so we use raw DB update
     */
    public function createToken(string $name, array $abilities = ['*'])
    {
        $token = $this->tokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken = \Illuminate\Support\Str::random(40)),
            'abilities' => $abilities,
        ]);

        // Fix tokenable_id using raw DB update since + gets URL-decoded by Eloquent
        $correctId = $this->getKey();
        if ($token->tokenable_id !== $correctId) {
            \DB::table('personal_access_tokens')
                ->where('id', $token->id)
                ->update(['tokenable_id' => $correctId]);

            // Refresh the token model to get the updated ID
            $token->refresh();
        }

        return new \Laravel\Sanctum\NewAccessToken($token, $token->getKey() . '|' . $plainTextToken);
    }

    /**
     * Override to prevent URL encoding of + in primary key
     */
    protected function getKeyForSelectQuery($value = null)
    {
        return $value ?? $this->getKey();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the most recently saved address
     */
    public function getLastSavedAddress()
    {
        if (!$this->saved_addresses || empty($this->saved_addresses)) {
            return null;
        }

        // Sort by created_at descending and return the first one
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

        // Add new address with timestamp
        $addresses[] = [
            'city' => $city,
            'address' => $address,
            'phone' => $phone,
            'created_at' => now()->toISOString(),
        ];

        // Keep only the last 5 addresses to prevent unlimited growth
        if (count($addresses) > 5) {
            // Sort by created_at descending
            usort($addresses, function ($a, $b) {
                $timeA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
                $timeB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
                return $timeB - $timeA;
            });
            // Keep only first 5
            $addresses = array_slice($addresses, 0, 5);
        }

        $this->saved_addresses = $addresses;
        $this->save();
    }
}
