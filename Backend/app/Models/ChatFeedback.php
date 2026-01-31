<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatFeedback extends Model
{
    protected $fillable = [
        'session_id',
        'message_id',
        'user_id',
        'is_positive',
        'comment',
        'feedback_context'
    ];

    protected $casts = [
        'is_positive' => 'boolean',
        'feedback_context' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function chatHistory()
    {
        return $this->belongsTo(ChatHistory::class, 'message_id');
    }
}
