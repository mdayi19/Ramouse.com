# TowTruck System Analysis

**Date:** 2026-02-04  
**Purpose:** Complete analysis before improving chatbot tow truck card

---

## 🔍 System Overview

The Ramouse app has a **Tow Truck Directory** system similar to technicians:
- Customers can find tow trucks (سطحات)
- Providers can create profiles
- Location-based "nearest me" search
- Reviews and ratings
- Different vehicle types (flatbed, winch, etc.)

---

## 📊 Database Structure

### **Table:** `tow_trucks`

```sql
CREATE TABLE tow_trucks (
    -- Identity
    id VARCHAR(20) PRIMARY KEY,          -- Phone number with + (SAME AS TECHNICIANS!)
    unique_id VARCHAR(10) UNIQUE,        -- "TOW001"
    name VARCHAR,
    password VARCHAR,
    
    -- Service Info
    vehicle_type VARCHAR,                 -- "سطحة مسطحة", "سطحة ونش", etc.
    city VARCHAR,
    service_area VARCHAR NULL,
    description TEXT NULL,
    
    -- Location (for "nearest me")
    location GEOMETRY(POINT, 4326) NULL,
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Media
    profile_photo VARCHAR NULL,
    gallery JSON NULL,
    
    -- Social & Contact
    socials JSON NULL,                    -- {"whatsapp": "...", "facebook": "..."}
    qr_code_url VARCHAR NULL,
    
    -- System
    notification_settings JSON NULL,
    flash_purchases JSON NULL,
    average_rating DECIMAL(3,2) DEFAULT 0,
    registration_date TIMESTAMP,
    timestamps
);
```

### **⚠️ CRITICAL FINDINGS (Same as Technicians!)**

1. **NO `phone` field!** - The `id` IS the phone number
2. **NO `whatsapp_number` field!** - It's in `socials` JSON
3. **Verification required** in DirectoryController
4. **JSON fields** need parsing (socials, gallery)
5. **URLs need formatting** for media files

---

## 🔌 Current API Endpoints

### **GET /api/tow-trucks**

**DirectoryController Response:**
```json
{
  "data": [
    {
      "id": "+963912345678",
      "uniqueId": "TOW001",
      "name": "سطحة النجاح",
      "vehicleType": "سطحة مسطحة",
      "city": "دمشق",
      "serviceArea": "دمشق وريفها",
      "description": "...",
      "isVerified": true,
      "isActive": true,
      "profilePhoto": "tow_trucks/photo.jpg",  // ❌ NOT full URL
      "gallery": [...],                         // ❌ NOT parsed/formatted
      "socials": {                              // ✅ Has whatsapp
        "whatsapp": "+963...",
        "facebook": "..."
      },
      "qrCodeUrl": "...",
      "averageRating": 4.5,
      "location": {"latitude": ..., "longitude": ...},
      "reviews": []
    }
  ]
}
```

**Note:** DirectoryController does NOT send `phone` field!

---

## ❌ Current Problems

### **1. Backend (AiSearchService)**

Line 674:
```php
return [
    'id' => $tow->id,
    'name' => $tow->name,
    'vehicleType' => $tow->vehicle_type,
    'rating' => $tow->average_rating,
    'city' => $tow->city,
    'distance' => $tow->distance ? round($tow->distance, 1) . ' كم' : null,
    'phone' => $tow->phone,  // ❌ Field doesn't exist!
];
```

**Issues:**
- ❌ Trying to access `$tow->phone` (doesn't exist)
- ❌ No `whatsapp` field returned
- ❌ No `profile_photo` returned
- ❌ No `cover_image` / gallery
- ❌ No `description`
- ❌ No `isVerified` status
- ❌ No `url` for profile link
- ❌ No `suggestions` for empty results

### **2. Frontend (TowTruckCard.tsx)**

**Current Design:**
- ✅ Basic card layout
- ✅ Has rating, name, vehicle type, city
- ❌ **Very basic** - not premium like SaleCarCard/RentCarCard
- ❌ Only ONE button (WhatsApp only)
- ❌ No call button
- ❌ No profile photo
- ❌ No cover image
- ❌ No verified badge
- ❌ No favorite button
- ❌ No share button
- ❌ No description preview
- ❌ No "View Profile" link

**Missing Props:**
```typescript
interface TowTruckCardProps {
    id: number;           // ⚠️ Should be string
    name: string;
    vehicleType: string;
    rating: number;
    city: string;
    distance?: string;
    phone: string;
    // ❌ MISSING:
    // whatsapp?: string;
    // description?: string;
    // profile_photo?: string;
    // cover_image?: string;
    // isVerified?: boolean;
    // url?: string;
}
```

---

## 🎨 Design Comparison

### **Current TowTruckCard**
- Basic gradient header (red/orange)
- Truck icon only
- Rating badge
- Name + vehicle type + city
- 1 button: "طلب الخدمة" (WhatsApp only)
- No images
- No extras

### **Premium TechnicianCard** (What we created)
- Cover image or gradient
- Profile photo or icon
- Rating badge
- Verified badge
- Distance badge
- Name + specialty + city
- Description preview (2 lines)
- 4 action buttons:
  - Call
  - WhatsApp
  - Favorite
  - Share
- Premium shadows & effects
- Dark mode support

### **What TowTruck SHOULD Have**
Same as TechnicianCard but:
- Different color theme (Red/Orange for emergency/urgency)
- Truck icon instead of Wrench
- "Vehicle Type" instead of "Specialty"
- "Request Service" messaging

---

## ✅ Recommended Improvements

### **1. Backend (AiSearchService.php)**

```php
protected function formatTowTruckResults($results)
{
    if ($results->isEmpty()) {
        return [
            'type' => 'tow_trucks',
            'message' => 'لم يتم العثور على سطحات قريبة.',
            'count' => 0,
            'items' => [],
            'suggestions' => [
                'ابحث في مدينة أخرى',
                'جرب نوع سطحة مختلف',
                'اطلب أقرب سطحة متاحة'
            ]
        ];
    }

    // Contextual suggestions
    $suggestions = [
        'ابحث عن قطع غيار',
        'ابحث عن ورشة قريبة'
    ];

    return [
        'type' => 'tow_trucks',
        'count' => $results->count(),
        'items' => $results->map(function ($tow) {
            // Parse socials JSON
            $socials = is_string($tow->socials) 
                ? json_decode($tow->socials, true) 
                : (is_array($tow->socials) ? $tow->socials : []);
            
            // Parse gallery JSON
            $gallery = is_string($tow->gallery) 
                ? json_decode($tow->gallery, true) 
                : (is_array($tow->gallery) ? $tow->gallery : []);
            
            // Get cover image
            $coverImage = null;
            if (!empty($gallery) && isset($gallery[0])) {
                if (isset($gallery[0]['path'])) {
                    $coverImage = url('storage/' . $gallery[0]['path']);
                } elseif (isset($gallery[0]['url'])) {
                    $coverImage = $gallery[0]['url'];
                }
            }
            
            return [
                'id' => (string) $tow->id,  // Keep as string
                'name' => (string) $tow->name,
                'vehicleType' => (string) $tow->vehicle_type,
                'rating' => $tow->average_rating ?? 0,
                'city' => (string) $tow->city,
                'distance' => $tow->distance ? round($tow->distance, 1) . ' كم' : null,
                'isVerified' => $tow->is_verified ? 1 : 0,
                
                // ✅ FIX: Use id as phone
                'phone' => (string) $tow->id,
                
                // ✅ ADD: WhatsApp from socials
                'whatsapp' => isset($socials['whatsapp']) 
                    ? (string) $socials['whatsapp'] 
                    : (string) $tow->id,
                
                // ✅ ADD: Description
                'description' => $tow->description 
                    ? mb_substr($tow->description, 0, 100) 
                    : '',
                
                // ✅ ADD: Profile photo URL
                'profile_photo' => $tow->profile_photo 
                    ? url('storage/' . $tow->profile_photo) 
                    : null,
                
                // ✅ ADD: Cover image
                'cover_image' => $coverImage,
                
                // ✅ ADD: Profile URL
                'url' => "/tow-trucks/" . rawurlencode($tow->id),
            ];
        })->toArray(),
        'suggestions' => $suggestions
    ];
}
```

### **2. Frontend (TowTruckCard.tsx)**

**Create Premium Card** similar to TechnicianCard:

```typescript
interface TowTruckCardProps {
    id: number | string;
    name: string;
    vehicleType: string;
    rating?: number;
    city: string;
    distance?: string;
    isVerified: boolean | number;
    phone: string;
    whatsapp?: string;
    description?: string;
    profile_photo?: string;
    cover_image?: string;
    url?: string;
}

export const PremiumTowTruckCard: React.FC<TowTruckCardProps> = ({...}) => {
    // Features:
    // - Cover image (truck photo) or gradient
    // - Profile photo or truck icon fallback
    // - Verified badge (emerald or blue for certified)
    // - Distance badge
    // - Rating stars
    // - Name + Vehicle Type + City
    // - Description preview (2 lines)
    // - 4 Action buttons:
    //   - Call
    //   - WhatsApp
    //   - Favorite
    //   - Share
    // - Red/Orange color theme (emergency/urgency)
    // - Dark mode support
    // - Premium animations & shadows
}
```

---

## 🎨 Color Theme

**TowTruck Theme:** Red/Orange (Emergency/Urgency)
- Primary: `red-600` / `orange-600`
- Verified: `blue-600` (certified/professional)
- Distance: `red-600` background
- Buttons: `red-500` hover to `red-600`
- WhatsApp: `#25D366` (brand color)

**Why Red/Orange?**
- Represents emergency response
- Urgency and immediate service
- Distinct from technicians (green) and cars (blue)
- Eye-catching for critical services

---

## 📊 Field Mapping Summary

| Backend Field | ChatBot Should Send | Frontend Expects |
|--------------|---------------------|------------------|
| `id` | `id` (string) ✅ | `id` ✅ |
| `id` | **`phone`** ✅ | `phone` ✅ |
| `socials['whatsapp']` | **`whatsapp`** ✅ | `whatsapp` ✅ |
| `profile_photo` | Full URL ✅ | `profile_photo` ✅ |
| `gallery[0]` | Full URL ✅ | `cover_image` ✅ |
| `description` | Truncated ✅ | `description` ✅ |
| `is_verified` | `isVerified` ✅ | `isVerified` ✅ |
| `id` | Profile URL ✅ | `url` ✅ |

---

## 🔄 Complete Data Flow (Fixed)

```
1. User: "بدي سطحة بدمشق"
   ↓
2. searchTowTrucks(): WHERE city LIKE '%دمشق%'
   ↓
3. formatTowTruckResults():
   - Parse socials JSON → extract whatsapp
   - Parse gallery JSON → get cover image
   - Format URLs
   - Use id as phone
   ↓
4. Return: {
     id: "+963912345678",
     phone: "+963912345678",
     whatsapp: "+963987654321",
     profile_photo: "https://...",
     cover_image: "https://...",
     ...
   }
   ↓
5. PremiumTowTruckCard renders:
   - Cover image/gradient
   - Profile photo/truck icon
   - Verified badge
   - Rating
   - Description
   - Call + WhatsApp + Favorite + Share buttons
   ↓
6. User clicks action → Works! ✅
```

---

## ✅ Action Items

### **Priority 1: Fix Backend**
- [ ] Use `$tow->id` as `phone`
- [ ] Parse `socials` JSON, extract `whatsapp`
- [ ] Format `profile_photo` URL
- [ ] Parse `gallery` JSON, get cover image
- [ ] Add `description`, `isVerified`, `url`
- [ ] Add contextual suggestions

### **Priority 2: Create Premium Frontend Card**
- [ ] Add all missing props
- [ ] Create premium design (like TechnicianCard)
- [ ] Red/Orange color theme
- [ ] 4 action buttons
- [ ] Profile photo + cover image
- [ ] Verified badge
- [ ] Description preview
- [ ] Dark mode support
- [ ] Animations & effects

### **Priority 3: Test**
- [ ] Search for tow trucks
- [ ] Verify phone/WhatsApp work
- [ ] Test with/without photos
- [ ] Test verified badge
- [ ] Test distance calculation

---

## 📝 Summary

**Key Findings:**
1. ✅ **Same structure as Technicians** - `id` IS the phone number
2. ❌ **Same backend issues** - accessing non-existent fields
3. ❌ **Basic frontend card** - needs premium upgrade
4. ❌ **No media handling** - photos/gallery not sent
5. ❌ **Limited actions** - only WhatsApp button

**Solution:** Apply same fixes as technicians + create premium card design! 🚀
