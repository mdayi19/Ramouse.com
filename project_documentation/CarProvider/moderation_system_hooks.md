# Moderation System (Phase 2 Hooks)

## 🛡️ نظام الإشراف والتبليغات

> **ملاحظة:** هذه الـ hooks للمستقبل (Phase 2)
> يتم إنشاء الهيكل الآن للتسهيل لاحقاً

---

### 1. Database - Reports Table

```sql
CREATE TABLE listing_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    car_listing_id BIGINT NOT NULL,
    reported_by_user_id BIGINT NOT NULL,
    reason ENUM(
        'spam',           -- إعلان مكرر/سبام
        'fake',           -- معلومات مزيفة
        'sold',           -- تم البيع ولم يُحدث
        'scam',           -- احتيال مشتبه به
        'inappropriate',  -- محتوى غير لائق
        'other'
    ) NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by_admin_id BIGINT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP,
    
    FOREIGN KEY (car_listing_id) REFERENCES car_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_listing (car_listing_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);
```

---

### 2. Database - Blocked Providers

```sql
CREATE TABLE blocked_providers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    car_provider_id VARCHAR(20) NOT NULL,
    blocked_by_admin_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    blocked_at TIMESTAMP,
    expires_at TIMESTAMP NULL, -- NULL = permanent
    
    FOREIGN KEY (car_provider_id) REFERENCES car_providers(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by_admin_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_provider (car_provider_id),
    INDEX idx_expires (expires_at)
);
```

---

### 3. Database - Hidden Listings

```sql
-- Add to car_listings table
ALTER TABLE car_listings ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE AFTER is_available;
ALTER TABLE car_listings ADD COLUMN hidden_reason TEXT AFTER is_hidden;
ALTER TABLE car_listings ADD COLUMN hidden_at TIMESTAMP NULL AFTER hidden_reason;
ALTER TABLE car_listings ADD COLUMN hidden_by_admin_id BIGINT NULL AFTER hidden_at;

ALTER TABLE car_listings ADD INDEX idx_hidden (is_hidden);
```

**الفرق بين `is_available` و `is_hidden`:**
- `is_available = false` → المزود أخفاه (تم البيع مثلاً)
- `is_hidden = true` → الأدمن أخفاه (تحقيق/مخالفة)

---

### 4. Models (Placeholder)

```php
// app/Models/ListingReport.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingReport extends Model
{
    protected $fillable = [
        'car_listing_id',
        'reported_by_user_id',
        'reason',
        'description',
        'status',
        'admin_notes',
        'reviewed_by_admin_id',
        'reviewed_at',
    ];
    
    protected $casts = [
        'reviewed_at' => 'datetime',
    ];
    
    public function carListing()
    {
        return $this->belongsTo(CarListing::class);
    }
    
    public function reportedBy()
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }
    
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by_admin_id');
    }
}

// app/Models/BlockedProvider.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedProvider extends Model
{
    protected $fillable = [
        'car_provider_id',
        'blocked_by_admin_id',
        'reason',
        'blocked_at',
        'expires_at',
    ];
    
    protected $casts = [
        'blocked_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
    
    public function carProvider()
    {
        return $this->belongsTo(CarProvider::class);
    }
    
    public function blockedBy()
    {
        return $this->belongsTo(User::class, 'blocked_by_admin_id');
    }
    
    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
```

---

### 5. Endpoints (Placeholder - Phase 2)

```php
// routes/api.php

// Public - Report listing (authenticated users only)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/car-listings/{id}/report', [ModerationController::class, 'reportListing']);
});

// Admin - Moderation panel
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Reports
    Route::get('/reports', [ModerationController::class, 'getReports']);
    Route::put('/reports/{id}/review', [ModerationController::class, 'reviewReport']);
    Route::post('/reports/{id}/resolve', [ModerationController::class, 'resolveReport']);
    Route::post('/reports/{id}/dismiss', [ModerationController::class, 'dismissReport']);
    
    // Hide listing
    Route::post('/car-listings/{id}/hide', [ModerationController::class, 'hideListing']);
    Route::post('/car-listings/{id}/unhide', [ModerationController::class, 'unhideListing']);
    
    // Block provider
    Route::post('/car-providers/{id}/block', [ModerationController::class, 'blockProvider']);
    Route::post('/car-providers/{id}/unblock', [ModerationController::class, 'unblockProvider']);
});
```

---

### 6. Controller Skeleton

```php
// app/Http/Controllers/ModerationController.php
namespace App\Http\Controllers;

use App\Models\ListingReport;
use App\Models\BlockedProvider;
use App\Models\CarListing;
use App\Models\CarProvider;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    /**
     * Report a listing
     * Phase 2: Implement full logic
     */
    public function reportListing(Request $request, $id)
    {
        // TODO: Implement in Phase 2
        return response()->json([
            'message' => 'Report functionality will be available soon'
        ], 501); // Not Implemented
    }
    
    /**
     * Get all reports (admin)
     * Phase 2: Implement full logic
     */
    public function getReports()
    {
        // TODO: Implement in Phase 2
        return response()->json([
            'message' => 'Moderation panel will be available soon'
        ], 501);
    }
    
    /**
     * Hide listing (admin)
     * Phase 2: Implement full logic
     */
    public function hideListing(Request $request, $id)
    {
        $listing = CarListing::findOrFail($id);
        
        $listing->update([
            'is_hidden' => true,
            'hidden_reason' => $request->reason,
            'hidden_at' => now(),
            'hidden_by_admin_id' => auth()->id(),
        ]);
        
        return response()->json([
            'message' => 'Listing hidden successfully'
        ]);
    }
    
    /**
     * Block provider (admin)
     * Phase 2: Implement full logic
     */
    public function blockProvider(Request $request, $id)
    {
        // TODO: Implement in Phase 2
        return response()->json([
            'message' => 'Block functionality will be available soon'
        ], 501);
    }
}
```

---

### 7. Query Modifications

```php
// في CarListingController::index()
public function index(Request $request)
{
    $query = CarListing::query()
        ->where('is_available', true)
        ->where('is_hidden', false) // ✅ Hide admin-hidden listings
        ->whereDoesntHave('carProvider.blockedProvider'); // ✅ Hide blocked providers
    
    // ... rest of filters
}
```

---

### 8. Frontend Hooks (Placeholder)

```tsx
// components/ReportButton.tsx (Phase 2)
const ReportButton = ({ listingId }) => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="text-red-600 text-sm"
      >
        🚩 تبليغ عن المشكلة
      </button>
      
      {showModal && (
        <ReportModal 
          listingId={listingId} 
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// Admin Panel - Reports View (Phase 2)
const ModerationView = () => {
  // TODO: Implement in Phase 2
  return (
    <div className="p-6">
      <h2>🛡️ الإشراف والتبليغات</h2>
      <p className="text-gray-500">
        سيتم تفعيل هذه الميزة في Phase 2
      </p>
      
      {/* Placeholder sections */}
      <Tabs>
        <Tab>التبليغات المعلقة (0)</Tab>
        <Tab>المعارض المحظورة (0)</Tab>
        <Tab>الإعلانات المخفية (0)</Tab>
      </Tabs>
    </div>
  );
};
```

---

### 9. Admin Badge Updates

```tsx
// في CarListingCard
{listing.is_hidden && (
  <Badge type="danger">
    🔒 مخفي من الأدمن
  </Badge>
)}

// في ProviderCard
{provider.isBlocked && (
  <Badge type="danger">
    🚫 محظور
  </Badge>
)}
```

---

## Summary - Phase 2 Hooks

| Feature | Database | Endpoint | Frontend | Status |
|---------|----------|----------|----------|--------|
| **Report Listing** | ✅ Table ready | ✅ Hook | ⏳ UI Phase 2 | Hook ready |
| **Hide Listing** | ✅ Columns added | ✅ Implemented | ⏳ UI Phase 2 | Hook ready |
| **Block Provider** | ✅ Table ready | ✅ Hook | ⏳ UI Phase 2 | Hook ready |
| **Moderation Panel** | ✅ Ready | ✅ Routes | ⏳ UI Phase 2 | Hook ready |

---

## Implementation Priority (Phase 2)

1. **Report Listing** - الأهم (يحتاج من المستخدمين)
2. **Hide Listing** - للأدمن (سهل التطبيق)
3. **Block Provider** - للحالات الخطيرة
4. **Auto-moderation** - AI/ML للكشف عن السبام

---

## Notes

- ✅ Database schema ready
- ✅ Routes defined
- ✅ Models created
- ✅ Queries modified to respect `is_hidden`
- ⏳ Full UI implementation → Phase 2
- ⏳ Email notifications → Phase 2
- ⏳ Auto-moderation → Phase 3

**الـ Hooks جاهزة للمستقبل!** 🎯
