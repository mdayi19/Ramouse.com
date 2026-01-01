<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarCategory extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'flag',
        'brands',
        'telegram_bot_token',
        'telegram_channel_id',
        'telegram_notifications_enabled',
    ];

    protected $casts = [
        'brands' => 'array',
        'telegram_notifications_enabled' => 'boolean',
    ];
}
