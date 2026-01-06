# Two-Tier Seller System

## 🚗 نظام البائعين المزدوج

### Comparison Table

| Feature | 👤 Individual Seller (بائع فردي) | 🏢 Car Provider (معرض) |
|---------|----------------------------------|------------------------|
| **Who** | Customer (عميل عادي) | Business (معرض/شركة) |
| **Listings Limit** | 1-3 إعلانات | ∞ Unlimited |
| **Listing Types** | ✅ Sale only | ✅ Sale + Rent |
| **Sponsored Ads** | ❌ No | ✅ Yes |
| **Public Profile Page** | ❌ No | ✅ Yes (`/car-providers/{id}`) |
| **Multiple Phones** | ❌ One only | ✅ Multiple |
| **Reviews/Ratings** | ❌ No | ✅ Yes |
| **Analytics** | ❌ No | ✅ Yes |
| **Display Name** | "بائع فردي" | Provider name |
| **Verification** | ❌ Not required | ✅ Required (is_verified) |
| **Registration** | Use existing account | Dedicated registration |

---

## Database Schema Updates

### 1. car_listings Table Modification

```sql
-- SIMPLIFIED DESIGN - owner_id for both types
ALTER TABLE car_listings 
  ADD COLUMN owner_id BIGINT NOT NULL,
  ADD COLUMN seller_type ENUM('individual', 'provider') NOT NULL DEFAULT 'provider';

-- Add foreign key
ALTER TABLE car_listings 
  ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes
ALTER TABLE car_listings ADD INDEX idx_owner (owner_id, seller_type);
ALTER TABLE car_listings ADD INDEX idx_seller_type (seller_type);
```

**How it works:**
- **Individual sellers:** `owner_id = users.id` where `user.role = 'customer'`
- **Car providers:** `owner_id = users.id` where `user.role = 'car_provider'`
- **seller_type** determines limits and features

**Benefits:**
✅ Single foreign key (simpler)
✅ Clear ownership model
✅ Easy policy checks: `listing.owner_id === auth()->id()`
✅ Works for both customer and car_provider roles

---

### 2. Model Updates

```php
// app/Models/CarListing.php

class CarListing extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'owner_id',         // Single owner (simplified!)
        'seller_type',
        // ... other fields
    ];
    
    protected $casts = [
        'seller_type' => 'string',
    ];
    
    // =====================
    // RELATIONSHIPS
    // =====================
    
    // Owner (always a User - individual or provider)
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
    
    // =====================
    // HELPER METHODS
    // =====================
    
    // Get CarProvider if seller is a provider
    public function getProvider()
    {
        if ($this->seller_type === 'provider') {
            return $this->owner->carProvider;
        }
        return null;
    }
    
    // Get display name
    public function getSellerName()
    {
        if ($this->seller_type === 'individual') {
            return 'بائع فردي'; // Anonymous for individuals
        }
        
        return $this->owner->carProvider->name;
    }
    
    // Get contact phone
    public function getContactPhone()
    {
        // Use listing's contact_phone if specified
        if ($this->contact_phone) {
            return $this->contact_phone;
        }
        
        // Otherwise use owner's phone
        return $this->seller_type === 'individual' 
            ? $this->owner->phone 
            : $this->owner->carProvider->id; // provider's phone
    }
    
    // Check if individual seller
    public function isIndividual()
    {
        return $this->seller_type === 'individual';
    }
    
    // Check if provider seller
    public function isProvider()
    {
        return $this->seller_type === 'provider';
    }
    
    // =====================
    // SCOPES
    // =====================
    
    public function scopeIndividual($query)
    {
        return $query->where('seller_type', 'individual');
    }
    
    public function scopeProvider($query)
    {
        return $query->where('seller_type', 'provider');
    }
}

// app/Models/User.php
public function carListings()
{
    return $this->hasMany(CarListing::class, 'owner_id');
}

public function individualListings()
{
    return $this->hasMany(CarListing::class, 'owner_id')
                ->where('seller_type', 'individual');
}

// app/Models/CarProvider.php
public function listings()
{
    // Get listings where owner is this provider's user
    return $this->hasMany(CarListing::class, 'owner_id')
                ->where('owner_id', $this->user_id)
                ->where('seller_type', 'provider');
}
```

---

### 3. Validation Rules

```php
// app/Http/Controllers/CarListingController.php

public function store(Request $request)
{
    $user = auth()->user();
    
    // Determine seller type based on user's role
    $sellerType = $user->role === 'car_provider' ? 'provider' : 'individual';
    
    // Base validation
    $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string|max:5000',
        'price' => 'required|numeric|min:0',
        'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
        'photos' => 'required|array|min:1|max:15',
        // ... other fields
    ];
    
    // =====================
    // INDIVIDUAL SELLER SPECIFIC RULES
    // =====================
    if ($sellerType === 'individual') {
        // Check listing limit (max 3)
        $currentListings = CarListing::where('owner_id', $user->id)
            ->where('seller_type', 'individual')
            ->count();
        
        if ($currentListings >= 3) {
            return response()->json([
                'error' => 'لقد وصلت للحد الأقصى (3 إعلانات)',
                'current_count' => $currentListings,
                'upgrade_url' => '/register-car-provider'
            ], 403);
        }
        
        // Force sale only (no rental for individuals)
        $rules['listing_type'] = 'required|in:sale';
        
        // No sponsored ads for individuals
        if ($request->has('is_sponsored') && $request->is_sponsored) {
            return response()->json([
                'error' => 'الإعلانات الممولة للمعارض فقط'
            ], 403);
        }
    }
    
    $validated = $request->validate($rules);
    
    // Create listing
    $listing = CarListing::create([
        ...$validated,
        'owner_id' => $user->id,          // ✅ SIMPLE!
        'seller_type' => $sellerType,
        'is_sponsored' => false,          // Always false for individuals
        'slug' => Str::slug($validated['title']), // Auto-generate slug
    ]);
    
    return response()->json([
        'message' => 'تم إضافة الإعلان بنجاح',
        'listing' => $listing
    ]);
}

// =====================
// POLICY (Authorization)
// =====================

// app/Policies/CarListingPolicy.php
public function update(User $user, CarListing $listing)
{
    // Simple ownership check - works for both types!
    return $listing->owner_id === $user->id;
}

public function delete(User $user, CarListing $listing)
{
    return $listing->owner_id === $user->id;
}

public function sponsor(User $user, CarListing $listing)
{
    // Only providers can sponsor
    if ($listing->seller_type !== 'provider') {
        return false;
    }
    
    return $listing->owner_id === $user->id;
}
```

---

### 4. Routes

```php
// routes/api.php

// Public - works for both types
Route::get('/car-listings', [CarListingController::class, 'index']);
Route::get('/car-listings/{id}', [CarListingController::class, 'show']);

// Authenticated - Individual sellers (customers)
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
    Route::get('/my-listings', [CarListingController::class, 'getMyListings']);
    Route::post('/listings', [CarListingController::class, 'store']); // Create (max 3)
    Route::put('/listings/{id}', [CarListingController::class, 'update']);
    Route::delete('/listings/{id}', [CarListingController::class, 'destroy']);
});

// Car Provider routes (as before)
Route::middleware(['auth:sanctum', 'role:car_provider'])->prefix('car-provider')->group(function () {
    // Unlimited listings, analytics, etc.
});
```

---

### 5. Frontend - UI Differences

#### Listing Card Display

```tsx
const CarCard = ({ listing }) => {
  return (
    <div className="car-card">
      <img src={listing.photos[0]} />
      
      <h3>{listing.title}</h3>
      <p className="price">{listing.price} ريال</p>
      
      {/* Seller Info */}
      <div className="seller-info">
        {listing.seller_type === 'individual' ? (
          <div className="individual-seller">
            <span className="badge bg-blue-100 text-blue-800">
              👤 بائع فردي
            </span>
            <span className="text-sm text-gray-500">
              (عضو موثوق)
            </span>
          </div>
        ) : (
          <Link to={`/car-providers/${listing.car_provider_id}`}>
            <div className="provider-seller">
              <img src={listing.carProvider.profile_photo} className="w-8 h-8 rounded" />
              <span>{listing.carProvider.name}</span>
              {listing.carProvider.is_verified && <VerifiedBadge />}
              {listing.carProvider.is_trusted && <TrustedBadge />}
            </div>
          </Link>
        )}
      </div>
      
      {/* NO sponsored badge for individuals */}
      {listing.is_sponsored && listing.seller_type === 'provider' && (
        <SponsoredBadge />
      )}
    </div>
  );
};
```

#### Customer Dashboard - My Listings

```tsx
const CustomerMyListings = () => {
  const { data: listings } = useQuery(['myListings'], getMyListings);
  const limit = 3;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>إعلاناتي ({listings?.length ?? 0} / {limit})</h2>
        
        {listings?.length < limit && (
          <button onClick={() => openAddListingModal()} className="btn-primary">
            + إضافة إعلان
          </button>
        )}
      </div>
      
      {listings?.length >= limit && (
        <div className="alert alert-info">
          ℹ️ وصلت للحد الأقصى ({limit} إعلانات).
          <Link to="/register-car-provider" className="text-blue-600">
            سجل كمعرض للمزيد
          </Link>
        </div>
      )}
      
      <div className="grid gap-4">
        {listings?.map(listing => (
          <MyListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
};
```

#### Listing Detail Page

```tsx
const CarListingDetail = () => {
  const { data: listing } = useQuery(['listing', id], () => getCarListing(id));
  
  return (
    <div>
      {/* ... listing details ... */}
      
      {/* Contact Section */}
      <div className="contact-section">
        <h3>معلومات البائع</h3>
        
        {listing.seller_type === 'individual' ? (
          <div className="individual-contact">
            <div className="mb-2">
              <span className="badge">👤 بائع فردي</span>
              <span className="text-sm text-gray-500 mr-2">
                (عضو في Ramouse)
              </span>
            </div>
            
            <button onClick={() => contactSeller(listing.user.phone)}>
              📞 اتصل بالبائع
            </button>
            
            {/* NO provider profile link */}
            <p className="text-xs text-gray-500 mt-2">
              ⓘ الإعلانات الفردية لا تملك صفحة عامة
            </p>
          </div>
        ) : (
          <div className="provider-contact">
            <Link to={`/car-providers/${listing.car_provider_id}`}>
              <ProviderCard provider={listing.carProvider} />
            </Link>
            
            <button onClick={() => contactProvider()}>
              📞 اتصل بالمعرض
            </button>
            
            <Link to={`/car-providers/${listing.car_provider_id}`}>
              🏢 عرض جميع سيارات المعرض ({listing.carProvider.listings_count})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### 6. Search & Filters

```tsx
// Add seller type filter
<FiltersSidebar>
  <h4>نوع البائع</h4>
  <Checkbox 
    label="معارض فقط" 
    checked={filters.providerOnly}
    onChange={(e) => setFilters({
      ...filters,
      sellerType: e.target.checked ? 'provider' : null
    })}
  />
  <Checkbox 
    label="بائعين أفراد" 
    checked={filters.individualOnly}
    onChange={(e) => setFilters({
      ...filters,
      sellerType: e.target.checked ? 'individual' : null
    })}
  />
</FiltersSidebar>
```

```php
// Backend filter
if ($request->seller_type) {
    $query->where('seller_type', $request->seller_type);
}
```

---

### 7. Upgrade Path

```tsx
// في Customer Dashboard
{listings.length >= 3 && (
  <div className="upgrade-banner">
    <h3>🚀 تريد المزيد من الإعلانات؟</h3>
    <p>سجل كمعرض سيارات واحصل على:</p>
    <ul>
      <li>✅ إعلانات غير محدودة</li>
      <li>✅ التأجير + البيع</li>
      <li>✅ إعلانات ممولة</li>
      <li>✅ صفحة عامة خاصة بك</li>
      <li>✅ تحليلات متقدمة</li>
    </ul>
    <Link to="/register-car-provider" className="btn-primary">
      الترقية لمعرض سيارات
    </Link>
  </div>
)}
```

---

### 8. Business Rules Summary

**Individual Seller:**
```php
// Limits
MAX_LISTINGS = 3;
ALLOWED_TYPES = ['sale'];  // rent = forbidden
SPONSORED = false;         // always
HAS_PUBLIC_PAGE = false;
HAS_ANALYTICS = false;
HAS_REVIEWS = false;

// Display
DISPLAY_NAME = "بائع فردي";  // anonymous
SHOW_PHONE = true;          // direct from user.phone
```

**Car Provider:**
```php
// Limits
MAX_LISTINGS = INF;        // unlimited
ALLOWED_TYPES = ['sale', 'rent'];
SPONSORED = true;          // if wallet has balance
HAS_PUBLIC_PAGE = true;    // /car-providers/{id}
HAS_ANALYTICS = true;
HAS_REVIEWS = true;

// Display
DISPLAY_NAME = provider.name;
SHOW_PHONE = provider.id;  // or multiple phones
```

---

## Migration Steps

1. ✅ Add columns (user_id, seller_type)
2. ✅ Add constraint (XOR: provider OR user)
3. ✅ Update Model relationships
4. ✅ Update validation logic
5. ✅ Add customer routes
6. ✅ Create frontend components
7. ✅ Update search filters
8. ✅ Test both flows

---

## Summary

| Aspect | Individual | Provider |
|--------|------------|----------|
| **Database** | owner_id (FK users.id) | owner_id (FK users.id) |
| **seller_type** | 'individual' | 'provider' |
| **user.role** | 'customer' | 'car_provider' |
| **Limit** | 3 max | Unlimited |
| **Types** | Sale only | Sale + Rent |
| **Sponsored** | ❌ Never | ✅ Paid |
| **Profile** | ❌ No | ✅ /car-providers/{id} |
| **Display** | "بائع فردي" | Provider name |
| **Reviews** | ❌ No | ✅ Yes |
| **Analytics** | ❌ No | ✅ Yes |

**Both types use the SAME car_listings table with owner_id!** ✅

**Simple ownership check:**
```php
$listing->owner_id === auth()->id()
```
