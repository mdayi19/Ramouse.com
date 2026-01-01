<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $primaryKey = 'order_number';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'order_number',
        'user_id',
        'user_type',
        'status',
        'form_data',
        'customer_name',
        'customer_address',
        'customer_phone',
        'delivery_method',
        'shipping_price',
        'shipping_notes',
        'payment_method_id',
        'payment_method_name',
        'payment_receipt_url',
        'rejection_reason',
        'accepted_quote_id',
        'review',
        'stale_notified'
    ];

    protected $casts = [
        'form_data' => 'array',
        'shipping_price' => 'decimal:2',
        'review' => 'array',
        'stale_notified' => 'boolean',
        'date' => 'datetime',
    ];

    public function quotes()
    {
        return $this->hasMany(Quote::class, 'order_number', 'order_number');
    }

    public function acceptedQuote()
    {
        return $this->belongsTo(Quote::class, 'accepted_quote_id');
    }

    /**
     * Override toArray to provide both snake_case and camelCase for JavaScript
     */
    public function toArray()
    {
        $array = parent::toArray();

        // Add camelCase aliases for JavaScript compatibility
        $array['formData'] = $array['form_data'] ?? null;
        $array['orderNumber'] = $array['order_number'] ?? null;
        $array['userPhone'] = $array['user_id'] ?? null;
        $array['userType'] = $array['user_type'] ?? 'customer';
        $array['customerName'] = $array['customer_name'] ?? null;
        $array['customerAddress'] = $array['customer_address'] ?? null;
        $array['customerPhone'] = $array['customer_phone'] ?? null;
        $array['deliveryMethod'] = $array['delivery_method'] ?? 'shipping';
        $array['shippingPrice'] = $array['shipping_price'] ?? 0;
        $array['shippingNotes'] = $array['shipping_notes'] ?? '';
        $array['paymentMethodId'] = $array['payment_method_id'] ?? null;
        $array['paymentMethodName'] = $array['payment_method_name'] ?? null;
        $array['paymentReceiptUrl'] = $array['payment_receipt_url'] ?? null;
        $array['rejectionReason'] = $array['rejection_reason'] ?? null;
        // $array['acceptedQuote'] = ($array['accepted_quote_id'] ?? null) ? $this->acceptedQuote : null;

        // Add date if not present (it should be from casts)
        if (!isset($array['date']) && isset($array['created_at'])) {
            $array['date'] = $array['created_at'];
        }

        return $array;
    }
}
