<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSettings extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
    ];

    // Don't auto-cast value since it's stored as JSON string
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Accessor to decode JSON value when accessed
    public function getValueAttribute($value)
    {
        return json_decode($value, true);
    }

    // Mutator to encode value as JSON when set
    public function setValueAttribute($value)
    {
        $this->attributes['value'] = json_encode($value);
    }

    // Static method to get a setting by key
    public static function getSetting(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    // Static method to set a setting
    public static function setSetting(string $key, $value)
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    // Get all settings as a flat array (key => value)
    public static function getAllFlat(): array
    {
        $settings = self::all();
        $flat = [];

        foreach ($settings as $setting) {
            $flat[$setting->key] = $setting->value;
        }

        return $flat;
    }
}

