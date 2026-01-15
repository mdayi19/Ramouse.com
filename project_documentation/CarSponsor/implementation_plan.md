# Sponsor Listing Payment System - Final Implementation Plan

## 📋 Executive Summary

Complete sponsor listing system where car providers pay from their wallet to promote listings. Admin has full control over pricing via database settings. Includes backend API, frontend UI, admin dashboard, and automated expiry.

**Total Effort:** 25 hours | **6 Phases** | **3 New Files** | **13 Modified Files**

---

## 🎯 System Overview

### User Flow - Car Provider
1. Provider goes to Dashboard → Listings
2. Clicks "Sponsor" button on a listing
3. Modal opens with duration selector (7, 30, 90 days or custom)
4. System calculates price based on admin settings
5. Provider confirms → wallet deducted → listing becomes sponsored
6. Listing appears first in marketplace with badge
7. Provider can unsponsor anytime for pro-rated refund

### User Flow - Admin
1. Admin goes to Dashboard → Car Listings Sponsor
2. Views all listings with sponsor status
3. Can sponsor any listing for FREE (marketing)
4. Updates pricing settings (daily, weekly, monthly)
5. Views revenue analytics
6. Views sponsorship history

---

## 📁 Complete File Structure

### New Files (3)
```
Backend/
├── database/migrations/
│   └── 2026_01_15_000001_create_car_listing_sponsorship_histories_table.php
├── app/Models/
│   └── CarListingSponsorshipHistory.php
└── app/Console/Commands/
    └── ExpireSponsorships.php

Frontend/
└── src/components/CarMarketplace/CarProviderDashboard/
    └── SponsorListingModal.tsx
```

### Modified Files (13)
```
Backend/
├── app/Http/Controllers/Api/CarListingController.php
├── app/Http/Controllers/AdminController.php
├── app/Models/CarListing.php
├── routes/api.php
└── app/Console/Kernel.php

Frontend/
├── src/components/CarMarketplace/CarProviderDashboard/ListingsView.tsx
├── src/components/CarMarketplace/MarketplaceParts/CarListingCard.tsx
├── src/components/CarMarketplace/MarketplaceParts/RentListingCard.tsx
├── src/components/CarMarketplace/CarListingDetail.tsx
├── src/components/CarMarketplace/RentCarListingDetail.tsx
├── src/components/CarMarketplace/CarMarketplacePage.tsx
├── src/components/CarMarketplace/RentCarPage.tsx
└── src/components/DashboardParts/CarListingsSponsorView.tsx
```

---

## 🗄️ Phase 1: Database & Settings (3 hours)

### Step 1.1: Create Sponsorship History Migration

**File:** `Backend/database/migrations/2026_01_15_000001_create_car_listing_sponsorship_histories_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('car_listing_sponsorship_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_listing_id')->constrained('car_listings')->onDelete('cascade');
            $table->foreignId('sponsored_by_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('sponsored_from');
            $table->timestamp('sponsored_until');
            $table->decimal('price', 10, 2); // Amount paid (0 for admin)
            $table->integer('duration_days');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->boolean('is_admin_sponsored')->default(false);
            $table->timestamps();
            
            $table->index(['car_listing_id', 'status']);
            $table->index('sponsored_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_listing_sponsorship_histories');
    }
};
```

**Run:** `php artisan migrate`

### Step 1.2: Seed Sponsor Settings

**File:** `Backend/database/seeders/SponsorSettingsSeeder.php` (create if needed)

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSettings;

class SponsorSettingsSeeder extends Seeder
{
    public function run(): void
    {
        SystemSettings::updateOrCreate(
            ['key' => 'sponsorSettings'],
            ['value' => json_encode([
                'dailyPrice' => 10,
                'weeklyPrice' => 60,
                'monthlyPrice' => 200,
                'maxDuration' => 90,
                'minDuration' => 1,
                'enabled' => true,
            ])]
        );
    }
}
```

**Run:** `php artisan db:seed --class=SponsorSettingsSeeder`

### Step 1.3: Create CarListingSponsorshipHistory Model

**File:** `Backend/app/Models/CarListingSponsorshipHistory.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarListingSponsorshipHistory extends Model
{
    protected $fillable = [
        'car_listing_id',
        'sponsored_by_user_id',
        'sponsored_from',
        'sponsored_until',
        'price',
        'duration_days',
        'status',
        'refund_amount',
        'refunded_at',
        'is_admin_sponsored',
    ];

    protected $casts = [
        'sponsored_from' => 'datetime',
        'sponsored_until' => 'datetime',
        'refunded_at' => 'datetime',
        'price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'is_admin_sponsored' => 'boolean',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(CarListing::class, 'car_listing_id');
    }

    public function sponsoredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sponsored_by_user_id');
    }
}
```

### Step 1.4: Update CarListing Model

**File:** `Backend/app/Models/CarListing.php`

**Add these relationships:**

```php
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

public function sponsorshipHistories(): HasMany
{
    return $this->hasMany(CarListingSponsorshipHistory::class);
}

public function activeSponsorship(): HasOne
{
    return $this->hasOne(CarListingSponsorshipHistory::class)
        ->where('status', 'active')
        ->latest();
}
```

---

## 🔧 Phase 2: Backend API (5 hours)

### Step 2.1: Add Provider Sponsor Endpoints

**File:** `Backend/app/Http/Controllers/Api/CarListingController.php`

**Add these 3 methods:**

```php
use App\Models\UserTransaction;
use App\Models\CarListingSponsorshipHistory;
use Illuminate\Support\Facades\DB;

/**
 * Calculate sponsor price based on duration
 */
public function calculateSponsorPrice(Request $request)
{
    $validated = $request->validate([
        'days' => 'required|integer|min:1|max:90'
    ]);
    
    $days = $validated['days'];
    
    // Get pricing from admin settings
    $settings = \App\Models\SystemSettings::getSetting('sponsorSettings');
    
    if (!$settings || !($settings['enabled'] ?? true)) {
        return response()->json(['error' => 'Sponsorship is currently disabled'], 400);
    }
    
    $pricing = [
        'daily' => $settings['dailyPrice'] ?? 10,
        'weekly' => $settings['weeklyPrice'] ?? 60,
        'monthly' => $settings['monthlyPrice'] ?? 200,
    ];
    
    // Calculate with tier discounts
    if ($days >= 30) {
        $months = ceil($days / 30);
        $price = $pricing['monthly'] * $months;
        $tier = 'monthly';
    } elseif ($days >= 7) {
        $weeks = ceil($days / 7);
        $price = $pricing['weekly'] * $weeks;
        $tier = 'weekly';
    } else {
        $price = $pricing['daily'] * $days;
        $tier = 'daily';
    }
    
    return response()->json([
        'price' => $price,
        'days' => $days,
        'tier' => $tier,
        'breakdown' => [
            'dailyPrice' => $pricing['daily'],
            'weeklyPrice' => $pricing['weekly'],
            'monthlyPrice' => $pricing['monthly'],
        ]
    ]);
}

/**
 * Sponsor a listing (Provider pays from wallet)
 */
public function sponsorListing(Request $request, $id)
{
    $validated = $request->validate([
        'duration_days' => 'required|integer|min:1|max:90'
    ]);
    
    $listing = CarListing::findOrFail($id);
    $user = auth('sanctum')->user();
    
    // Validate ownership
    if ($listing->owner_id !== $user->id) {
        return response()->json(['error' => 'غير مصرح لك برعاية هذا الإعلان'], 403);
    }
    
    // Check if already sponsored
    if ($listing->is_sponsored && $listing->sponsored_until && $listing->sponsored_until->isFuture()) {
        return response()->json([
            'error' => 'الإعلان مرعي بالفعل حتى ' . $listing->sponsored_until->format('Y-m-d')
        ], 400);
    }
    
    $provider = $user->carProvider;
    
    if (!$provider) {
        return response()->json(['error' => 'حساب مزود السيارات غير موجود'], 404);
    }
    
    // Calculate price
    $priceResponse = $this->calculateSponsorPrice(new Request(['days' => $validated['duration_days']]));
    $priceData = json_decode($priceResponse->getContent(), true);
    
    if (isset($priceData['error'])) {
        return response()->json($priceData, 400);
    }
    
    $price = $priceData['price'];
    
    // Check balance
    if ($provider->wallet_balance < $price) {
        return response()->json([
            'error' => 'رصيد المحفظة غير كافٍ',
            'required' => $price,
            'current_balance' => $provider->wallet_balance,
            'shortage' => $price - $provider->wallet_balance
        ], 400);
    }
    
    DB::transaction(function () use ($listing, $provider, $price, $validated, $user) {
        // Deduct from wallet
        $balanceBefore = $provider->wallet_balance;
        $provider->decrement('wallet_balance', $price);
        $provider->refresh();
        
        // Create wallet transaction
        UserTransaction::create([
            'user_id' => $user->id,
            'user_type' => 'car_provider',
            'type' => 'payment',
            'amount' => -$price,
            'description' => "رعاية إعلان: {$listing->title} لمدة {$validated['duration_days']} يوم",
            'balance_after' => $provider->wallet_balance,
            'reference_type' => 'car_listing_sponsorship',
            'reference_id' => $listing->id,
        ]);
        
        // Activate sponsorship
        $sponsoredUntil = now()->addDays($validated['duration_days']);
        $listing->update([
            'is_sponsored' => true,
            'sponsored_until' => $sponsoredUntil,
        ]);
        
        // Create sponsorship history
        CarListingSponsorshipHistory::create([
            'car_listing_id' => $listing->id,
            'sponsored_by_user_id' => $user->id,
            'sponsored_from' => now(),
            'sponsored_until' => $sponsoredUntil,
            'price' => $price,
            'duration_days' => $validated['duration_days'],
            'status' => 'active',
            'is_admin_sponsored' => false,
        ]);
    });
    
    return response()->json([
        'success' => true,
        'message' => 'تم تفعيل الرعاية بنجاح',
        'listing' => $listing->fresh(),
        'new_balance' => $provider->wallet_balance,
        'amount_paid' => $price,
    ]);
}

/**
 * Unsponsor a listing with pro-rated refund
 */
public function unsponsorListing($id)
{
    $listing = CarListing::findOrFail($id);
    $user = auth('sanctum')->user();
    
    // Validate ownership
    if ($listing->owner_id !== $user->id) {
        return response()->json(['error' => 'غير مصرح'], 403);
    }
    
    if (!$listing->is_sponsored) {
        return response()->json(['error' => 'الإعلان غير مرعي'], 400);
    }
    
    $provider = $user->carProvider;
    $history = $listing->sponsorshipHistories()
        ->where('status', 'active')
        ->first();
    
    if (!$history) {
        return response()->json(['error' => 'لا توجد رعاية نشطة'], 404);
    }
    
    // Don't refund admin-sponsored listings
    if ($history->is_admin_sponsored) {
        return response()->json(['error' => 'لا يمكن إلغاء الرعاية الإدارية'], 400);
    }
    
    // Calculate refund
    $remainingDays = now()->diffInDays($listing->sponsored_until, false);
    $refundAmount = 0;
    
    if ($remainingDays > 0 && $history->price > 0) {
        $refundAmount = ($history->price / $history->duration_days) * $remainingDays;
        $refundAmount = round($refundAmount, 2);
    }
    
    DB::transaction(function () use ($listing, $provider, $history, $refundAmount, $user) {
        // Refund to wallet
        if ($refundAmount > 0) {
            $provider->increment('wallet_balance', $refundAmount);
            $provider->refresh();
            
            UserTransaction::create([
                'user_id' => $user->id,
                'user_type' => 'car_provider',
                'type' => 'refund',
                'amount' => $refundAmount,
                'description' => "استرجاع رعاية: {$listing->title}",
                'balance_after' => $provider->wallet_balance,
                'reference_type' => 'car_listing_sponsorship',
                'reference_id' => $listing->id,
            ]);
        }
        
        // Cancel sponsorship
        $listing->update([
            'is_sponsored' => false,
            'sponsored_until' => null,
        ]);
        
        $history->update([
            'status' => 'cancelled',
            'refund_amount' => $refundAmount,
            'refunded_at' => now(),
        ]);
    });
    
    return response()->json([
        'success' => true,
        'message' => 'تم إلغاء الرعاية',
        'refund_amount' => $refundAmount,
        'new_balance' => $provider->wallet_balance,
    ]);
}
```

### Step 2.2: Add Admin Sponsor Endpoints

**File:** `Backend/app/Http/Controllers/AdminController.php`

**Add these 5 methods:**

```php
use App\Models\CarListing;
use App\Models\CarListingSponsorshipHistory;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\DB;

/**
 * Get sponsor settings
 */
public function getSponsorSettings()
{
    $settings = SystemSettings::getSetting('sponsorSettings');
    
    if (!$settings) {
        $settings = [
            'dailyPrice' => 10,
            'weeklyPrice' => 60,
            'monthlyPrice' => 200,
            'maxDuration' => 90,
            'minDuration' => 1,
            'enabled' => true,
        ];
    }
    
    return response()->json(['settings' => $settings]);
}

/**
 * Update sponsor settings
 */
public function updateSponsorSettings(Request $request)
{
    $validated = $request->validate([
        'dailyPrice' => 'required|numeric|min:0',
        'weeklyPrice' => 'required|numeric|min:0',
        'monthlyPrice' => 'required|numeric|min:0',
        'maxDuration' => 'required|integer|min:1|max:365',
        'minDuration' => 'required|integer|min:1',
        'enabled' => 'required|boolean',
    ]);
    
    SystemSettings::updateOrCreate(
        ['key' => 'sponsorSettings'],
        ['value' => json_encode($validated)]
    );
    
    return response()->json([
        'success' => true,
        'message' => 'تم تحديث إعدادات الرعاية بنجاح'
    ]);
}

/**
 * Admin sponsor listing (FREE)
 */
public function adminSponsorListing(Request $request, $id)
{
    $validated = $request->validate([
        'duration_days' => 'required|integer|min:1|max:365'
    ]);
    
    $listing = CarListing::findOrFail($id);
    
    DB::transaction(function () use ($listing, $validated, $request) {
        $sponsoredUntil = now()->addDays($validated['duration_days']);
        
        // Cancel any existing active sponsorship
        $listing->sponsorshipHistories()
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);
        
        $listing->update([
            'is_sponsored' => true,
            'sponsored_until' => $sponsoredUntil,
        ]);
        
        CarListingSponsorshipHistory::create([
            'car_listing_id' => $listing->id,
            'sponsored_by_user_id' => $request->user()->id,
            'sponsored_from' => now(),
            'sponsored_until' => $sponsoredUntil,
            'price' => 0, // Free for admin
            'duration_days' => $validated['duration_days'],
            'status' => 'active',
            'is_admin_sponsored' => true,
        ]);
    });
    
    return response()->json([
        'success' => true,
        'message' => 'تم تفعيل الرعاية بنجاح'
    ]);
}

/**
 * Get all sponsorships (history)
 */
public function getAllSponsorships(Request $request)
{
    $sponsorships = CarListingSponsorshipHistory::with([
        'listing:id,title,price',
        'sponsoredBy:id,name'
    ])
        ->orderBy('created_at', 'desc')
        ->paginate(20);
    
    return response()->json($sponsorships);
}

/**
 * Get sponsorship revenue analytics
 */
public function getSponsorshipRevenue(Request $request)
{
    // Total revenue (exclude admin-sponsored)
    $totalRevenue = CarListingSponsorshipHistory::where('is_admin_sponsored', false)
        ->sum('price');
    
    // Monthly revenue
    $monthlyRevenue = CarListingSponsorshipHistory::where('is_admin_sponsored', false)
        ->where('created_at', '>=', now()->startOfMonth())
        ->sum('price');
    
    // Active sponsorships count
    $activeSponsorships = CarListingSponsorshipHistory::where('status', 'active')->count();
    
    // This week revenue
    $weeklyRevenue = CarListingSponsorshipHistory::where('is_admin_sponsored', false)
        ->where('created_at', '>=', now()->startOfWeek())
        ->sum('price');
    
    return response()->json([
        'totalRevenue' => (float) $totalRevenue,
        'monthlyRevenue' => (float) $monthlyRevenue,
        'weeklyRevenue' => (float) $weeklyRevenue,
        'activeSponsorships' => $activeSponsorships,
    ]);
}
```

### Step 2.3: Add API Routes

**File:** `Backend/routes/api.php`

**Add these routes:**

```php
// Provider sponsor endpoints (authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/car-listings/sponsor-price', [CarListingController::class, 'calculateSponsorPrice']);
    Route::post('/car-listings/{id}/sponsor', [CarListingController::class, 'sponsorListing']);
    Route::post('/car-listings/{id}/unsponsor', [CarListingController::class, 'unsponsorListing']);
});

// Admin sponsor endpoints
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Sponsor settings
    Route::get('/sponsor-settings', [AdminController::class, 'getSponsorSettings']);
    Route::put('/sponsor-settings', [AdminController::class, 'updateSponsorSettings']);
    
    // Sponsor management
    Route::post('/car-listings/{id}/sponsor', [AdminController::class, 'adminSponsorListing']);
    Route::get('/sponsorships', [AdminController::class, 'getAllSponsorships']);
    Route::get('/sponsorship-revenue', [AdminController::class, 'getSponsorshipRevenue']);
});
```

---

## 🎨 Phase 3: Provider Dashboard UI (6 hours)

### Step 3.1: Create SponsorListingModal

**File:** `Frontend/src/components/CarMarketplace/CarProviderDashboard/SponsorListingModal.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { CarListing } from '../../../types';

interface Props {
    listing: CarListing;
    walletBalance: number;
    onClose: () => void;
    onSuccess: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SponsorListingModal: React.FC<Props> = ({ listing, walletBalance, onClose, onSuccess, showToast }) => {
    const [duration, setDuration] = useState(7);
    const [price, setPrice] = useState(0);
    const [tier, setTier] = useState('daily');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        calculatePrice();
    }, [duration]);

    const calculatePrice = async () => {
        setCalculating(true);
        try {
            const response = await fetch(`/api/car-listings/sponsor-price?days=${duration}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setPrice(data.price);
            setTier(data.tier);
        } catch (error) {
            showToast('فشل حساب السعر', 'error');
        } finally {
            setCalculating(false);
        }
    };

    const handleSponsor = async () => {
        if (walletBalance < price) {
            showToast('رصيد المحفظة غير كافٍ', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/car-listings/${listing.id}/sponsor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ duration_days: duration })
            });

            const data = await response.json();

            if (data.success) {
                showToast('تم تفعيل الرعاية بنجاح', 'success');
                onSuccess();
                onClose();
            } else {
                showToast(data.error || 'فشل تفعيل الرعاية', 'error');
            }
        } catch (error) {
            showToast('حدث خطأ أثناء تفعيل الرعاية', 'error');
        } finally {
            setLoading(false);
        }
    };

    const presets = [
        { days: 7, label: 'أسبوع' },
        { days: 30, label: 'شهر' },
        { days: 90, label: '3 أشهر' }
    ];

    return (
        <Modal title="رعاية الإعلان" onClose={onClose}>
            <div className="space-y-6">
                {/* Listing Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        سيظهر إعلانك في أول نتائج البحث مع شارة "إعلان ممول"
                    </p>
                </div>

                {/* Duration Selector */}
                <div>
                    <label className="block text-sm font-medium mb-2">المدة</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {presets.map(preset => (
                            <button
                                key={preset.days}
                                onClick={() => setDuration(preset.days)}
                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                    duration === preset.days
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm">أو أدخل عدد الأيام:</label>
                        <input
                            type="number"
                            min="1"
                            max="90"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                            className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                        />
                    </div>
                </div>

                {/* Price Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">المدة:</span>
                        <span className="font-bold">{duration} يوم</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">الفئة:</span>
                        <span className="font-medium">
                            {tier === 'monthly' && 'شهري (خصم 33%)'}
                            {tier === 'weekly' && 'أسبوعي (خصم 14%)'}
                            {tier === 'daily' && 'يومي'}
                        </span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold">السعر:</span>
                            <span className="font-bold text-primary">
                                {calculating ? '...' : `${price} ريال`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Balance Check */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>الرصيد الحالي:</span>
                        <span className="font-medium">{walletBalance} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>الرصيد بعد الخصم:</span>
                        <span className={`font-medium ${walletBalance - price < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {walletBalance - price} ريال
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSponsor}
                        disabled={loading || walletBalance < price || calculating}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'جاري التفعيل...' : walletBalance < price ? 'رصيد غير كافٍ' : 'تأكيد الدفع'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SponsorListingModal;
```

### Step 3.2: Update ListingsView

**File:** `Frontend/src/components/CarMarketplace/CarProviderDashboard/ListingsView.tsx`

**Add these imports:**
```tsx
import SponsorListingModal from './SponsorListingModal';
import { useState } from 'react';
```

**Add state:**
```tsx
const [sponsorModal, setSponsorModal] = useState<{ open: boolean; listing: any | null }>({
    open: false,
    listing: null
});
```

**Add sponsor button to each listing card (in the actions section):**
```tsx
{/* Sponsor Button */}
{!listing.is_sponsored ? (
    <button
        onClick={() => setSponsorModal({ open: true, listing })}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md"
    >
        <span>⭐</span>
        <span>رعاية الإعلان</span>
    </button>
) : (
    <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-lg">
            <span>🌟</span>
            <span className="font-bold">مُعلن عنه حتى {new Date(listing.sponsored_until).toLocaleDateString('ar-SY')}</span>
        </div>
        <button
            onClick={() => handleUnsponsor(listing.id)}
            className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition-colors"
        >
            إلغاء الرعاية
        </button>
    </div>
)}
```

**Add unsponsor handler:**
```tsx
const handleUnsponsor = async (listingId: number) => {
    if (!confirm('هل تريد إلغاء رعاية هذا الإعلان؟ سيتم استرجاع المبلغ المتبقي.')) {
        return;
    }

    try {
        const response = await fetch(`/api/car-listings/${listingId}/unsponsor`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(`تم إلغاء الرعاية. استرجاع: ${data.refund_amount} ريال`, 'success');
            loadListings(); // Refresh listings
        } else {
            showToast(data.error || 'فشل إلغاء الرعاية', 'error');
        }
    } catch (error) {
        showToast('حدث خطأ', 'error');
    }
};
```

**Add modal at the end:**
```tsx
{sponsorModal.open && sponsorModal.listing && (
    <SponsorListingModal
        listing={sponsorModal.listing}
        walletBalance={provider.walletBalance || 0}
        onClose={() => setSponsorModal({ open: false, listing: null })}
        onSuccess={() => {
            loadListings(); // Refresh listings
        }}
        showToast={showToast}
    />
)}
```

---

## 🏪 Phase 4: Marketplace Display (3 hours)

### Step 4.1: Add Sponsored Badge to CarListingCard

**File:** `Frontend/src/components/CarMarketplace/MarketplaceParts/CarListingCard.tsx`

**Add badge at the top of the card (inside the main container):**

```tsx
{/* Sponsored Badge */}
{listing.is_active_sponsor && (
    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
        <span className="text-sm">⭐</span>
        <span>إعلان ممول</span>
    </div>
)}
```

### Step 4.2: Add Sponsored Badge to RentListingCard

**File:** `Frontend/src/components/CarMarketplace/MarketplaceParts/RentListingCard.tsx`

**Same badge as CarListingCard:**

```tsx
{listing.is_active_sponsor && (
    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
        <span className="text-sm">⭐</span>
        <span>إعلان ممول</span>
    </div>
)}
```

### Step 4.3: Add Badge to Detail Pages

**Files:** 
- `Frontend/src/components/CarMarketplace/CarListingDetail.tsx`
- `Frontend/src/components/CarMarketplace/RentCarListingDetail.tsx`

**Add near the title:**

```tsx
{listing.is_active_sponsor && (
    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1.5 rounded-full text-sm font-semibold border border-yellow-300 dark:border-yellow-700">
        <span>⭐</span>
        <span>إعلان ممول</span>
    </span>
)}
```

### Step 4.4: Update Marketplace Sorting

**Files:**
- `Frontend/src/components/CarMarketplace/CarMarketplacePage.tsx`
- `Frontend/src/components/CarMarketplace/RentCarPage.tsx`

**Change default sort:**

```tsx
// Find the useState for sortBy and change default value
const [sortBy, setSortBy] = useState('sponsored'); // Changed from 'created_at'
```

---

## 👨‍💼 Phase 5: Admin Dashboard (4 hours)

### Step 5.1: Enhance CarListingsSponsorView

**File:** `Frontend/src/components/DashboardParts/CarListingsSponsorView.tsx`

**Add new state at the top:**

```tsx
const [settings, setSettings] = useState({
    dailyPrice: 10,
    weeklyPrice: 60,
    monthlyPrice: 200,
    maxDuration: 90,
    minDuration: 1,
    enabled: true
});
const [revenue, setRevenue] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    activeSponsorships: 0
});
const [history, setHistory] = useState([]);
const [activeTab, setActiveTab] = useState<'listings' | 'history'>('listings');
```

**Add these functions:**

```tsx
const loadSettings = async () => {
    try {
        const response = await fetch('/api/admin/sponsor-settings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await response.json();
        setSettings(data.settings);
    } catch (error) {
        console.error('Failed to load settings');
    }
};

const saveSettings = async () => {
    try {
        await fetch('/api/admin/sponsor-settings', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        showToast('تم تحديث الإعدادات', 'success');
    } catch (error) {
        showToast('فشل تحديث الإعدادات', 'error');
    }
};

const loadRevenue = async () => {
    try {
        const response = await fetch('/api/admin/sponsorship-revenue', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await response.json();
        setRevenue(data);
    } catch (error) {
        console.error('Failed to load revenue');
    }
};

const loadHistory = async () => {
    try {
        const response = await fetch('/api/admin/sponsorships', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await response.json();
        setHistory(data.data || []);
    } catch (error) {
        console.error('Failed to load history');
    }
};

useEffect(() => {
    loadSettings();
    loadRevenue();
    loadHistory();
}, []);
```

**Add Settings Card before the search:**

```tsx
{/* Pricing Settings */}
<div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-bold mb-4">Sponsor Pricing Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
            <label className="block text-sm font-medium mb-2">Daily Price (SAR)</label>
            <input
                type="number"
                value={settings.dailyPrice}
                onChange={(e) => setSettings({...settings, dailyPrice: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
        </div>
        <div>
            <label className="block text-sm font-medium mb-2">Weekly Price (SAR)</label>
            <input
                type="number"
                value={settings.weeklyPrice}
                onChange={(e) => setSettings({...settings, weeklyPrice: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
        </div>
        <div>
            <label className="block text-sm font-medium mb-2">Monthly Price (SAR)</label>
            <input
                type="number"
                value={settings.monthlyPrice}
                onChange={(e) => setSettings({...settings, monthlyPrice: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
        </div>
    </div>
    <button
        onClick={saveSettings}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold"
    >
        Save Pricing
    </button>
</div>
```

**Update Stats to include revenue:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-green-600">${revenue.totalRevenue.toFixed(2)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-blue-600">${revenue.monthlyRevenue.toFixed(2)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-purple-600">{revenue.activeSponsorships}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Sponsorships</div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-orange-600">${revenue.weeklyRevenue.toFixed(2)}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
    </div>
</div>
```

---

## ⏰ Phase 6: Scheduled Jobs (1 hour)

### Step 6.1: Create Expiry Command

**File:** `Backend/app/Console/Commands/ExpireSponsorships.php`

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CarListing;

class ExpireSponsorships extends Command
{
    protected $signature = 'sponsorships:expire';
    protected $description = 'Expire sponsored listings past their expiry date';

    public function handle()
    {
        $expired = CarListing::where('is_sponsored', true)
            ->where('sponsored_until', '<', now())
            ->get();

        foreach ($expired as $listing) {
            $listing->update(['is_sponsored' => false]);
            
            $listing->sponsorshipHistories()
                ->where('status', 'active')
                ->update(['status' => 'expired']);
        }

        $count = $expired->count();
        $this->info("Expired {$count} sponsorships");
        
        return 0;
    }
}
```

### Step 6.2: Schedule Command

**File:** `Backend/app/Console/Kernel.php`

**Add to schedule method:**

```php
protected function schedule(Schedule $schedule)
{
    // Expire sponsorships daily at midnight
    $schedule->command('sponsorships:expire')->daily();
}
```

---

## ✅ Testing & Verification (3 hours)

### Manual Test Cases

**Test 1: Provider Sponsors Listing**
1. Login as car provider
2. Add 100 SAR to wallet (via admin or deposit)
3. Go to Dashboard → Listings
4. Click "Sponsor" on a listing
5. Select 7 days
6. Verify price shows 60 SAR
7. Confirm
8. ✅ Balance should be 40 SAR
9. ✅ Listing should show "مُعلن عنه" badge
10. Go to Wallet → Transactions
11. ✅ Should see "رعاية إعلان" transaction

**Test 2: Marketplace Display**
1. Logout
2. Go to marketplace
3. ✅ Sponsored listing should appear FIRST
4. ✅ Should have yellow/orange badge
5. Click on sponsored listing
6. ✅ Detail page should show "إعلان ممول" badge

**Test 3: Unsponsor with Refund**
1. Login as provider
2. Go to Dashboard → Listings
3. Click "إلغاء الرعاية" on sponsored listing
4. Confirm
5. ✅ Should show refund amount
6. ✅ Balance should increase
7. ✅ Badge should disappear

**Test 4: Admin Sponsor (Free)**
1. Login as admin
2. Go to Dashboard → Car Listings Sponsor
3. Enter days for a listing
4. Click "Sponsor"
5. ✅ Listing should be sponsored
6. ✅ No wallet deduction
7. ✅ History should show "Admin" sponsored

**Test 5: Admin Settings**
1. Login as admin
2. Go to Car Listings Sponsor
3. Change daily price to 15
4. Save
5. Logout, login as provider
6. Try to sponsor for 1 day
7. ✅ Price should be 15 SAR

**Test 6: Expiry**
1. Manually set `sponsored_until` to yesterday in database
2. Run: `php artisan sponsorships:expire`
3. ✅ `is_sponsored` should become false
4. ✅ History status should be 'expired'

---

## 🚀 Deployment Checklist

- [ ] **Backup database**
- [ ] **Run migrations:** `php artisan migrate`
- [ ] **Seed sponsor settings:** `php artisan db:seed --class=SponsorSettingsSeeder`
- [ ] **Test scheduled job:** `php artisan sponsorships:expire`
- [ ] **Verify cron is running:** Check `php artisan schedule:list`
- [ ] **Test API endpoints** with Postman/Insomnia
- [ ] **Test frontend flows** in staging
- [ ] **Monitor first 5 sponsorships** for errors
- [ ] **Check wallet transactions** are logging correctly
- [ ] **Verify refunds** calculate correctly

---

## 📊 Timeline Summary

| Phase | Description | Time | Status |
|-------|-------------|------|--------|
| 1 | Database & Settings | 3h | ⏳ Pending |
| 2 | Backend API | 5h | ⏳ Pending |
| 3 | Provider Dashboard | 6h | ⏳ Pending |
| 4 | Marketplace Display | 3h | ⏳ Pending |
| 5 | Admin Dashboard | 4h | ⏳ Pending |
| 6 | Scheduled Jobs | 1h | ⏳ Pending |
| Testing | Manual & Automated | 3h | ⏳ Pending |
| **TOTAL** | | **25h** | |

---

## 🔮 Future Enhancements

- Auto-renewal before expiry
- Bulk sponsor (multiple listings)
- Sponsor packages (monthly subscription)
- Analytics dashboard (ROI, views, contacts)
- Email/SMS notifications before expiry
- Payment gateway integration (direct payment)
- Sponsor boost (extra visibility)
- Featured + Sponsored combo packages
