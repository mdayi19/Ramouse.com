# CarProvider Role Implementation Plan

This plan outlines adding a new `car_provider` role to allow businesses/individuals to list cars for sale and rent.

---

## User Review Required

> [!IMPORTANT]
> **Breaking Changes**: This adds a new user role type, which will require updates to existing role-checking logic throughout the application.

> [!WARNING]
> **Database Changes**: New tables `car_providers`, `car_listings`, and `car_categories` will be added. Ensure database backups are taken before migration.

> [!CAUTION]
> **Frontend Type Updates**: The role union type in `types.ts` will change from `'customer' | 'provider' | 'technician' | 'tow_truck'` to include `'car_provider'`.

### User Requirements (Confirmed):

✅ **Simple Contact System**: No booking/payment integration. Just display car info with contact details.

✅ **No Admin Approval**: Car provider listings go live immediately (unlike technicians).

✅ **Predefined Car Categories**: Sedan, SUV, Truck, etc. (managed in database).

✅ **Additional Fields**: License plate, VIN, doors, engine size, body style, body condition per part.

✅ **Sponsored Ads**: Support for featured/promoted listings (`is_sponsored` flag).

### Final Architectural Decisions:

✅ **Multiple Phone Numbers**: Each provider can have additional contact numbers in `car_provider_phones` table

✅ **Phone as Primary Key**: Keeping `phone` as PK for login compatibility (existing pattern)

✅ **Analytics Archiving**: 6-month retention, then archive to daily aggregates

✅ **Listing Edits**: Providers can edit listings after publishing (no draft needed)

✅ **Auto-Verification**: Trusted providers (`is_trusted = true`) for instant approval

✅ **Image Limits**: 1-15 photos, max 5MB each, auto-resize + EXIF removal

✅ **VIN Validation**: 17-character validation for chassis numbers

✅ **Indexes**: Spatial index on location + composite indexes for performance

---

## File Structure Overview

```
c:\laragon\www\ramouse\
│
├── Backend\
│   ├── app\
│   │   ├── Models\
│   │   │   ├── [NEW] CarProvider.php
│   │   │   ├── [NEW] CarListing.php
│   │   │   ├── [NEW] CarCategory.php
│   │   │   └── [MODIFY] User.php (add carProvider relationship)
│   │   │
│   │   ├── Http\Controllers\
│   │   │   ├── [MODIFY] AuthController.php (add registerCarProvider, update login)
│   │   │   ├── [NEW] CarProviderController.php
│   │   │   ├── [NEW] CarListingController.php
│   │   │   ├── [NEW] CarListingAnalyticsController.php
│   │   │   └── [MODIFY] AdminController.php (add getCarProviders, updateCarProvider)
│   │   │
│   │   └── Services\
│   │       └── [MODIFY] AuctionWalletService.php (add car_provider cases)
│   │
│   ├── database\migrations\
│   │   ├── [NEW] YYYY_MM_DD_create_car_providers_table.php
│   │   ├── [NEW] YYYY_MM_DD_create_car_listings_table.php
│   │   ├── [NEW] YYYY_MM_DD_create_car_categories_table.php
│   │   ├── [NEW] YYYY_MM_DD_create_car_listing_analytics_table.php
│   │   ├── [NEW] YYYY_MM_DD_create_car_provider_phones_table.php
│   │   └── [NEW] YYYY_MM_DD_create_car_listing_daily_stats_table.php
│   │
│   ├── database\seeders\
│   │   └── [NEW] CarCategorySeeder.php
│   │
│   └── routes\
│       └── [MODIFY] api.php (add car provider routes)
│
└── Frontend\
    └── src\
        ├── [MODIFY] types.ts (add CarProvider, CarListing, CarCategory interfaces)
        │
        ├── services\
        │   ├── [NEW] carprovider.service.ts
        │   └── [NEW] carlisting.service.ts
        │
        ├── components\
        │   ├── [NEW] CarProviderRegistration.tsx
        │   ├── [NEW] CarProviderDashboard.tsx
        │   ├── [NEW] CarMarketplace.tsx
        │   ├── [NEW] CarListingDetail.tsx
        │   ├── [NEW] CarListingForm.tsx
        │   │
        │   ├── DashboardParts\
        │   │   ├── [NEW] CarProvidersView.tsx
        │   │   ├── [NEW] CarListingsSponsorView.tsx
        │   │   └── [NEW] CarCategoriesView.tsx
        │   │
        │   └── [MODIFY] AdminDashboard.tsx (add new tabs)
        │
        ├── hooks\
        │   └── [MODIFY] useAppState.ts (add carProvider state)
        │
        └── [MODIFY] App.tsx (add new routes)
```

### Files Summary

**Backend (18 files):**
- 6 New Migrations (providers, listings, categories, analytics, phones, daily_stats)
- 5 New Models (CarProvider, CarListing, CarCategory, CarListingAnalytics, CarProviderPhone)
- 3 New Controllers (CarProvider, CarListing, CarListingAnalytics)
- 1 New Seeder
- 3 Modified Files (User, AuthController, AdminController, api.php)

**Frontend (16 files):**
- 6 New Component Pages (Registration, Dashboard, Marketplace, Detail, Form, Analytics)
- 3 New Admin Views
- 2 New Services
- 5 Modified Files (types.ts, App.tsx, useAppState.ts, AdminDashboard.tsx)

**Total: 34 files** (23 new, 11 modified)

---

## Proposed Changes

### Database Layer

#### [NEW] Migration: create_car_providers_table.php

Creates the `car_providers` table following the technician/tow_truck pattern:

```php
- id (string PK, phone number)
- user_id (FK to users.id)
- unique_id (string 10, unique)
- name (business/individual name)
- password (hashed)
- business_type (enum: 'dealership', 'individual', 'rental_agency')
- business_license (string, nullable)
- city
- address
- location (POINT geometry for "Near Me")
- description (text, nullable)
- is_verified (boolean, default false)
- is_active (boolean, default true)
- is_trusted (boolean, default false) - للمعارض الموثوقة (auto-verify listings)
- verified_at (timestamp, nullable)
- verified_by (FK to users.id, nullable) - الأدمن الذي وافق
- profile_photo (string, nullable)
- gallery (JSON array)
- socials (JSON object)
- qr_code_url (string, nullable)
- notification_settings (JSON)
- flash_purchases (JSON)
- average_rating (decimal 3,2, default 0)
- wallet_balance (decimal 10,2, default 0)
- saved_addresses (JSON array)
- payment_info (JSON)
- timestamps
```

#### [NEW] Migration: create_car_listings_table.php

Creates the `car_listings` table for individual car entries:

```php
- id (bigint, auto-increment, PK)
- owner_id (FK to users.id, on delete cascade) - SIMPLIFIED: Both individual + provider
- seller_type (enum: 'individual', 'provider') - Determines listing limits & features
- listing_type (enum: 'sale', 'rent') 
- car_category_id (FK to car_categories.id, nullable) - sedan, SUV, etc.
- title (string) - Display title (e.g., "2022 Toyota Camry SE")
- slug (string, unique) - SEO-friendly URL (auto-generated from title)
- brand (string) - foreign key to brands table
- model (string)
- year (integer)
- mileage (integer, kilometers)
- condition (enum: 'new', 'used', 'certified_pre_owned')
- price (decimal 10,2) - sale price or base rental rate
- is_negotiable (boolean, default false) - السعر قابل للتفاوض
- rental_terms (JSON, nullable) - {daily, weekly, monthly} rates
- exterior_color (string, nullable) - لون السيارة (خارجي)
- interior_color (string, nullable) - لون الداخلية
- transmission (enum: 'automatic', 'manual', nullable)
- fuel_type (enum: 'gasoline', 'diesel', 'electric', 'hybrid', nullable)
- doors_count (integer, nullable) - عدد الأبواب
- seats_count (integer, nullable) - عدد المقاعد
- license_plate (string, nullable) - رقم اللوحة
- chassis_number (string, nullable) - رقم الهيكل (VIN)
- engine_size (string, nullable) - حجم المحرك (e.g., "2.0L", "1500cc")
- horsepower (integer, nullable) - قوة المحرك (HP)
- body_style (string, nullable) - نوع الهيكل (coupe, hatchback, etc.)
- body_condition (JSON, nullable) - حالة الهيكل per part
  Example: {"front_door": "replaced", "rear_bumper": "scratched", "hood": "painted"}
- previous_owners (integer, nullable) - عدد المالكين السابقين
- warranty (string, nullable) - الضمان
- features (JSON array, optional features list)
- description (text, nullable)
- photos (JSON array of paths)
- video_url (string, nullable)
- contact_phone (string, nullable) - رقم الاتصال (if different from owner)
- contact_whatsapp (string, nullable) - رقم واتساب
- is_available (boolean, default true)
- is_hidden (boolean, default false) - Admin moderation (hide without delete)
- is_sponsored (boolean, default false) - اعلان ممول (providers only)
- sponsored_until (datetime, nullable) - sponsorship expiry
- is_featured (boolean, default false) - Admin featured (free)
- featured_until (datetime, nullable) - featured expiry
- featured_position (integer, nullable) - manual ordering
- views_count (integer, default 0)
- deleted_at (timestamp, nullable) - Soft delete
- timestamps
```

**Indexes:**
```php
INDEX idx_owner (owner_id, seller_type)
INDEX idx_listing_type (listing_type)
INDEX idx_category (car_category_id)
INDEX idx_price (price)
INDEX idx_brand (brand)
INDEX idx_slug (slug) UNIQUE
INDEX idx_sponsored (is_sponsored, sponsored_until)
INDEX idx_featured (is_featured, featured_position)
INDEX idx_available (is_available)
INDEX idx_hidden (is_hidden)
INDEX idx_created (created_at)
INDEX idx_deleted (deleted_at)
```

#### [NEW] Migration: create_car_categories_table.php

Predefined car types:

```php
- id (auto-increment, PK)
- name_ar (string) - e.g., "سيدان", "SUV"
- name_en (string) - e.g., "Sedan", "SUV"
- icon (string, nullable) - icon name or path
- timestamps
```

#### [NEW] Migration: create_car_listing_analytics_table.php

Tracks analytics events for each listing:

```php
- id (bigint, auto-increment, PK)
- car_listing_id (FK to car_listings.id, on delete cascade)
- event_type (enum: 'view', 'contact_phone', 'contact_whatsapp', 'favorite', 'share')
- user_ip (string, nullable) - IP address for unique visitor tracking
- user_id (FK to users.id, nullable) - If logged in user
- metadata (JSON, nullable) - Additional event data
- created_at (timestamp)
```

**Index:** `car_listing_id`, `event_type`, `created_at` for fast queries.

#### [NEW] Migration: create_car_provider_phones_table.php

Support for multiple contact numbers:

```php
- id (bigint, auto-increment, PK)
- car_provider_id (FK to car_providers.id, on delete cascade)
- phone (string) - رقم إضافي
- label (string, nullable) - e.g., "Sales", "Service", "WhatsApp Only"
- is_whatsapp (boolean, default false)
- is_primary (boolean, default false)
- created_at (timestamp)
```

**Use case:** معارض كبيرة لديها أرقام لأقسام مختلفة

#### [NEW] Migration: create_car_listing_daily_stats_table.php

Aggregated daily analytics for performance:

```php
- id (bigint, auto-increment, PK)
- car_listing_id (FK to car_listings.id, on delete cascade)
- date DATE
- total_views INT DEFAULT 0
- unique_visitors INT DEFAULT 0
- contact_phone_clicks INT DEFAULT 0
- contact_whatsapp_clicks INT DEFAULT 0
- favorites INT DEFAULT 0
- shares INT DEFAULT 0
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE KEY idx_listing_date (car_listing_id, date)
```

**Purpose:** Cache daily stats, archive analytics after 6 months

---

### Backend - Models

#### [NEW] [CarProvider.php](file:///c:/laragon/www/ramouse/Backend/app/Models/CarProvider.php)

Extends `Authenticatable`, uses `HasApiTokens`. Pattern identical to `Technician.php`:

**Key Features:**
- Phone-based primary key
- Custom `createToken()` method for correct tokenable_id
- Relationship to `User` model
- `hasMany` relationship to `CarListing`
- `hasMany` relationship to `CarProviderPhone` - أرقام إضافية
- Polymorphic `reviews()` relationship
- `recalculateAverageRating()` method
- Location accessor for POINT geometry
- Address management methods
- `isTrusted()` helper method for auto-verification

#### [NEW] [CarListing.php](file:///c:/laragon/www/ramouse/Backend/app/Models/CarListing.php)

Standard Eloquent model with:

**Relationships:**
- `belongsTo(User, 'owner_id')` - owner (both individual & provider)
- `belongsTo(Brand)` - car brand
- `belongsTo(CarCategory)` - car category

**Helper Methods:**
```php
public function getProvider() {
    if ($this->seller_type === 'provider') {
        return $this->owner->carProvider;
    }
    return null;
}

public function getSellerName() {
    return $this->seller_type === 'individual' 
        ? 'بائع فردي' 
        : $this->owner->carProvider->name;
}

public function getContactPhone() {
    // Use listing's contact_phone if set, otherwise owner's phone
    return $this->contact_phone 
        ?? ($this->seller_type === 'individual' 
            ? $this->owner->phone 
            : $this->owner->carProvider->id);
}
```

**Scopes:**
- `scopeAvailable()` - is_available AND NOT is_hidden
- `scopeForSale()` / `scopeForRent()` - filter by listing_type
- `scopeIndividual()` / `scopeProvider()` - filter by seller_type
- `scopeSponsored()` - is_sponsored AND sponsored_until > now
- `scopeFeatured()` - is_featured AND featured_until > now
- `scopeNearLocation($lat, $lng, $radius)` - spatial search

**Casts:**
- `rental_terms` => 'array'
- `body_condition` => 'array'
- `features` => 'array'
- `photos` => 'array'
- `price` => 'decimal:2'
- `sponsored_until` => 'datetime'
- `featured_until` => 'datetime'
- `deleted_at` => 'datetime'

**Traits:**
- `SoftDeletes` - for soft delete support

---

### Backend - Controllers

#### [MODIFY] [AuthController.php](file:///c:/laragon/www/ramouse/Backend/app/Http/Controllers/AuthController.php)

Add `registerCarProvider(Request $request)` method following the `registerTechnician` pattern:

**Validation:**
- phone, password, name (required)
- business_type (required)
- city, address (required)
- business_license (optional)
- profile_photo, gallery (optional, base64)
- location (optional)

**Logic:**
- Create User with role='car_provider'
- Create CarProvider profile
- Generate unique_id (6 digits)
- Handle photo uploads
- Set is_verified=false
- Dispatch `UserRegistered` and `AdminDashboardEvent` events
- Return token

#### [MODIFY] [AuthController.php](file:///c:/laragon/www/ramouse/Backend/app/Http/Controllers/AuthController.php) - Login

Update `login()` method to handle `car_provider` role (lines 46-103):

```php
elseif ($user->role === 'car_provider') {
    $profile = $user->carProvider;
    if (!$profile->is_verified) {
        return response()->json(['message' => 'حسابك قيد المراجعة'], 403);
    }
    if (!$profile->is_active) {
        return response()->json(['message' => 'حسابك غير نشط'], 403);
    }
}
```

#### [NEW] [CarProviderController.php](file:///c:/laragon/www/ramouse/Backend/app/Http/Controllers/CarProviderController.php)

Handles car provider-specific operations:

**Methods:**
- `getProfile()` - Get authenticated provider's profile
- `updateProfile(Request $request)` - Update profile data
- `getMyListings()` - Get provider's car listings
- `getStats()` - Dashboard statistics (total listings, views, contacts)
- `getAnalytics(Request $request)` - **Advanced analytics with date ranges**
  - Total views, unique visitors
  - Contact button clicks (phone/WhatsApp)
  - Favorites/saves count
  - Share count
  - Top performing listings
  - Daily/weekly/monthly trends
  - Conversion rates (views → contacts)
- **`getPublicProfile($id)`** - 🌐 **Public provider profile page** (NEW)
  - Provider info (name, location, rating, verified badge)
  - Gallery photos
  - Social links
  - Total listings count
  - Reviews from customers
- **`getProviderListings($id)`** - Get all **public** listings for a specific provider
  - Filtered by `is_available = true`
  - Paginated
  - For the public profile page

#### [NEW] [CarListingAnalyticsController.php](file:///c:/laragon/www/ramouse/Backend/app/Http/Controllers/CarListingAnalyticsController.php)

Handles analytics event tracking:

**Methods:**
- `trackEvent(Request $request)` - Record analytics event (view, contact, favorite, share)
- `getListingAnalytics($listingId)` - Get analytics for specific listing
- `getProviderAnalytics()` - Get aggregated analytics for authenticated provider

#### [NEW] [CarListingController.php](file:///c:/laragon/www/ramouse/Backend/app/Http/Controllers/CarListingController.php)

Handles car listing CRUD operations:

**Public Methods:**
- `index()` - Browse marketplace with filters (category, brand, price, type, location, sponsored)
- `show($id)` - Get single listing details, increment view count
- `search(Request $request)` - Advanced search with filters
- `getCategories()` - Get all car categories

**Authenticated Provider Methods:**
- `store(Request $request)` - Create new listing (goes live immediately)
- `update(Request $request, $id)` - Update listing
- `destroy($id)` - Delete listing
- `toggleAvailability($id)` - Mark as available/unavailable

**Admin Methods:**
- `sponsorListing($id, $days)` - Mark listing as sponsored with expiry date
- `unsponsorListing($id)` - Remove sponsorship

---

### Backend - Routes

#### [MODIFY] [api.php](file:///c:/laragon/www/ramouse/Backend/routes/api.php)

```php
// Car Provider Authentication
Route::post('/auth/register-car-provider', [AuthController::class, 'registerCarProvider']);

// Public Car Listings & Categories
Route::get('/car-categories', [CarListingController::class, 'getCategories']);
Route::get('/car-listings', [CarListingController::class, 'index']);
Route::get('/car-listings/{id}', [CarListingController::class, 'show']);
Route::post('/car-listings/search', [CarListingController::class, 'search']);

// Analytics Tracking (Public - for tracking views, clicks, etc.)
Route::post('/analytics/track', [CarListingAnalyticsController::class, 'trackEvent']);

// Authenticated Car Provider Routes
Route::middleware('auth:sanctum')->group(function () {
    // Profile
    Route::get('/car-provider/profile', [CarProviderController::class, 'getProfile']);
    Route::put('/car-provider/profile', [CarProviderController::class, 'updateProfile']);
    Route::get('/car-provider/stats', [CarProviderController::class, 'getStats']);
    
    // Analytics
    Route::get('/car-provider/analytics', [CarProviderController::class, 'getAnalytics']);
    Route::get('/car-provider/listings/{id}/analytics', [CarListingAnalyticsController::class, 'getListingAnalytics']);
    
    // Listings Management
    Route::get('/car-provider/listings', [CarListingController::class, 'getMyListings']);
    Route::post('/car-provider/listings', [CarListingController::class, 'store']);
    Route::put('/car-provider/listings/{id}', [CarListingController::class, 'update']);
    Route::delete('/car-provider/listings/{id}', [CarListingController::class, 'destroy']);
    Route::patch('/car-provider/listings/{id}/toggle', [CarListingController::class, 'toggleAvailability']);
});

// Admin Routes
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/car-listings/{id}/sponsor', [CarListingController::class, 'sponsorListing']);
    Route::delete('/admin/car-listings/{id}/sponsor', [CarListingController::class, 'unsponsorListing']);
    Route::get('/admin/car-providers', [AdminController::class, 'getCarProviders']);
    Route::patch('/admin/car-providers/{id}', [AdminController::class, 'updateCarProvider']);
    Route::patch('/admin/car-providers/{id}/trust', [AdminController::class, 'toggleTrustedStatus']);
    
    // Analytics Management
    Route::post('/admin/analytics/archive', [CarListingAnalyticsController::class, 'archiveOldData']);
});
```

---

### Backend - Services

#### [MODIFY] [AuctionWalletService.php](file:///c:/laragon/www/ramouse/Backend/app/Services/AuctionWalletService.php)

Add `car_provider` case in role switch statements (lines 91, 111, 215).

---

### Frontend - Types

#### [MODIFY] [types.ts](file:///c:/laragon/www/ramouse/Frontend/src/types.ts)

Update role type (line 947):

```typescript
role: 'customer' | 'provider' | 'technician' | 'tow_truck' | 'car_provider';
```

Add new interfaces:

```typescript
export interface CarCategory {
  id: number;
  name_ar: string;
  name_en: string;
  icon?: string;
}

export interface CarProvider {
  id: string;
  user_id: number;
  unique_id: string;
  name: string;
  business_type: 'dealership' | 'individual' | 'rental_agency';
  business_license?: string;
  city: string;
  address: string;
  location?: { latitude: number; longitude: number };
  description?: string;
  is_verified: boolean;
  is_active: boolean;
  profile_photo?: string;
  gallery?: GalleryItem[];
  socials?: SocialLinks;
  qr_code_url?: string;
  notification_settings?: any;
  average_rating: number;
  wallet_balance: number;
  saved_addresses?: SavedAddress[];
  payment_info?: any;
  created_at: string;
}

export interface CarListing {
  id: number;
  owner_id: number; // SIMPLIFIED: FK to users.id
  seller_type: 'individual' | 'provider';
  car_provider?: CarProvider; // populated if seller_type='provider'
  car_category_id?: number;
  car_category?: CarCategory; // populated
  listing_type: 'sale' | 'rent';
  title: string; // Display title
  slug: string; // SEO URL
  brand: string;
  model: string;
  year: number;
  mileage: number;
  condition: 'new' | 'used' | 'certified_pre_owned';
  price: number;
  is_negotiable: boolean; // السعر قابل للتفاوض
  rental_terms?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  exterior_color?: string; // خارجي
  interior_color?: string; // داخلي
  transmission?: 'automatic' | 'manual';
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  doors_count?: number; // عدد الأبواب
  seats_count?: number; // عدد المقاعد
  license_plate?: string; // رقم اللوحة
  chassis_number?: string; // رقم الهيكل
  engine_size?: string; // حجم المحرك
  horsepower?: number; // قوة المحرك
  body_style?: string; // نوع الهيكل
  body_condition?: Record<string, string>; // حالة الهيكل
  previous_owners?: number; // عدد المالكين السابقين
  warranty?: string; // الضمان
  features?: string[];
  description?: string;
  photos: string[];
  video_url?: string;
  contact_phone?: string; // للاتصال
  contact_whatsapp?: string; // واتساب
  is_available: boolean;
  is_hidden: boolean; // Admin moderation
  is_sponsored: boolean; // اعلان ممول (providers only)
  sponsored_until?: string;
  is_featured: boolean; // Admin featured (free)
  featured_until?: string;
  featured_position?: number;
  views_count: number;
  deleted_at?: string; // Soft delete
  created_at: string;
  updated_at: string;
}
```

---

### Frontend - Services

#### [NEW] [carprovider.service.ts](file:///c:/laragon/www/ramouse/Frontend/src/services/carprovider.service.ts)

API service for car provider operations:

```typescript
- registerCarProvider(data)
- getProfile()
- updateProfile(data)
- getStats()
- getMyListings()
- createListing(listing)
- updateListing(id, data)
- deleteListing(id)
- toggleAvailability(id)
```

#### [NEW] [carlisting.service.ts](file:///c:/laragon/www/ramouse/Frontend/src/services/carlisting.service.ts)

Public API for car marketplace:

```typescript
- getListings(filters) // brand, priceRange, type, location
- getListing(id)
- searchListings(query, filters)
- incrementView(id)
```

---

### Frontend - Components

#### [NEW] [CarProviderRegistration.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/CarProviderRegistration.tsx)

Multi-step registration form following `TechnicianRegistration` pattern:

**Steps:**
1. Phone & Password
2. Business Information (name, type, license)
3. Location & Address
4. Profile Photo & Gallery
5. Review & Submit

#### [NEW] [CarProviderDashboard.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/CarProviderDashboard.tsx)

Dashboard with sidebar navigation:

**Views:**
- **Overview** (stats, recent views, trending listings)
- **My Listings** (list with edit/delete)
- **Add New Listing** (form)
- **Analytics** 📊 (NEW - Advanced analytics dashboard):
  - **Date Range Selector** (today, week, month, custom)
  - **Key Metrics Cards**:
    - Total Views (with trend ↑↓)
    - Unique Visitors
    - Contact Clicks (phone + WhatsApp)
    - Favorites/Saves
    - Conversion Rate (views → contacts)
  - **Charts**:
    - Views over time (line chart)
    - Top performing listings (bar chart)
    - Traffic sources breakdown
    - Contact methods distribution (WhatsApp vs Phone)
  - **Listing Performance Table**:
    - Each listing with views, contacts, conversion rate
    - Sortable columns
    - Click to see detailed analytics per listing
  - **Export Button** (CSV/PDF reports)
- **Profile Settings**
- **Wallet**

#### [NEW] [CarMarketplace.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/CarMarketplace.tsx)

Public marketplace browsing:

**Layout:**
- **Sponsored Ads Section** (top): Horizontal carousel of sponsored listings with "اعلان ممول" badge
- **Filters Sidebar**: Category, brand, price range, listing type, condition, location
- **Results Grid/List**: Toggle view, sort options (price, year, newest)

**Features:**
- Search bar (brand, model, description)
- "Near Me" location filter
- Category pills/tabs for quick filtering
- Infinite scroll or pagination

#### [NEW] [CarListingDetail.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/CarListingDetail.tsx)

Individual car detail page:

**Sections:**
- **Header**: Title (brand model year), price, sponsored badge (if applicable)
- **Photo Gallery**: Carousel with fullscreen view
- **Specs Table**:
  - Basic: Year, mileage, condition, color, transmission, fuel
  - **New Fields**: Doors, seats, license plate, VIN, engine size, horsepower, body style
- **Body Condition Diagram**: Visual representation of each part's condition
- **Rental Terms** (if type=rent): Daily/weekly/monthly rates
- **Features List**: Badges or chips
- **Description**: Full text
- **Provider Card**: Name, rating, location, contact button (WhatsApp/Phone)
- **Map**: Provider location (if available)
- **Contact Section**: Simple button to call or WhatsApp provider
  - **Analytics Tracking**: Track "contact_phone" or "contact_whatsapp" events when clicked
- **Share Button**: Track "share" event
- **Favorite/Save Button**: Track "favorite" event

**Auto-tracking:**
- Page view tracked automatically on component mount (event_type: 'view')

#### [NEW] [CarListingWizard/](file:///c:/laragon/www/ramouse/Frontend/src/components/CarListingWizard/)

Multi-step modal for creating car listings (Similar to `OrderWizard.tsx`):

**Component Structure:**
```
CarListingWizard/
├── CarListingWizardModal.tsx    // Main modal wrapper
├── CarWizardProgressBar.tsx     // Progress with icons
└── steps/
    ├── Step1BasicInfo.tsx       // 🚗 Title, type, year, mileage
    ├── Step2CategoryBrand.tsx   // 🏷️ Category & Brand (icon cards)
    ├── Step3Specs.tsx           // ⚙️ Specs, colors, engine
    ├── Step4Condition.tsx       // 🔍 Body condition + history
    ├── Step5Media.tsx           // 📸 Photos & video upload
    └── Step6Review.tsx          // ✅ Price, contact, review & publish
```

**6 Steps with Icons:**
1. **Basic Car Info** 🚗 - Title, listing type (sale/rent), year, mileage
2. **Category & Brand** 🏷️ - Large icon cards for category/brand selection
3. **Specs** ⚙️ - Condition, transmission, fuel, doors, seats, colors
4. **Condition & History** 🔍 - Interactive body diagram, VIN, owners, warranty
5. **Photos & Media** 📸 - Drag-drop uploader (1-15 photos), video, description  
6. **Review & Publish** ✅ - Price, negotiable, rental terms, contact info, submit

**Design Pattern (from `Step1Category.tsx`):**
- Large touch-friendly icon cards
- Framer Motion animations
- Haptic feedback on mobile
- Progress bar with step navigation
- Exit button in top corner
- Emoji/icon heavy for easy use

**Shared Components:**
- `<IconCard />` - Reusable selection card with icon
- `<CarBodyDiagram />` - Interactive SVG for body condition
- `<PhotoUploader />` - Drag-drop with preview
- `<ColorPicker />` - Color selection grid

---

### Frontend - Routing

#### [MODIFY] [App.tsx](file:///c:/laragon/www/ramouse/Frontend/src/App.tsx)

Add new routes:

```typescript
// Registration
<Route path="/register-car-provider" element={<CarProviderRegistration ... />} />

// Dashboard (protected)
<Route path="/car-provider/*" element={
  isCarProvider ? <CarProviderDashboard ... /> : <Navigate to="/" />
} />

// Public Marketplace
<Route path="/cars" element={<CarMarketplace />} />
<Route path="/cars/:listingId" element={<CarListingDetail />} />
```

Add redirect logic in Welcome screen route (lines 688-717).

---

### Frontend - State Management

#### [MODIFY] [useAppState.ts](file:///c:/laragon/www/ramouse/Frontend/src/hooks/useAppState.ts)

Add state variables:

```typescript
const [loggedInCarProvider, setLoggedInCarProvider] = useState<CarProvider | null>(null);
const [isCarProvider, setIsCarProvider] = useState(false);
const [carListings, setCarListings] = useState<CarListing[]>([]);
```

Update authentication handling to set `isCarProvider` when role === 'car_provider'.

---

### Frontend - Admin Dashboard

#### [MODIFY] [AdminDashboard.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/AdminDashboard.tsx)

Add new sidebar tab: "Car Providers" and "Car Categories".

#### [NEW] [CarProvidersView.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/DashboardParts/CarProvidersView.tsx)

Admin view to manage car providers:

**Features:**
- List all car providers with verification status
- Verify/unverify toggle
- Activate/deactivate toggle
- View provider details and statistics
- View all listings from provider

#### [NEW] [CarListingsSponsorView.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/DashboardParts/CarListingsSponsorView.tsx)

Admin view for managing sponsored listings:

**Features:**
- List all car listings
- Filter by sponsored status
- Sponsor listing (set duration in days)
- Remove sponsorship
- View sponsorship expiry dates

#### [NEW] [CarCategoriesView.tsx](file:///c:/laragon/www/ramouse/Frontend/src/components/DashboardParts/CarCategoriesView.tsx)

Admin view for managing car categories:

**Features:**
- List all categories (Arabic/English names)
- Add new category
- Edit category
- Delete category (if no listings)

---

## Verification Plan

### Automated Tests

> [!NOTE]
> No existing automated tests were found in this project. Testing will be manual.

### Manual Verification

#### Backend API Testing

**Prerequisites:** Install and use Postman or similar API client.

1. **Registration Endpoint**
   ```bash
   POST http://localhost/api/auth/register-car-provider
   Body (JSON):
   {
     "phone": "+963991234567",
     "password": "test123",
     "name": "Car Dealership Inc",
     "business_type": "dealership",
     "city": "Damascus",
     "address": "Main Street 123"
   }
   ```
   **Expected:** Returns 200 with user object and token. User should have `is_verified: false`.

2. **Login Verification**
   ```bash
   POST http://localhost/api/auth/login
   Body (JSON):
   {
     "phone": "+963991234567",
     "password": "test123"
   }
   ```
   **Expected:** Returns 403 with message "حسابك قيد المراجعة" (account under review).

3. **Admin Verification** (manual via database or admin panel)
   - Update `car_providers` table: set `is_verified = 1` for the test user
   - Try login again
   **Expected:** Returns 200 with token and role='car_provider'

4. **Get Car Categories**
   ```bash
   GET http://localhost/api/car-categories
   ```
   **Expected:** Returns 200 with array of categories (if seeded).

5. **Create Listing**
   ```bash
   POST http://localhost/api/car-provider/listings
   Headers: Authorization: Bearer {token}
   Body (JSON):
   {
     "listing_type": "sale",
     "car_category_id": 1,
     "brand": "Toyota",
     "model": "Camry",
     "year": 2022,
     "mileage": 15000,
     "condition": "used",
     "price": 25000,
     "doors_count": 4,
     "license_plate": "ABC123",
     "chassis_number": "1HGBH41JXMN109186",
     "engine_size": "2.5L",
     "body_style": "sedan",
     "body_condition": {"front_door": "pristine", "hood": "scratched"},
     "photos": ["data:image/jpeg;base64,..."],
     "description": "Excellent condition"
   }
   ```
   **Expected:** Returns 201 with created listing. **Should be immediately available** (no admin approval).

6. **Browse Marketplace (Public)**
   ```bash
   GET http://localhost/api/car-listings
   ```
   **Expected:** Returns 200 with array. Should INCLUDE the newly created listing (goes live immediately).

#### Frontend Testing

**Prerequisites:** Ensure dev server is running (`npm run dev` in Frontend folder).

1. **Registration Flow**
   - Navigate to `/register-car-provider`
   - Fill out all steps
   - Submit form
   **Expected:** Success message, user redirected with "account pending approval" notice.

2. **Login as CarProvider**
   - Navigate to `/` (welcome screen)
   - Click login, enter credentials
   - If not verified, should see error toast
   - If verified, should redirect to `/car-provider` dashboard

3. **Dashboard Functionality**
   - **Overview tab:** Should show stats (0 listings, 0 views initially)
   - **My Listings tab:** Should show empty state with "Add Listing" button
   - **Add Listing:** 
     - Fill all new fields (doors, plates, VIN, engine, body condition)
     - Upload photos, submit
   - **Expected:** Listing appears immediately in "My Listings" as **Active** (no approval needed)

4. **Public Marketplace**
   - Navigate to `/cars`
   - **Top Section:** Should show sponsored listings carousel (empty initially)
   - **Main Grid:** Should see newly created listing immediately
   - Click on a listing → navigate to `/cars/:id`
   - Detail page should show:
     - All specs including new fields (doors, plates, VIN, engine)
     - Body condition diagram/list
     - Contact button (WhatsApp/Phone)

5. **Admin Sponsor Feature**
   - Login as admin
   - Navigate to Admin Dashboard → "Car Providers" tab
   - Verify the test car provider
   - Navigate to "Sponsored Listings" tab
   - Select a listing, click "Sponsor (اعلان ممول)"
   - Set duration (e.g., 7 days)
   - **Expected:** 
     - Listing appears in sponsored carousel on marketplace
     - Has "اعلان ممول" badge
     - Shows expiry date in admin view

6. **Filters & Search**
   - In marketplace, use category filter
   - Use brand filter, price range slider
   - Use "For Sale" / "For Rent" toggle
   - **Expected:** Results update dynamically

---

## Deployment Considerations

1. **Database Migration:** Run migrations on production database with backup.
2. **File Storage:** Ensure `storage/app/public/car_providers` and `car_listings` directories exist and are writable.
3. **Role Permissions:** Update any middleware that checks roles to include `car_provider`.
4. **Real-time Events:** Add `car_provider` to Laravel Echo channel subscriptions if needed.

---

## Future Enhancements (Out of Scope)

- Inquiry/messaging system between customers and car providers
- Booking calendar for rentals
- Payment integration for deposits
- Car comparison tool (side-by-side comparison)
