<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatAnalytics extends Model
{
    protected $fillable = [
        'session_id',
        'user_id',
        'event_type',
        'event_data',
        'response_time_ms'
    ];

    protected $casts = [
        'response_time_ms' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
