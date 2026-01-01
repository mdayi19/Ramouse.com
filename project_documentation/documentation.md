# Ramouse Auto Parts - Complete Documentation

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Documentation Index](#documentation-index)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Common Tasks](#common-tasks)
- [Deployment Guide](#deployment-guide)
- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License & Credits](#license--credits)

---

## Project Overview

**Ramouse Auto Parts** is a comprehensive web application for auto parts ordering and service management. It connects customers seeking auto parts with providers, and features a directory for technicians and tow truck services.

### Key Capabilities

- 🚗 **Multi-Step Part Ordering**: Customers specify vehicle details and part requirements through a guided 7-step process
- 💬 **Quote Management**: Multiple providers can bid on orders; customers choose the best offer
- 🛒 **E-Commerce Store**: Sell products directly to customers, technicians, and service providers
- 👨‍🔧 **Service Directories**: Public listings for verified technicians and tow truck services
- 📱 **WhatsApp Integration**: OTP authentication and order notifications via WhatsApp
- 📊 **Admin Dashboard**: Complete management of orders, users, content, and system settings
- 🌙 **Dark Mode**: Full dark mode support across the entire application
- 🌍 **RTL Arabic Interface**: Right-to-left design for Arabic language support

### Target Users

1. **Customers**: Individuals or businesses ordering auto parts
2. **Providers**: Auto parts suppliers who quote on customer orders
3. **Technicians**: Mechanics and repair shops with public profiles
4. **Tow Truck Operators**: Vehicle recovery services with directory listings
5. **Administrators**: Platform managers with full system control

---

## Quick Start

### Prerequisites

- **Backend**: PHP 8.2+, Composer, PostgreSQL 15+
- **Frontend**: Node.js 20+, npm
- **System**: Git, PostGIS extension for PostgreSQL

### Installation (Development)

```bash
# 1. Clone the repository
git clone <repository-url>
cd ramouse

# 2. Backend Setup
cd Backend
composer install
cp .env.example .env
# Edit .env with your database credentials
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve

# 3. Frontend Setup (new terminal)
cd ../Frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Login**: Use seeded credentials (check DatabaseSeeder)

---

## Documentation Index

### Core Documentation

| Document | Description | Size |
|----------|-------------|------|
| **[API Documentation](./api_documentation.md)** | Complete API endpoint reference with request/response examples | 44.5 KB |
| **[Backend Structure](./backendstructure.md)** | Laravel backend architecture, controllers, models, services | 21.4 KB |
| **[Frontend Structure](./frontendstructure.md)** | React/TypeScript frontend architecture, components, state management | 38.5 KB |
| **[Database Schema](./databaseschema.md)** | Complete database schema with 25 tables, relationships, and indexes | 60+ KB |

### Supporting Documentation

| Location | Description |
|----------|-------------|
| **workflow/** | Step-by-step workflow guides |
| **old/** | Archived documentation |
| **Backend/README.md** | Laravel-specific setup notes |

---

## Project Structure

```
ramouse/
├── Backend/                      # Laravel 11 Backend
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       ├── Admin/       # Admin-specific controllers
│   │   │       ├── AdminController.php
│   │   │       ├── AuthController.php
│   │   │       ├── ContentController.php
│   │   │       ├── DirectoryController.php
│   │   │       ├── NotificationController.php
│   │   │       ├── OrderController.php
│   │   │       ├── StoreController.php
│   │   │       └── UploadController.php
│   │   ├── Models/              # Eloquent models (23 models)
│   │   ├── Services/            # Business logic services
│   │   │   └── WhatsAppService.php
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/          # 22 migration files
│   │   ├── seeders/             # Database seeders
│   │   └── factories/
│   ├── routes/
│   │   ├── api.php             # API routes (149 lines)
│   │   ├── web.php             # Web routes
│   │   └── console.php
│   ├── storage/
│   │   └── app/public/uploads/ # User uploads
│   └── public/
│
├── Frontend/                     # React 18 Frontend
│   ├── src/
│   │   ├── components/          # 66+ React components
│   │   │   ├── DashboardParts/  # Admin dashboard (31 components)
│   │   │   ├── CustomerDashboardParts/ # Customer views
│   │   │   ├── ProviderDashboardParts/ # Provider views
│   │   │   ├── TechnicianDashboardParts/
│   │   │   ├── TowTruckDashboardParts/
│   │   │   └── [main components] # 66 total components
│   │   ├── services/            # API service layer (6 files)
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAppState.ts  # Main state management
│   │   │   └── useTelegram.ts
│   │   ├── lib/                 # Core utilities
│   │   │   ├── api.ts          # Axios configuration
│   │   │   ├── config.ts
│   │   │   └── db.ts           # IndexedDB
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── types.ts            # TypeScript definitions (572 lines)
│   │   └── constants.tsx
│   ├── public/
│   ├── index.html
│   └── vite.config.ts
│
└── project_documentation/        # This directory
    ├── documentation.md          # This file (master index)
    ├── api_documentation.md
    ├── backendstructure.md
    ├── frontendstructure.md
    ├── databaseschema.md
    ├── workflow/
    └── old/
```

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel** | 11.x | PHP framework |
| **PostgreSQL** | 15+ | Primary database |
| **PostGIS** | 3.3+ | Geolocation features |
| **Laravel Sanctum** | - | API authentication |
| **Composer** | 2.x | Dependency management |
| **Axios** (PHP) | - | External API calls |

**Key PHP Packages**:
- `laravel/sanctum` - Token authentication
- `postgis/laravel-doctrine` - PostGIS support (optional)

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.4 | Type safety |
| **Vite** | 5.1 | Build tool |
| **TailwindCSS** | 3.4 | Styling |
| **Axios** | 1.6 | HTTP client |
| **Lucide React** | 0.344 | Icons |
| **React Router DOM** | 6.22 | Routing (planned) |

**Key npm Packages**:
- `@google/generative-ai` - AI integration
- `qrcode` - QR code generation
- `clsx`, `tailwind-merge` - Class utilities

### Development Tools

- **Git** - Version control
- **Laragon/XAMPP** - Local development (Windows)
- **pgAdmin** - Database management
- **Postman** - API testing
- **VS Code** - Recommended editor

---

## Development Setup

### Detailed Backend Setup

```bash
cd Backend

# Install dependencies
composer install

# Environment configuration
cp .env.example .env

# Configure .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=ramouse
# DB_USERNAME=postgres
# DB_PASSWORD=yourpassword

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database with sample data
php artisan db:seed

# Create storage symlink
php artisan storage:link

# Start development server
php artisan serve
```

**Backend runs on**: http://localhost:8000

### Detailed Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Environment configuration
cp .env.example .env

# Configure .env
# VITE_API_URL=http://localhost:8000/api
# VITE_GEMINI_API_KEY=your_gemini_key (optional)

# Start development server
npm run dev
```

**Frontend runs on**: http://localhost:5173

### Database Setup

#### PostgreSQL Installation

**Windows (Laragon)**:
1. Laragon includes PostgreSQL
2. Start Laragon → Database → PostgreSQL

**Manual PostgreSQL**:
1. Download from postgresql.org
2. Install with PostGIS extension
3. Create database: `CREATE DATABASE ramouse;`
4. Enable PostGIS: `CREATE EXTENSION postgis;`

#### Create Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE ramouse;

-- Connect to ramouse database
\c ramouse

-- Enable PostGIS extension
CREATE EXTENSION postgis;

-- Verify
SELECT PostGIS_Version();
```

---

## Common Tasks

### Backend Tasks

#### Run Migrations

```bash
# Run all pending migrations
php artisan migrate

# Fresh migration (drops all tables)
php artisan migrate:fresh

# Rollback last batch
php artisan migrate:rollback

# Migrate and seed
php artisan migrate:fresh --seed
```

#### Database Seeding

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=WhatsAppSettingsSeeder
```

#### Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### Create New Controller

```bash
php artisan make:controller ExampleController
php artisan make:controller Admin/ExampleController
```

#### Create New Model

```bash
php artisan make:model Example -m  # with migration
php artisan make:model Example -mfs # with migration, factory, seeder
```

#### Create Migration

```bash
php artisan make:migration create_examples_table
php artisan make:migration add_field_to_examples_table
```

#### Generate API Documentation

```bash
# If using Laravel API documentation package
php artisan api:generate
```

### Frontend Tasks

#### Build for Production

```bash
cd Frontend
npm run build
```

Output: `Frontend/dist/`

#### Preview Production Build

```bash
npm run preview
```

#### TypeScript Type Checking

```bash
npm run build  # Includes tsc check
```

#### Linting

```bash
npm run lint
```

#### Install New Package

```bash
npm install <package-name>
npm install -D <dev-package>  # Dev dependency
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit with message
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Merge to main (after PR approval)
git checkout main
git merge feature/new-feature
git push origin main
```

---

## Deployment Guide

### Production Deployment Checklist

#### Backend Deployment

1. **Server Requirements**
   - PHP 8.2+
   - PostgreSQL 15+
   - Composer
   - Nginx/Apache
   - SSL Certificate

2. **Environment Configuration**
   ```bash
   # .env production settings
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com
   
   DB_CONNECTION=pgsql
   DB_HOST=your-db-host
   DB_DATABASE=production_db
   DB_USERNAME=production_user
   DB_PASSWORD=strong_password
   
   SESSION_DRIVER=database
   CACHE_DRIVER=redis  # Recommended
   QUEUE_CONNECTION=redis
   ```

3. **Deployment Steps**
   ```bash
   # On server
   git clone <repo> /var/www/ramouse
   cd /var/www/ramouse/Backend
   
   composer install --optimize-autoloader --no-dev
   
   php artisan key:generate
   php artisan migrate --force
   php artisan db:seed --force
   php artisan storage:link
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   
   # Set permissions
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

4. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       root /var/www/ramouse/Backend/public;
   
       add_header X-Frame-Options "SAMEORIGIN";
       add_header X-Content-Type-Options "nosniff";
   
       index index.php;
   
       location / {
           try_files $uri $uri/ /index.php?$query_string;
       }
   
       location ~ \.php$ {
           fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
           fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
           include fastcgi_params;
       }
   
       location ~ /\.(?!well-known).* {
           deny all;
       }
   }
   ```

#### Frontend Deployment

1. **Build Application**
   ```bash
   cd Frontend
   
   # Set production API URL
   echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
   
   # Build
   npm run build
   ```

2. **Deploy to Static Host**
   
   **Option A: Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/ramouse/Frontend/dist;
   
       index index.html;
   
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   **Option B: Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   
   **Option C: Netlify**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables (Static Host)**
   ```bash
   VITE_API_URL=https://api.yourdomain.com/api
   ```

#### Database Migration (Production)

```bash
# Backup existing database
pg_dump -U postgres production_db > backup_$(date +%Y%m%d).sql

# Run migrations
php artisan migrate --force

# Verify
php artisan migrate:status
```

#### SSL Configuration

```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

#### Monitoring & Logs

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Components (66+)     │    State (useAppState)   │   │
│  │   ─────────────────────┼─────────────────────── │   │
│  │   Services             │    IndexedDB Cache       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST (Axios)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend API (Laravel)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Routes (api.php)  →  Controllers (13)           │   │
│  │       ↓                     ↓                      │   │
│  │  Middleware        →    Services                  │   │
│  │  (Sanctum Auth)         (WhatsAppService)         │   │
│  │       ↓                     ↓                      │   │
│  │  Eloquent Models (23)  →  Database               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ SQL Queries
                      ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database (25 tables)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Users, Orders, Products, Content, Financial     │   │
│  │  + PostGIS for Geolocation                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

External Services:
├── WhatsApp API ──→ OTP & Notifications
├── Google Gemini ──→ AI Suggestions (optional)
└── Telegram API ──→ Order Notifications (optional)
```

### Request Flow Example

**User Login Flow**:
```
1. User enters phone → Frontend sends POST /api/auth/check-phone
2. Backend checks if phone exists in customers/technicians/tow_trucks
3. If exists → Response: {exists: true, hasPassword: true}
4. Frontend shows password field
5. User enters password → POST /api/auth/login
6. Backend validates credentials, generates Sanctum token
7. Response: {token: "...", user: {...}, role: "customer"}
8. Frontend stores token in localStorage
9. All subsequent requests include: Authorization: Bearer {token}
```

**Order Creation Flow**:
```
1. Customer fills 7-step form → Frontend collects data
2. Submit → POST /api/orders (with FormData including images)
3. Backend (OrderController@create):
   - Validates request
   - Uploads images to storage
   - Creates order record
   - Sends WhatsApp notifications to providers
4. Response: {success: true, orderNumber: "ORD-..."}
5. Frontend navigates to success screen
6. Providers receive WhatsApp notification
7. Providers submit quotes via POST /api/orders/{orderNumber}/quotes
```

### Authentication Architecture

**Laravel Sanctum** (Token-based):
- Frontend gets token after login
- Token stored in localStorage
- Axios interceptor adds token to all requests
- Backend validates token via Sanctum middleware
- Token can be revoked for logout

**Multi-Role System**:
- `users` table → Admins only
- `customers`, `providers`, `technicians`, `tow_trucks` → Separate tables
- Phone-based authentication for all non-admin users
- Admin uses email/password

---

## Key Features

### 1. Multi-Step Order System

**Customer Journey**:
1. **Category Selection**: Choose vehicle origin (German, Japanese, etc.)
2. **Brand Selection**: Pick manufacturer or enter manually
3. **Model Selection**: Choose vehicle model
4. **Part Type**: Select needed parts (multi-select)
5. **Details**: Description, images, video, voice note, VIN
6. **Review**: Confirm all details
7. **Success**: Get order number and QR code

**Technical Implementation**:
- `currentStep` state in `useAppState`
- 7 separate step components
- Form data accumulated in `formData` state
- Progress bar shows current position
- Can navigate backward to edit

### 2. Quote Management

**Provider Workflow**:
1. Browse available orders (filtered by assigned categories)
2. View order details (vehicle, part requirements, media)
3. Submit quote (price, part condition, proof images)
4. Wait for customer decision
5. If accepted → Process order through status updates

**Customer Workflow**:
1. Receive notification when first quote arrives
2. View all quotes with:
   - Price comparison
   - Part condition (new/used)
   - Provider rating
   - Media proof
3. Accept one quote
4. Upload payment receipt
5. Track order status

### 3. E-Commerce Store

**Features**:
- Product catalog with categories
- Flash sales with expiration
- Target-specific products (e.g., technicians-only)
- Shopping cart
- Payment receipt upload
- Admin approval workflow
- Product reviews and ratings

**Product Types**:
- Regular store products
- Flash/limited-time products
- Targeted products (by user role/specialty)

### 4. Service Directories

**Technician Directory**:
- Public listings of verified technicians
- Filter by specialty and city
- Profiles with:
  - Photos and videos
  - Social media links
  - Customer reviews
  - QR codes for sharing
  - "Near Me" geolocation search (PostGIS)

**Tow Truck Directory**:
- Similar to technicians
- Vehicle type information
- Service area coverage
- Real-time availability (planned)

### 5. WhatsApp Integration

**Use Cases**:
1. **OTP Verification**: Send verification codes for new user registration
2. **Order Notifications**: Notify providers of new orders in their categories
3. **Quote Alerts**: Notify customers when quotes arrive
4. **Status Updates**: Order status change notifications

**Failover System**:
- Configure up to 10 WhatsApp APIs
- Round-robin distribution
- Automatic failover if API fails

**Implementation**: `WhatsAppService.php`

### 6. Admin Dashboard

**Management Modules**:
- **Overview**: Statistics and analytics
- **Orders**: View and manage all orders, update statuses
- **Users**: CRUD for customers, providers, technicians, tow trucks
- **Content**: Blog posts, FAQs, announcements
- **Store**: Products, categories, store orders
- **Financial**: Withdrawals, transactions, balance management
- **Settings**: System configuration, WhatsApp APIs, payment methods
- **Vehicle Data**: Categories, brands, models, part types

**26 Admin Views** in total across `DashboardParts/`

### 7. Wallet & Financial System

**Provider Wallet**:
- Track earnings from accepted orders
- Request withdrawals
- View transaction history
- Admin approval for withdrawals

**Transaction Types**:
- `deposit`: Automatic credit when order accepted
- `manual_deposit`: Admin manual credit
- `withdrawal`: Withdrawal deduction

### 8. Notification System

**Notification Types** (25+ types):
- Order updates
- Quote notifications
- Payment confirmations
- System announcements
- Verification status
- Financial updates

**Storage**: Currently localStorage (can migrate to database)

**Display**:
- Header notification bell with badge
- Dropdown preview (5 recent)
- Full notification center
- Toast notifications for immediate feedback

---

## API Overview

### API Base URL

**Development**: `http://localhost:8000/api`  
**Production**: `https://api.yourdomain.com/api`

### Authentication

**Header**:
```
Authorization: Bearer {token}
```

**Get Token**:
```bash
POST /api/auth/login
Body: {
  "phone": "201234567890",
  "password": "password"
}

Response: {
  "success": true,
  "data": {
    "token": "1|abc123...",
    "user": {...},
    "role": "customer"
  }
}
```

### Main Endpoint Groups

| Group | Base Path | Auth Required | Description |
|-------|-----------|---------------|-------------|
| **Authentication** | `/api/auth/*` | No | Login, register, OTP |
| **Orders** | `/api/orders/*` | Yes | Order CRUD, quotes |
| **Store** | `/api/store/*` | Partial | Products, purchases |
| **Directories** | `/api/technicians/*`, `/api/tow-trucks/*` | No | Public listings |
| **Content** | `/api/blog/*`, `/api/faq/*` | No | Public content |
| **Admin** | `/api/admin/*` | Yes (Admin) | Management |
| **Upload** | `/api/upload/*` | No | File uploads |

### Quick API Examples

**Check Phone Exists**:
```bash
POST /api/auth/check-phone
{
  "phone": "201234567890"
}
```

**Create Order**:
```bash
POST /api/orders
Authorization: Bearer {token}
{
  "formData": {...},
  "images": [File, File],
  "video": File
}
```

**List Products**:
```bash
GET /api/store/products?category=oils&limit=20
```

**Get Blog Posts**:
```bash
GET /api/blog
```

For complete API documentation, see **[api_documentation.md](./api_documentation.md)**

---

## Testing

### Backend Testing

**Laravel Testing**:
```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=OrderTest

# With coverage
php artisan test --coverage
```

**Create Test**:
```bash
php artisan make:test OrderTest
php artisan make:test Api/OrderApiTest
```

**Example Test** (Feature Test):
```php
public function test_customer_can_create_order()
{
    $customer = Customer::factory()->create();
    $token = $customer->createToken('test')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
    ])->postJson('/api/orders', [
        'formData' => [
            'category' => 'German',
            'brand' => 'BMW',
            // ... other fields
        ]
    ]);

    $response->assertStatus(201)
             ->assertJsonStructure(['success', 'orderNumber']);
}
```

### Frontend Testing (Planned)

**Unit Tests** (Jest + React Testing Library):
```bash
npm test
```

**E2E Tests** (Cypress/Playwright):
```bash
npx playwright test
```

### Manual Testing

**Postman Collection**:
- Import `project_documentation/old/` if available
- Or use API documentation to create requests

**Browser Testing**:
- Chrome DevTools
- React DevTools
- Network tab for API calls

---

## Troubleshooting

### Common Backend Issues

#### Migration Errors

**Problem**: `SQLSTATE[42P01]: Undefined table`
```bash
# Solution: Clear cache and re-migrate
php artisan config:clear
php artisan migrate:fresh --seed
```

**Problem**: `Class "PostGIS" not found`
```sql
-- Solution: Enable PostGIS extension
psql -U postgres ramouse
CREATE EXTENSION postgis;
```

#### Storage Link Issues

**Problem**: Uploaded images not accessible
```bash
# Solution: Recreate storage link
php artisan storage:link

# Verify
ls -la public/storage  # Should link to ../storage/app/public
```

#### CORS Errors

**Problem**: Frontend can't access API
```php
// Solution: config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173'],
'supports_credentials' => true,
```

#### Token Authentication Issues

**Problem**: 401 Unauthorized on protected routes
```bash
# Check token in request
# Chrome DevTools → Network → Headers → Authorization: Bearer ...

# Verify token in database
SELECT * FROM personal_access_tokens WHERE tokenable_id = 'phone';
```

### Common Frontend Issues

#### API Connection Failed

**Problem**: `Network Error` or `ERR_CONNECTION_REFUSED`
```bash
# Check .env
cat .env | grep VITE_API_URL
# Should match backend URL

# Restart dev server
npm run dev
```

#### Build Errors

**Problem**: TypeScript errors during build
```bash
# Check types
npx tsc --noEmit

# Fix imports and type definitions
# See types.ts for reference
```

#### State Not Persisting

**Problem**: Login state lost on refresh
```javascript
// Check localStorage
console.log(localStorage.getItem('authToken'))
console.log(localStorage.getItem('isAuthenticated'))

// Check cookies (Sanctum)
document.cookie
```

### Database Issues

#### Connection Failed

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -p 5432

# Check PostgreSQL service
sudo systemctl status postgresql  # Linux
# or check Laragon database status
```

#### Slow Queries

```sql
-- Enable query logging
ALTER DATABASE ramouse SET log_min_duration_statement = 1000;

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Create missing indexes
CREATE INDEX idx_orders_status ON orders(status);
```

#### Disk Space Full

```bash
# Check database size
SELECT pg_size_pretty(pg_database_size('ramouse'));

# Vacuum database
VACUUM FULL ANALYZE;

# Clean old data (carefully!)
DELETE FROM sessions WHERE last_activity < EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days');
```

---

## Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Changes**
   ```bash
   # Backend
   php artisan test
   
   # Frontend
   npm run build  # Ensure no errors
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/feature-name
   ```

### Code Style Guidelines

**Backend (Laravel)**:
- Follow PSR-12 coding standard
- Use descriptive variable names
- Add PHPDoc comments for methods
- Use Eloquent relationships over raw queries

**Frontend (React/TypeScript)**:
- Use functional components with hooks
- Define TypeScript interfaces for props
- Use meaningful component names
- Keep components focused (single responsibility)
- Use `camelCase` for variables, `PascalCase` for components

### Commit Message Convention

```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting)
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks
```

---

## License & Credits

### License

This project is proprietary software. All rights reserved.

### Credits

**Development Team**:
- Backend: Laravel 11 + PostgreSQL
- Frontend: React 18 + TypeScript + TailwindCSS
- Database: PostgreSQL with PostGIS

**Third-Party Services**:
- WhatsApp Business API
- Google Gemini AI (optional)
- Telegram Bot API (optional)

**Icons**: Lucide React  
**Fonts**: Google Fonts (if used)

---

## Next Steps

### For New Developers

1. ✅ Read this documentation
2. ✅ Set up development environment
3. ✅ Review [Backend Structure](./backendstructure.md)
4. ✅ Review [Frontend Structure](./frontendstructure.md)
5. ✅ Study [Database Schema](./databaseschema.md)
6. ✅ Test API endpoints with [API Documentation](./api_documentation.md)
7. ✅ Run the application locally
8. ✅ Make a small test change
9. ✅ Ask questions!

### For Administrators

1. ✅ Deploy to production (see [Deployment Guide](#deployment-guide))
2. ✅ Configure WhatsApp API
3. ✅ Set up backup system
4. ✅ Configure monitoring
5. ✅ Train staff on admin dashboard

### Planned Features

- [ ] Real-time notifications (WebSockets/Pusher)
- [ ] Payment gateway integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Progressive Web App (PWA)
- [ ] Email notifications (in addition to WhatsApp)
- [ ] Advanced search with Elasticsearch
- [ ] Video chat support for technicians
- [ ] Inventory management for providers

---

## Contact & Support

**Documentation Issues**: Create an issue in the repository  
**Technical Support**: Contact development team  
**Feature Requests**: Submit via issue tracker

---

**Last Updated**: November 25, 2025  
**Documentation Version**: 1.0.0  
**Application Version**: 1.0.0

---

## Quick Links

- 📖 [API Documentation](./api_documentation.md) - Complete API reference
- 🏗️ [Backend Structure](./backendstructure.md) - Laravel architecture
- ⚛️ [Frontend Structure](./frontendstructure.md) - React architecture  
- 🗄️ [Database Schema](./databaseschema.md) - Database design
- 📁 [Workflows](./workflow/) - Step-by-step guides
- 📦 [Old Documentation](./old/) - Archive
