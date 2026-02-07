/**
 * Filter Configuration for Chatbot
 * Defines all available filters for cars, technicians, and tow trucks
 */

export interface FilterOption {
    label: string;
    value: string | number;
    icon?: string;
}

export interface FilterGroup {
    id: string;
    label: string;
    type: 'single' | 'multiple' | 'range' | 'location';
    options: FilterOption[];
}

// ==================== CAR FILTERS ====================
export const carFilters: FilterGroup[] = [
    {
        id: 'listing_type',
        label: 'نوع الإعلان',
        type: 'single',
        options: [
            { label: 'بيع', value: 'sale', icon: '💰' },
            { label: 'إيجار', value: 'rent', icon: '🔄' }
        ]
    },
    {
        id: 'budget',
        label: 'الميزانية',
        type: 'single',
        options: [
            { label: 'أقل من 30,000 ريال', value: '0-30000' },
            { label: '30,000 - 50,000 ريال', value: '30000-50000' },
            { label: '50,000 - 100,000 ريال', value: '50000-100000' },
            { label: '100,000 - 200,000 ريال', value: '100000-200000' },
            { label: 'أكثر من 200,000 ريال', value: '200000+' }
        ]
    },
    {
        id: 'car_type',
        label: 'نوع السيارة',
        type: 'multiple',
        options: [
            { label: 'سيدان', value: 'sedan', icon: '🚗' },
            { label: 'SUV', value: 'suv', icon: '🚙' },
            { label: 'شاحنة', value: 'truck', icon: '🚚' },
            { label: 'رياضية', value: 'sports', icon: '🏎️' },
            { label: 'كهربائية', value: 'electric', icon: '⚡' }
        ]
    },
    {
        id: 'brand',
        label: 'الماركة',
        type: 'multiple',
        options: [
            { label: 'تويوتا', value: 'toyota' },
            { label: 'هيونداي', value: 'hyundai' },
            { label: 'كيا', value: 'kia' },
            { label: 'نيسان', value: 'nissan' },
            { label: 'هوندا', value: 'honda' },
            { label: 'فورد', value: 'ford' },
            { label: 'شيفروليه', value: 'chevrolet' },
            { label: 'BMW', value: 'bmw' },
            { label: 'مرسيدس', value: 'mercedes' },
            { label: 'أخرى', value: 'other' }
        ]
    },
    {
        id: 'year',
        label: 'سنة الصنع',
        type: 'single',
        options: [
            { label: '2024', value: '2024' },
            { label: '2023', value: '2023' },
            { label: '2022', value: '2022' },
            { label: '2021', value: '2021' },
            { label: '2020', value: '2020' },
            { label: '2015-2019', value: '2015-2019' },
            { label: 'قبل 2015', value: '0-2014' }
        ]
    },
    {
        id: 'condition',
        label: 'حالة السيارة',
        type: 'single',
        options: [
            { label: 'جديدة', value: 'new', icon: '✨' },
            { label: 'مستعملة', value: 'used', icon: '🔧' }
        ]
    },
    {
        id: 'transmission',
        label: 'ناقل الحركة',
        type: 'single',
        options: [
            { label: 'أوتوماتيك', value: 'automatic', icon: '⚙️' },
            { label: 'يدوي', value: 'manual', icon: '🎮' }
        ]
    },
    {
        id: 'city',
        label: 'المدينة',
        type: 'single',
        options: [
            { label: 'دمشق', value: 'damascus' },
            { label: 'حلب', value: 'aleppo' },
            { label: 'حمص', value: 'homs' },
            { label: 'حماة', value: 'hama' },
            { label: 'اللاذقية', value: 'latakia' },
            { label: 'طرطوس', value: 'tartus' },
            { label: 'درعا', value: 'daraa' },
            { label: 'السويداء', value: 'sweida' },
            { label: 'جميع المدن', value: 'all' }
        ]
    }
];

// ==================== TECHNICIAN FILTERS ====================
export const technicianFilters: FilterGroup[] = [
    {
        id: 'service_type',
        label: 'نوع الخدمة',
        type: 'multiple',
        options: [
            { label: 'صيانة عامة', value: 'general', icon: '🔧' },
            { label: 'كهرباء', value: 'electrical', icon: '⚡' },
            { label: 'ميكانيك', value: 'mechanical', icon: '⚙️' },
            { label: 'تكييف', value: 'ac', icon: '❄️' },
            { label: 'دهان', value: 'paint', icon: '🎨' },
            { label: 'فحص شامل', value: 'inspection', icon: '🔍' }
        ]
    },
    {
        id: 'rating',
        label: 'التقييم',
        type: 'single',
        options: [
            { label: '⭐⭐⭐⭐⭐ فقط', value: '5' },
            { label: '⭐⭐⭐⭐ وأعلى', value: '4' },
            { label: '⭐⭐⭐ وأعلى', value: '3' },
            { label: 'جميع التقييمات', value: '0' }
        ]
    },
    {
        id: 'distance',
        label: 'المسافة',
        type: 'single',
        options: [
            { label: 'أقل من 5 كم', value: '0-5' },
            { label: '5 - 10 كم', value: '5-10' },
            { label: '10 - 20 كم', value: '10-20' },
            { label: 'أكثر من 20 كم', value: '20+' },
            { label: 'جميع المسافات', value: 'all' }
        ]
    },
    {
        id: 'price_range',
        label: 'نطاق السعر',
        type: 'single',
        options: [
            { label: 'أقل من 100 ريال', value: '0-100' },
            { label: '100 - 300 ريال', value: '100-300' },
            { label: '300 - 500 ريال', value: '300-500' },
            { label: 'أكثر من 500 ريال', value: '500+' },
            { label: 'جميع الأسعار', value: 'all' }
        ]
    },
    {
        id: 'availability',
        label: 'التوفر',
        type: 'single',
        options: [
            { label: 'متاح الآن', value: 'now', icon: '🟢' },
            { label: 'اليوم', value: 'today', icon: '📅' },
            { label: 'خلال 24 ساعة', value: '24h', icon: '⏰' },
            { label: 'غير محدد', value: 'any', icon: '📆' }
        ]
    },
    {
        id: 'city',
        label: 'المدينة',
        type: 'single',
        options: [
            { label: 'دمشق', value: 'damascus' },
            { label: 'حلب', value: 'aleppo' },
            { label: 'حمص', value: 'homs' },
            { label: 'حماة', value: 'hama' },
            { label: 'اللاذقية', value: 'latakia' },
            { label: 'طرطوس', value: 'tartus' },
            { label: 'جميع المدن', value: 'all' }
        ]
    }
];

// ==================== TOW TRUCK FILTERS ====================
export const towTruckFilters: FilterGroup[] = [
    {
        id: 'truck_type',
        label: 'نوع السطحة',
        type: 'multiple',
        options: [
            { label: 'سطحة صغيرة', value: 'small', icon: '🚗' },
            { label: 'سطحة متوسطة', value: 'medium', icon: '🚙' },
            { label: 'سطحة كبيرة', value: 'large', icon: '🚛' },
            { label: 'سطحة هيدروليك', value: 'hydraulic', icon: '⚙️' }
        ]
    },
    {
        id: 'service_type',
        label: 'نوع الخدمة',
        type: 'multiple',
        options: [
            { label: 'سطحة عادية', value: 'standard', icon: '🚚' },
            { label: 'ونش', value: 'winch', icon: '🔗' },
            { label: 'طوارئ 24/7', value: 'emergency', icon: '🚨' }
        ]
    },
    {
        id: 'availability',
        label: 'التوفر',
        type: 'single',
        options: [
            { label: 'متاح الآن', value: 'now', icon: '🟢' },
            { label: 'اليوم', value: 'today', icon: '📅' },
            { label: 'غير محدد', value: 'any', icon: '📆' }
        ]
    },
    {
        id: 'distance',
        label: 'المسافة',
        type: 'single',
        options: [
            { label: 'أقل من 10 كم', value: '0-10' },
            { label: '10 - 20 كم', value: '10-20' },
            { label: '20 - 50 كم', value: '20-50' },
            { label: 'أكثر من 50 كم', value: '50+' },
            { label: 'جميع المسافات', value: 'all' }
        ]
    },
    {
        id: 'price_range',
        label: 'نطاق السعر',
        type: 'single',
        options: [
            { label: 'أقل من 200 ريال', value: '0-200' },
            { label: '200 - 400 ريال', value: '200-400' },
            { label: '400 - 600 ريال', value: '400-600' },
            { label: 'أكثر من 600 ريال', value: '600+' },
            { label: 'جميع الأسعار', value: 'all' }
        ]
    },
    {
        id: 'city',
        label: 'المدينة',
        type: 'single',
        options: [
            { label: 'دمشق', value: 'damascus' },
            { label: 'حلب', value: 'aleppo' },
            { label: 'حمص', value: 'homs' },
            { label: 'حماة', value: 'hama' },
            { label: 'اللاذقية', value: 'latakia' },
            { label: 'طرطوس', value: 'tartus' },
            { label: 'جميع المدن', value: 'all' }
        ]
    }
];

// ==================== QUICK FILTER CHIPS ====================
export const quickFilters = {
    cars: [
        { label: 'أقل من 50,000 ريال', filters: { budget: '0-50000' } },
        { label: 'SUV', filters: { car_type: ['suv'] } },
        { label: 'تويوتا', filters: { brand: ['toyota'] } },
        { label: 'جديدة', filters: { condition: 'new' } },
        { label: 'دمشق', filters: { city: 'damascus' } },
        { label: '2023-2024', filters: { year: '2023' } }
    ],
    technicians: [
        { label: 'قريب مني', filters: { distance: '0-5' } },
        { label: '5 نجوم', filters: { rating: '5' } },
        { label: 'متاح الآن', filters: { availability: 'now' } },
        { label: 'صيانة عامة', filters: { service_type: ['general'] } },
        { label: 'أقل من 300 ريال', filters: { price_range: '0-300' } }
    ],
    towTrucks: [
        { label: 'متاح الآن', filters: { availability: 'now' } },
        { label: 'طوارئ 24/7', filters: { service_type: ['emergency'] } },
        { label: 'قريب مني', filters: { distance: '0-10' } },
        { label: 'أقل من 400 ريال', filters: { price_range: '0-400' } }
    ]
};
