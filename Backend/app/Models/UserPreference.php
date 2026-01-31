<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'preference_key',
        'preference_value',
        'frequency',
        'last_used_at'
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'frequency' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Increment the frequency of this preference
     */
    public function incrementUsage()
    {
        $this->increment('frequency');
        $this->update(['last_used_at' => now()]);
    }
}
