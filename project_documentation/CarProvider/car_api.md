# Car Listings API Documentation

## 🔗 Complete API Reference

All endpoints for the CarProvider system including public marketplace, individual sellers, car providers, and admin controls.

---

## Base URL

```
Production: https://api.ramouse.com/api
Development: http://localhost:8000/api
```

---

## Authentication

Most endpoints require authentication using Laravel Sanctum:

```http
Authorization: Bearer {token}
```

**Rate Limiting:**
- Public routes: 60 requests/minute
- Authenticated routes: 100 requests/minute

---

## 1. Public Endpoints

### 1.1 Get All Categories

```http
GET /car-categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name_ar": "سيدان",
      "name_en": "Sedan",
      "icon": "🚗"
    },
    {
      "id": 2,
      "name_ar": "SUV",
      "name_en": "SUV",
      "icon": "🚙"
    }
  ]
}
```

---

### 1.2 Browse Marketplace (Sale)

```http
GET /car-marketplace
```

**Query Parameters:**
```
?category=1              // Filter by category
&brand=toyota           // Filter by brand
&min_price=50000        // Min price
&max_price=200000       // Max price
&year_from=2020         // Min year
&year_to=2024           // Max year
&condition=new          // new|used|certified_pre_owned
&lat=24.7136            // User latitude
&lng=46.6753            // User longitude
&radius=50              // Search radius (km)
&trusted_only=true      // Trusted providers only
&with_warranty=true     // With warranty
&sort=relevance         // relevance|price_asc|price_desc|date|rating
&page=1                 // Pagination
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "owner_id": 123,
      "seller_type": "provider",
      "listing_type": "sale",
      "title": "تويوتا كامري 2022 GLX",
      "slug": "toyota-camry-2022-glx",
      "brand": "Toyota",
      "model": "Camry",
      "year": 2022,
      "mileage": 15000,
      "condition": "used",
      "price": 95000,
      "is_negotiable": true,
      "photos": ["/storage/cars/1.jpg"],
      "is_sponsored": true,
      "is_featured": false,
      "views_count": 1250,
      "car_provider": {
        "id": "0501234567",
        "name": "معرض الأمين",
        "is_verified": true,
        "is_trusted": true,
        "average_rating": 4.8
      },
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 150,
    "per_page": 20
  }
}
```

---

### 1.3 Browse Rental Cars

```http
GET /rent-car
```

**Query Parameters:** (Same as marketplace + rental-specific)
```
?period=daily           // daily|weekly|monthly
&max_daily_rate=300     // Max daily rate
&insurance=true         // Insurance included
&driver=true            // Driver included
```

**Response:** Similar to marketplace but includes `rental_terms`

---

### 1.4 Get Listing Details

```http
GET /car-listings/{slug}
```

**Example:**
```http
GET /car-listings/toyota-camry-2022-glx
```

**Response:**
```json
{
  "listing": {
    "id": 1,
    "owner_id": 123,
    "seller_type": "provider",
    "title": "تويوتا كامري 2022 GLX",
    "slug": "toyota-camry-2022-glx",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2022,
    "mileage": 15000,
    "condition": "used",
    "price": 95000,
    "is_negotiable": true,
    "exterior_color": "أبيض",
    "interior_color": "بيج",
    "transmission": "automatic",
    "fuel_type": "gasoline",
    "doors_count": 4,
    "seats_count": 5,
    "engine_size": "2.5L",
    "horsepower": 203,
    "previous_owners": 1,
    "warranty": "سنة واحدة",
    "body_condition": {
      "hood": "pristine",
      "roof": "pristine",
      "front_bumper": "scratched",
      "rear_bumper": "replaced"
    },
    "features": ["ABS", "تحكم مروري", "كاميرا خلفية"],
    "description": "سيارة في حالة ممتازة...",
    "photos": ["/storage/cars/1.jpg", "/storage/cars/2.jpg"],
    "contact_phone": "0501234567",
    "contact_whatsapp": "0501234567",
    "views_count": 1250,
    "car_provider": {
      "id": "0501234567",
      "name": "معرض الأمين",
      "city": "الرياض",
      "is_verified": true,
      "is_trusted": true,
      "average_rating": 4.8,
      "total_listings": 45
    },
    "meta_tags": {
      "title": "تويوتا كامري 2022 GLX - معرض الأمين | Ramouse",
      "description": "...",
      "og_image": "/storage/cars/1.jpg"
    }
  }
}
```

---

### 1.5 Search Listings (FULLTEXT)

```http
POST /car-listings/search
```

**Request Body:**
```json
{
  "q": "تويوتا كامري",
  "category": 1,
  "min_price": 50000,
  "max_price": 200000,
  "lat": 24.7136,
  "lng": 46.6753,
  "radius": 50,
  "sort": "relevance"
}
```

**Response:** Same as marketplace with relevance scoring

---

### 1.6 Get Provider Public Profile

```http
GET /car-providers/{id}
```

**Response:**
```json
{
  "provider": {
    "id": "0501234567",
    "name": "معرض الأمين",
    "business_type": "dealership",
    "city": "الرياض",
    "address": "طريق الملك فهد",
    "description": "معرض متخصص في السيارات اليابانية...",
    "is_verified": true,
    "is_trusted": true,
    "profile_photo": "/storage/providers/photo.jpg",
    "gallery": ["/storage/providers/1.jpg"],
    "socials": {
      "instagram": "@alamin_cars",
      "twitter": "@alamin"
    },
    "average_rating": 4.8,
    "total_listings": 45,
    "total_reviews": 120
  }
}
```

---

### 1.7 Get Provider Listings

```http
GET /car-providers/{id}/listings
```

**Response:** List of provider's public listings

---

## 2. Individual Seller Endpoints (Customers)

**Auth Required:** ✅ `auth:sanctum`

### 2.1 Get My Listings

```http
GET /customer/my-listings
```

**Response:**
```json
{
  "listings": [
    {
      "id": 5,
      "owner_id": 456,
      "seller_type": "individual",
      "title": "هوندا أكورد 2020",
      "price": 65000,
      "is_available": true,
      "views_count": 45,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "limit": 3,
  "current_count": 1,
  "remaining": 2
}
```

---

### 2.2 Create Listing (Individual)

```http
POST /customer/listings
```

**Request Body:**
```json
{
  "title": "هوندا أكورد 2020",
  "listing_type": "sale",
  "car_category_id": 1,
  "brand": "Honda",
  "model": "Accord",
  "year": 2020,
  "mileage": 45000,
  "condition": "used",
  "price": 65000,
  "is_negotiable": true,
  "transmission": "automatic",
  "fuel_type": "gasoline",
  "exterior_color": "أسود",
  "photos": ["base64...", "base64..."],
  "description": "سيارة نظيفة جداً...",
  "contact_phone": "0509876543"
}
```

**Validation:**
- ✅ Max 3 listings per individual
- ✅ Sale only (no rental)
- ✅ No sponsored ads
- ✅ 1-15 photos (max 5MB each)

**Response:**
```json
{
  "message": "تم إضافة الإعلان بنجاح",
  "listing": { /* listing object */ }
}
```

**Error (Limit Reached):**
```json
{
  "error": "لقد وصلت للحد الأقصى (3 إعلانات)",
  "current_count": 3,
  "upgrade_url": "/register-car-provider"
}
```

---

### 2.3 Update Listing

```http
PUT /customer/listings/{id}
```

**Authorization:** Owner only (`owner_id === auth()->id()`)

---

### 2.4 Delete Listing

```http
DELETE /customer/listings/{id}
```

**Authorization:** Owner only

---

## 3. Car Provider Endpoints

**Auth Required:** ✅ `auth:sanctum` + `role:car_provider`

### 3.1 Get Profile

```http
GET /car-provider/profile
```

**Response:**
```json
{
  "provider": {
    "id": "0501234567",
    "name": "معرض الأمين",
    "wallet_balance": 1500.00,
    "is_verified": true,
    "is_trusted": false,
    "total_listings": 45
  }
}
```

---

### 3.2 Update Profile

```http
PUT /car-provider/profile
```

**Request Body:**
```json
{
  "name": "معرض الأمين المحدث",
  "description": "...",
  "profile_photo": "base64...",
  "socials": {
    "instagram": "@alamin_cars"
  }
}
```

---

### 3.3 Get Dashboard Stats

```http
GET /car-provider/stats
```

**Response:**
```json
{
  "stats": {
    "total_listings": 45,
    "active_listings": 40,
    "sponsored_listings": 5,
    "total_views": 12500,
    "total_contacts": 340,
    "conversion_rate": 2.72
  }
}
```

---

### 3.4 Get My Listings

```http
GET /car-provider/listings
```

**Response:** All provider's listings (unlimited)

---

### 3.5 Create Listing (Provider)

```http
POST /car-provider/listings
```

**Request Body:** Same as individual + rental support

```json
{
  "listing_type": "rent",
  "rental_terms": {
    "daily": 250,
    "weekly": 1500,
    "monthly": 5000
  }
}
```

**Validation:**
- ✅ Unlimited listings
- ✅ Sale + Rental
- ✅ Can sponsor (if wallet balance sufficient)

---

### 3.6 Toggle Availability

```http
PATCH /car-provider/listings/{id}/toggle
```

**Response:**
```json
{
  "message": "تم تحديث الحالة",
  "is_available": false
}
```

---

### 3.7 Sponsor Listing

```http
POST /car-provider/listings/{id}/sponsor
```

**Request Body:**
```json
{
  "duration": "weekly"  // daily|weekly|monthly
}
```

**Pricing:**
- Daily: 10 SAR
- Weekly: 60 SAR
- Monthly: 200 SAR

**Response:**
```json
{
  "message": "تم رعاية الإعلان بنجاح",
  "sponsored_until": "2024-01-15T12:00:00Z",
  "amount_deducted": 60.00,
  "new_balance": 1440.00
}
```

**Error (Insufficient Balance):**
```json
{
  "error": "رصيد غير كافي",
  "required": 60.00,
  "current_balance": 30.00
}
```

---

### 3.8 Get Analytics

```http
GET /car-provider/analytics
```

**Query Parameters:**
```
?from=2024-01-01        // Start date
&to=2024-01-31          // End date
&listing_id=5           // Specific listing (optional)
```

**Response:**
```json
{
  "summary": {
    "total_views": 5400,
    "unique_visitors": 3200,
    "contact_phone_clicks": 120,
    "contact_whatsapp_clicks": 95,
    "favorites": 45,
    "shares": 18,
    "conversion_rate": 3.75
  },
  "trends": {
    "views_chart": [
      { "date": "2024-01-01", "views": 180 },
      { "date": "2024-01-02", "views": 220 }
    ]
  },
  "top_listings": [
    {
      "listing_id": 5,
      "title": "تويوتا كامري 2022",
      "views": 1250,
      "contacts": 45,
      "conversion": 3.6
    }
  ]
}
```

---

### 3.9 Get Listing Analytics

```http
GET /car-provider/listings/{id}/analytics
```

**Response:** Detailed analytics for specific listing

---

## 4. Analytics Tracking (Public)

### 4.1 Track Event

```http
POST /analytics/track
```

**Request Body:**
```json
{
  "car_listing_id": 5,
  "event_type": "view",  // view|contact_phone|contact_whatsapp|favorite|share
  "metadata": {
    "referrer": "google",
    "device": "mobile"
  }
}
```

**Rate Limit:** 60/min (to prevent abuse)

**Deduplication:** Views from same IP within 30min = 1 view

**Response:**
```json
{
  "message": "Event tracked successfully"
}
```

---

## 5. Favorites System

**Auth Required:** ✅ `auth:sanctum`

### 5.1 Toggle Favorite

```http
POST /favorites/{listingId}/toggle
```

**Response:**
```json
{
  "message": "تم الإضافة للمفضلة",
  "is_favorited": true
}
```

---

### 5.2 Check Favorite Status

```http
GET /favorites/{listingId}/check
```

**Response:**
```json
{
  "is_favorited": true
}
```

---

### 5.3 Get My Favorites

```http
GET /favorites
```

**Response:**
```json
{
  "favorites": [
    {
      "id": 1,
      "listing": { /* full listing object */ },
      "favorited_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### 5.4 Get Favorites Count

```http
GET /car-listings/{id}/favorites/count
```

**Response:**
```json
{
  "count": 45
}
```

---

## 6. Reviews & Ratings

**Auth Required:** ✅ `auth:sanctum`

### 6.1 Submit Review

```http
POST /car-providers/{id}/reviews
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "تعامل ممتاز ومصداقية عالية"
}
```

**Validation:**
- ✅ Must have contacted provider
- ✅ One review per user per provider
- ✅ Rating: 1-5
- ✅ Comment: min 10 chars, max 1000

**Response:**
```json
{
  "message": "تم إضافة التقييم بنجاح",
  "review": {
    "id": 1,
    "rating": 5,
    "comment": "...",
    "user": {
      "name": "أحمد"
    },
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### 6.2 Get Provider Reviews

```http
GET /car-providers/{id}/reviews
```

**Response:**
```json
{
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "...",
      "user": { "name": "أحمد" },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "average_rating": 4.8,
  "total_reviews": 120
}
```

---

### 6.3 Update Review

```http
PUT /reviews/{id}
```

**Authorization:** Review owner only

---

### 6.4 Delete Review

```http
DELETE /reviews/{id}
```

**Authorization:** Review owner only

---

## 7. Admin Endpoints

**Auth Required:** ✅ `auth:sanctum` + `admin`

### 7.1 Get All Providers

```http
GET /admin/car-providers
```

**Query:** `?status=pending|verified|all`

---

### 7.2 Verify Provider

```http
PATCH /admin/car-providers/{id}/verify
```

**Request Body:**
```json
{
  "is_verified": true
}
```

---

### 7.3 Toggle Trusted Status

```http
PATCH /admin/car-providers/{id}/trust
```

**Request Body:**
```json
{
  "is_trusted": true
}
```

---

### 7.4 Sponsor Listing (Free)

```http
POST /admin/car-listings/{id}/sponsor
```

**Request Body:**
```json
{
  "days": 30
}
```

**Note:** Admin sponsorship is FREE (no wallet deduction)

---

### 7.5 Feature Listing

```http
POST /admin/car-listings/{id}/feature
```

**Request Body:**
```json
{
  "days": 30,
  "position": 1  // Manual ordering
}
```

---

### 7.6 Hide Listing

```http
POST /admin/car-listings/{id}/hide
```

**Request Body:**
```json
{
  "reason": "محتوى مخالف"
}
```

---

### 7.7 Restore Listing

```http
POST /admin/car-listings/{id}/restore
```

---

### 7.8 Bulk Actions

```http
POST /admin/car-listings/bulk
```

**Request Body:**
```json
{
  "action": "hide",  // approve|hide|feature|sponsor|delete
  "listing_ids": [1, 2, 3, 5]
}
```

---

### 7.9 Manage Categories

```http
POST /admin/car-categories
PUT /admin/car-categories/{id}
DELETE /admin/car-categories/{id}
PATCH /admin/car-categories/{id}/toggle
```

---

### 7.10 Archive Old Analytics

```http
POST /admin/analytics/archive
```

**Note:** Manually trigger archiving (also runs monthly via cron)

---

## 8. Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "price": ["The price must be at least 0"]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Listing not found"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests. Please try again later."
}
```

### 500 Server Error
```json
{
  "message": "Server error. Please contact support."
}
```

---

## 9. Webhooks (Future)

Coming in Phase 2:
- Listing status changed
- New review received
- Sponsorship expired
- Wallet balance low

---

## Summary

| Category | Endpoints |
|----------|-----------|
| **Public** | 7 endpoints |
| **Individual Sellers** | 4 endpoints |
| **Car Providers** | 9 endpoints |
| **Analytics** | 2 endpoints |
| **Favorites** | 4 endpoints |
| **Reviews** | 4 endpoints |
| **Admin** | 10+ endpoints |

**Total: 40+ API endpoints** 🎯
