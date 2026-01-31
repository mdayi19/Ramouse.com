<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ChatHistory extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'role',
        'content',
        'tool_calls',
        'tool_results'
    ];

    protected $casts = [
        'tool_calls' => 'array',
        'tool_results' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
