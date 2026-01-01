<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class InternationalLicenseRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'nationality',
        'birthdate',
        'address',
        'personal_photo',
        'id_document',
        'id_document_back',
        'passport_document',
        'driving_license_front',
        'driving_license_back',
        'price',
        'payment_method',
        'proof_of_payment',
        'payment_status',
        'status',
        'admin_note',
        'rejection_type',
        'rejected_documents',
        'order_number',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'rejected_documents' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the personal photo URL.
     */
    public function getPersonalPhotoAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }

    /**
     * Get the ID document URL.
     */
    public function getIdDocumentAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }

    /**
     * Get the ID document back URL.
     */
    public function getIdDocumentBackAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }

    /**
     * Get the passport document URL.
     */
    public function getPassportDocumentAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }

    /**
     * Get the driving license front URL.
     */
    public function getDrivingLicenseFrontAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }

    /**
     * Get the driving license back URL.
     */
    public function getDrivingLicenseBackAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }

    /**
     * Get the proof of payment URL.
     */
    public function getProofOfPaymentAttribute($value)
    {
        return $value ? asset(Storage::url($value)) : null;
    }
}
