# قرارات معمارية - CarProvider Feature

## 1. أسئلة معمارية (Architecture)

### ✅ is_verified vs is_active

**القرار المقترح بناءً على النمط الحالي:**

- **`is_verified`** = شرط دخول (must be true to login)
  - يستخدم حالياً في `Technician` و `TowTruck`
  - في `AuthController::login()` → يمنع الدخول إذا `!is_verified`
  - **الغرض**: تحقق إداري من بيانات المزود (رخصة، هوية، إلخ)

- **`is_active`** = تعطيل مؤقت للحساب
  - يمكن للإدارة تعطيل المزود دون حذف البيانات
  - يمنع الدخول حتى لو كان verified

**التوصية للـ CarProvider:**
```
is_verified = false (افتراضياً)
→ يجب أن يقوم الأدمن بالتحقق من:
  - business_license (إن وجدت)
  - الهوية أو السجل التجاري
  - صحة البيانات
→ بعد الموافقة: is_verified = true
```

### ❓ هل نخطط لدعم أكثر من رقم هاتف؟

**السؤال للمستخدم:** هل معرض السيارات قد يحتاج أكثر من رقم للتواصل؟

**الخيارات:**
1. **رقم واحد فقط** (النمط الحالي) - بسيط
2. **أرقام متعددة** - نضيف جدول `car_provider_phones`

---

## 2. أسئلة قاعدة البيانات (Database)

### ⚠️ استخدام Phone كـ Primary Key

**الوضع الحالي في Ramouse:**
- `Technician`, `TowTruck`, `Provider` → كلهم يستخدمون `phone` كـ PK
- **المشكلة**: إذا غير المزود رقمه → صعوبة في التحديث

**التوصية:**
```sql
-- الأفضل للـ CarProvider:
id BIGINT AUTO_INCREMENT PRIMARY KEY  -- رقم داخلي
phone VARCHAR(20) UNIQUE NOT NULL      -- فريد لكن ليس PK
```

**الفوائد:**
- سهولة تغيير الرقم
- Foreign Keys أسهل
- توافق أفضل مع الأنظمة الخارجية

**لكن:** نحافظ على النمط الحالي (phone PK) للتوافق مع باقي الكود ✅

### ✅ Indexes المطلوبة

**يجب إضافة:**
```sql
-- car_listings table
INDEX idx_listing_type (listing_type)
INDEX idx_category (car_category_id)
INDEX idx_price (price)
INDEX idx_sponsored (is_sponsored, sponsored_until)
INDEX idx_available (is_available)
INDEX idx_created (created_at)
SPATIAL INDEX idx_location (location)  -- مهم جداً!

-- car_listing_analytics table
INDEX idx_listing_event (car_listing_id, event_type, created_at)
INDEX idx_user_tracking (user_ip, created_at)
```

### ⚠️ حجم جدول Analytics

**التقدير:**
- 1000 إعلان × 100 مشاهدة/يوم = 100,000 سجل/يوم
- بعد 6 أشهر = ~18 مليون سجل
- الحجم التقريبي: 2-3 GB

**الحلول:**
1. **Partitioning** حسب التاريخ
2. **Archiving** - نقل البيانات القديمة (> 6 أشهر)
3. **Aggregation** - جدول ملخص يومي
4. **TTL** - حذف تلقائي بعد سنة

**التوصية:**
```sql
-- نضيف migration لاحقاً للـ partitioning:
CREATE TABLE car_listing_analytics (...)
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    ...
);
```

---

## 3. أسئلة Listings & Data Integrity

### contact_phone في الإعلان

**القرار:**
- إذا `contact_phone` موجود → استخدمه
- إذا فارغ → استخدم `car_provider.id` (رقم المزود)
- **السبب**: بعض المعارض لديها أرقام مخصصة لكل قسم

### license_plate (رقم اللوحة)

**القرار: ليس فريداً (NOT UNIQUE)**
- **السبب**: 
  - نفس السيارة قد تُعلن من أكثر من مزود (وكيل، معرض)
  - بعض السيارات الجديدة قد لا يكون لها لوحة بعد
  - nullable field

### chassis_number (VIN)

**القرار:**
```sql
chassis_number VARCHAR(17) NULLABLE
```

**Validation في Backend:**
```php
'chassis_number' => 'nullable|string|size:17|regex:/^[A-HJ-NPR-Z0-9]{17}$/'
```

**لا نجعله UNIQUE** لنفس سبب license_plate

### الصور

**القرارات:**
```php
// في Controller validation:
'photos' => 'required|array|min:1|max:15',  // 1-15 صورة
'photos.*' => 'string',  // base64 or URL
'photos.*.size' => 'max:5242880',  // 5MB per image
```

**حجم Base64:**
- نحدد `max:5MB` لكل صورة
- نضغط الصور تلقائياً إلى 1920×1080
- نزيل EXIF metadata

### Draft vs Publish

**القرار: مباشرة Publish**
- `is_available = true` افتراضياً
- لا حاجة لـ draft status
- المزود يستطيع تعطيل الإعلان بـ `toggleAvailability()`

---

## 4. أسئلة body_condition

### البنية المقترحة

**JSON Schema:**
```json
{
  "front_bumper": "pristine",
  "rear_bumper": "scratched",
  "hood": "painted",
  "roof": "pristine",
  "front_left_door": "dented",
  "front_right_door": "replaced",
  "rear_left_door": "pristine",
  "rear_right_door": "pristine",
  "front_left_fender": "pristine",
  "front_right_fender": "scratched",
  "rear_left_fender": "pristine",
  "rear_right_fender": "pristine"
}
```

**القيم الثابتة (Enum - Strict Validation):**
```typescript
type BodyPartCondition = 
  | 'pristine'    // سليمة ✅
  | 'scratched'   // خدوش ⚠️
  | 'painted'     // مدهونة 🎨
  | 'replaced'    // مستبدلة ♻️
  | 'damaged';    // تالفة/مكسورة ❌
```

**⚠️ تجنب الفوضى النصية:**
```php
// Backend Validation - يرفض أي قيمة غير صحيحة
'body_condition' => [
    'nullable',
    'array',
    function ($attribute, $value, $fail) {
        $allowedConditions = ['pristine', 'scratched', 'painted', 'replaced', 'damaged'];
        $allowedParts = [
            'front_bumper', 'rear_bumper', 'hood', 'roof', 'trunk',
            'front_left_door', 'front_right_door',
            'rear_left_door', 'rear_right_door',
            'front_left_fender', 'front_right_fender',
            'rear_left_fender', 'rear_right_fender'
        ];
        
        foreach ($value as $part => $condition) {
            if (!in_array($part, $allowedParts)) {
                $fail("Invalid car part: {$part}");
            }
            if (!in_array($condition, $allowedConditions)) {
                $fail("Invalid condition value for {$part}: {$condition}");
            }
        }
    }
]
```

**Frontend - Dropdown محدود:**
```tsx
const CONDITION_OPTIONS = [
  { value: 'pristine', label: 'سليمة ✅', color: 'green' },
  { value: 'scratched', label: 'خدوش ⚠️', color: 'yellow' },
  { value: 'painted', label: 'مدهونة 🎨', color: 'blue' },
  { value: 'replaced', label: 'مستبدلة ♻️', color: 'purple' },
  { value: 'damaged', label: 'تالفة ❌', color: 'red' }
];

// User يختار من القائمة فقط - لا كتابة حرة
<Select options={CONDITION_OPTIONS} />
```

**أجزاء السيارة الثابتة:**
```typescript
const CAR_PARTS = [
  'front_bumper', 'rear_bumper', 'hood', 'roof', 'trunk',
  'front_left_door', 'front_right_door',
  'rear_left_door', 'rear_right_door',
  'front_left_fender', 'front_right_fender',
  'rear_left_fender', 'rear_right_fender',
  'front_left_quarter_panel', 'front_right_quarter_panel',
  'rear_left_quarter_panel', 'rear_right_quarter_panel'
];
```

**استخدام في البحث:**
- نضيف filter: "سيارات بدون أضرار" → WHERE body_condition IS NULL OR all values = 'pristine'
- لاحقاً: بحث متقدم حسب الجزء

---

## 5. أسئلة Analytics

### تسجيل المشاهدات

**القرار:**
```php
// منع التكرار من نفس IP خلال 30 دقيقة
if (RecentView::where('car_listing_id', $id)
    ->where('user_ip', $ip)
    ->where('created_at', '>', now()->subMinutes(30))
    ->exists()) {
    // لا تسجل مرة أخرى
    return;
}

// سجل المشاهدة
CarListingAnalytics::create([
    'car_listing_id' => $id,
    'event_type' => 'view',
    'user_ip' => $ip,
    'user_id' => auth()->id(),
]);

// زد العداد في car_listings
$listing->increment('views_count');
```

### الأحداث المدعومة

**كل الأحداث:**
- `view` - مشاهدة الصفحة
- `contact_phone` - ضغط على زر الاتصال
- `contact_whatsapp` - ضغط على واتساب
- `favorite` - إضافة للمفضلة
- `share` - مشاركة الإعلان

### التقارير المخزنة (Caching)

**نعم، نستخدم:**
```php
// جدول ملخص يومي
CREATE TABLE car_listing_daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    car_listing_id BIGINT,
    date DATE,
    total_views INT,
    unique_visitors INT,
    contact_clicks INT,
    favorites INT,
    shares INT,
    KEY idx_listing_date (car_listing_id, date)
);

// Cron job يومي لتحديث الملخص
```

### الأداء

**مع آلاف المشاهدات:**
- Indexes محسّنة ✅
- Caching للتقارير ✅
- Queue للتحليلات الثقيلة ✅
- CDN للصور ✅

---

## 6. أسئلة Sponsored Listings

### الترتيب

**القرار:**
```sql
ORDER BY 
  is_sponsored DESC,           -- الممولة أولاً
  RAND(DATE(NOW()))            -- عشوائي يومياً للممولة
  created_at DESC              -- الأحدث للعادية
```

### أكثر من إعلان ممول

**نعم مسموح** - كل إعلان له sponsored_until خاص

### انتهاء الرعاية

**تلقائي:**
```php
// في scope:
public function scopeSponsored($query) {
    return $query->where('is_sponsored', true)
                 ->where('sponsored_until', '>', now());
}

// Cron job يومي:
CarListing::where('is_sponsored', true)
    ->where('sponsored_until', '<=', now())
    ->update(['is_sponsored' => false]);
```

### سجل تاريخي

**نضيف جدول:**
```sql
CREATE TABLE car_listing_sponsorship_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    car_listing_id BIGINT,
    sponsored_from DATETIME,
    sponsored_until DATETIME,
    sponsored_by_admin_id BIGINT,
    price DECIMAL(10,2),
    created_at TIMESTAMP
);
```

---

## 7. أسئلة Frontend & UX

### شارة الإعلان الممول

**نعم، واضحة:**
```tsx
{listing.is_sponsored && (
  <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 
                  text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg
                  flex items-center gap-1">
    <StarIcon /> اعلان ممول
  </div>
)}
```

### الفرق البصري

- **الممولة**: حدود ذهبية، صورة أكبر، في carousel أعلى الصفحة
- **العادية**: عرض grid عادي

### طول النموذج

**حل:**
- Multi-step form (5 خطوات)
- Progress bar
- Auto-save draft
- إمكانية Skip للحقول الاختيارية

### Presets لحالة الهيكل

**نعم:**
```typescript
const BODY_CONDITION_PRESETS = {
  excellent: { /* all pristine */ },
  good: { /* minor scratches */ },
  fair: { /* some dents */ },
  needs_work: { /* multiple issues */ }
};
```

### البحث العربي/الإنجليزي

**نعم:**
```sql
WHERE (
  title LIKE '%keyword%'
  OR brand LIKE '%keyword%'
  OR model LIKE '%keyword%'
  OR description LIKE '%keyword%'
)
```

**نستخدم:** Full-Text Search لاحقاً

### سرعة تحميل الصور

**الحل:**
- Lazy loading
- Thumbnail + Full size
- CDN
- WebP format
- Progressive loading

---

## 8. أسئلة الأمان والجودة

### حجم الصور

**نعم محدود:**
```php
'photos.*' => [
    'required',
    'string',
    function ($attribute, $value, $fail) {
        // Check base64 size (max 5MB)
        if (strlen($value) > 7000000) { // ~5MB base64
            $fail('الصورة كبيرة جداً');
        }
    }
]
```

### تنظيف Metadata

**نعم:**
```php
use Intervention\Image\Facades\Image;

$image = Image::make($base64Data);
$image->resize(1920, 1080, function ($constraint) {
    $constraint->aspectRatio();
    $constraint->upsize();
});
$image->strip(); // Remove EXIF data
```

### الصلاحيات

**نعم، محمية:**
```php
// في CarListingController:
public function update(Request $request, $id) {
    $listing = CarListing::findOrFail($id);
    
    // التحقق من الملكية
    if ($listing->car_provider_id !== auth()->id()) {
        return response()->json(['error' => 'غير مصرح'], 403);
    }
    
    // ...
}
```

**Middleware إضافي:**
```php
Route::put('/listings/{id}', [...])->middleware('owns:car_listing');
```

---

## ملخص القرارات الرئيسية

| الموضوع | القرار |
|---------|--------|
| is_verified | شرط دخول (false افتراضياً) |
| PK | phone (للتوافق مع النمط الحالي) |
| Indexes | نعم - spatial, price, category, sponsored |
| Analytics archiving | partitioning + caching |
| license_plate unique | لا |
| VIN validation | نعم (17 حرف) |
| الصور | 1-15 صورة، max 5MB |
| body_condition | JSON schema ثابت |
| Analytics deduplication | 30 دقيقة من نفس IP |
| Sponsored order | random daily للممولة |
| Image optimization | نعم - resize + strip EXIF |
| Authorization | owner-only edits |

---

## الأسئلة المتبقية للمستخدم

1. **هل نحتاج أكثر من رقم هاتف للمزود الواحد؟** ✅ نعم (تم إضافة car_provider_phones)
2. **هل نغير PK من phone إلى id (breaking change)؟** ✅ لا، نحافظ على phone
3. **كم المدة المثالية لحفظ analytics قبل الأرشفة؟** ✅ 6 أشهر
4. **هل نريد verify تلقائي لبعض المزودين الموثوقين؟** ✅ نعم (is_trusted)
5. **هل نسمح بتعديل الإعلان بعد النشر أم create new؟** ✅ تعديل مسموح

---

## 9. أسئلة إضافية حرجة

### حذف الإعلان (Delete Behavior)

**القرار: Soft Delete**

```sql
-- نضيف حقل deleted_at في migration
ALTER TABLE car_listings ADD COLUMN deleted_at TIMESTAMP NULL;
```

**الأسباب:**
- ✅ الاحتفاظ بالسجل التاريخي والتحليلات
- ✅ إمكانية استرجاع الإعلان إذا حذف بالخطأ
- ✅ الاحتفاظ بالروابط في analytics/favorites

**Implementation:**
```php
// في Model
use Illuminate\Database\Eloquent\SoftDeletes;

class CarListing extends Model {
    use SoftDeletes;
}

// في Controller
public function destroy($id) {
    $listing = CarListing::findOrFail($id);
    // Soft delete
    $listing->delete(); // sets deleted_at
}

// استرجاع للأدمن
public function restore($id) {
    CarListing::withTrashed()->findOrFail($id)->restore();
}
```

---

### is_available Behavior

**القرار: يؤثر على البحث والتفاصيل**

```php
// في البحث - لا يظهر
public function index() {
    return CarListing::where('is_available', true)
                     ->whereNull('deleted_at')
                     ->get();
}

// في التفاصيل - يظهر لكن بـ warning
public function show($id) {
    $listing = CarListing::findOrFail($id);
    
    if (!$listing->is_available) {
        return response()->json([
            'listing' => $listing,
            'warning' => 'هذا الإعلان غير متاح حالياً'
        ]);
    }
    
    return response()->json(['listing' => $listing]);
}
```

**Frontend:**
```tsx
{!listing.is_available && (
  <div className="bg-yellow-50 border-yellow-500 p-4">
    ⚠️ هذا الإعلان غير متاح للبيع/الإيجار حالياً
  </div>
)}
```

---

### Sponsored Listings Filtering

**القرار: تلتزم بالفلاتر**

```php
public function index(Request $request) {
    $query = CarListing::query()
        ->where('is_available', true);
    
    // تطبيق الفلاتر (category, brand, price, etc.)
    if ($request->car_category_id) {
        $query->where('car_category_id', $request->car_category_id);
    }
    
    if ($request->max_price) {
        $query->where('price', '<=', $request->max_price);
    }
    
    // الترتيب: الممولة أولاً ضمن النتائج المفلترة
    $query->orderByRaw('
        CASE 
            WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 0
            ELSE 1
        END
    ')
    ->orderBy('created_at', 'DESC');
    
    return $query->paginate(20);
}
```

**السبب:** المستخدم يفلتر لسبب (مثلاً Toyota فقط) - الممولة يجب أن تكون Toyota أيضاً

---

### انتهاء sponsored_until

**القرار: Auto-expire بـ Cron Job**

```php
// Cron Job يومي (Laravel Scheduler)
// في app/Console/Kernel.php

protected function schedule(Schedule $schedule)
{
    // كل يوم الساعة 00:01
    $schedule->call(function () {
        CarListing::where('is_sponsored', true)
                  ->where('sponsored_until', '<=', now())
                  ->update([
                      'is_sponsored' => false,
                      'sponsored_until' => null
                  ]);
        
        Log::info('Expired sponsored listings updated');
    })->dailyAt('00:01');
}
```

**Alternative:** Query-time check (أبطأ لكن أدق)
```php
public function scopeActivelySponsored($query) {
    return $query->where('is_sponsored', true)
                 ->where('sponsored_until', '>', now());
}
```

---

### تسجيل المشاهدات (View Tracking)

**القرار: سطر واحد لكل view مع deduplication + Queue للعداد**

```php
public function trackView(Request $request, $listingId) {
    $ip = $request->ip();
    $userId = auth()->id();
    
    // تحقق: هل شاهد من نفس IP خلال 30 دقيقة؟
    $recentView = CarListingAnalytics::where('car_listing_id', $listingId)
        ->where('event_type', 'view')
        ->where('user_ip', $ip)
        ->where('created_at', '>', now()->subMinutes(30))
        ->exists();
    
    if ($recentView) {
        return; // لا تسجل
    }
    
    // سجل المشاهدة (في analytics)
    CarListingAnalytics::create([
        'car_listing_id' => $listingId,
        'event_type' => 'view',
        'user_ip' => $ip,
        'user_id' => $userId,
    ]);
    
    // ✅ زد العداد في Queue (async - لا يبطئ الـ response)
    IncrementViewsCountJob::dispatch($listingId);
}
```

**Queue Job:**
```php
// app/Jobs/IncrementViewsCountJob.php
namespace App\Jobs;

use App\Models\CarListing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class IncrementViewsCountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $listingId;
    
    public function __construct($listingId)
    {
        $this->listingId = $listingId;
    }
    
    public function handle()
    {
        // يتم تنفيذها async بدون تأخير للمستخدم
        CarListing::where('id', $this->listingId)
            ->increment('views_count');
    }
}
```

**الفوائد:**
- ✅ **views_count** سريع (cached counter) - async update
- ✅ **analytics** تفصيلية لتحليل الترند (real-time insert)
- ✅ **deduplication** تمنع التضخم
- ✅ **Queue** يقلل الضغط على DB ويسرع الـ response
- ✅ **Batch updates** ممكن لاحقاً (كل 10 views مرة واحدة)

**Alternative - Batch Updates (أفضل للنطاق الكبير):**
```php
// تجميع التحديثات كل دقيقة بدلاً من كل view
class BatchIncrementViewsJob implements ShouldQueue
{
    public function handle()
    {
        // جمع كل الـ views من آخر دقيقة
        $views = Cache::pull('pending_views', []);
        
        foreach ($views as $listingId => $count) {
            CarListing::where('id', $listingId)
                ->increment('views_count', $count);
        }
    }
}

// في trackView:
$pendingViews = Cache::get('pending_views', []);
$pendingViews[$listingId] = ($pendingViews[$listingId] ?? 0) + 1;
Cache::put('pending_views', $pendingViews, 60);
```

---

### نقل البيانات إلى daily_stats

**القرار: Cron Job يومي**

```php
// في Kernel.php
protected function schedule(Schedule $schedule)
{
    // كل يوم الساعة 02:00
    $schedule->call(function () {
        $yesterday = now()->subDay()->toDateString();
        
        // جمع إحصائيات الأمس لكل إعلان
        $listings = CarListing::all();
        
        foreach ($listings as $listing) {
            $stats = CarListingAnalytics::where('car_listing_id', $listing->id)
                ->whereDate('created_at', $yesterday)
                ->selectRaw('
                    COUNT(CASE WHEN event_type = "view" THEN 1 END) as total_views,
                    COUNT(DISTINCT user_ip) as unique_visitors,
                    COUNT(CASE WHEN event_type = "contact_phone" THEN 1 END) as phone_clicks,
                    COUNT(CASE WHEN event_type = "contact_whatsapp" THEN 1 END) as whatsapp_clicks,
                    COUNT(CASE WHEN event_type = "favorite" THEN 1 END) as favorites,
                    COUNT(CASE WHEN event_type = "share" THEN 1 END) as shares
                ')
                ->first();
            
            CarListingDailyStats::updateOrCreate(
                [
                    'car_listing_id' => $listing->id,
                    'date' => $yesterday
                ],
                [
                    'total_views' => $stats->total_views,
                    'unique_visitors' => $stats->unique_visitors,
                    'contact_phone_clicks' => $stats->phone_clicks,
                    'contact_whatsapp_clicks' => $stats->whatsapp_clicks,
                    'favorites' => $stats->favorites,
                    'shares' => $stats->shares,
                ]
            );
        }
        
        Log::info("Daily stats aggregated for {$yesterday}");
    })->dailyAt('02:00');
}
```

---

### أرشفة Analytics

**القرار: شبه تلقائية (Cron + ملف حذف يدوي)**

```php
// Artisan Command
// php artisan analytics:archive-old

namespace App\Console\Commands;

class ArchiveOldAnalytics extends Command
{
    protected $signature = 'analytics:archive-old {--months=6}';
    
    public function handle()
    {
        $cutoffDate = now()->subMonths($this->option('months'));
        
        $count = CarListingAnalytics::where('created_at', '<', $cutoffDate)
            ->count();
        
        $this->info("Found {$count} records older than 6 months");
        
        if ($this->confirm('Archive to daily stats only?')) {
            // حذف البيانات القديمة (daily_stats موجودة بالفعل)
            CarListingAnalytics::where('created_at', '<', $cutoffDate)
                ->delete();
            
            $this->info('Old analytics archived successfully');
        }
    }
}

// Optional: Cron شهري
$schedule->command('analytics:archive-old')
         ->monthlyOn(1, '03:00');
```

---

### من يرى Analytics؟

**القرار: المزود + الأدمن**

```php
// CarProviderController
public function getAnalytics(Request $request) {
    $providerId = auth()->id();
    
    // احصائيات خاصة بإعلانات هذا المزود فقط
    $listings = CarListing::where('car_provider_id', $providerId)->pluck('id');
    
    return [
        'total_views' => CarListingAnalytics::whereIn('car_listing_id', $listings)
            ->where('event_type', 'view')
            ->count(),
        // ...
    ];
}

// AdminController
public function getAllAnalytics() {
    // الأدمن يرى كل شيء
    return [
        'total_views' => CarListingAnalytics::where('event_type', 'view')->count(),
        'by_provider' => CarListing::with('carProvider')
            ->selectRaw('car_provider_id, SUM(views_count) as total_views')
            ->groupBy('car_provider_id')
            ->get(),
    ];
}
```

---

### Conversion Rate Calculation

**القرار: Backend (لكن يمكن cache في daily_stats)**

```php
// في Analytics Service
public function getConversionRate($listingId) {
    $views = CarListingAnalytics::where('car_listing_id', $listingId)
        ->where('event_type', 'view')
        ->count();
    
    $contacts = CarListingAnalytics::where('car_listing_id', $listingId)
        ->whereIn('event_type', ['contact_phone', 'contact_whatsapp'])
        ->count();
    
    return $views > 0 ? ($contacts / $views) * 100 : 0;
}

// Alternative: SQL Subquery (في report واحد)
CarListing::selectRaw('
    id,
    title,
    views_count,
    (SELECT COUNT(*) FROM car_listing_analytics 
     WHERE car_listing_id = car_listings.id 
     AND event_type IN ("contact_phone", "contact_whatsapp")) as contacts,
    CASE 
        WHEN views_count > 0 THEN 
            ((SELECT COUNT(*) FROM car_listing_analytics 
              WHERE car_listing_id = car_listings.id 
              AND event_type IN ("contact_phone", "contact_whatsapp")) / views_count) * 100
        ELSE 0 
    END as conversion_rate
')->get();
```

---

### favorite & share Events

**القرار النهائي:**

#### ✅ **favorite** - ضروري

**الأسباب:**
- المستخدمون يحفظون الإعلانات للمقارنة لاحقاً
- مؤشر قوي على الاهتمام (أقوى من View)
- يمكن إضافة "My Favorites" page للعملاء
- تحليل: أي إعلانات تُحفظ أكثر؟

**Implementation:**
```tsx
// Frontend
<button onClick={() => toggleFavorite(listing.id)}>
  {isFavorited ? '❤️' : '🤍'} حفظ
</button>

// Backend
CREATE TABLE user_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    car_listing_id BIGINT,
    created_at TIMESTAMP,
    UNIQUE KEY (user_id, car_listing_id)
);
```

#### ❌ **share** - اختياري (Phase 2)

**الأسباب:**
- أقل أهمية من favorite/contact
- صعب التتبع (مشاركة خارج الموقع)
- يمكن إضافته لاحقاً إذا لزم الأمر

**Alternative:** Share button بدون تتبع
```tsx
<button onClick={() => shareToWhatsApp(listing.url)}>
  📤 مشاركة
</button>
// لا يسجل في analytics (تبسيط)
```

---

## 10. أسئلة معالجة الصور والميديا

### رفض الصور الكبيرة

**القرار: Client-side قبل الرفع + Server-side تأكيد**

**Frontend (قبل الرفع):**
```tsx
const handleFileSelect = (files: FileList) => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  
  const validFiles = Array.from(files).filter(file => {
    if (file.size > MAX_SIZE) {
      showToast('error', `الصورة ${file.name} أكبر من 5MB`);
      return false;
    }
    return true;
  });
  
  // رفع الصور الصالحة فقط
  uploadFiles(validFiles);
};
```

**Backend (تأكيد):**
```php
public function store(Request $request) {
    $request->validate([
        'photos' => 'required|array|min:1|max:15',
        'photos.*' => [
            'required',
            'string',
            function ($attribute, $value, $fail) {
                // تحقق من حجم base64
                $sizeInBytes = (strlen($value) * 3) / 4;
                if ($sizeInBytes > 5242880) { // 5MB
                    $fail('حجم الصورة يجب أن يكون أقل من 5MB');
                }
            }
        ]
    ]);
}
```

**الفائدة:** 
- ✅ UX أفضل (رفض فوري)
- ✅ توفير bandwidth
- ✅ Server-side validation كـ backup

---

### Auto-Resize للصور

**القرار: نعم، كل الصور تُعالج**

```php
use Intervention\Image\Facades\Image;

private function processPhoto($base64Data, $folder, $filename) {
    // Decode base64
    $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $base64Data));
    
    // Load image
    $image = Image::make($imageData);
    
    // Auto-orient based on EXIF
    $image->orientate();
    
    // Resize if larger than max dimensions
    // Maintains aspect ratio
    if ($image->width() > 1920 || $image->height() > 1080) {
        $image->resize(1920, 1080, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize(); // لا تكبر الصور الصغيرة
        });
    }
    
    // Strip EXIF data
    $image->strip();
    
    // Optimize quality (85% بدلاً من 100%)
    $image->encode('jpg', 85);
    
    // Save
    $path = "{$folder}/{$filename}.jpg";
    Storage::disk('public')->put($path, (string) $image);
    
    // Generate thumbnail (300x200)
    $thumb = Image::make($imageData)
        ->fit(300, 200)
        ->strip()
        ->encode('jpg', 80);
    
    Storage::disk('public')->put("{$folder}/thumbs/{$filename}.jpg", (string) $thumb);
    
    return $path;
}
```

**النتيجة:**
- ✅ كل صورة → Max 1920×1080
- ✅ Aspect ratio محفوظ
- ✅ Quality 85% (توازن بين الحجم والجودة)
- ✅ Thumbnail للـ lists

---

### إزالة EXIF

**القرار: نعم، فعلياً**

```php
$image->strip(); // يزيل:
// - GPS coordinates
// - Camera model
// - Date/time
// - Copyright
// - All metadata
```

**الأسباب:**
- 🔒 **الخصوصية**: GPS قد يكشف موقع المنزل
- 💾 **الحجم**: EXIF قد يكون 50-100KB
- ⚡ **الأداء**: تحميل أسرع

**ملاحظة:** نحافظ على Orientation قبل الحذف:
```php
$image->orientate(); // يصحح الاتجاه بناءً على EXIF
$image->strip();     // ثم يحذف EXIF
```

---

### ترتيب الصور يدوياً

**القرار: نعم، Drag & Drop**

**Database Schema:**
```php
// photos مخزنة كـ JSON array مع order
'photos' => [
    ['path' => 'path/to/image1.jpg', 'order' => 0, 'is_cover' => true],
    ['path' => 'path/to/image2.jpg', 'order' => 1, 'is_cover' => false],
    ['path' => 'path/to/image3.jpg', 'order' => 2, 'is_cover' => false],
]
```

**Frontend (React DnD or similar):**
```tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const PhotoManager = ({ photos, setPhotos }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(photos);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    // Update order property
    const reordered = items.map((item, index) => ({
      ...item,
      order: index,
      is_cover: index === 0 // first is always cover
    }));
    
    setPhotos(reordered);
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="photos" direction="horizontal">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} 
               className="flex gap-4">
            {photos.map((photo, index) => (
              <Draggable key={photo.path} draggableId={photo.path} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`relative ${snapshot.isDragging ? 'opacity-50' : ''}`}
                  >
                    <img src={photo.path} className="w-32 h-32 object-cover rounded" />
                    {photo.is_cover && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs">
                        📌 غلاف
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-black/50 text-white px-2">
                      {index + 1}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

---

### Cover Image (الصورة الرئيسية)

**القرار: أول صورة افتراضياً + إمكانية التغيير**

**Backend Helper:**
```php
public function getCoverImage() {
    $photos = $this->photos; // JSON array
    
    // ابحث عن is_cover = true
    $cover = collect($photos)->firstWhere('is_cover', true);
    
    // إذا لم توجد، خذ الأولى
    return $cover ?? $photos[0] ?? null;
}
```

**Frontend:**
```tsx
const setCover = (index: number) => {
  const updated = photos.map((photo, i) => ({
    ...photo,
    is_cover: i === index
  }));
  setPhotos(updated);
};

// UI
<button 
  onClick={() => setCover(index)}
  className="btn-sm"
>
  {photo.is_cover ? '📌 غلاف' : '🔘 اجعلها غلاف'}
</button>
```

---

### الفيديو

**القرار: URL فقط (YouTube/Facebook/Instagram)**

**الأسباب:**
- ❌ رفع الفيديو مكلف جداً (storage + bandwidth)
- ❌ يحتاج encoding (FFmpeg server)
- ❌ يبطئ الموقع

**البديل الأفضل:**
```tsx
<input 
  type="url"
  placeholder="رابط الفيديو (YouTube, Facebook)"
  pattern="https?://.+"
/>
```

**Backend Validation:**
```php
'video_url' => 'nullable|url|regex:/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com)/'
```

**Frontend Display:**
```tsx
const VideoEmbed = ({ url }) => {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    return (
      <iframe 
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full aspect-video"
        allowFullScreen
      />
    );
  }
  
  // Facebook
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return (
      <iframe 
        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`}
        className="w-full aspect-video"
      />
    );
  }
  
  // Fallback: link
  return (
    <a href={url} target="_blank" className="btn-primary">
      🎥 مشاهدة الفيديو
    </a>
  );
};
```

---

## ملخص قرارات الصور والميديا

| الموضوع | القرار |
|---------|--------|
| رفض >5MB | Client-side قبل + Server-side تأكيد |
| Auto-resize | نعم، كل الصور → Max 1920×1080 |
| EXIF removal | نعم، `$image->strip()` |
| ترتيب الصور | Drag & Drop مع order property |
| Cover image | أول صورة افتراضياً + قابل للتغيير |
| Thumbnails | نعم، 300×200 للـ lists |
| الفيديو | URL فقط (YouTube/FB/IG) |
| Video upload | ❌ لا (مكلف جداً) |

---

## ملخص القرارات النهائية (Updated)

| الموضوع | القرار |
|---------|--------|
| حذف الإعلان | Soft Delete (deleted_at) |
| is_available | يمنع البحث، يظهر في التفاصيل مع تحذير |
| Sponsored filtering | تلتزم بالفلاتر |
| sponsored_until expiry | Cron يومي auto-expire |
| View tracking | سطر لكل view + deduplication 30 دقيقة |
| views_count | **Queue job (async increment)** |
| daily_stats | Cron يومي الساعة 02:00 |
| Analytics archiving | Command شهري (6 أشهر) |
| Analytics visibility | مزود (إعلاناته) + أدمن (كل شيء) |
| Conversion rate | Backend calculation |
| favorite event | ✅ ضروري (مع جدول user_favorites) |
| share event | ❌ اختياري Phase 2 |
| **Image validation** | **Client + Server (5MB)** |
| **Image resize** | **Auto 1920×1080 + thumbnail** |
| **EXIF** | **Strip all metadata** |
| **Photo order** | **Drag & drop** |
| **Cover image** | **First by default** |
| **Video** | **URL only (YouTube/FB/IG)** |

