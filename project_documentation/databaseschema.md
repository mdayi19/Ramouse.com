# Database Schema Documentation

## Overview
The Ramouse Auto Parts application uses **PostgreSQL** (production) / **SQLite** (development) with a well-structured relational database schema. The database supports multi-role user management, order processing, e-commerce, content management, and financial transactions.

**Database Engine**: PostgreSQL 15+ (with PostGIS extension for geolocation)  
**ORM**: Laravel Eloquent  
**Migrations**: 22 migration files  
**Total Tables**: 26 tables  

---

## Database Architecture

### Schema Organization

The database is organized into **7 functional domains**:

1. **Authentication & User Management** (4 tables)
2. **Service Orders & Quotes** (2 tables)
3. **E-Commerce Store** (5 tables)
4. **Vehicle Data** (4 tables)
5. **Content Management** (3 tables)
6. **Financial Management** (2 tables)
7. **System & Supporting** (5 tables)

---

## Complete Table List

| # | Table Name | Domain | Records (Typical) | Primary Key |
|---|------------|--------|-------------------|-------------|
| 1 | users | Auth | ~100-1000 | id (bigint) |
| 2 | customers | Auth | ~500-5000 | id (phone) |
| 3 | providers | Auth | ~50-200 | id (phone) |
| 4 | technicians | Auth | ~100-500 | id (phone) |
| 5 | tow_trucks | Auth | ~50-200 | id (phone) |
| 6 | orders | Orders | ~1000-10000 | order_number |
| 7 | quotes | Orders | ~5000-50000 | id (uuid) |
| 8 | products | Store | ~100-1000 | id |
| 9 | store_categories | Store | ~10-50 | id |
| 10 | store_orders | Store | ~500-5000 | id |
| 11 | product_reviews | Store | ~100-1000 | id |
| 12 | car_categories | Vehicle | ~10-20 | id |
| 13 | brands | Vehicle | ~50-200 | id |
| 14 | car_models | Vehicle | ~500-2000 | id |
| 15 | part_types | Vehicle | ~50-200 | id |
| 16 | technician_specialties | Vehicle | ~10-30 | id |
| 17 | blog_posts | Content | ~50-500 | id |
| 18 | faq_items | Content | ~20-100 | id |
| 19 | announcements | Content | ~10-100 | id |
| 20 | withdrawals | Financial | ~100-1000 | id |
| 21 | transactions | Financial | ~1000-10000 | id |
| 22 | system_settings | System | ~1-10 | id |
| 23 | personal_access_tokens | System | ~100-1000 | id |
| 24 | password_reset_tokens | System | ~10-100 | email |
| 25 | sessions | System | ~100-1000 | id |
| 26 | notifications | System | ~1000-10000 | id (uuid) |

---

## Detailed Table Schemas

### 1. Authentication & User Management

---

#### **users** (Laravel Default User Table)
**Purpose**: Base authentication table for admin users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | Primary key |
| name | varchar(255) | NO | - | User full name |
| email | varchar(255) | YES | - | Email (nullable) |
| phone | varchar(255) | YES | - | Phone number (unique) |
| is_admin | boolean | NO | false | Admin flag |
| email_verified_at | timestamp | YES | - | Email verification |
| password | varchar(255) | NO | - | Hashed password |
| remember_token | varchar(100) | YES | - | Remember me token |
| created_at | timestamp | YES | - | Creation timestamp |
| updated_at | timestamp | YES | - | Update timestamp |

**Indexes**:
- UNIQUE: email (if not null)
- UNIQUE: phone (if not null)

**Notes**:
- Admin users authenticate via email/password
- Phone field added for potential phone-based admin login
- `is_admin` flag distinguishes admins from potential future customer users in this table

---

#### **customers**
**Purpose**: Customer profiles for ordering auto parts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(20) (PK) | NO | - | Phone number as ID |
| unique_id | varchar(10) | NO | - | Human-readable ID (e.g., "CUS001") |
| name | varchar(255) | YES | - | Customer name |
| password | varchar(255) | NO | - | Hashed password |
| address | text | YES | - | Customer address |
| is_active | boolean | NO | true | Account active status |
| garage | jsonb | YES | - | Array of Vehicle objects |
| notification_settings | jsonb | YES | - | Notification preferences |
| flash_purchases | jsonb | YES | - | Flash sale purchase history |
| created_at | timestamp | YES | - | Registration date |
| updated_at | timestamp | YES | - | Last update |

**Indexes**:
- PRIMARY: id
- UNIQUE: unique_id

**JSON Fields**:
```json
garage: [
  {
    "id": "uuid",
    "category": "German",
    "brand": "BMW",
    "model": "X5",
    "year": "2020",
    "vin": "...",
    "engineType": "diesel",
    "transmission": "auto"
  }
]

notification_settings: {
  "FIRST_QUOTE_RECEIVED": true,
  "ORDER_STATUS_CHANGED": true,
  ...
}

flash_purchases: [
  {
    "productId": "prod-123",
    "quantity": 2,
    "purchaseDate": "2025-11-25T14:00:00Z"
  }
]
```

**Relationships**:
- Has many: orders (polymorphic via user_id)
- Has many: store_orders (polymorphic via buyer_id)

---

#### **providers**
**Purpose**: Service providers who quote on customer orders.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(20) (PK) | NO | - | Phone number as ID |
| unique_id | varchar(10) | NO | - | Provider ID (e.g., "PRO001") |
| name | varchar(255) | NO | - | Provider name |
| password | varchar(255) | NO | - | Hashed password |
| is_active | boolean | NO | true | Account status |
| wallet_balance | decimal(10,2) | NO | 0.00 | Current wallet balance |
| assigned_categories | jsonb | NO | - | Array of assigned car categories |
| payment_info | jsonb | YES | - | Payment methods |
| notification_settings | jsonb | YES | - | Notification preferences |
| last_login_at | timestamp | YES | - | Last login timestamp |
| inactivity_warning_sent | boolean | NO | false | Inactivity warning flag |
| average_rating | decimal(3,2) | NO | 0.00 | Average rating (0-5) |
| flash_purchases | jsonb | YES | - | Flash product purchases |
| created_at | timestamp | YES | - | Registration date |
| updated_at | timestamp | YES | - | Last update |

**Indexes**:
- PRIMARY: id
- UNIQUE: unique_id

**JSON Fields**:
```json
assigned_categories: ["German", "Japanese", "Korean"]

payment_info: [
  {
    "methodId": "pm-1",
    "methodName": "Bank Transfer",
    "details": "Account: 123456789",
    "isPrimary": true
  }
]
```

**Relationships**:
- Has many: quotes
- Has many: withdrawals
- Has many: transactions
- Has many: store_orders (as buyer)

---

#### **technicians**
**Purpose**: Technician directory profiles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(20) (PK) | NO | - | Phone number |
| unique_id | varchar(10) | NO | - | Tech ID (e.g., "TEC001") |
| name | varchar(255) | NO | - | Technician name |
| password | varchar(255) | NO | - | Hashed password |
| specialty | varchar(255) | NO | - | Primary specialty |
| city | varchar(255) | NO | - | City/location |
| workshop_address | text | YES | - | Workshop address |
| location | geography(POINT,4326) | YES | - | GPS coordinates (PostGIS) |
| description | text | YES | - | Bio/description |
| is_verified | boolean | NO | false | Admin verification status |
| is_active | boolean | NO | true | Account status |
| profile_photo | varchar(255) | YES | - | Profile photo URL |
| gallery | jsonb | YES | - | Work photos/videos |
| socials | jsonb | YES | - | Social media links |
| qr_code_url | varchar(255) | YES | - | QR code for profile |
| notification_settings | jsonb | YES | - | Notification preferences |
| flash_purchases | jsonb | YES | - | Store purchases |
| average_rating | decimal(3,2) | NO | 0.00 | Average rating (0-5) |
| registration_date | timestamp | NO | CURRENT | Registration date |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- UNIQUE: unique_id
- SPATIAL: location (for "Near Me" searches)

**JSON Fields**:
```json
gallery: [
  {"type": "image", "data": "https://..."},
  {"type": "video", "data": "https://..."}
]

socials: {
  "facebook": "https://facebook.com/...",
  "instagram": "@username",
  "whatsapp": "201234567890"
}
```

**Relationships**:
- Has many: orders (can place orders for parts)
- Has many: store_orders (as buyer)
- Belongs to many: technician_specialties

**PostGIS Note**:
- `location` field uses PostGIS geography type for accurate distance calculations
- Enables "Find technicians near me" feature
- SRID 4326 = WGS84 (standard GPS coordinates)

---

#### **tow_trucks**
**Purpose**: Tow truck service directory profiles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(20) (PK) | NO | - | Phone number |
| unique_id | varchar(10) | NO | - | Truck ID (e.g., "TOW001") |
| name | varchar(255) | NO | - | Owner/company name |
| password | varchar(255) | NO | - | Hashed password |
| vehicle_type | varchar(255) | NO | - | Truck type (Flatbed, Winch, etc.) |
| city | varchar(255) | NO | - | Base city |
| service_area | varchar(255) | YES | - | Service coverage area |
| location | geography(POINT,4326) | YES | - | GPS coordinates |
| description | text | YES | - | Service description |
| is_verified | boolean | NO | false | Admin verification |
| is_active | boolean | NO | true | Account status |
| profile_photo | varchar(255) | YES | - | Profile photo |
| gallery | jsonb | YES | - | Vehicle photos/videos |
| socials | jsonb | YES | - | Social media |
| qr_code_url | varchar(255) | YES | - | QR code |
| notification_settings | jsonb | YES | - | Preferences |
| flash_purchases | jsonb | YES | - | Store purchases |
| average_rating | decimal(3,2) | NO | 0.00 | Rating |
| registration_date | timestamp | NO | CURRENT | Registration |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- UNIQUE: unique_id
- SPATIAL: location

**Relationships**:
- Has many: orders (can place orders)
- Has many: store_orders (as buyer)

---

### 2. Service Orders & Quotes

---

#### **orders**
**Purpose**: Customer orders for auto parts with quote management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| order_number | varchar(255) (PK) | NO | - | Unique order ID (ORD-{timestamp}) |
| user_id | varchar(255) | NO | - | Polymorphic user ID (phone) |
| user_type | varchar(255) | NO | - | customer, technician, tow_truck |
| status | varchar(255) | NO | 'قيد المراجعة' | Order status (Arabic) |
| form_data | jsonb | NO | - | Complete order details |
| customer_name | varchar(255) | YES | - | Delivery name |
| customer_address | text | YES | - | Delivery address |
| customer_phone | varchar(255) | YES | - | Contact phone |
| delivery_method | varchar(255) | NO | 'shipping' | shipping or pickup |
| shipping_price | decimal(10,2) | NO | 0.00 | Shipping cost |
| shipping_notes | text | YES | - | Delivery notes |
| payment_method_id | varchar(255) | YES | - | Payment method ID |
| payment_method_name | varchar(255) | YES | - | Payment method name |
| payment_receipt_url | varchar(255) | YES | - | Receipt upload |
| rejection_reason | text | YES | - | Admin rejection reason |
| accepted_quote_id | uuid | YES | - | FK to quotes.id |
| review | jsonb | YES | - | Customer review |
| stale_notified | boolean | NO | false | Stale order notification sent |
| date | timestamp | NO | CURRENT | Order creation date |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: order_number
- INDEX: user_id, status, date

**JSON Fields**:
```json
form_data: {
  "category": "German",
  "brand": "BMW",
  "model": "X5",
  "year": "2020",
  "vin": "WBA...",
  "engineType": "diesel",
  "transmission": "auto",
  "partTypes": ["Engine Parts", "Brakes"],
  "partDescription": "Front brake pads and discs",
  "partNumber": "34116858910",
  "images": ["/storage/uploads/img1.jpg"],
  "video": "/storage/uploads/vid1.mp4",
  "voiceNote": "/storage/uploads/voice1.webm",
  "contactMethod": "whatsapp",
  "city": "Cairo",
  "additionalDetails": "Urgent replacement needed"
}

review: {
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Order Status Values** (Arabic):
- `قيد المراجعة` - Under Review
- `بانتظار تأكيد الدفع` - Awaiting Payment Confirmation
- `جاري التجهيز` - Preparing
- `تم الاستلام من المزود` - Received from Provider
- `قيد التوصيل` - In Delivery
- `تم الشحن للعميل` - Shipped to Customer
- `تم التوصيل` - Delivered
- `ملغي` - Cancelled
- `جاهز للاستلام` - Ready for Pickup
- `تم الاستلام من الشركة` - Received from Company

**Relationships**:
- Belongs to: customers/technicians/tow_trucks (polymorphic)
- Has many: quotes
- Belongs to: accepted_quote (quotes)

**Business Logic**:
1. Customer creates order with detailed requirements
2. Multiple providers can submit quotes
3. Customer accepts one quote → `accepted_quote_id` set
4. Customer uploads payment receipt
5. Order progresses through status updates
6. Customer can review after delivery

---

#### **quotes**
**Purpose**: Provider quotes/offers for orders.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid (PK) | NO | - | Quote UUID |
| order_number | varchar(255) | NO | - | FK to orders |
| provider_id | varchar(255) | NO | - | FK to providers |
| provider_name | varchar(255) | NO | - | Snapshot of name |
| provider_unique_id | varchar(255) | NO | - | Snapshot of unique ID |
| price | decimal(10,2) | NO | - | Quote price |
| part_status | varchar(255) | NO | - | new or used |
| part_size_category | varchar(255) | YES | - | xs, s, m, l, vl (for shipping) |
| notes | text | YES | - | Additional notes |
| media | jsonb | YES | - | Quote images/video/voice |
| viewed_by_customer | boolean | NO | false | Customer viewed flag |
| timestamp | timestamp | NO | CURRENT | Quote submission time |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- FOREIGN: order_number → orders.order_number (CASCADE DELETE)
- FOREIGN: provider_id → providers.id
- INDEX: timestamp

**JSON Fields**:
```json
media: {
  "images": ["/storage/uploads/quote-img1.jpg"],
  "video": "/storage/uploads/quote-vid.mp4",
  "voiceNote": "/storage/uploads/quote-voice.webm"
}
```

**Relationships**:
- Belongs to: order
- Belongs to: provider

**Business Logic**:
- Provider can submit one quote per order
- Quote includes price, part condition, media proof
- Customer receives notification when first quote arrives
- `viewed_by_customer` flag triggers provider notification
- Accepted quote becomes the order's `accepted_quote_id`

---

### 3. E-Commerce Store

---

#### **products**
**Purpose**: Store products (general merchandise, flash sales, tools, parts).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Product ID |
| name | varchar(255) | NO | - | Product name |
| description | text | NO | - | Product description |
| price | decimal(10,2) | NO | - | Unit price |
| media | jsonb | NO | - | Product images/videos |
| target_audience | varchar(255) | NO | 'all' | all, technicians, providers, tow_trucks, customers |
| specialty | varchar(255) | YES | - | Technician specialty if targeted |
| total_stock | integer | NO | - | Available quantity |
| purchase_limit_per_buyer | integer | NO | - | Max per buyer |
| is_flash | boolean | NO | false | Flash sale product |
| expires_at | timestamp | YES | - | Flash sale expiration |
| store_category_id | varchar(255) | YES | - | FK to store_categories |
| store_subcategory_id | varchar(255) | YES | - | Subcategory ID |
| shipping_size | varchar(255) | YES | - | xs, s, m, l, vl |
| static_shipping_cost | decimal(10,2) | YES | - | Fixed shipping cost (overrides size-based) |
| allowed_payment_methods | jsonb | YES | - | Array of allowed payment method IDs |
| average_rating | decimal(3,2) | NO | 0.00 | Average rating |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- FOREIGN: store_category_id → store_categories.id
- INDEX: target_audience, is_flash, expires_at

**JSON Fields**:
```json
media: [
  {"type": "image", "data": "https://..."},
  {"type": "video", "data": "https://..."}
]

allowed_payment_methods: ["pm-1", "pm-3", "pm-5"]
```

**Relationships**:
- Belongs to: store_category
- Has many: product_reviews
- Has many: store_orders

**Flash Products**:
- `is_flash = true` → Limited-time offer
- `expires_at` → Deadline for purchases
- `purchase_limit_per_buyer` → Prevent bulk buying
- `target_audience` → Can be shown only to specific users (e.g., technicians only)

---

#### **store_categories**
**Purpose**: Product categorization for store navigation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Category ID (e.g., 'oils') |
| name | varchar(255) | NO | - | Category name |
| icon | varchar(255) | NO | - | Lucide icon name |
| subcategories | jsonb | NO | - | Array of subcategory objects |
| is_featured | boolean | NO | false | Show in featured section |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id

**JSON Fields**:
```json
subcategories: [
  {"id": "engine-oil", "name": "Engine Oil"},
  {"id": "brake-fluid", "name": "Brake Fluid"}
]
```

**Relationships**:
- Has many: products

---

#### **store_orders**
**Purpose**: E-commerce orders (separate from part orders).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Order ID |
| product_id | varchar(255) | NO | - | FK to products |
| buyer_id | varchar(255) | NO | - | Polymorphic buyer ID |
| buyer_type | varchar(255) | NO | - | customer, provider, technician, tow_truck |
| buyer_name | varchar(255) | NO | - | Snapshot |
| buyer_unique_id | varchar(255) | NO | - | Snapshot |
| quantity | integer | NO | - | Order quantity |
| total_price | decimal(10,2) | NO | - | Total price (product * qty) |
| shipping_cost | decimal(10,2) | NO | 0.00 | Shipping fee |
| status | varchar(255) | NO | - | pending, approved, shipped, delivered, rejected, cancelled |
| delivery_method | varchar(255) | NO | - | shipping, pickup |
| shipping_address | text | YES | - | Delivery address |
| contact_phone | varchar(255) | YES | - | Contact number |
| payment_method_id | varchar(255) | YES | - | Payment method |
| payment_method_name | varchar(255) | YES | - | Payment name |
| payment_receipt_url | varchar(255) | YES | - | Receipt upload |
| admin_notes | text | YES | - | Admin notes |
| request_date | timestamp | NO | CURRENT | Order date |
| decision_date | timestamp | YES | - | Admin decision date |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- FOREIGN: product_id → products.id
- INDEX: buyer_id, buyer_type, status

**Relationships**:
- Belongs to: product
- Belongs to: buyer (polymorphic)

**Workflow**:
1. Buyer adds product to cart and checks out
2. Buyer uploads payment receipt
3. Admin verifies payment
4. Status: pending → approved → preparing → shipped → delivered
5. Can be rejected if payment invalid

---

#### **product_reviews**
**Purpose**: Customer reviews for store products.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | Review ID |
| product_id | varchar(255) | NO | - | FK to products |
| user_id | varchar(255) | NO | - | Reviewer ID |
| user_name | varchar(255) | NO | - | Reviewer name |
| rating | integer | NO | - | Rating (1-5) |
| comment | text | YES | - | Review text |
| created_at | timestamp | YES | - | Review date |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- FOREIGN: product_id → products.id
- INDEX: rating, created_at

**Relationships**:
- Belongs to: product

---

### 4. Vehicle Data

---

#### **car_categories**
**Purpose**: Vehicle categories (German, Japanese, Korean, American, etc.).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Category ID |
| name | varchar(255) | NO | - | Category name |
| flag | varchar(255) | NO | - | Country flag emoji/image |
| brands | json | YES | - | Associated brand names |
| telegram_bot_token | varchar(255) | YES | - | Telegram bot token for category |
| telegram_channel_id | varchar(255) | YES | - | Telegram channel ID |
| telegram_notifications_enabled | boolean | NO | false | Enable Telegram notifications |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id

**JSON Fields**:
```json
brands: ["BMW", "Mercedes", "Audi", "Volkswagen"]
```

**Relationships**:
- Has many: brands (logical, not FK)

**Telegram Integration**:
- Each category can have its own Telegram bot
- Used to notify category-specific channels when orders arrive

---

#### **brands**
**Purpose**: Car brands/manufacturers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Brand ID |
| name | varchar(255) | NO | - | Brand name |
| logo | text | YES | - | Logo URL or base64 |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id

**Relationships**:
- Has many: car_models

---

#### **car_models**
**Purpose**: Car models for each brand.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | Model ID |
| brand_name | varchar(255) | NO | - | Brand name (linking) |
| name | varchar(255) | NO | - | Model name |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- INDEX: brand_name

**Relationships**:
- Belongs to: brand (via brand_name)

**Note**: Uses brand_name instead of brand_id for flexibility

---

#### **part_types**
**Purpose**: Types/categories of auto parts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Part type ID |
| name | varchar(255) | NO | - | Part type name |
| icon | varchar(255) | YES | - | Lucide icon name |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id

**Examples**: Engine Parts, Brakes, Suspension, Electrical, Body Parts, etc.

---

#### **technician_specialties**
**Purpose**: Technician specialty categories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Specialty ID |
| name | varchar(255) | NO | - | Specialty name |
| icon | varchar(255) | YES | - | Icon name |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id

**Examples**: Mechanic, Electrician, AC Specialist, Dent Repair, Paint, etc.

---

### 5. Content Management

---

#### **blog_posts**
**Purpose**: Blog articles for SEO and customer engagement.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Post ID |
| slug | varchar(255) | NO | - | URL slug (unique) |
| title | varchar(255) | NO | - | Post title |
| summary | text | NO | - | Short summary |
| content | longtext | NO | - | Full content (Markdown) |
| imageUrl | varchar(255) | NO | - | Featured image |
| author | varchar(255) | NO | - | Author name |
| published_at | timestamp | NO | - | Publish date |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- UNIQUE: slug
- INDEX: published_at

**SEO Features**:
- Slug-based URLs for SEO
- Markdown support for rich content
- Featured images for social sharing
- Author attribution

---

#### **faq_items**
**Purpose**: Frequently Asked Questions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | FAQ ID |
| question | text | NO | - | Question text |
| answer | text | NO | - | Answer text |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id

**Display**: Accordion-style Q&A on FAQ page

---

#### **announcements**
**Purpose**: System-wide or targeted announcements.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Announcement ID |
| title | varchar(255) | NO | - | Announcement title |
| message | text | NO | - | Announcement message |
| target | varchar(255) | NO | - | all, customers, providers, technicians, tow_trucks |
| image_url | text | YES | - | Optional image |
| timestamp | timestamp | NO | CURRENT | Publication time |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- INDEX: target, timestamp

**Targeting**:
- Can target specific user groups
- Displayed on dashboards and public pages
- Can include images for promotions

---

### 6. Financial Management

---

#### **withdrawals**
**Purpose**: Provider withdrawal requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Withdrawal ID |
| provider_id | varchar(255) | NO | - | FK to providers |
| amount | decimal(10,2) | NO | - | Withdrawal amount |
| status | varchar(255) | NO | - | Pending, Approved, Rejected |
| payment_method_id | varchar(255) | NO | - | Payment method |
| payment_method_name | varchar(255) | NO | - | Payment method name |
| request_timestamp | timestamp | NO | - | Request time |
| decision_timestamp | timestamp | YES | - | Admin decision time |
| admin_notes | text | YES | - | Admin notes |
| receipt_url | text | YES | - | Payment receipt (if approved) |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- INDEX: provider_id, status

**Relationships**:
- Belongs to: provider

**Workflow**:
1. Provider requests withdrawal from wallet
2. Admin reviews request
3. Admin approves → Creates transaction, deducts balance, uploads receipt
4. Admin rejects → Adds rejection notes

---

#### **transactions**
**Purpose**: Provider financial transaction history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Transaction ID |
| provider_id | varchar(255) | NO | - | FK to providers |
| type | varchar(255) | NO | - | deposit, manual_deposit, withdrawal |
| amount | decimal(10,2) | NO | - | Transaction amount |
| description | varchar(255) | NO | - | Transaction description |
| balance_after | decimal(10,2) | NO | - | Balance after transaction |
| timestamp | timestamp | NO | - | Transaction time |
| related_order_id | varchar(255) | YES | - | Related order (if type=deposit) |
| related_withdrawal_id | varchar(255) | YES | - | Related withdrawal request |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- INDEX: provider_id, type, timestamp

**Relationships**:
- Belongs to: provider
- Can relate to: order or withdrawal

**Transaction Types**:
- `deposit`: Automatic payment from accepted order
- `manual_deposit`: Admin manual credit
- `withdrawal`: Withdrawal deduction

---

### 7. System & Supporting Tables

---

#### **system_settings**
**Purpose**: Global application configuration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | Setting ID |
| key | varchar(255) | NO | - | Setting key (unique) |
| value | jsonb | NO | - | Setting value (entire Settings object) |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- UNIQUE: key

**Common Keys**:
- `global_config`: Main settings object
- `whatsapp_api_1` to `whatsapp_api_10`: WhatsApp API configs
- `footer_info`: Footer content
- `seo_settings`: SEO metadata

**JSON Value Structure** (for global_config):
```json
{
  "logoUrl": "...",
  "appName": "Ramouse Auto Parts",
  "adminPhone": "201234567890",
  "paymentMethods": [...],
  "limitSettings": {...},
  "notificationSettings": {...},
  ...
}
```

---

#### **personal_access_tokens** (Laravel Sanctum)
**Purpose**: API authentication tokens.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | Token ID |
| tokenable_type | varchar(255) | NO | - | Polymorphic type (User, Customer, etc.) |
| tokenable_id | varchar(255) | NO | - | Polymorphic ID (string) |
| name | varchar(255) | NO | - | Token name |
| token | varchar(64) | NO | - | Hashed token (unique) |
| abilities | text | YES | - | Token abilities/scopes |
| last_used_at | timestamp | YES | - | Last used timestamp |
| expires_at | timestamp | YES | - | Expiration time |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes**:
- PRIMARY: id
- UNIQUE: token
- INDEX: tokenable_type, tokenable_id

**Purpose**: Sanctum generates Bearer tokens for API authentication

---

#### **password_reset_tokens**
**Purpose**: Password reset token management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| email | varchar(255) (PK) | NO | - | User email |
| token | varchar(255) | NO | - | Reset token |
| created_at | timestamp | YES | - | Token creation |

**Indexes**:
- PRIMARY: email

**Note**: Standard Laravel password reset functionality

---

#### **sessions**
**Purpose**: User session management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | varchar(255) (PK) | NO | - | Session ID |
| user_id | bigint | YES | - | User ID (nullable) |
| ip_address | varchar(45) | YES | - | Client IP |
| user_agent | text | YES | - | Client user agent |
| payload | longtext | NO | - | Session data |
| last_activity | integer | NO | - | Last activity timestamp |

**Indexes**:
- PRIMARY: id
- INDEX: user_id, last_activity

**Purpose**: Laravel session storage (database driver)

---

#### **notifications**
**Purpose**: System notifications for users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid (PK) | NO | - | Notification ID |
| user_id | varchar(255) | NO | - | User ID (phone/uuid) |
| title | varchar(255) | NO | - | Notification title |
| message | text | NO | - | Notification body |
| type | varchar(255) | NO | 'info' | Type (info, order, etc.) |
| link | json | YES | - | Action link data |
| context | json | YES | - | Metadata |
| read | boolean | NO | false | Read status |
| created_at | timestamp | YES | - | Creation time |
| updated_at | timestamp | YES | - | Update time |

**Indexes**:
- PRIMARY: id
- INDEX: user_id, read
- INDEX: user_id, created_at

---

#### **cache** (Laravel Cache)
**Purpose**: Application cache storage.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| key | varchar(255) (PK) | NO | - | Cache key |
| value | longtext | NO | - | Cache value |
| expiration | integer | NO | - | Expiration timestamp |

**Indexes**:
- PRIMARY: key

---

#### **jobs** (Laravel Queue)
**Purpose**: Queued job management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | NO | AUTO | Job ID |
| queue | varchar(255) | NO | - | Queue name |
| payload | longtext | NO | - | Job payload |
| attempts | tinyint | NO | - | Attempt count |
| reserved_at | integer | YES | - | Reserved timestamp |
| available_at | integer | NO | - | Available timestamp |
| created_at | integer | NO | - | Creation timestamp |

**Indexes**:
- PRIMARY: id
- INDEX: queue

**Related Tables** (also created in migration):
- `job_batches`: Batch job tracking
- `failed_jobs`: Failed job log

---

## Entity Relationship Diagram (ERD)

### Key Relationships

```
users (admins)
  ↓ (manages)
  ├─ customers
  ├─ providers
  ├─ technicians
  └─ tow_trucks

customers/technicians/tow_trucks
  ↓ (creates)
  orders
    ├─ has many quotes (from providers)
    └─ has one accepted_quote

providers
  ├─ has many quotes
  ├─ has many transactions
  └─ has many withdrawals

products
  ├─ belongs to store_category
  ├─ has many product_reviews
  └─ has many store_orders

car_categories
  └─ has many brands
      └─ has many car_models
```

---

## Data Types & Conventions

### ID Conventions
- **users**: Auto-increment bigint
- **customers, providers, technicians, tow_trucks**: Phone number (varchar 20)
- **unique_id**: Human-readable ID (varchar 10) - e.g., "CUS001", "PRO042"
- **orders**: Custom order number (varchar) - "ORD-{timestamp}"
- **quotes**: UUID
- **products, blog_posts, announcements**: Custom string IDs

### JSONB Usage
PostgreSQL's `jsonb` type is used extensively for:
- **Flexible data structures** (garage, gallery, socials)
- **settings** (notification preferences)
- **Media arrays** (images, videos)
- **Polymorphic data** (form_data in orders)

**Benefits**:
- No need for extra pivot tables
- Fast querying with GIN indexes
- Schema flexibility

### PostGIS Geography
- **Type**: `geography(POINT, 4326)`
- **Used in**: technicians.location, tow_trucks.location
- **SRID 4326**: WGS84 (GPS coordinates)
- **Enables**: Distance calculations, "Near Me" searches

**Query Example**:
```sql
SELECT * FROM technicians 
WHERE ST_DWithin(
  location::geography, 
  ST_MakePoint(31.2357, 30.0444)::geography, 
  10000 -- 10km radius
);
```

### Decimal Precision
- **Prices & Money**: `decimal(10,2)` - Up to 99,999,999.99
- **Ratings**: `decimal(3,2)` - 0.00 to 9.99 (for 5-star: 0-5.00)

### Timestamp Strategy
- **created_at/updated_at**: Laravel automatic timestamps
- **Custom timestamps**: registration_date, published_at, timestamp, etc. use specific business meaning

---

## Indexing Strategy

### Primary Indexes
- All primary keys automatically indexed

### Foreign Key Indexes
- All foreign keys indexed for JOIN performance

### Business Logic Indexes
- **orders**: user_id, status, date (for filtering)
- **quotes**: order_number, timestamp (for listings)
- **products**: target_audience, is_flash, expires_at (for filtering)
- **store_orders**: buyer_id, buyer_type, status
- **technicians/tow_trucks**: location (spatial index)

### Text Search (Future)
- blog_posts.content - Full-text search
- faq_items.question, faq_items.answer - Full-text search

**PostgreSQL Full-Text Example**:
```sql
ALTER TABLE blog_posts 
ADD COLUMN search_vector tsvector;

CREATE INDEX idx_blog_search 
ON blog_posts USING GIN(search_vector);
```

---

## Data Constraints

### Unique Constraints
- customers.unique_id, providers.unique_id, technicians.unique_id, tow_trucks.unique_id
- users.email, users.phone
- blog_posts.slug
- system_settings.key

### Foreign Key Constraints
- quotes.order_number → orders.order_number (CASCADE DELETE)
- quotes.provider_id → providers.id
- products.store_category_id → store_categories.id
- store_orders.product_id → products.id

### Check Constraints (Recommended)
```sql
ALTER TABLE products 
ADD CONSTRAINT check_stock_positive 
CHECK (total_stock >= 0);

ALTER TABLE providers 
ADD CONSTRAINT check_balance_positive 
CHECK (wallet_balance >= 0);

ALTER TABLE product_reviews 
ADD CONSTRAINT check_rating_range 
CHECK (rating >= 1 AND rating <= 5);
```

---

## Database Size Estimates

### Small Installation (1 year)
- **Orders**: ~1,000 rows (~10 MB)
- **Quotes**: ~5,000 rows (~15 MB)
- **Customers**: ~500 rows (~2 MB)
- **Products**: ~100 rows (~5 MB)
- **Total**: ~50-100 MB

### Medium Installation (3 years)
- **Orders**: ~10,000 rows (~100 MB)
- **Quotes**: ~50,000 rows (~150 MB)
- **Customers**: ~5,000 rows (~20 MB)
- **Total**: ~500 MB - 1 GB

### Large Installation (5+ years)
- **Orders**: ~100,000 rows (~1 GB)
- **Quotes**: ~500,000 rows (~1.5 GB)
- **Customers**: ~50,000 rows (~200 MB)
- **Total**: ~5-10 GB

**Note**: JSONB fields and media storage dominate size. Media files stored separately in filesystem.

---

## Backup Strategy

### Recommended Backup Approach

#### Daily Backups
```bash
pg_dump -U postgres ramouse > ramouse_backup_$(date +%Y%m%d).sql
```

#### Critical Tables (Hourly)
```bash
pg_dump -U postgres -t orders -t quotes -t transactions ramouse > critical_backup.sql
```

#### Full System Backup (Weekly)
```bash
pg_dumpall -U postgres > full_backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U postgres ramouse < ramouse_backup_20251125.sql
```

---

## Performance Optimization

### Query Optimization Tips

1. **Use Indexes**: Ensure all foreign keys and frequently filtered columns are indexed
2. **JSONB Indexing**: Create GIN indexes on JSONB columns for faster queries
   ```sql
   CREATE INDEX idx_orders_form_data ON orders USING GIN(form_data);
   ```
3. **Partial Indexes**: Index only relevant rows
   ```sql
   CREATE INDEX idx_active_orders 
   ON orders(status) 
   WHERE status NOT IN ('تم التوصيل', 'ملغي');
   ```
4. **Spatial Indexes**: Already created for geography columns
5. **VACUUM regularly**: PostgreSQL maintenance

### Connection Pooling
- Use **PgBouncer** for production
- Laravel default: 1 connection per request
- PgBouncer: Reuse connections

### Caching Strategy
- Cache frequently accessed data (settings, categories)
- Use Laravel cache (Redis/Memcached)
- Invalidate cache on updates

---

## Security Considerations

### Data Protection
1. **Password Hashing**: bcrypt (Laravel default)
2. **Sensitive Data**: Payment info stored as JSONB (encrypted at app level if needed)
3. **SQL Injection**: Protected by Eloquent ORM
4. **Mass Assignment**: Protected by model `$fillable` arrays

### Access Control
- **Row-Level Security** (PostgreSQL feature, optional):
  ```sql
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY user_orders ON orders
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id'));
  ```

### Audit Trail
- All tables have `created_at` and `updated_at`
- Consider adding `deleted_at` for soft deletes
- Consider separate `audit_logs` table for sensitive operations

---

## Migration Management

### Running Migrations
```bash
# Run all pending migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Refresh (drop all tables and migrate)
php artisan migrate:fresh

# Seed database after migration
php artisan db:seed
```

### Migration Order
Migrations run in filename order (timestamp prefix). Current order:
1. Core Laravel tables (users, cache, jobs)
2. User tables (customers, providers, technicians, tow_trucks)
3. Order tables (orders, quotes)
4. Store tables (categories, products, store_orders, reviews)
5. Content tables (blog, faq, announcements)
6. Vehicle/financial/specialty tables
7. Sanctum tokens
8. User table modifications (phone field)

---

## Database Seeders

### Available Seeders
- **DatabaseSeeder**: Main seeder (calls all others)
- **WhatsAppSettingsSeeder**: Seeds WhatsApp API configurations
- Custom seeders for: categories, brands, part types, etc.

### Running Seeders
```bash
php artisan db:seed
php artisan db:seed --class=WhatsAppSettingsSeeder
```

---

## Future Enhancements

### Potential Schema Additions

1. **Reviews Tables**
   - `technician_reviews`: Customer reviews for technicians
   - `tow_truck_reviews`: Customer reviews for tow trucks

2. **Messaging System**
   - `conversations`: Between customers and providers
   - `messages`: Individual messages

3. **Notifications**
   - `notifications`: Instead of localStorage (currently)

4. **Analytics**
   - `analytics_events`: Track user behavior
   - `dashboard_stats`: Cached statistics

5. **Multi-Currency**
   - Add `currency` field to prices
   - `exchange_rates` table

6. **Inventory Management**
   - `inventory`: Stock tracking for providers
   - `shipments`: Incoming stock

---

## Documentation References

- [Backend Structure](./backendstructure.md)
- [Frontend Structure](./frontendstructure.md)
- [API Documentation](./api_documentation.md)
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- PostGIS Documentation: https://postgis.net/docs/
- Laravel Database: https://laravel.com/docs/11.x/database

---

**Last Updated**: November 25, 2025  
**Schema Version**: 1.0.0  
**Total Tables**: 25  
**PostgreSQL Version**: 15+  
**PostGIS Version**: 3.3+
