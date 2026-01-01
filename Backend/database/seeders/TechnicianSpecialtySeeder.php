<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TechnicianSpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            // 🔧 مهن تصليح وصيانة السيارات
            ['id' => 'mechanic', 'name' => 'ميكانيكي', 'icon' => 'Wrench'],
            ['id' => 'electrician', 'name' => 'كهربجي', 'icon' => 'Zap'],
            ['id' => 'body-repair-sowaj', 'name' => 'صواج', 'icon' => 'Hammer'],
            ['id' => 'body-repair-smkari', 'name' => 'سمكري', 'icon' => 'Eraser'],
            ['id' => 'car-painter', 'name' => 'دهّان سيارات', 'icon' => 'Paintbrush'],
            ['id' => 'dozan-brakes', 'name' => 'دوزان (فرامل)', 'icon' => 'Disc'],
            ['id' => 'dozan-alignment', 'name' => 'دوزان ميزان', 'icon' => 'ArrowLeftRight'],
            ['id' => 'tire-specialist', 'name' => 'كومجي (دواليب)', 'icon' => 'Circle'],
            ['id' => 'gearbox-specialist', 'name' => 'قيرجي', 'icon' => 'Settings2'],
            ['id' => 'engine-specialist', 'name' => 'موتورجي', 'icon' => 'Power'],
            ['id' => 'turbo-specialist', 'name' => 'تيربو', 'icon' => 'Wind'],
            ['id' => 'pump-specialist', 'name' => 'طرمبات', 'icon' => 'Droplet'],
            ['id' => 'injectors-specialist', 'name' => 'رشاشات', 'icon' => 'SprayCan'],
            ['id' => 'diagnostics', 'name' => 'فحص كمبيوتر', 'icon' => 'Laptop'],
            ['id' => 'garage-owner', 'name' => 'كراجي', 'icon' => 'Warehouse'],

            // ❄️ تكييف وأنظمة
            ['id' => 'ac-specialist', 'name' => 'تكييف سيارات', 'icon' => 'Snowflake'],
            ['id' => 'cooling-specialist', 'name' => 'مبردات', 'icon' => 'Thermometer'],

            // 🚘 هيكل وتجهيز
            ['id' => 'polishing', 'name' => 'تلميع', 'icon' => 'Sparkles'],
            ['id' => 'car-wash', 'name' => 'تنظيف سيارات', 'icon' => 'Waves'],
            ['id' => 'window-tinting', 'name' => 'فيميه (تظليل)', 'icon' => 'SunOff'],
            ['id' => 'upholstery', 'name' => 'تنجيد سيارات', 'icon' => 'Scissors'],
            ['id' => 'car-glass', 'name' => 'زجاج سيارات', 'icon' => 'Maximize'],
            ['id' => 'car-locks', 'name' => 'أقفال سيارات', 'icon' => 'Key'],
            ['id' => 'car-alarm', 'name' => 'إنذار سيارات', 'icon' => 'BellRing'],
            ['id' => 'car-audio', 'name' => 'صوتيات سيارات', 'icon' => 'Speaker'],

            // 🧪 فحص وخبرة
            ['id' => 'expert-inspection', 'name' => 'أكسبير سيارات', 'icon' => 'ClipboardCheck'],
        ];

        foreach ($specialties as $specialty) {
            DB::table('technician_specialties')->updateOrInsert(
                ['id' => $specialty['id']],
                array_merge($specialty, [
                    'updated_at' => now(),
                    'created_at' => now(),
                ])
            );
        }
    }
}
