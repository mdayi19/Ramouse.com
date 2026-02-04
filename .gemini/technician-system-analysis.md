# Technician System Analysis

**Date:** 2026-02-04  
**Purpose:** Complete analysis before improving chatbot search

---

## 🔍 System Overview

The Ramouse app has a **Technician Directory** system that allows:
- Customers to find technicians (mechanics, electricians, etc.)
- Technicians to create profiles and manage their workshops
- Location-based search ("find nearest technician")
- Reviews and ratings
- QR code profiles

---

## 📊 Database Structure

### **Table:** `technicians`

```sql
CREATE TABLE technicians (
    -- Identity
    id VARCHAR(20) PRIMARY KEY,          -- Phone number with +
    unique_id VARCHAR(10) UNIQUE,        -- Short ID like "TECH001"
    name VARCHAR,
    password VARCHAR,
    
    -- Professional Info
    specialty VARCHAR,                    -- "ميكانيك", "كهربائي", etc.
    city VARCHAR,
    workshop_address TEXT NULL,
    description TEXT NULL,
    
    -- Location (for "nearest me" features)
    location GEOMETRY(POINT, 4326) NULL, -- MySQL spatial data
    
    -- Status
    is_verified BOOLEAN DEFAULT false,    -- Admin verification
    is_active BOOLEAN DEFAULT true,       -- Account status
    
    -- Media
    profile_photo VARCHAR NULL,
    gallery JSON NULL,                    -- Array of images/videos
    
    -- Social & Contact  
    socials JSON NULL,                    -- Social media links
    qr_code_url VARCHAR NULL,
    
    -- System
    notification_settings JSON NULL,
    flash_purchases JSON NULL,
    average_rating DECIMAL(3,2) DEFAULT 0,
    registration_date TIMESTAMP,
    timestamps
);
```

### **⚠️ CRITICAL FINDINGS**

1. **NO `phone` field!**
   - The `id` IS the phone number (e.g., "+963912345678")
   - Chatbot search was looking for `phone` field that doesn't exist!
   
2. **NO `whatsapp_number` field!**
   - Also doesn't exist in database
   - Need to use `id` as phone number

3. **NO `years_of_experience` field!**
   - Doesn't exist in current schema
   - Need to remove from chatbot response

4. **Verification is REQUIRED**
   - Directory only shows `is_verified = true` technicians
   - Chatbot was also checking this, being too restrictive

---

## 🔌 API Endpoints

### **Public Directory**

```
GET /api/technicians
```

**Parameters:**
- `city` - Filter by city
- `specialty` - Filter by specialty  
- `search` - Text search (name, specialty, city, description, ID)
- `sort` - "distance" | "rating" | "default"
- `lat`, `lng` - GPS coordinates for distance sorting

**Returns:**
```json
{
  "data": [
    {
      "id": "+963912345678",
      "uniqueId": "TECH001",
      "name": "محمد أحمد",
      "specialty": "ميكانيك",
      "city": "دمشق",
      "description": "...",
      "isVerified": true,
      "isActive": true,
      "profilePhoto": "https://...",
      "gallery": [...],
      "socials": {...},
      "qrCodeUrl": "...",
      "averageRating": 4.5,
      "location": {"latitude": 33.5138, "longitude": 36.2765},
      "reviews": [],
      "distance": 5.2  // Only when sorting by distance
    }
  ]
}
```

### **Single Technician**

```
GET /api/technicians/{id}
```

Returns same structure + `workshopAddress`

---

## 🎯 Current Search Logic (DirectoryController)

```php
$query = Technician::query()
    ->where('is_active', true)
    ->where('is_verified', true);  // ❌ TOO RESTRICTIVE

if ($city !== 'الكل') {
    $query->where('city', $city);
}

if ($specialty !== 'الكل') {
    $query->where('specialty', $specialty);
}

if ($search) {
    $query->where(function ($q) use ($search) {
        $q->where('name', 'like', "%{$search}%")
          ->orWhere('specialty', 'like', "%{$search}%")
          ->orWhere('city', 'like', "%{$search}%")
          ->orWhere('description', 'like', "%{$search}%")
          ->orWhere('unique_id', 'like', "%{$search}%");
    });
}

// Geolocation
if ($lat && $lng && $sort === 'distance') {
    $query->orderByRaw("ST_Distance_Sphere(location, ...)");
}
```

**Issues:**
- ✅ Works well for verified technicians
- ❌ Returns empty if no verified techs match
- ❌ No fallback logic

---

## 🤖 Chatbot Search Logic (AiSearchService)

### **OLD (Before Fix)**
```php
$q = Technician::query()
    ->where('is_active', true)
    ->where('is_verified', true);  // TOO STRICT

if ($specialty)
    $q->where('specialty', 'like', "%$specialty%");
if ($city)
    $q->where('city', 'like', "%$city%");

$results = $q->limit(5)->get();
```

**Problems:**
1. Required BOTH active AND verified
2. No fallback if no results
3. Only 5 results
4. Returned wrong fields (`phone`, `whatsapp_number`, `years_experience`)

### **NEW (After Fix - Current)**
```php
// Start with active only (not verified)
$q = Technician::query()->where('is_active', true);

if ($specialty) {
    $q->where('specialty', 'like', "%$specialty%");
}

if ($city) {
    $q->where('city', 'like', "%$city%");
}

// Geolocation or rating sort
if ($userLat && $userLng) {
    $q->orderBy('distance');
} else {
    $q->orderBy('average_rating', 'desc');
}

$results = $q->limit(10)->get();

// Fallback 1: Remove city filter
if ($results->isEmpty() && $specialty && $city) {
    $results = Technician::where('is_active', true)
        ->where('specialty', 'like', "%$specialty%")
        ->limit(10)->get();
}

// Fallback 2: Remove specialty filter  
if ($results->isEmpty() && $specialty) {
    $results = Technician::where('is_active', true)
        ->orderBy('average_rating', 'desc')
        ->limit(10)->get();
}

// Fallback 3: Show ANY active technicians
if ($results->isEmpty()) {
    $results = Technician::where('is_active', true)
        ->orderBy('average_rating', 'desc')
        ->limit(10)->get();
}
```

**BUT FIELDS ARE WRONG!** Need to fix the response format.

---

## ❌ Current Problems

### **1. Field Mismatch Issues**

| Chatbot Returns | Actual DB Field | Status |
|----------------|-----------------|---------|
| `phone` | Doesn't exist! Use `id` | ❌ BROKEN |
| `whatsapp` | Doesn't exist! Use `id` | ❌ BROKEN |
| `years_experience` | Doesn't exist! | ❌ BROKEN |
| `profile_photo` | Exists | ⚠️ Wrong format |
| `cover_image` | Should be `gallery[0]` | ⚠️ Wrong format |

### **2. Data Format Issues**

**Chatbot returns:**
```php
'profile_photo' => $tech->profile_photo  // ❌ Just path
```

**Should return:**
```php
'profile_photo' => $tech->profile_photo 
    ? url('storage/' . $tech->profile_photo) 
    : null
```

### **3. Missing Phone Number**

The chatbot needs `phone` for the call/WhatsApp buttons, but:
- Phone doesn't exist as a field
- The `id` field IS the phone number
- Need to extract it: `'phone' => $tech->id`

---

## ✅ Required Fixes

### **Fix 1: Update formatTechnicianResults()**

```php
protected function formatTechnicianResults($results)
{
    return [
        'type' => 'technicians',
        'count' => $results->count(),
        'items' => $results->map(function ($tech) {
            return [
                'id' => (int) $tech->id,
                'name' => (string) $tech->name,
                'specialty' => (string) $tech->specialty,
                'rating' => $tech->average_rating ?? 0,
                'city' => (string) $tech->city,
                'distance' => $tech->distance ? round($tech->distance, 1) . ' كم' : null,
                'isVerified' => $tech->is_verified ? 1 : 0,
                
                // ✅ FIX: Use 'id' as phone
                'phone' => (string) $tech->id,
                'whatsapp' => (string) $tech->id,  // Same as phone
                
                // ✅ FIX: Format with full URL
                'profile_photo' => $tech->profile_photo 
                    ? url('storage/' . $tech->profile_photo) 
                    : null,
                
                // ✅ FIX: Get first gallery item properly
                'cover_image' => $tech->gallery && count($tech->gallery) > 0
                    ? url('storage/' . $tech->gallery[0]['path'])
                    : null,
                
                'description' => $tech->description 
                    ? mb_substr($tech->description, 0, 100) 
                    : '',
                
                // ✅ REMOVE: Field doesn't exist
                // 'years_experience' => null,
                
                'url' => "/technicians/{$tech->id}",
            ];
        })->toArray(),
        'suggestions' => $suggestions
    ];
}
```

### **Fix 2: Update Frontend Card Props**

Remove `years_experience` from TechnicianCard props since it doesn't exist:

```typescript
interface TechnicianCardProps {
    id: number | string;  // Can be phone number string!
    name: string;
    specialty: string;
    rating?: number;
    city: string;
    distance?: string;
    isVerified: boolean | number;
    phone: string;
    whatsapp?: string;
    description?: string;
    profile_photo?: string;
    cover_image?: string;
    // years_experience?: number;  // ❌ REMOVE - doesn't exist
    url?: string;
}
```

---

## 🔄 Data Flow

1. **User asks:** "بدي ميكانيك بدمشق"
2. **AI extracts:** `{specialty: "ميكانيك", city: "دمشق"}`
3. **searchTechnicians()** is called
4. **Query:** `WHERE is_active=1 AND specialty LIKE '%ميكانيك%' AND city LIKE '%دمشق%'`
5. **Fallbacks** if no results
6. **formatTechnicianResults()** formats the response
7. **Frontend** renders TechnicianCard components

---

## 📋 Action Items

### **Priority 1: Fix Data Issues**
- [ ] Change `phone` to use `$tech->id`
- [ ] Change `whatsapp` to use `$tech->id`
- [ ] Format `profile_photo` with `url('storage/...')`
- [ ] Format `cover_image` from `gallery[0]['path']`
- [ ] Remove `years_experience` field
- [ ] Handle `id` being string (phone number)

### **Priority 2: Improve Search**
- [x] Remove `is_verified` requirement ✅
- [x] Add fallback queries ✅
- [x] Increase limit to 10 ✅
- [x] Add rating sort ✅

### **Priority 3: Test**
- [ ] Create test technician data
- [ ] Test chatbot search
- [ ] Verify phone/WhatsApp buttons work
- [ ] Test with/without photos
- [ ] Test distance calculation

---

## 📝 Summary

**Key Learnings:**
1. **Phone number IS the ID** - No separate phone field
2. **No WhatsApp field** - Same as ID
3. **No experience field** - Remove from card
4. **URLs need formatting** - Add `url('storage/...')`
5. **Verification was too strict** - Removed requirement

**Next Steps:**
1. Fix `formatTechnicianResults()` with correct fields
2. Update TechnicianCard props
3. Test the complete flow
4. Add test data if needed
