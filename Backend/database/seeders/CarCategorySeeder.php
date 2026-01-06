<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CarCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name_ar' => 'سيدان', 'name_en' => 'Sedan', 'icon' => '🚗', 'sort_order' => 1],
            ['name_ar' => 'SUV', 'name_en' => 'SUV', 'icon' => '🚙', 'sort_order' => 2],
            ['name_ar' => 'شاحنة', 'name_en' => 'Truck', 'icon' => '🚚', 'sort_order' => 3],
            ['name_ar' => 'فان', 'name_en' => 'Van', 'icon' => '🚐', 'sort_order' => 4],
            ['name_ar' => 'رياضية', 'name_en' => 'Sports Car', 'icon' => '🏎️', 'sort_order' => 5],
            ['name_ar' => 'فاخرة', 'name_en' => 'Luxury', 'icon' => '🚘', 'sort_order' => 6],
            ['name_ar' => 'كهربائية', 'name_en' => 'Electric', 'icon' => '⚡', 'sort_order' => 7],
            ['name_ar' => 'هجينة', 'name_en' => 'Hybrid', 'icon' => '🔋', 'sort_order' => 8],
        ];

        foreach ($categories as $category) {
            DB::table('car_categories')->insert([
                'name_ar' => $category['name_ar'],
                'name_en' => $category['name_en'],
                'icon' => $category['icon'],
                'sort_order' => $category['sort_order'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
