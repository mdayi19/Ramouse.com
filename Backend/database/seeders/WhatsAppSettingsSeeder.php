<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class WhatsAppSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed default WhatsApp verification APIs
        SystemSetting::updateOrCreate(
            ['key' => 'verificationApis'],
            [
                'value' => [
                    [
                        'id' => 'api-default-verification',
                        'name' => 'Whatso Verification API',
                        'apiUrl' => 'https://whatsoio.com/api/create-message',
                        'appKey' => 'f69e455b-2155-4b4b-981a-25af0e56df51',
                        'authKey' => 'DWaAxBH8Z0AJCdz5h4Vb87pkI6DxcMZ0RcU3htPtdgzfgEIJlu',
                        'isActive' => true,
                    ],
                ],
            ]
        );

        // Seed default WhatsApp notification APIs
        SystemSetting::updateOrCreate(
            ['key' => 'notificationApis'],
            [
                'value' => [
                    [
                        'id' => 'api-default-notification',
                        'name' => 'Whatso Notification API',
                        'apiUrl' => 'https://whatsoio.com/api/create-message',
                        'appKey' => 'f69e455b-2155-4b4b-981a-25af0e56df51',
                        'authKey' => 'DWaAxBH8Z0AJCdz5h4Vb87pkI6DxcMZ0RcU3htPtdgzfgEIJlu',
                        'isActive' => true,
                    ],
                ],
            ]
        );

        // Seed WhatsApp notifications active flag
        SystemSetting::updateOrCreate(
            ['key' => 'whatsappNotificationsActive'],
            ['value' => true]
        );

        $this->command->info('WhatsApp settings seeded successfully!');
    }
}
