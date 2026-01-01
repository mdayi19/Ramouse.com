<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Custom Application Messages
    |--------------------------------------------------------------------------
    |
    | Custom messages for application-specific features and errors.
    |
    */

    // Order messages
    'order_created' => 'تم إنشاء الطلب بنجاح.',
    'order_not_found' => 'الطلب غير موجود.',
    'order_updated' => 'تم تحديث الطلب بنجاح.',
    'order_status_updated' => 'تم تحديث حالة الطلب بنجاح.',
    'providers_not_allowed_to_order' => 'الموردين غير مسموح لهم بتقديم الطلبات.',

    // Quote messages
    'quote_submitted' => 'تم تقديم العرض بنجاح.',
    'quote_accepted' => 'تم قبول العرض بنجاح.',
    'quote_not_found' => 'العرض غير موجود.',
    'quote_already_selected' => 'تم اختيار عرض آخر لهذا الطلب.',

    // Payment messages
    'payment_approved' => 'تم قبول الدفع بنجاح.',
    'payment_rejected' => 'تم رفض الدفع.',
    'payment_receipt_uploaded' => 'تم رفع إيصال الدفع بنجاح.',
    'payment_pending' => 'في انتظار الدفع.',

    // Provider messages
    'provider_not_found' => 'المورد غير موجود.',
    'provider_profile_not_found' => 'ملف المورد غير موجود.',
    'unauthorized' => 'غير مصرح.',
    'unauthorized_role' => 'الصلاحية غير مسموح بها.',
    'insufficient_funds' => 'الرصيد غير كافي.',
    'invalid_payment_method' => 'طريقة الدفع غير صالحة.',
    'withdrawal_request_submitted' => 'تم تقديم طلب السحب بنجاح.',

    // Status messages
    'invalid_status_transition' => 'لا يمكن تغيير الحالة بهذا الشكل.',

    // Auth additional
    'user_not_found' => 'المستخدم غير موجود.',
    'otp_send_failed' => 'فشل إرسال رمز التحقق.',

    // Shipping messages
    'shipping_notes_updated' => 'تم تحديث ملاحظات الشحن بنجاح.',

    // General messages
    'success' => 'تمت العملية بنجاح.',
    'failed' => 'فشلت العملية.',
    'error' => 'حدث خطأ.',
    'not_found' => 'غير موجود.',
    'invalid_request' => 'طلب غير صالح.',
    'validation_error' => 'خطأ في التحقق من البيانات.',

];
