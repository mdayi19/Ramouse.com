<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        // Blog Posts
        $blogPosts = [
            [
                'id' => Str::random(10),
                'slug' => 'car-maintenance-tips-summer',
                'title' => '10 نصائح فنية للعناية بالسيارة في الصيف',
                'summary' => 'حافظ على أداء سيارتك وكفاءتها خلال أشهر الصيف الحارة مع هذه النصائح الأساسية.',
                'content' => 'حرارة الصيف قد تكون قاسية على سيارتك. إليك 10 نصائح أساسية لصيانة سيارتك والحفاظ على سلاسة عملها خلال الأشهر الحارة: 1. فحص مستويات سائل التبريد، 2. فحص نظام التكييف، 3. مراقبة ضغط الإطارات...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=صيانة+السيارة',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(10),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'understanding-warning-lights',
                'title' => 'فهم معاني لمبات الطبلون في سيارتك',
                'summary' => 'تعرف على معنى كل ضوء تحذيري في لوحة القيادة ومتى يجب عليك اتخاذ إجراء فورى.',
                'content' => 'يمكن أن تكون أضواء لوحة القيادة محيرة. تعرف على معنى كل ضوء ومتى يجب عليك اتخاذ إجراء فوري. من ضوء فحص المحرك إلى تحذيرات ضغط الزيت، نغطيها جميعاً...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=لمبات+الطبلون',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(8),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'choosing-right-motor-oil',
                'title' => 'كيفية اختيار زيت المحرك المناسب لسيارتك',
                'summary' => 'فهم تصنيفات اللزوجة والاختيار بين الزيوت الاصطناعية والتقليدية.',
                'content' => 'اختيار زيت المحرك المناسب أمر حيوي لصحة محرك سيارتك. تعرف على تصنيفات اللزوجة، والزيت الاصطناعي مقابل التقليدي، وما توصي به الشركة المصنعة لسيارتك...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=زيت+المحرك',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(15),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'brake-inspections-importance',
                'title' => 'أهمية الفحص الدوري لنظام الفرامل',
                'summary' => 'يمكن للفحص الدوري للفرامل أن يمنع الحوادث والإصلاحات المكلفة.',
                'content' => 'الفرامل هي أهم ميزة أمان في سيارتك. يمكن أن يمنع الفحص الدوري الحوادث والإصلاحات المكلفة. إليك ما تحتاج لمعرفته حول صيانة الفرامل...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=نظام+الفرامل',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(5),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'electric-vehicle-maintenance',
                'title' => 'السيارات الكهربائية: دليل الصيانة الشامل',
                'summary' => 'تعرف على العناية بالبطارية، والفرملة التجديدية، والصيانة الخاصة بالسيارات الكهربائية.',
                'content' => 'تتطلب السيارات الكهربائية صيانة مختلفة عن السيارات التقليدية. تعرف على العناية بالبطارية، والفرملة التجديدية، واحتياجات الصيانة الأخرى الخاصة بالمركبات الكهربائية...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=صيانة+EV',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(3),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-spare-parts-original-vs-copy',
                'title' => 'كيف تميز بين قطع السيارات الأصلية والتجارية',
                'summary' => 'دليل عملي لمعرفة الفرق بين القطع الأصلية والمقلدة.',
                'content' => 'يعاني الكثير من الغش في قطع السيارات. القطع الأصلية تتميز بجودة التصنيع والعمر الطويل، بينما التجارية أقل سعراً وأقصر عمراً...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=قطع+أصلية',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(36),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'engine-oil-change-interval',
                'title' => 'متى يجب تغيير زيت المحرك؟',
                'summary' => 'الفترة الصحيحة لتغيير الزيت حسب نوع السيارة.',
                'content' => 'تغيير زيت المحرك في الوقت المناسب يحميه من التلف. في الظروف المحلية يفضل تغييره كل 5,000 إلى 7,000 كم...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=تغيير+زيت',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(37),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'brake-pads-when-to-change',
                'title' => 'متى يجب تغيير فحمات الفرامل؟',
                'summary' => 'علامات تدل على ضرورة تبديل فحمات الفرامل.',
                'content' => 'من أهم العلامات: صوت الصفير، ضعف الفرملة، واهتزاز الدواسة...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=فحمات+الفرامل',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(38),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-battery-types',
                'title' => 'أنواع بطاريات السيارات وأيها أفضل',
                'summary' => 'مقارنة بين البطاريات الجافة والعادية.',
                'content' => 'تختلف بطاريات السيارات من حيث العمر والسعر. البطارية الجافة تدوم أطول لكنها أغلى...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=بطارية',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(39),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-filters-importance',
                'title' => 'أهمية فلاتر السيارة ومتى يتم تغييرها',
                'summary' => 'فلتر الهواء والزيت والبنزين.',
                'content' => 'تلعب الفلاتر دوراً أساسياً في حماية المحرك. إهمالها يؤدي إلى ضعف الأداء وزيادة الاستهلاك...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=فلاتر+السيارة',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(40),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'clutch-problems-signs',
                'title' => 'علامات تلف الدبرياج في السيارة',
                'summary' => 'متى تعرف أن الدبرياج بحاجة تبديل؟',
                'content' => 'من أبرز العلامات: صعوبة تبديل السرعات، رائحة احتراق، وضعف التسارع...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=الدبرياج',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(41),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'gearbox-oil-change',
                'title' => 'زيت القير: متى يغير ولماذا',
                'summary' => 'أهمية زيت ناقل الحركة.',
                'content' => 'إهمال تغيير زيت القير يسبب أعطال مكلفة. يفضل تغييره حسب توصية الشركة...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=زيت+القير',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(42),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'shock-absorbers-failure',
                'title' => 'متى تحتاج لتغيير المساعدات (النوابض)',
                'summary' => 'تأثير المساعدات التالفة على القيادة.',
                'content' => 'المساعدات التالفة تسبب اهتزاز السيارة وعدم ثباتها على الطريق...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=مساعدات',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(43),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'spark-plugs-function',
                'title' => 'البواجي: وظيفتها ومتى يتم تغييرها',
                'summary' => 'أثر البواجي على تشغيل السيارة.',
                'content' => 'البواجي الجيدة تحسن التشغيل وتقلل استهلاك الوقود...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=بواجي',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(44),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'radiator-water-vs-coolant',
                'title' => 'ماء الرديتر أم سائل التبريد؟',
                'summary' => 'الفرق وأيهما أفضل للمحرك.',
                'content' => 'استخدام سائل التبريد أفضل من الماء العادي لأنه يحمي من الصدأ وارتفاع الحرارة...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=رديتر',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(45),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-alternator-problems',
                'title' => 'أعطال الدينامو وكيفية اكتشافها',
                'summary' => 'علامات تلف دينامو السيارة وتأثيره على البطارية.',
                'content' => 'الدينامو مسؤول عن شحن البطارية. من علامات عطله ضعف الإضاءة، نفاد البطارية، أو صدور أصوات غير طبيعية...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=دينامو',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(46),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'fuel-pump-failure-signs',
                'title' => 'علامات تلف مضخة الوقود (طرمبة البنزين)',
                'summary' => 'كيف تعرف أن طرمبة البنزين بحاجة تبديل.',
                'content' => 'ضعف العزم، تقطيع المحرك، وصعوبة التشغيل من أبرز علامات تلف مضخة الوقود...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=طرمبة+بنزين',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(47),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'timing-belt-change',
                'title' => 'متى يجب تغيير سير التايمن',
                'summary' => 'أهمية سير التايمن وخطورة إهماله.',
                'content' => 'قطع سير التايمن يؤدي إلى تلف المحرك. غالباً يتم تغييره كل 60–100 ألف كم حسب السيارة...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=سير+تايمن',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(48),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-sensors-common-failures',
                'title' => 'حساسات السيارة الشائعة وأعطالها',
                'summary' => 'تعرف على أكثر الحساسات عرضة للتلف.',
                'content' => 'حساس الأكسجين، حساس الحرارة، وحساس الكرنك من أكثر الحساسات التي تسبب مشاكل عند تلفها...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=حساسات',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(49),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-electrical-wiring-problems',
                'title' => 'مشاكل كهرباء السيارة وأسبابها',
                'summary' => 'أشهر أعطال الأسلاك والفيوزات.',
                'content' => 'ضعف التوصيلات أو احتراق الفيوزات يسبب توقف أنظمة كثيرة في السيارة...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=كهرباء+السيارة',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(50),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-steering-wheel-vibration',
                'title' => 'اهتزاز المقود أثناء القيادة',
                'summary' => 'أسباب رجّة الدركسيون.',
                'content' => 'غالباً يكون السبب ميزان الإطارات أو تلف المقصات والمفاصل...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=دركسيون',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(51),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-exhaust-system-problems',
                'title' => 'أعطال نظام العادم في السيارة',
                'summary' => 'متى يكون صوت العادم مؤشراً لمشكلة.',
                'content' => 'تلف الشكمان أو انسداده يؤثر على أداء المحرك واستهلاك الوقود...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=العادم',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(52),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'power-steering-problems',
                'title' => 'مشاكل الباور ستيرينغ في السيارة',
                'summary' => 'ثقل المقود وأسبابه.',
                'content' => 'نقص زيت الباور أو تلف المضخة يؤدي إلى صعوبة في توجيه السيارة...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=باور',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(53),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-ac-gas-refill',
                'title' => 'متى يحتاج مكيف السيارة لتعبئة غاز',
                'summary' => 'علامات نقص غاز المكيف.',
                'content' => 'ضعف التبريد أو خروج هواء دافئ دليل على نقص غاز المكيف...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=غاز+المكيف',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(54),
            ],
            [
                'id' => Str::random(10),
                'slug' => 'car-body-parts-replacement',
                'title' => 'متى يجب تغيير قطع الهيكل الخارجية',
                'summary' => 'الصدام، الرفرف، والغطاء الأمامي.',
                'content' => 'تلف قطع الهيكل لا يؤثر فقط على الشكل بل على السلامة أيضاً...',
                'imageUrl' => 'https://placehold.co/800x400/png?text=هيكل+السيارة',
                'author' => 'فريق راموسة',
                'published_at' => now()->subDays(55),
            ],
        ];

        foreach ($blogPosts as $post) {
            DB::table('blog_posts')->updateOrInsert(
                ['slug' => $post['slug']],
                array_merge($post, [
                    'id' => DB::table('blog_posts')->where('slug', $post['slug'])->value('id') ?? Str::random(10),
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        // FAQ Items
        $faqs = [
            [
                'id' => Str::random(10),
                'question' => 'كيف يمكنني طلب قطع غيار السيارات؟',
                'answer' => 'يمكنك تصفح متجرنا، وإضافة العناصر إلى سلة التسوق الخاصة بك، وإتمام الشراء. نحن نقبل الدفع عند الاستلام والدفع عبر الإنترنت.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'ما هي طرق الدفع التي تقبلونها؟',
                'answer' => 'نحن نقبل الدفع عند الاستلام، وبطاقات الائتمان/الخصم، ومدفوعات المحفظة من خلال تطبيقنا.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'كم من الوقت يستغرق الشحن؟',
                'answer' => 'يستغرق الشحن القياسي من 2 إلى 5 أيام عمل حسب موقعك. يتوفر الشحن السريع للطلبات العاجلة.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'هل يمكنني إرجاع منتج إذا لم يناسب سيارتي؟',
                'answer' => 'نعم، لدينا سياسة إرجاع لمدة 14 يوماً للعناصر غير المستخدمة في تغليفها الأصلي. اتصل بفريق الدعم لدينا لبدء عملية الإرجاع.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'كيف أجد فنياً بالقرب مني؟',
                'answer' => 'استخدم ميزة "البحث عن فني" في التطبيق. يمكنك التصفية حسب التخصص والموقع والتقييمات للعثور على الفني المناسب لاحتياجاتك.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'هل الفنيون موثقون؟',
                'answer' => 'نعم، يخضع جميع الفنيين على منصتنا لعملية توثيق. ابحث عن شارة التوثيق في ملفاتهم الشخصية.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'ما هو عرض الفلاش (Sale)؟',
                'answer' => 'عروض الفلاش هي عروض محدودة الوقت على منتجات مختارة بخصومات خاصة. لديها مخزون محدود وتنتهي بعد الفترة الزمنية المحددة.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'هل يمكنني تتبع طلبي؟',
                'answer' => 'نعم، يمكنك تتبع حالة طلبك في الوقت الفعلي من خلال التطبيق أو عن طريق تسجيل الدخول إلى حسابك على موقعنا.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'هل تقدمون ضمانات على القطع؟',
                'answer' => 'تأتي معظم القطع مع ضمانات من الشركة المصنعة. يتم تحديد تفاصيل الضمان في صفحة كل منتج.',
            ],
            [
                'id' => Str::random(10),
                'question' => 'كيف أصبح مزود خدمة في راموسة؟',
                'answer' => 'يمكنك التقديم من خلال صفحة "كن مزود خدمة". املأ نموذج الطلب وسيقوم فريقنا بمراجعة طلبك.',
            ],
        ];

        foreach ($faqs as $faq) {
            DB::table('faq_items')->updateOrInsert(
                ['id' => $faq['id']],
                array_merge($faq, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        // Announcements
        $announcements = [
            [
                'id' => Str::random(10),
                'title' => 'عرض فلاش جديد: فحمات فرامل ممتازة',
                'message' => 'احصل على خصم 30% على فحمات فرامل بريمبو! الكمية محدودة. ينتهي العرض خلال 5 أيام.',
                'target' => 'all',
                'image_url' => null,
            ],
            [
                'id' => Str::random(10),
                'title' => 'تنبيه صيانة النظام',
                'message' => 'ستخضع منصتنا لصيانة دورية يوم الجمعة من الساعة 2 صباحاً حتى 4 صباحاً. قد تكون الخدمات غير متوفرة مؤقتاً.',
                'target' => 'all',
                'image_url' => null,
            ],
            [
                'id' => Str::random(10),
                'title' => 'ميزة جديدة: دعم الدردشة المباشرة',
                'message' => 'لقد أضفنا دعم الدردشة المباشرة! احصل على مساعدة فورية من فريق خدمة العملاء لدينا.',
                'target' => 'all',
                'image_url' => null,
            ],
            [
                'id' => Str::random(10),
                'title' => 'عرض الصيف للفنيين',
                'message' => 'خصم خاص على أدوات التشخيص والمعدات المهنية. تحقق من المتجر لمزيد من التفاصيل!',
                'target' => 'technicians',
                'image_url' => null,
            ],
        ];

        foreach ($announcements as $announcement) {
            DB::table('announcements')->updateOrInsert(
                ['id' => $announcement['id']],
                array_merge($announcement, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
