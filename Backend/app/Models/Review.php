<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'reviewable_type',
        'reviewable_id',
        'user_id',
        'customer_name',
        'rating',
        'comment',
        'status',
        'provider_response',
        'responded_at',
        'moderated_by',
        'moderated_at',
        'moderation_notes'
    ];

    protected $casts = [
        'rating' => 'integer',
        'responded_at' => 'datetime',
        'moderated_at' => 'datetime',
    ];

    /**
     * Get the reviewable entity (Technician or TowTruck)
     */
    public function reviewable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who submitted the review
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who moderated the review
     */
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    /**
     * Scope to get only approved reviews
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get only pending reviews
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get only rejected reviews
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
