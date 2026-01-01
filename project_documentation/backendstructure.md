# Backend Structure Documentation

## Overview
The Ramouse Auto Parts backend is built using **Laravel 11** with a **PostgreSQL** database (using SQLite for development). It follows a RESTful API architecture with JWT-based authentication via Laravel Sanctum.

## Technology Stack
- **Framework**: Laravel 11
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Authentication**: Laravel Sanctum (Token-based)
- **File Storage**: Laravel Storage (Public disk)
- **External Services**: WhatsApp API integration for notifications

---

## Directory Structure

```
Backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── Admin/
│   │       │   ├── FinancialController.php
│   │       │   ├── SettingsController.php
│   │       │   └── VehicleDataController.php
│   │       ├── AdminController.php
│   │       ├── AuthController.php
│   │       ├── ContentController.php
│   │       ├── Controller.php
│   │       ├── DirectoryController.php
│   │       ├── NotificationController.php
│   │       ├── OrderController.php
│   │       ├── StoreController.php
│   │       └── UploadController.php
│   ├── Models/
│   │   ├── Announcement.php
│   │   ├── BlogPost.php
│   │   ├── Brand.php
│   │   ├── CarCategory.php
│   │   ├── CarModel.php
│   │   ├── Customer.php
│   │   ├── FaqItem.php
│   │   ├── Order.php
│   │   ├── PartType.php
│   │   ├── Product.php
│   │   ├── ProductReview.php
│   │   ├── Provider.php
│   │   ├── Quote.php
│   │   ├── StoreCategory.php
│   │   ├── StoreOrder.php
│   │   ├── SystemSettings.php
│   │   ├── Technician.php
│   │   ├── TechnicianSpecialty.php
│   │   ├── TowTruck.php
│   │   ├── Transaction.php
│   │   ├── User.php
│   │   └── Withdrawal.php
│   ├── Services/
│   │   └── WhatsAppService.php
│   └── Providers/
│       └── AppServiceProvider.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   ├── api.php
│   ├── web.php
│   └── console.php
├── config/
├── public/
├── resources/
├── storage/
└── tests/
```

---

## Core Components

### 1. Controllers

#### **AdminController.php**
Handles administrative operations including:
- User management (list, update, delete, reset password)
- Content management (blog posts, FAQs, announcements)
- Store management (products, categories, orders)
- Provider status management
- Tow truck management (CRUD operations)
- Technician and tow truck verification
- Dashboard statistics

**Key Methods:**
- `login()` - Admin authentication
- `stats()` - Dashboard statistics
- `listUsers()`, `updateUser()`, `deleteUser()`, `resetUserPassword()`
- `createBlogPost()`, `updateBlogPost()`, `deleteBlogPost()`
- `createFaq()`, `updateFaq()`, `deleteFaq()`
- `createAnnouncement()`, `deleteAnnouncement()`
- `createProduct()`, `createStoreCategory()`
- `listTowTrucks()`, `createTowTruck()`, `updateTowTruck()`, `deleteTowTruck()`
- `verifyTechnician()`, `verifyTowTruck()`
- `updateProviderStatus()`

#### **AuthController.php**
Manages authentication and user registration:
- Phone-based login flow
- OTP generation and verification via WhatsApp
- Multi-role registration (Customer, Technician, Tow Truck)
- Password reset functionality

**Key Methods:**
- `checkPhone()` - Verify if phone number exists
- `login()` - Standard login with phone/password
- `registerCustomer()`, `registerTechnician()`, `registerTowTruck()`
- `sendOtp()` - Send OTP via WhatsApp
- `verifyOtp()` - Verify OTP and complete registration
- `resetPassword()` - Password reset

#### **ContentController.php**
Public content delivery:
- Blog posts (list and individual)
- FAQ items
- Announcements

**Key Methods:**
- `listBlogPosts()` - Paginated blog list
- `getBlogPost($identifier)` - Get blog by ID or slug
- `listFaqItems()` - All FAQ items
- `getFaqItem($id)` - Single FAQ item
- `listAnnouncements()` - All announcements

#### **OrderController.php**
Order and quote management:
- Order creation
- Quote submission by providers
- Quote acceptance by customers
- Order status updates

**Key Methods:**
- `create()` - Create new order
- `list()` - List user's orders
- `show($orderNumber)` - Order details
- `submitQuote($orderNumber)` - Provider submits quote
- `acceptQuote($orderNumber)` - Customer accepts quote
- `updateStatus($orderNumber)` - Update order status

#### **StoreController.php**
E-commerce functionality:
- Product catalog
- Categories
- Purchase processing
- Order history
- Product reviews

**Key Methods:**
- `listProducts()` - Product catalog with filtering
- `getProduct($id)` - Product details
- `listCategories()` - Store categories
- `purchase()` - Process purchase
- `listOrders()` - User's store orders
- `addReview($id)` - Add product review

#### **DirectoryController.php**
Public directory listings:
- Technicians directory
- Tow trucks directory

**Key Methods:**
- `listTechnicians()` - All verified technicians
- `getTechnician($id)` - Technician details
- `listTowTrucks()` - All verified tow trucks
- `getTowTruck($id)` - Tow truck details

#### **UploadController.php**
File upload handling:
- Single and multiple file uploads
- File deletion
- Image storage in public disk

**Key Methods:**
- `upload()` - Single file upload
- `uploadMultiple()` - Multiple files upload
- `delete()` - Delete file

#### **NotificationController.php**
Notification management:
- WhatsApp message testing
- Notification statistics

**Key Methods:**
- `testWhatsApp()` - Test WhatsApp API
- `getStats()` - Notification statistics

#### **Admin Subdirectory Controllers**

##### **FinancialController.php**
Financial operations:
- Withdrawal requests management
- Transaction history
- Provider fund management

**Key Methods:**
- `listWithdrawals()` - All withdrawal requests
- `approveWithdrawal($id)` - Approve withdrawal
- `rejectWithdrawal($id)` - Reject withdrawal
- `listTransactions()` - Transaction history
- `addFunds($id)` - Add funds to provider

##### **SettingsController.php**
System settings management:
- WhatsApp API configuration
- General system settings
- Footer information

**Key Methods:**
- `getSettings()` - Retrieve all settings
- `updateSettings()` - Update settings

##### **VehicleDataController.php**
Vehicle data and specialty management:
- Car categories, brands, models
- Part types
- Technician specialties

**Key Methods:**
- `getAllData()` - Get all vehicle data
- `saveCategory()`, `deleteCategory($id)`
- `saveBrand()`, `deleteBrand($id)`
- `saveModel()`, `deleteModel($id)`
- `savePartType()`, `deletePartType($id)`
- `saveSpecialty()`, `deleteSpecialty($id)`

---

### 2. Models

All models use Eloquent ORM with defined relationships:

#### **User.php**
Base user model with Sanctum authentication.
- Uses `HasApiTokens`, `HasFactory`, `Notifiable`
- Fields: name, email, phone, password, role
- Relationships: Can be customer, technician, or tow truck owner

#### **Customer.php**
Customer profile extension.
- Belongs to User
- Fields: location coordinates, address details
- Relationships: Has many orders

#### **Provider.php**
Service provider (technician/tow truck owner).
- Belongs to User
- Fields: balance, verification status, rating
- Relationships: Has many quotes, withdrawals, transactions

#### **Technician.php**
Technician profile.
- Belongs to User and Provider
- Fields: specialties, location, availability, verification status
- Relationships: Has many technician specialties

#### **TowTruck.php**
Tow truck profile.
- Belongs to User and Provider
- Fields: vehicle details, capacity, location, availability, verification status

#### **Order.php**
Service orders.
- Belongs to Customer
- Fields: order number, type, status, location, description
- Relationships: Has many quotes

#### **Quote.php**
Provider quotes for orders.
- Belongs to Order and Provider
- Fields: price, estimated time, status, notes

#### **Product.php**
Store products.
- Fields: name, description, price, stock, images
- Relationships: Belongs to category, has many reviews

#### **StoreOrder.php**
E-commerce orders.
- Belongs to User
- Fields: order number, items (JSON), total, status

#### **BlogPost.php**
Blog content.
- Fields: title, slug, content, image, author
- Automatic slug generation

#### **FaqItem.php**
FAQ entries.
- Fields: question, answer, category, order

#### **Announcement.php**
System announcements.
- Fields: title, content, image, expiry date

#### **SystemSettings.php**
Application settings.
- Fields: key-value pairs for various settings
- Stores WhatsApp API configs, footer info, etc.

#### **Transaction.php**
Financial transactions.
- Belongs to Provider
- Fields: type, amount, description, reference

#### **Withdrawal.php**
Withdrawal requests.
- Belongs to Provider
- Fields: amount, status, bank details

#### **Brand.php, CarCategory.php, CarModel.php, PartType.php**
Vehicle data models for categorization.

#### **StoreCategory.php**
Product categories.

#### **ProductReview.php**
Product reviews and ratings.

#### **TechnicianSpecialty.php**
Technician specialty categories.

---

### 3. Services

#### **WhatsAppService.php**
Centralized WhatsApp integration service with failover support.

**Features:**
- Multiple API configuration support
- Round-robin API selection
- Automatic failover on API failure
- OTP message templates
- Notification message formatting

**Key Methods:**
- `sendMessage($to, $message)` - Send WhatsApp message with failover
- `sendOtp($phone, $otp)` - Send OTP message
- `sendOrderNotification($order, $provider)` - Order notifications
- `sendQuoteNotification($quote, $customer)` - Quote notifications

---

## Database Structure

### Migrations (22 total)

#### Core Laravel Tables
1. `users` - Base user authentication
2. `cache` - Application cache
3. `jobs` - Queue jobs
4. `personal_access_tokens` - Sanctum tokens

#### Application Tables
5. `customers` - Customer profiles
6. `providers` - Service provider base
7. `technicians` - Technician profiles
8. `tow_trucks` - Tow truck profiles
9. `orders` - Service orders
10. `quotes` - Provider quotes
11. `store_categories` - Product categories
12. `products` - Store products
13. `blog_posts` - Blog content
14. `product_reviews` - Product reviews
15. `store_orders` - E-commerce orders
16. `system_settings` - Application settings
17. `announcements` - System announcements
18. `faq_items` - FAQ entries
19. `brands`, `car_categories`, `car_models`, `part_types` - Vehicle data
20. `transactions` - Financial transactions
21. `withdrawals` - Withdrawal requests
22. `technician_specialties` - Technician specialties

---

## API Routes Structure

### Public Routes

#### Authentication (`/api/auth`)
- `POST /check-phone` - Check if phone exists
- `POST /login` - User login
- `POST /register/customer` - Customer registration
- `POST /register/technician` - Technician registration
- `POST /register/tow-truck` - Tow truck registration
- `POST /otp/send` - Send OTP
- `POST /otp/verify` - Verify OTP
- `POST /reset-password` - Password reset

#### Admin Authentication
- `POST /api/admin/login` - Admin login

#### File Uploads
- `POST /api/upload` - Single file upload
- `POST /api/upload/multiple` - Multiple files upload
- `DELETE /api/upload` - Delete file

#### Notifications (Testing)
- `POST /api/notifications/test-whatsapp` - Test WhatsApp
- `GET /api/notifications/stats` - Notification stats

#### Public Directories
- `GET /api/technicians` - List technicians
- `GET /api/technicians/{id}` - Technician details
- `GET /api/tow-trucks` - List tow trucks
- `GET /api/tow-trucks/{id}` - Tow truck details

#### Store (Public)
- `GET /api/store/products` - Product listing
- `GET /api/store/products/{id}` - Product details
- `GET /api/store/categories` - Categories

#### Content (Public)
- `GET /api/blog` - Blog posts
- `GET /api/blog/{identifier}` - Blog post (by ID or slug)
- `GET /api/faq` - FAQ items
- `GET /api/faq/{id}` - FAQ item
- `GET /api/announcements` - Announcements

### Protected Routes (Require Sanctum Token)

#### User Info
- `GET /api/user` - Current user details

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/{orderNumber}` - Order details
- `POST /api/orders/{orderNumber}/quotes` - Submit quote
- `POST /api/orders/{orderNumber}/accept` - Accept quote
- `PATCH /api/orders/{orderNumber}/status` - Update status

#### Store (Protected)
- `POST /api/store/purchase` - Purchase products
- `GET /api/store/orders` - User's store orders
- `POST /api/store/products/{id}/review` - Add review

#### Admin Routes (`/api/admin/*`)

**Dashboard:**
- `GET /stats` - Dashboard statistics

**Financials:**
- `GET /withdrawals` - Withdrawal requests
- `POST /withdrawals/{id}/approve` - Approve withdrawal
- `POST /withdrawals/{id}/reject` - Reject withdrawal
- `GET /transactions` - Transaction history
- `POST /providers/{id}/add-funds` - Add provider funds

**Settings:**
- `GET /settings` - Get settings
- `PUT /settings` - Update settings

**Vehicle Data:**
- `GET /vehicle/data` - All vehicle data
- `POST /vehicle/categories` - Add category
- `DELETE /vehicle/categories/{id}` - Delete category
- `POST /vehicle/brands` - Add brand
- `DELETE /vehicle/brands/{id}` - Delete brand
- `POST /vehicle/models` - Add model
- `DELETE /vehicle/models/{id}` - Delete model
- `POST /vehicle/part-types` - Add part type
- `DELETE /vehicle/part-types/{id}` - Delete part type
- `POST /technicians/specialties` - Add specialty
- `DELETE /technicians/specialties/{id}` - Delete specialty

**Content Management:**
- `POST /blog` - Create blog post
- `PUT /blog/{id}` - Update blog post
- `DELETE /blog/{id}` - Delete blog post
- `POST /faq` - Create FAQ
- `PUT /faq/{id}` - Update FAQ
- `DELETE /faq/{id}` - Delete FAQ
- `POST /announcements` - Create announcement
- `DELETE /announcements/{id}` - Delete announcement

**Store Management:**
- `POST /products` - Create product
- `POST /store/categories` - Create category
- `GET /store/orders` - All store orders
- `PATCH /store/orders/{id}` - Update order status

**User Management:**
- `GET /users` - List all users
- `PUT /users/{id}` - Update user
- `POST /users/{id}/reset-password` - Reset password
- `DELETE /users/{id}` - Delete user

**Tow Truck Management:**
- `GET /tow-trucks` - List tow trucks
- `POST /tow-trucks` - Create tow truck
- `PUT /tow-trucks/{id}` - Update tow truck
- `DELETE /tow-trucks/{id}` - Delete tow truck

**Verification:**
- `PATCH /technicians/{id}/verify` - Verify technician
- `PATCH /tow-trucks/{id}/verify` - Verify tow truck
- `PATCH /providers/{id}/status` - Update provider status

---

## Authentication Flow

### 1. **New User Registration (with OTP)**
```
1. User enters phone number → POST /api/auth/check-phone
2. If new user → Frontend shows registration form
3. User fills details → POST /api/auth/otp/send (sends OTP via WhatsApp)
4. User enters OTP → POST /api/auth/otp/verify
5. On success → Creates user and returns token
```

### 2. **Existing User Login**
```
1. User enters phone → POST /api/auth/check-phone
2. If exists and has password → Frontend shows password field
3. User enters password → POST /api/auth/login
4. Returns user data and Sanctum token
```

### 3. **Password Reset**
```
1. POST /api/auth/otp/send (with phone)
2. POST /api/auth/otp/verify (with OTP)
3. POST /api/auth/reset-password (with new password)
```

### 4. **Admin Login**
```
1. POST /api/admin/login (email/password)
2. Returns admin user and token
```

---

## WhatsApp Integration

### Configuration
WhatsApp APIs are configured in `system_settings` table with keys:
- `whatsapp_api_1` to `whatsapp_api_10`
- Each contains: `instance_id`, `access_token`, `enabled`

### Features
- **Failover Support**: Automatically tries next API if one fails
- **Round-Robin**: Distributes load across active APIs
- **Use Cases**:
  - OTP delivery
  - Order notifications to providers
  - Quote notifications to customers
  - General notifications

### Service Methods
```php
WhatsAppService::sendOtp($phone, $otp)
WhatsAppService::sendOrderNotification($order, $provider)
WhatsAppService::sendQuoteNotification($quote, $customer)
```

---

## File Storage

### Configuration
- **Disk**: `public` (symlinked to `public/storage`)
- **Upload Path**: `storage/app/public/uploads/`
- **Public URL**: `/storage/uploads/filename`

### Upload Types
- **Images**: Products, blog posts, announcements, user avatars
- **Documents**: Various attachments

### Storage Structure
```
storage/app/public/
└── uploads/
    ├── products/
    ├── blog/
    ├── announcements/
    └── users/
```

---

## Key Features

### 1. **Multi-Role System**
- Users can be Customers, Technicians, or Tow Truck Owners
- Role-based access control
- Separate registration flows

### 2. **Order & Quote System**
- Customers create orders
- Multiple providers can submit quotes
- Customer accepts one quote
- Status tracking throughout lifecycle

### 3. **E-commerce**
- Product catalog with categories
- Shopping cart and checkout
- Order management
- Product reviews and ratings

### 4. **Content Management**
- Blog with slug-based URLs
- FAQ system with categories
- Announcements with expiry

### 5. **Financial Management**
- Provider balance tracking
- Withdrawal requests
- Transaction history
- Admin fund management

### 6. **Verification System**
- Technician verification by admin
- Tow truck verification by admin
- Only verified providers appear in public directory

### 7. **Settings Management**
- Dynamic system settings
- WhatsApp API configuration
- Footer information
- General app settings

---

## Environment Variables

### Database
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ramouse
DB_USERNAME=postgres
DB_PASSWORD=
```

### App
```
APP_NAME=Ramouse
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000
```

### Session & Auth
```
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

---

## Development Setup

### Commands
```bash
# Install dependencies
composer install

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Create storage link
php artisan storage:link

# Start server
php artisan serve
```

---

## Testing Endpoints

### Test WhatsApp
```bash
POST /api/notifications/test-whatsapp
Body: {
  "phone": "201234567890",
  "message": "Test message"
}
```

### Test File Upload
```bash
POST /api/upload
Form Data:
  file: [file]
```

---

## Security Features

1. **Sanctum Token Authentication**: All protected routes require valid token
2. **Password Hashing**: bcrypt hashing for all passwords
3. **OTP Verification**: Secure phone verification
4. **Role-Based Access**: Admin routes protected
5. **Input Validation**: Request validation on all endpoints
6. **CSRF Protection**: Enabled for session-based requests
7. **Rate Limiting**: API rate limiting configured

---

## Performance Considerations

1. **Database Indexing**: Key fields indexed for performance
2. **Eager Loading**: Relationships eager-loaded to prevent N+1 queries
3. **Pagination**: Large datasets paginated
4. **Image Optimization**: Images stored efficiently
5. **Caching**: Cache configured for sessions and settings

---

## Error Handling

All API responses follow consistent format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": {...}
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Server Error

---

## Future Enhancements

1. Real-time notifications using WebSockets/Pusher
2. Payment gateway integration
3. Advanced search and filtering
4. Analytics dashboard
5. Mobile app API optimization
6. Multi-language support
7. Advanced reporting features

---

## Documentation References

- [API Documentation](./api_documentation.md)
- Laravel Documentation: https://laravel.com/docs/11.x
- Laravel Sanctum: https://laravel.com/docs/11.x/sanctum

---

**Last Updated**: November 25, 2025  
**Backend Version**: 1.0.0  
**Laravel Version**: 11.x
