
import { Category, PartType, Brand, TechnicianSpecialty, TowTruckType, StoreCategory } from './types';

// Data Constants (Same content as original constants.tsx)
export const DEFAULT_CAR_CATEGORIES: Category[] = [
    { id: 'cat1', name: 'ألمانية', flag: '🇩🇪', brands: ['مرسيدس-بنز', 'بي إم دبليو', 'أودي', 'فولكس فاجن', 'بورش', 'أوبل'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat2', name: 'أمريكية', flag: '🇺🇸', brands: ['فورد', 'شيفروليه', 'دودج', 'جيب', 'كرايسلر', 'جي إم سي', 'كاديلاك', 'لينكون'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat3', name: 'كورية', flag: '🇰🇷', brands: ['هيونداي', 'كيا', 'جينيسيس', 'سانج يونج'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat4', name: 'يابانية', flag: '🇯🇵', brands: ['تويوتا', 'نيسان', 'هوندا', 'مازدا', 'سوبارو', 'ميتسوبيشي', 'لكزس', 'إنفينيتي', 'سوزوكي'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat5', name: 'فرنسية', flag: '🇫🇷', brands: ['بيجو', 'رينو', 'سيتروين', 'دي إس'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat6', name: 'صينية', flag: '🇨🇳', brands: ['شيري', 'جيلي', 'بي واي دي', 'إم جي', 'هافال', 'شانجان', 'جريت وول', 'بي واي دي'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat7', name: 'إيطالية', flag: '🇮🇹', brands: ['فيات', 'ألفا روميو', 'فيراري', 'مازيراتي', 'لامبورغيني'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat8', name: 'بريطانية', flag: '🇬🇧', brands: ['لاند روفر', 'جاغوار', 'ميني', 'بنتلي', 'رولز رويس', 'أستون مارتن'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat9', name: 'سويدية', flag: '🇸🇪', brands: ['فولفو'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
    { id: 'cat10', name: 'تركية', flag: '🇹🇷', brands: ['توفاش'], telegramBotToken: '8384231011:AAHwMGo47u8hLa-hFjV9kxeg8n36XVJdO-w', telegramChannelId: '-1003140324258', telegramNotificationsEnabled: true },
];

export const DEFAULT_STORE_CATEGORIES: StoreCategory[] = [
    {
        id: 'oils',
        name: 'زيوت وسوائل',
        icon: 'Droplet',
        subcategories: [
            { id: 'engine-oil', name: 'زيوت محرك' },
            { id: 'transmission-fluid', name: 'زيوت قير' },
            { id: 'brake-fluid', name: 'زيوت فرامل' },
            { id: 'coolant', name: 'مياه رديتر' },
            { id: 'additives', name: 'إضافات ومحسنات' }
        ]
    },
    {
        id: 'filters',
        name: 'فلاتر',
        icon: 'Filter',
        subcategories: [
            { id: 'oil-filter', name: 'فلتر زيت' },
            { id: 'air-filter', name: 'فلتر هواء' },
            { id: 'ac-filter', name: 'فلتر مكيف' },
            { id: 'fuel-filter', name: 'فلتر بنزين' }
        ]
    },
    {
        id: 'batteries',
        name: 'بطاريات',
        icon: 'Battery',
        subcategories: [
            { id: 'car-battery', name: 'بطاريات سيارات' },
            { id: 'truck-battery', name: 'بطاريات شاحنات' },
            { id: 'jump-starter', name: 'شواحن واشتراك' }
        ]
    },
    {
        id: 'accessories',
        name: 'إكسسوارات',
        icon: 'Gem',
        subcategories: [
            { id: 'interior-accessories', name: 'إكسسوارات داخلية' },
            { id: 'exterior-accessories', name: 'إكسسوارات خارجية' },
            { id: 'car-care', name: 'عناية وتنظيف' },
            { id: 'electronics', name: 'إلكترونيات' }
        ]
    },
    {
        id: 'tires',
        name: 'إطارات',
        icon: 'CircleDot',
        subcategories: [
            { id: 'summer-tires', name: 'إطارات صيفية' },
            { id: 'winter-tires', name: 'إطارات شتوية' },
            { id: 'all-season-tires', name: 'إطارات جميع الفصول' }
        ]
    },
    {
        id: 'tools',
        name: 'عدد وأدوات',
        icon: 'Wrench',
        subcategories: [
            { id: 'hand-tools', name: 'أدوات يدوية' },
            { id: 'diagnostic-tools', name: 'أجهزة فحص' },
            { id: 'lifting-tools', name: 'أدوات رفع' }
        ]
    }
];

export const DEFAULT_PART_TYPES: PartType[] = [
    { id: 'pt1', name: 'المحرك', icon: 'Cog' },
    { id: 'pt2', name: 'الهيكل', icon: 'Car' },
    { id: 'pt3', name: 'الكهرباء', icon: 'Cpu' },
    { id: 'pt4', name: 'المقصورة الداخلية', icon: 'Armchair' },
    { id: 'pt5', name: 'العجلات والفرامل', icon: 'Disc' },
    { id: 'pt6', name: 'أخرى', icon: 'MoreHorizontal' },
];

export const DEFAULT_TECHNICIAN_SPECIALTIES: TechnicianSpecialty[] = [
    { id: 'mechanic', name: 'ميكانيكي', icon: 'Wrench' },
    { id: 'electrician', name: 'كهربجي', icon: 'Zap' },
    { id: 'body-repair-sowaj', name: 'صواج', icon: 'Hammer' },
    { id: 'body-repair-smkari', name: 'سمكري', icon: 'Eraser' },
    { id: 'car-painter', name: 'دهّان سيارات', icon: 'Paintbrush' },
    { id: 'dozan-brakes', name: 'دوزان (فرامل)', icon: 'Disc' },
    { id: 'dozan-alignment', name: 'دوزان ميزان', icon: 'ArrowLeftRight' },
    { id: 'tire-specialist', name: 'كومجي (دواليب)', icon: 'Circle' },
    { id: 'gearbox-specialist', name: 'قيرجي', icon: 'Settings2' },
    { id: 'engine-specialist', name: 'موتورجي', icon: 'Power' },
    { id: 'turbo-specialist', name: 'تيربو', icon: 'Wind' },
    { id: 'pump-specialist', name: 'طرمبات', icon: 'Droplet' },
    { id: 'injectors-specialist', name: 'رشاشات', icon: 'SprayCan' },
    { id: 'diagnostics', name: 'فحص كمبيوتر', icon: 'Laptop' },
    { id: 'garage-owner', name: 'كراجي', icon: 'Warehouse' },
    { id: 'ac-specialist', name: 'تكييف سيارات', icon: 'Snowflake' },
    { id: 'cooling-specialist', name: 'مبردات', icon: 'Thermometer' },
    { id: 'polishing', name: 'تلميع', icon: 'Sparkles' },
    { id: 'car-wash', name: 'تنظيف سيارات', icon: 'Waves' },
    { id: 'window-tinting', name: 'فيميه (تظليل)', icon: 'SunOff' },
    { id: 'upholstery', name: 'تنجيد سيارات', icon: 'Scissors' },
    { id: 'car-glass', name: 'زجاج سيارات', icon: 'Maximize' },
    { id: 'car-locks', name: 'أقفال سيارات', icon: 'Key' },
    { id: 'car-alarm', name: 'إنذار سيارات', icon: 'BellRing' },
    { id: 'car-audio', name: 'صوتيات سيارات', icon: 'Speaker' },
    { id: 'expert-inspection', name: 'أكسبير سيارات', icon: 'ClipboardCheck' },
];

export const DEFAULT_TOW_TRUCK_TYPES: TowTruckType[] = [
    { id: 'tt1', name: 'سطحة عادية', icon: 'towtruck' },
    { id: 'tt2', name: 'سطحة هيدروليك', icon: 'towtruck' },
    { id: 'tt3', name: 'رافعة (ونش)', icon: 'towtruck' },
    { id: 'tt4', name: 'أخرى', icon: 'MoreHorizontal' },
];

export const TOTAL_STEPS = 7;

export const DEFAULT_BRAND_MODELS: { [key: string]: string[] } = {
    'بي إم دبليو': ['الفئة الثالثة (3 Series)', 'الفئة الخامسة (5 Series)', 'الفئة السابعة (7 Series)', 'X1', 'X3', 'X5', 'X6', 'X7', 'M3', 'M4', 'M5'],
    'مرسيدس-بنز': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'G-Class', 'CLA'],
    'أودي': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
    'فولكس فاجن': ['جولف (Golf)', 'باسات (Passat)', 'تيغوان (Tiguan)', 'طوارق (Touareg)', 'بولو (Polo)', 'جيتا (Jetta)', 'أرتيون (Arteon)'],
    'أوبل': ['أسترا (Astra)', 'إنسيغنيا (Insignia)', 'كورسا (Corsa)', 'موكا (Mokka)', 'جراندلاند (Grandland)'],
    'بورش': ['كايين (Cayenne)', 'ماكان (Macan)', 'باناميرا (Panamera)', '911', 'تايكان (Taycan)'],
    'فورد': ['فوكاس (Focus)', 'فيوجن (Fusion)', 'إسكيب (Escape)', 'إكسبلورر (Explorer)', 'إكسبيدشن (Expedition)', 'تورس (Taurus)', 'F-150', 'موسيتنج (Mustang)', 'رينجر (Ranger)'],
    'شيفروليه': ['كروز (Cruze)', 'ماليبو (Malibu)', 'تاهو (Tahoe)', 'سوبربان (Suburban)', 'كامارو (Camaro)', 'كورفيت (Corvette)', 'سيلفرادو (Silverado)', 'إمبالا (Impala)', 'سبارك (Spark)'],
    'دودج': ['تشارجر (Charger)', 'تشالنجر (Challenger)', 'دورانجو (Durango)', 'رام (Ram)'],
    'جيب': ['جراند شيروكي (Grand Cherokee)', 'رانجلر (Wrangler)', 'كومباس (Compass)', 'رينيجيد (Renegade)', 'شيروكي (Cherokee)'],
    'كرايسلر': ['300', 'باسيفيكا (Pacifica)'],
    'جي إم سي': ['يوكون (Yukon)', 'سييرا (Sierra)', 'أكاديا (Acadia)', 'تيرين (Terrain)'],
    'كاديلاك': ['إسكاليد (Escalade)', 'CT4', 'CT5', 'XT4', 'XT5', 'XT6'],
    'هيونداي': ['إلنترا (Elantra)', 'سوناتا (Sonata)', 'أكسنت (Accent)', 'توسان (Tucson)', 'سنتافي (Santa Fe)', 'باليسيد (Palisade)', 'كريتا (Creta)', 'أزيرا (Azera)', 'فيرنا (Verna)', 'كونا (Kona)'],
    'كيا': ['سيراتو (Cerato)', 'أوبتيما/K5', 'سبورتاج (Sportage)', 'سورينتو (Sorento)', 'بيكانتو (Picanto)', 'ريو (Rio)', 'تيلورايد (Telluride)', 'سيلتوس (Seltos)', 'كادينزا/K8'],
    'جينيسيس': ['G70', 'G80', 'G90', 'GV70', 'GV80'],
    'سانج يونج': ['تيفولي (Tivoli)', 'ريكستون (Rexton)', 'كوراندو (Korando)'],
    'تويوتا': ['كورولا (Corolla)', 'كامري (Camry)', 'راف فور (RAV4)', 'لاند كروزر (Land Cruiser)', 'هايلكس (Hilux)', 'ياريس (Yaris)', 'برادو (Prado)', 'أفالون (Avalon)', 'فورتشنر (Fortuner)', 'هايلاندر (Highlander)'],
    'نيسان': ['صني (Sunny)', 'سنترا (Sentra)', 'ألتيما (Altima)', 'ماكسيما (Maxima)', 'باترول (Patrol)', 'إكس-تريل (X-Trail)', 'كيكس (Kicks)', 'باثفايندر (Pathfinder)', 'جوك (Juke)'],
    'هوندا': ['سيفيك (Civic)', 'أكورد (Accord)', 'سي آر-في (CR-V)', 'بايلوت (Pilot)', 'أوديسي (Odyssey)', 'سيتي (City)', 'إتش آر-في (HR-V)'],
    'مازدا': ['3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-9'],
    'سوبارو': ['إمبريزا (Impreza)', 'ليجاسي (Legacy)', 'فورستر (Forester)', 'أوتباك (Outback)', 'XV/Crosstrek'],
    'ميتسوبيشي': ['لانسر (Lancer)', 'باجيرو (Pajero)', 'أوتلاندر (Outlander)', 'إكليبس كروس (Eclipse Cross)', 'ASX', 'L200'],
    'لكزس': ['IS', 'ES', 'LS', 'NX', 'RX', 'GX', 'LX'],
    'إنفينيتي': ['Q50', 'Q60', 'QX50', 'QX60', 'QX80'],
    'سوزوكي': ['سويفت (Swift)', 'فيتارا (Vitara)', 'جيمني (Jimny)', 'ألتو (Alto)', 'بالينو (Baleno)'],
    'بيجو': ['206', '207', '208', '301', '307', '308', '407', '508', '2008', '3008', '5008', 'بارتنر (Partner)'],
    'رينو': ['كليو (Clio)', 'ميغان (Megane)', 'لوجان (Logan)', 'سانديرو (Sandero)', 'داستر (Duster)', 'سيمبول (Symbol)', 'كوليوس (Koleos)', 'كابتشر (Captur)', 'تويزي (Twizy)'],
    'سيتروين': ['C3', 'C4', 'C5', 'سي-إليزيه (C-Elysee)', 'بيرلينجو (Berlingo)', 'C5 Aircross'],
    'دي إس': ['DS 3', 'DS 4', 'DS 7'],
    'شيري': ['تيجو 2 (Tiggo 2)', 'تيجو 4 (Tiggo 4)', 'تيجو 7 (Tiggo 7)', 'تيجو 8 (Tiggo 8)', 'أريزو 3 (Arrizo 3)', 'أريزو 5 (Arrizo 5)', 'أريزو 6 (Arrizo 6)'],
    'جيلي': ['إمجراند 7 (Emgrand 7)', 'إمجراند X7', 'كولراي (Coolray)', 'توغيلا (Tugella)', 'أوكافانجو (Okavango)', 'مونجارو (Monjaro)'],
    'بي واي دي': ['F3', 'F6', 'Song', 'Tang', 'Han'],
    'إم جي': ['MG 3', 'MG 5', 'MG 6', 'MG ZS', 'MG RX5', 'MG HS', 'MG GT'],
    'هافال': ['H2', 'H6', 'H9', 'جوليون (Jolion)', 'دارجو (Dargo)'],
    'شانجان': ['إيدو (Eado)', 'ألسفين (Alsvin)', 'CS35', 'CS75', 'CS85', 'CS95', 'UNI-T', 'UNI-K'],
    'جريت وول': ['وينجل 5 (Wingle 5)', 'وينجل 7 (Wingle 7)', 'باور (Poer)'],
    'فيات': ['500', 'تيبو (Tipo)', 'باندا (Panda)', 'بونتو (Punto)', 'دوبلو (Doblo)', 'فيورينو (Fiorino)'],
    'ألفا روميو': ['جوليا (Giulia)', 'ستيلفيو (Stelvio)', 'جوليتا (Giulietta)'],
    'لاند روفر': ['رنج روفر (Range Rover)', 'سبورت (Sport)', 'فيلار (Velar)', 'إيفوك (Evoque)', 'ديفندر (Defender)', 'ديسكفري (Discovery)'],
    'جاغوار': ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace'],
    'ميني': ['كوبر (Cooper)', 'كانتري مان (Countryman)'],
    'فولفو': ['S60', 'S90', 'XC40', 'XC60', 'XC90', 'V60', 'V90'],
    'توفاش': ['شاهين (Şahin)', 'دوجان (Doğan)', 'كارتال (Kartal)']
};

const allBrandNames = [...new Set(DEFAULT_CAR_CATEGORIES.flatMap(c => c.brands))];
export const DEFAULT_ALL_BRANDS: Brand[] = allBrandNames.map((name, index) => ({
    id: `brand${index + 1}`,
    name: name,
}));

export const SYRIAN_CITIES: string[] = [
    'دمشق',
    'حلب',
    'حمص',
    'اللاذقية',
    'حماة',
    'طرطوس',
    'دير الزور',
    'الرقة',
    'إدلب',
    'السويداء',
    'درعا',
    'الحسكة',
    'القنيطرة',
    'أخرى',
];