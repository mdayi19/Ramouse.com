<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin Users
        // Admin users are now handled in AdminUserSeeder

        // Customers
        $customers = [
            [
                'id' => '966501234567',
                'unique_id' => 'CUST000001',
                'name' => 'Ahmed Al-Mutairi',
                'password' => Hash::make('password'),
                'address' => 'Riyadh, King Fahd District',
                'is_active' => true,
                'garage' => json_encode([
                    ['brand' => 'Toyota', 'model' => 'Camry', 'year' => 2020],
                    ['brand' => 'Honda', 'model' => 'Accord', 'year' => 2019],
                ]),
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
            ],
            [
                'id' => '966502345678',
                'unique_id' => 'CUST000002',
                'name' => 'Fatima Al-Shammari',
                'password' => Hash::make('password'),
                'address' => 'Jeddah, Al-Hamra District',
                'is_active' => true,
                'garage' => json_encode([
                    ['brand' => 'BMW', 'model' => 'X5', 'year' => 2021],
                ]),
                'notification_settings' => json_encode(['email' => true, 'sms' => false]),
                'flash_purchases' => json_encode([]),
            ],
            [
                'id' => '966503456789',
                'unique_id' => 'CUST000003',
                'name' => 'Mohammed Al-Qahtani',
                'password' => Hash::make('password'),
                'address' => 'Dammam, Al-Faisaliyah',
                'is_active' => true,
                'garage' => json_encode([
                    ['brand' => 'Mercedes-Benz', 'model' => 'E-Class', 'year' => 2022],
                ]),
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
            ],
        ];

        foreach ($customers as $customer) {
            DB::table('customers')->insert(array_merge($customer, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Providers
        $providers = [
            [
                'id' => '966511111111',
                'unique_id' => 'PROV000001',
                'name' => 'German Parts Supplier',
                'password' => Hash::make('password'),
                'is_active' => true,
                'wallet_balance' => 5000.00,
                'assigned_categories' => json_encode(['german']),
                'payment_info' => json_encode([
                    ['method' => 'bank', 'account' => 'SA1234567890'],
                ]),
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'last_login_at' => now(),
                'inactivity_warning_sent' => false,
                'average_rating' => 4.8,
                'flash_purchases' => json_encode([]),
            ],
            [
                'id' => '966512222222',
                'unique_id' => 'PROV000002',
                'name' => 'Japanese Auto Parts Co.',
                'password' => Hash::make('password'),
                'is_active' => true,
                'wallet_balance' => 7500.00,
                'assigned_categories' => json_encode(['japanese', 'korean']),
                'payment_info' => json_encode([
                    ['method' => 'bank', 'account' => 'SA9876543210'],
                ]),
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'last_login_at' => now(),
                'inactivity_warning_sent' => false,
                'average_rating' => 4.6,
                'flash_purchases' => json_encode([]),
            ],
            [
                'id' => '966513333333',
                'unique_id' => 'PROV000003',
                'name' => 'American Motors Supply',
                'password' => Hash::make('password'),
                'is_active' => true,
                'wallet_balance' => 3200.00,
                'assigned_categories' => json_encode(['american']),
                'payment_info' => json_encode([
                    ['method' => 'bank', 'account' => 'SA5555555555'],
                ]),
                'notification_settings' => json_encode(['email' => true, 'sms' => false]),
                'last_login_at' => now()->subDays(5),
                'inactivity_warning_sent' => false,
                'average_rating' => 4.5,
                'flash_purchases' => json_encode([]),
            ],
        ];

        foreach ($providers as $provider) {
            DB::table('providers')->insert(array_merge($provider, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Technicians
        $technicians = [
            [
                'id' => '966520000001',
                'unique_id' => 'TECH000001',
                'name' => 'Ali Al-Harbi - Auto Mechanic',
                'password' => Hash::make('password'),
                'specialty' => 'Mechanic',
                'city' => 'Riyadh',
                'workshop_address' => 'Exit 10, Industrial Area',
                'location' => DB::raw("ST_PointFromText('POINT(46.7219 24.6877)', 4326)"),
                'description' => 'Expert mechanic with 15 years of experience in all car brands.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966520000001']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.9,
                'registration_date' => now()->subMonths(6),
            ],
            [
                'id' => '966520000002',
                'unique_id' => 'TECH000002',
                'name' => 'Omar Al-Rashid - Electrician',
                'password' => Hash::make('password'),
                'specialty' => 'Electrician',
                'city' => 'Jeddah',
                'workshop_address' => 'Al-Amir Sultan Street',
                'location' => DB::raw("ST_PointFromText('POINT(39.1925 21.5433)', 4326)"),
                'description' => 'Specialized in automotive electrical systems and diagnostics.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966520000002']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.7,
                'registration_date' => now()->subMonths(8),
            ],
            [
                'id' => '966520000003',
                'unique_id' => 'TECH000003',
                'name' => 'Khalid Al-Otaibi - Body Repair',
                'password' => Hash::make('password'),
                'specialty' => 'Body Repair',
                'city' => 'Dammam',
                'workshop_address' => 'King Abdulaziz Street',
                'location' => DB::raw("ST_PointFromText('POINT(50.0992 26.4207)', 4326)"),
                'description' => 'Professional body repair and painting services.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966520000003', 'instagram' => '@khalid_bodyshop']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => false, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.8,
                'registration_date' => now()->subMonths(4),
            ],
            [
                'id' => '966520000004',
                'unique_id' => 'TECH000004',
                'name' => 'Fahad Al-Dossary - AC Specialist',
                'password' => Hash::make('password'),
                'specialty' => 'AC Specialist',
                'city' => 'Riyadh',
                'workshop_address' => 'Olaya District, Main Road',
                'location' => DB::raw("ST_PointFromText('POINT(46.6753 24.7136)', 4326)"),
                'description' => 'Expert in car AC systems, repair and maintenance.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966520000004']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.6,
                'registration_date' => now()->subMonths(3),
            ],
        ];

        foreach ($technicians as $technician) {
            DB::table('technicians')->insert(array_merge($technician, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Tow Trucks
        $towTrucks = [
            [
                'id' => '966530000001',
                'unique_id' => 'TOW0000001',
                'name' => 'Riyadh Express Towing',
                'password' => Hash::make('password'),
                'vehicle_type' => 'Flatbed',
                'city' => 'Riyadh',
                'service_area' => 'Greater Riyadh Area',
                'location' => DB::raw("ST_PointFromText('POINT(46.7219 24.6877)', 4326)"),
                'description' => '24/7 towing service with flatbed trucks for all vehicle types.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966530000001']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.8,
                'registration_date' => now()->subMonths(12),
            ],
            [
                'id' => '966530000002',
                'unique_id' => 'TOW0000002',
                'name' => 'Jeddah Fast Recovery',
                'password' => Hash::make('password'),
                'vehicle_type' => 'Winch',
                'city' => 'Jeddah',
                'service_area' => 'Jeddah and Surroundings',
                'location' => DB::raw("ST_PointFromText('POINT(39.1925 21.5433)', 4326)"),
                'description' => 'Quick response towing service with winch recovery capabilities.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966530000002']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => true, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.7,
                'registration_date' => now()->subMonths(9),
            ],
            [
                'id' => '966530000003',
                'unique_id' => 'TOW0000003',
                'name' => 'Dammam Heavy Duty Towing',
                'password' => Hash::make('password'),
                'vehicle_type' => 'Flatbed',
                'city' => 'Dammam',
                'service_area' => 'Eastern Province',
                'location' => DB::raw("ST_PointFromText('POINT(50.0992 26.4207)', 4326)"),
                'description' => 'Specialized in heavy-duty vehicle towing and recovery.',
                'is_verified' => true,
                'is_active' => true,
                'profile_photo' => null,
                'gallery' => json_encode([]),
                'socials' => json_encode(['whatsapp' => '966530000003', 'twitter' => '@dammam_towing']),
                'qr_code_url' => null,
                'notification_settings' => json_encode(['email' => false, 'sms' => true]),
                'flash_purchases' => json_encode([]),
                'average_rating' => 4.9,
                'registration_date' => now()->subMonths(15),
            ],
        ];

        foreach ($towTrucks as $towTruck) {
            DB::table('tow_trucks')->insert(array_merge($towTruck, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
