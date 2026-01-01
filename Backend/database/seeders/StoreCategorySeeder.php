<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StoreCategory;

class StoreCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'id' => 'oils',
                'name' => 'زيوت وسوائل',
                'icon' => 'Droplet',
                'is_featured' => true,
                'subcategories' => [
                    ['id' => 'engine-oil', 'name' => 'زيوت محرك'],
                    ['id' => 'transmission-fluid', 'name' => 'زيوت قير'],
                    ['id' => 'brake-fluid', 'name' => 'زيوت فرامل'],
                    ['id' => 'coolant', 'name' => 'مياه رديتر'],
                    ['id' => 'additives', 'name' => 'إضافات ومحسنات'],
                ],
            ],
            [
                'id' => 'filters',
                'name' => 'فلاتر',
                'icon' => 'Filter',
                'is_featured' => true,
                'subcategories' => [
                    ['id' => 'oil-filter', 'name' => 'فلتر زيت'],
                    ['id' => 'air-filter', 'name' => 'فلتر هواء'],
                    ['id' => 'ac-filter', 'name' => 'فلتر مكيف'],
                    ['id' => 'fuel-filter', 'name' => 'فلتر بنزين'],
                ],
            ],
            [
                'id' => 'batteries',
                'name' => 'بطاريات',
                'icon' => 'Battery',
                'is_featured' => true,
                'subcategories' => [
                    ['id' => 'car-battery', 'name' => 'بطاريات سيارات'],
                    ['id' => 'truck-battery', 'name' => 'بطاريات شاحنات'],
                    ['id' => 'jump-starter', 'name' => 'شواحن واشتراك'],
                ],
            ],
            [
                'id' => 'accessories',
                'name' => 'إكسسوارات',
                'icon' => 'Gem',
                'is_featured' => true,
                'subcategories' => [
                    ['id' => 'interior-accessories', 'name' => 'إكسسوارات داخلية'],
                    ['id' => 'exterior-accessories', 'name' => 'إكسسوارات خارجية'],
                    ['id' => 'car-care', 'name' => 'عناية وتنظيف'],
                    ['id' => 'electronics', 'name' => 'إلكترونيات'],
                ],
            ],
            [
                'id' => 'tires',
                'name' => 'إطارات',
                'icon' => 'CircleDot',
                'is_featured' => false,
                'subcategories' => [
                    ['id' => 'summer-tires', 'name' => 'إطارات صيفية'],
                    ['id' => 'winter-tires', 'name' => 'إطارات شتوية'],
                    ['id' => 'all-season-tires', 'name' => 'إطارات جميع الفصول'],
                ],
            ],
            [
                'id' => 'tools',
                'name' => 'عدد وأدوات',
                'icon' => 'Wrench',
                'is_featured' => false,
                'subcategories' => [
                    ['id' => 'hand-tools', 'name' => 'أدوات يدوية'],
                    ['id' => 'diagnostic-tools', 'name' => 'أجهزة فحص'],
                    ['id' => 'lifting-tools', 'name' => 'أدوات رفع'],
                ],
            ],
            [
                'id' => 'brakes',
                'name' => 'فرامل',
                'icon' => 'Disc',
                'is_featured' => false,
                'subcategories' => [
                    ['id' => 'brake-pads', 'name' => 'تيل فرامل'],
                    ['id' => 'brake-discs', 'name' => 'أقراص فرامل'],
                    ['id' => 'brake-drums', 'name' => 'طنابير فرامل'],
                ],
            ],
            [
                'id' => 'lighting',
                'name' => 'إضاءة',
                'icon' => 'Lightbulb',
                'is_featured' => false,
                'subcategories' => [
                    ['id' => 'headlights', 'name' => 'إضاءة أمامية'],
                    ['id' => 'tail-lights', 'name' => 'إضاءة خلفية'],
                    ['id' => 'fog-lights', 'name' => 'إضاءة ضباب'],
                    ['id' => 'led-strips', 'name' => 'شرائط LED'],
                ],
            ],
        ];

        foreach ($categories as $category) {
            StoreCategory::updateOrCreate(
                ['id' => $category['id']],
                $category
            );
        }

        $this->command->info('Store categories seeded successfully with Arabic names!');
    }
}
