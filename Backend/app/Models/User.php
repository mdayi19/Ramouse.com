<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasPushSubscriptions;

    /**
     * The channels the user receives notification broadcasts on.
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'user.' . $this->id;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'is_admin',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function provider()
    {
        return $this->hasOne(Provider::class);
    }

    public function technician()
    {
        return $this->hasOne(Technician::class);
    }

    public function towTruck()
    {
        return $this->hasOne(TowTruck::class);
    }

    /**
     * Get the last saved address for the user from their order history.
     */
    public function getLastSavedAddress()
    {
        $lastOrder = \App\Models\StoreOrder::where('buyer_id', $this->id)
            ->orWhere('buyer_id', $this->phone)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastOrder && $lastOrder->shipping_address) {
            $parts = explode(' - ', $lastOrder->shipping_address, 2);
            $city = count($parts) > 1 ? $parts[0] : 'Damascus';
            $address = count($parts) > 1 ? $parts[1] : $parts[0];

            return [
                'city' => $city,
                'address' => $address,
                'phone' => $lastOrder->contact_phone
            ];
        }

        return null;
    }

    /**
     * Save/Update user address. 
     * Currently a placeholder as we use order history, but keeps valid structure.
     */
    public function saveAddress($city, $address, $phone)
    {
        // Ideally we would save this to a user_addresses table
        // For now, we rely on the order history which captures this data

        // We can update the user's phone if it's different and valid
        if ($phone && $phone !== $this->phone) {
            // $this->update(['phone' => $phone]); 
            // Commented out to avoid accidental account takeover/changes
        }
    }
}
