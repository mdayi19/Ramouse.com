<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'whatsapp' => [
        'app_key' => env('WHATSAPP_APP_KEY', 'f69e455b-2155-4b4b-981a-25af0e56df51'),
        'auth_key' => env('WHATSAPP_AUTH_KEY', 'DWaAxBH8Z0AJCdz5h4Vb87pkI6DxcMZ0RcU3htPtdgzfgEIJlu'),
        'api_url' => env('WHATSAPP_API_URL', 'https://whatsoio.com/api/create-message'),
        'templates' => [
            'otp' => env('WHATSAPP_TEMPLATE_OTP', 'TEMPLATE_ID'),
            'new_order' => env('WHATSAPP_TEMPLATE_NEW_ORDER', 'TEMPLATE_ID'),
            'quote_received' => env('WHATSAPP_TEMPLATE_QUOTE', 'TEMPLATE_ID'),
            'order_status' => env('WHATSAPP_TEMPLATE_STATUS', 'TEMPLATE_ID'),
            'store_order' => env('WHATSAPP_TEMPLATE_STORE', 'TEMPLATE_ID'),
            'welcome' => env('WHATSAPP_TEMPLATE_WELCOME', 'TEMPLATE_ID'),
        ],
    ],

];
