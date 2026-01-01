
# Ramouse Auto Parts - Laravel Backend Implementation Guide

This document serves as the master blueprint for building the backend API using Laravel. It maps the frontend requirements, types, and workflows to specific Laravel components.

## 1. Architecture & Stack

*   **Framework**: Laravel 11.x
*   **Database**: PostgreSQL (with PostGIS extension for geolocation)
*   **Authentication**: Laravel Sanctum (API Tokens)
*   **File Storage**: Laravel Storage (Local `public` disk by default; S3 ready for future scaling)
*   **Real-time**: Pusher (or Laravel Reverb) for status updates
*   **Queue**: Redis (for WhatsApp/Telegram notifications)

---

## 2. Database Migrations

### 2.1. Users & Roles
We use specific tables for each user role to handle their distinct data structures efficiently.

#### `create_customers_table`
```php
Schema::create('customers', function (Blueprint $table) {
    $table->string('id', 20)->primary(); // Phone number
    $table->string('unique_id', 10)->unique();
    $table->string('name')->nullable();
    $table->string('password');
    $table->text('address')->nullable();
    $table->boolean('is_active')->default(true);
    $table->jsonb('garage')->nullable(); // Array of Vehicle objects
    $table->jsonb('notification_settings')->nullable(); // Partial<NotificationSettings>
    $table->jsonb('flash_purchases')->nullable(); // History of flash sale purchases (snapshot)
    $table->timestamps();
});
```

#### `create_providers_table`
```php
Schema::create('providers', function (Blueprint $table) {
    $table->string('id', 20)->primary(); // Phone
    $table->string('unique_id', 10)->unique();
    $table->string('name');
    $table->string('password');
    $table->boolean('is_active')->default(true);
    $table->decimal('wallet_balance', 10, 2)->default(0);
    $table->jsonb('assigned_categories'); // ['German', 'Korean']
    $table->jsonb('payment_info')->nullable(); // ProviderPaymentInfo[]
    $table->jsonb('notification_settings')->nullable();
    $table->timestamp('last_login_at')->nullable();
    $table->boolean('inactivity_warning_sent')->default(false);
    $table->decimal('average_rating', 3, 2)->default(0);
    $table->jsonb('flash_purchases')->nullable();
    $table->timestamps();
});
```

#### `create_technicians_table`
```php
Schema::create('technicians', function (Blueprint $table) {
    $table->string('id', 20)->primary();
    $table->string('unique_id', 10)->unique();
    $table->string('name');
    $table->string('password');
    $table->string('specialty'); // Mechanic, Electrician...
    $table->string('city');
    $table->text('workshop_address')->nullable();
    // PostGIS Geography point for "Nearest Me" features
    $table->geography('location', subtype: 'POINT', srid: 4326)->nullable(); 
    $table->text('description')->nullable();
    $table->boolean('is_verified')->default(false);
    $table->boolean('is_active')->default(true);
    $table->string('profile_photo')->nullable();
    $table->jsonb('gallery')->nullable(); // GalleryItem[]
    $table->jsonb('socials')->nullable();
    $table->string('qr_code_url')->nullable();
    $table->jsonb('notification_settings')->nullable();
    $table->jsonb('flash_purchases')->nullable();
    $table->decimal('average_rating', 3, 2)->default(0);
    $table->timestamp('registration_date')->useCurrent();
    $table->timestamps();
});
```

#### `create_tow_trucks_table`
```php
Schema::create('tow_trucks', function (Blueprint $table) {
    $table->string('id', 20)->primary();
    $table->string('unique_id', 10)->unique();
    $table->string('name');
    $table->string('password');
    $table->string('vehicle_type'); // Flatbed, Winch...
    $table->string('city');
    $table->string('service_area')->nullable();
    $table->geography('location', subtype: 'POINT', srid: 4326)->nullable();
    $table->text('description')->nullable();
    $table->boolean('is_verified')->default(false);
    $table->boolean('is_active')->default(true);
    $table->string('profile_photo')->nullable();
    $table->jsonb('gallery')->nullable();
    $table->jsonb('socials')->nullable();
    $table->string('qr_code_url')->nullable();
    $table->jsonb('notification_settings')->nullable();
    $table->jsonb('flash_purchases')->nullable();
    $table->decimal('average_rating', 3, 2)->default(0);
    $table->timestamp('registration_date')->useCurrent();
    $table->timestamps();
});
```

### 2.2. Orders & Logistics

#### `create_orders_table`
```php
Schema::create('orders', function (Blueprint $table) {
    $table->string('order_number')->primary(); // ORD-Timestamp
    $table->string('user_id'); // Polymorphic ID (Customer/Tech/Tow)
    $table->string('user_type'); // customer, technician, tow_truck
    $table->string('status')->default('قيد المراجعة'); // See OrderStatus type
    $table->jsonb('form_data'); // StoredFormData (Vehicle details, part description, media paths)
    
    // Shipping & Logistics
    $table->string('customer_name')->nullable();
    $table->text('customer_address')->nullable();
    $table->string('customer_phone')->nullable();
    $table->string('delivery_method')->default('shipping'); // shipping, pickup
    $table->decimal('shipping_price', 10, 2)->default(0);
    $table->text('shipping_notes')->nullable();
    
    // Payment
    $table->string('payment_method_id')->nullable();
    $table->string('payment_method_name')->nullable();
    $table->string('payment_receipt_url')->nullable();
    $table->text('rejection_reason')->nullable();
    
    // Relations
    $table->uuid('accepted_quote_id')->nullable();
    $table->jsonb('review')->nullable(); // OrderReview {rating, comment}
    $table->boolean('stale_notified')->default(false);
    
    $table->timestamp('date')->useCurrent();
    $table->timestamps();
});
```

#### `create_quotes_table`
```php
Schema::create('quotes', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('order_number');
    $table->foreign('order_number')->references('order_number')->on('orders')->onDelete('cascade');
    $table->string('provider_id');
    $table->foreign('provider_id')->references('id')->on('providers');
    $table->string('provider_name'); // Snapshot
    $table->string('provider_unique_id'); // Snapshot
    
    $table->decimal('price', 10, 2);
    $table->string('part_status'); // new, used
    $table->string('part_size_category')->nullable(); // xs, s, m, l, vl
    $table->text('notes')->nullable();
    $table->jsonb('media')->nullable(); // {images: [], video, voiceNote}
    $table->boolean('viewed_by_customer')->default(false);
    
    $table->timestamp('timestamp')->useCurrent();
    $table->timestamps();
});
```

### 2.3. Store & E-Commerce

#### `create_store_categories_table`
```php
Schema::create('store_categories', function (Blueprint $table) {
    $table->string('id')->primary(); // e.g., 'oils'
    $table->string('name');
    $table->string('icon'); // Lucide icon name
    $table->jsonb('subcategories'); // Array of {id, name}
    $table->boolean('is_featured')->default(false);
    $table->timestamps();
});
```

#### `create_products_table` (AdminFlashProduct)
```php
Schema::create('products', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('name');
    $table->text('description');
    $table->decimal('price', 10, 2);
    $table->jsonb('media'); // GalleryItem[]
    
    // Targeting & Stock
    $table->string('target_audience')->default('all'); // all, technicians, providers, tow_trucks, customers
    $table->string('specialty')->nullable(); // If target is technicians
    $table->integer('total_stock');
    $table->integer('purchase_limit_per_buyer');
    
    // Type
    $table->boolean('is_flash')->default(false);
    $table->timestamp('expires_at')->nullable();
    
    // Store Categorization
    $table->string('store_category_id')->nullable();
    $table->foreign('store_category_id')->references('id')->on('store_categories');
    $table->string('store_subcategory_id')->nullable();
    
    // Logistics
    $table->string('shipping_size')->nullable(); // xs, s, m, l, vl
    $table->decimal('static_shipping_cost', 10, 2)->nullable();
    $table->jsonb('allowed_payment_methods')->nullable(); // Array of IDs
    
    // Stats
    $table->decimal('average_rating', 3, 2)->default(0);
    
    $table->timestamps();
});
```

#### `create_product_reviews_table`
```php
Schema::create('product_reviews', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('product_id');
    $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
    $table->string('user_id');
    $table->string('user_name');
    $table->integer('rating');
    $table->text('comment');
    $table->timestamp('date')->useCurrent();
    $table->timestamps();
});
```

#### `create_store_orders_table` (FlashProductBuyerRequest)
```php
Schema::create('store_orders', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('product_id');
    $table->foreign('product_id')->references('id')->on('products');
    
    // Buyer
    $table->string('buyer_id');
    $table->string('buyer_type');
    $table->string('buyer_name'); // Snapshot
    $table->string('buyer_unique_id'); // Snapshot
    
    // Order Details
    $table->integer('quantity');
    $table->decimal('total_price', 10, 2);
    $table->decimal('shipping_cost', 10, 2)->default(0);
    $table->string('status'); // pending, payment_verification, preparing, shipped, delivered, rejected, cancelled, approved
    
    // Fulfillment
    $table->string('delivery_method'); // shipping, pickup
    $table->text('shipping_address')->nullable();
    $table->string('contact_phone')->nullable();
    $table->string('payment_method_id')->nullable();
    $table->string('payment_method_name')->nullable();
    $table->string('payment_receipt_url')->nullable();
    
    $table->text('admin_notes')->nullable();
    $table->timestamp('request_date')->useCurrent();
    $table->timestamp('decision_date')->nullable();
    $table->timestamps();
});
```

### 2.4. System & Settings

#### `create_system_settings_table`
```php
Schema::create('system_settings', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique(); // e.g., 'global_config'
    $table->jsonb('value'); // Stores the entire Settings object
    $table->timestamps();
});
```

#### `create_blog_posts_table`
```php
Schema::create('blog_posts', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('slug')->unique();
    $table->string('title');
    $table->text('summary');
    $table->longText('content'); // Markdown
    $table->string('image_url');
    $table->string('author');
    $table->timestamp('published_at');
    $table->timestamps();
});
```

#### `create_faq_items_table`
```php
Schema::create('faq_items', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->text('question');
    $table->text('answer');
    $table->timestamps();
});
```

#### `create_announcements_table`
```php
Schema::create('announcements', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('title');
    $table->text('message');
    $table->string('target'); // all, customers, providers...
    $table->string('image_url')->nullable();
    $table->timestamp('timestamp')->useCurrent();
    $table->timestamps();
});
```

---

## 3. API Routes (`routes/api.php`)

### 3.1. Authentication (Sanctum)
*   `POST /auth/login` (Polymorphic login for all user types)
*   `POST /auth/register/customer`
*   `POST /auth/register/technician`
*   `POST /auth/register/tow-truck`
*   `POST /auth/otp/send`
*   `POST /auth/otp/verify`

### 3.2. Orders (Customer/Provider)
*   `POST /orders` (Create order with vehicle details and media)
*   `GET /orders` (List my orders, supports filtering)
*   `GET /orders/{orderNumber}` (Details)
*   `POST /orders/{orderNumber}/quotes` (Submit quote with media)
*   `POST /orders/{orderNumber}/accept` (Accept quote, provide payment info)
*   `PATCH /orders/{orderNumber}/status` (Update status e.g., 'delivered')

### 3.3. Store
*   `GET /store/products` (Filter by category, is_flash, target_audience, stock status)
*   `GET /store/products/{id}` (Product details including reviews)
*   `POST /store/purchase` (Create store order)
*   `GET /store/orders` (List my purchases)
*   `POST /store/products/{id}/review` (Add review)
*   `GET /store/categories` (Public list of store categories)

### 3.4. Public Directories
*   `GET /technicians` (Supports filtering by city, specialty, location sorting)
*   `GET /tow-trucks` (Supports filtering by city, vehicle type, location sorting)
*   `GET /technicians/{id}`
*   `GET /tow-trucks/{id}`

### 3.5. Admin
*   `GET /admin/stats` (Dashboard overview metrics)
*   `GET /admin/withdrawals`
*   `PATCH /admin/withdrawals/{id}`
*   `PUT /admin/settings` (Update global settings JSON)
*   `POST /admin/blog`
*   `POST /admin/faq`
*   `POST /admin/announcements`
*   `POST /admin/products` (Manage store/flash products)
*   `POST /admin/store/categories` (Manage store categories)
*   `GET /admin/store/orders` (List all store orders for fulfillment)
*   `PATCH /admin/store/orders/{id}` (Update store order status e.g., 'shipped')
*   `PATCH /admin/providers/{id}/status` (Activate/Deactivate)
*   `PATCH /admin/technicians/{id}/verify` (Verify/Activate)
*   `PATCH /admin/tow-trucks/{id}/verify` (Verify/Activate)

---

## 4. Services & Logic

### 4.1. Media Upload Service
*   Handle `multipart/form-data` uploads.
*   Store in `storage/app/public` (or S3).
*   Return full URL (e.g., `https://api.ramouse.com/storage/uploads/image.jpg`).

### 4.2. WhatsApp Notification Service
Handles sending messages via configured 3rd-party APIs with failover/rotation support.

The system stores multiple API configurations in Settings (`verificationApis`, `notificationApis`). The service uses a round-robin strategy with failover: it attempts the API at `currentIndex`, and if it fails, it updates the index and tries the next active API.

```php
class WhatsAppService
{
    public function sendNotification(string $phone, string $type, array $data): void
    {
        $settings = SystemSetting::get(); // Retrieves the full Settings object
        
        // Global switch check
        if (!$settings->whatsapp_notifications_active) return;
        
        // Template check
        $templateConfig = $settings->message_templates[$type] ?? null;
        if (!$templateConfig || !$templateConfig['enabled']) return;

        // Parse message
        $message = $this->parseTemplate($templateConfig['template'], $data);
        
        // Determine API list based on type (verification vs notification)
        $isVerification = ($type === 'VERIFICATION_CODE');
        $apis = $isVerification ? $settings->verificationApis : $settings->notificationApis;
        $indexKey = $isVerification ? 'lastUsedVerificationApiIndex' : 'lastUsedNotificationApiIndex';
        $currentIndex = $settings->$indexKey;

        // Dispatch job. The Job should implement the rotation:
        // 1. Try API at $currentIndex.
        // 2. If success, increment $currentIndex (mod count) and save settings.
        // 3. If fail, try next index immediately until all exhausted.
        SendWhatsAppMessage::dispatch($phone, $message, $apis, $currentIndex, $indexKey);
    }
}
```

### 4.3. Geolocation
Use PostGIS `ST_Distance` for efficient "Nearest Me" queries in directories.
Example Query Scope:
```php
public function scopeNearest($query, $lat, $lng) {
    return $query->orderByRaw("ST_Distance(location, ST_MakePoint(?, ?)::geography)", [$lng, $lat]);
}
```

---

## 5. Configuration (Singleton)
The `SystemSettings` model (`key='global_config'`) stores the frontend `Settings` interface as a JSON blob. This allows dynamic updates without migrations.

**Important Fields in JSON:**
*   `storePaymentMethods`: Array of `{ id, name, details, isActive }`. Used for Store checkout.
*   `storeBanners`: Array of `{ id, title, imageUrl, isActive, link }`. Managed via Admin Store Settings.
*   `paymentMethods`: Array of `{ id, name, details, isActive }`. Used for Parts Request checkout.
*   `limitSettings`: Object containing `shippingPrices` (City based pricing), `minWithdrawalAmount`, `maxImagesPerQuote`, etc.
*   `notificationSettings`: Object mapping `NotificationType` to boolean.
*   `messageTemplates`: Object mapping `NotificationType` to `{ template, enabled }`.
*   `seoSettings`: Global SEO defaults.
*   `companyPhone`, `companyAddress`, `companyEmail`, `ceoName`, `ceoMessage`: Contact info.

Admin endpoints simply update this JSON blob, allowing the frontend to react immediately to configuration changes.

---

## 6. Setup
1.  **Install**: `composer install`
2.  **Env**: Set `FILESYSTEM_DISK=public`. Configure DB credentials.
3.  **Migrate**: `php artisan migrate --seed`
4.  **Storage**: `php artisan storage:link`
5.  **Queue**: Run `php artisan queue:work` for WhatsApp/Telegram jobs.
