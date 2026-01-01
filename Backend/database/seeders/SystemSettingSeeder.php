<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing settings to avoid duplicates
        DB::table('system_settings')->truncate();

        $settings = [
            // Application Settings
            [
                'key' => 'logoUrl',
                'value' => json_encode('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImxvZ29HcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAyODRjNyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAzNjlhMSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwJSIgc3RvcC1jb2xvcj0idXJsKCNsb2dvR3JhZGllbnQpIi8+PHBhdGggZD0iTTY1IDU4IFYgMTQyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNjUgNTggQSAzMiAzMiAwIDAgMSA2NSAxMTgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMjIiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik05NSAxMDggTCAxMzUgMTQyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='),
            ],
            [
                'key' => 'appName',
                'value' => json_encode('راموسة لقطع غيار السيارات'),
            ],
            [
                'key' => 'mainDomain',
                'value' => json_encode('ramouse.com'),
            ],
            [
                'key' => 'adminPhone',
                'value' => json_encode('+963987654321'),
            ],
            [
                'key' => 'adminPassword',
                'value' => json_encode('adminpassword123'),
            ],

            // Social Media URLs
            [
                'key' => 'facebookUrl',
                'value' => json_encode('https://facebook.com/ramouse'),
            ],
            [
                'key' => 'instagramUrl',
                'value' => json_encode('https://instagram.com/ramouse'),
            ],
            [
                'key' => 'twitterUrl',
                'value' => json_encode('https://x.com/ramouse'),
            ],
            [
                'key' => 'linkedinUrl',
                'value' => json_encode('https://linkedin.com/company/ramouse'),
            ],
            [
                'key' => 'youtubeUrl',
                'value' => json_encode('https://youtube.com/@ramouse'),
            ],
            [
                'key' => 'whatsappUrl',
                'value' => json_encode('https://wa.me/963987654321'),
            ],
            [
                'key' => 'telegramUrl',
                'value' => json_encode('https://t.me/ramouse'),
            ],

            // CEO Information
            [
                'key' => 'ceoName',
                'value' => json_encode('محمد أحمد'),
            ],
            [
                'key' => 'ceoMessage',
                'value' => json_encode('مرحباً بكم في راموسة لقطع غيار السيارات. نحن ملتزمون بتقديم أفضل الخدمات وأجود قطع الغيار لعملائنا الكرام.'),
            ],

            // Company Information
            [
                'key' => 'companyAddress',
                'value' => json_encode('دمشق، سوريا - شارع الثورة'),
            ],
            [
                'key' => 'companyPhone',
                'value' => json_encode('+963 11 123 4567'),
            ],
            [
                'key' => 'companyEmail',
                'value' => json_encode('info@ramouse.com'),
            ],

            // Shipping Costs
            [
                'key' => 'shipping_cost_xs',
                'value' => json_encode('2.00'),
            ],
            [
                'key' => 'shipping_cost_s',
                'value' => json_encode('3.00'),
            ],
            [
                'key' => 'shipping_cost_m',
                'value' => json_encode('5.00'),
            ],
            [
                'key' => 'shipping_cost_l',
                'value' => json_encode('10.00'),
            ],
            [
                'key' => 'shipping_cost_vl',
                'value' => json_encode('15.00'),
            ],

            // Commission Rates
            [
                'key' => 'provider_commission_rate',
                'value' => json_encode('0.15'),
            ],
            [
                'key' => 'technician_commission_rate',
                'value' => json_encode('0.10'),
            ],

            // Order Settings
            [
                'key' => 'minimum_order_amount',
                'value' => json_encode('50.00'),
            ],
            [
                'key' => 'free_shipping_threshold',
                'value' => json_encode('200.00'),
            ],

            // System Toggles
            [
                'key' => 'flash_sale_enabled',
                'value' => json_encode(true),
            ],
            [
                'key' => 'maintenance_mode',
                'value' => json_encode(false),
            ],
            [
                'key' => 'whatsappNotificationsActive',
                'value' => json_encode(false), // Disabled by default, enabling it will rely on .env or DB keys
            ],
            [
                'key' => 'verificationApis',
                'value' => json_encode([]),
            ],
            [
                'key' => 'notificationApis',
                'value' => json_encode([]),
            ],
            [
                'key' => 'limitSettings',
                'value' => json_encode([
                    'maxActiveOrders' => 5,
                    'maxVerificationAttempts' => 3,
                    'verificationWindowMinutes' => 60,
                    'international_license_settings' => [
                        'syrian_price' => 500000,
                        'non_syrian_price' => 1000000,
                        'license_duration' => 'سنة واحدة',
                        'informations' => 'الأسعار تشمل كافة الرسوم',
                        'allowed_payment_methods' => ['cash', 'transfer'],
                        'is_active' => true
                    ]
                ]),
            ],

            // Support Information
            [
                'key' => 'support_email',
                'value' => json_encode('support@ramouse.com'),
            ],
            [
                'key' => 'support_phone',
                'value' => json_encode('+963987654321'),
            ],

            // Business Settings
            [
                'key' => 'company_name',
                'value' => json_encode('Ramouse Auto Parts'),
            ],
            [
                'key' => 'currency',
                'value' => json_encode('SAR'),
            ],
            [
                'key' => 'tax_rate',
                'value' => json_encode('0.15'),
            ],

            // Product Settings
            [
                'key' => 'featured_products_limit',
                'value' => json_encode('10'),
            ],
            [
                'key' => 'max_flash_purchase_per_user',
                'value' => json_encode('5'),
            ],

            // SEO Settings
            [
                'key' => 'seoSettings',
                'value' => json_encode([
                    'title' => 'Ramouse Auto Parts | راموسة لقطع غيار السيارات',
                    'description' => 'راموسة لقطع غيار السيارات: منصة حديثة ومتجاوبة لطلب قطع غيار السيارات بسهولة في سوريا.',
                    'keywords' => 'قطع غيار سيارات, سوريا, راموسة, قطع غيار, توصيل, تجارة إلكترونية',
                    'canonicalUrl' => 'https://ramouse.com/',
                    'themeColor' => '#0284c7',
                    'ogType' => 'website',
                    'ogUrl' => 'https://ramouse.com/',
                    'ogTitle' => 'Ramouse Auto Parts | راموسة لقطع غيار السيارات',
                    'ogDescription' => 'منصة حديثة ومتجاوبة لطلب قطع غيار السيارات بسهولة في سوريا.',
                    'ogImage' => 'https://ramouse.com/og-image.png',
                    'twitterCard' => 'summary_large_image',
                    'twitterUrl' => 'https://ramouse.com/',
                    'twitterTitle' => 'Ramouse Auto Parts | راموسة لقطع غيار السيارات',
                    'twitterDescription' => 'منصة حديثة ومتجاوبة لطلب قطع غيار السيارات بسهولة في سوريا.',
                    'twitterImage' => 'https://ramouse.com/og-image.png',
                    'jsonLd' => json_encode([
                        '@context' => 'https://schema.org',
                        '@type' => 'Organization',
                        'name' => 'Ramouse Auto Parts',
                        'url' => 'https://ramouse.com/',
                        'logo' => 'https://ramouse.com/logo.png',
                        'description' => 'منصة حديثة لتوفير قطع غيار السيارات في سوريا',
                        'address' => [
                            '@type' => 'PostalAddress',
                            'addressCountry' => 'SY',
                            'addressLocality' => 'Damascus'
                        ]
                    ])
                ])
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
