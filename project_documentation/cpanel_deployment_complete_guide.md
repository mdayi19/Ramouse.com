# 🚀 Complete cPanel Deployment Guide for Ramouse.com

> **Domain:** ramouse.com  
> **Stack:** Laravel 11 (Backend) + React/Vite (Frontend) + MySQL 8.0  
> **Last Updated:** December 2024

---

## 📑 Table of Contents

1. [Prerequisites & Requirements](#1-prerequisites--requirements)
2. [Domain & SSL Configuration](#2-domain--ssl-configuration)
3. [cPanel PHP Configuration](#3-cpanel-php-configuration)
4. [Database Setup](#4-database-setup)
5. [Backend Deployment](#5-backend-deployment)
6. [Frontend Build & Deployment](#6-frontend-build--deployment)
7. [Server Configuration (htaccess)](#7-server-configuration-htaccess)
8. [Environment Configuration](#8-environment-configuration)
9. [Laravel Final Setup](#9-laravel-final-setup)
10. [Cron Jobs & Queue Workers](#10-cron-jobs--queue-workers)
11. [WebSocket (Reverb) Configuration](#11-websocket-reverb-configuration)
12. [Testing & Verification](#12-testing--verification)
13. [Troubleshooting Guide](#13-troubleshooting-guide)

---

## 1. Prerequisites & Requirements

### 1.1 What You Need Before Starting

| Requirement | Minimum Version | Purpose |
|-------------|-----------------|---------|
| **PHP** | 8.2+ | Laravel 11 requirement |
| **MySQL** | 8.0+ | Spatial functions support |
| **Node.js** | 18+ | Building frontend |
| **Composer** | 2.0+ | PHP dependencies |
| **SSH Access** | Enabled | Running commands on server |
| **SSL Certificate** | Valid | HTTPS for security & geolocation |

### 1.2 cPanel Access Requirements

You will need:
- cPanel login credentials
- SSH access (Terminal access in cPanel)
- FTP/SFTP access (File Manager or FileZilla)
- Access to MySQL Databases

### 1.3 Local Machine Requirements

Ensure you have installed:
```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version   # Should be 9+

# Check Composer version
composer --version  # Should be 2+
```

---

## 2. Domain & SSL Configuration

### 2.1 Point Domain to cPanel

**Step 1:** Log in to your domain registrar (GoDaddy, Namecheap, etc.)

**Step 2:** Update DNS records:
```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          3600
A       www     YOUR_SERVER_IP          3600
CNAME   *       ramouse.com             3600
```

> **Note:** Replace `YOUR_SERVER_IP` with your hosting server's IP address.

**Step 3:** Wait for DNS propagation (can take 24-48 hours)

**Step 4:** Verify propagation:
```bash
# On Windows Command Prompt
nslookup ramouse.com

# Or using online tools
# https://dnschecker.org/#A/ramouse.com
```

### 2.2 SSL Certificate Setup

**Step 1:** In cPanel, go to **SSL/TLS Status**

**Step 2:** Enable **AutoSSL** for ramouse.com

**Step 3:** Wait for certificate issuance (usually 5-10 minutes)

**Step 4:** Verify SSL:
```
https://www.ssllabs.com/ssltest/analyze.html?d=ramouse.com
```

> [!WARNING]
> **Geolocation API REQUIRES HTTPS!**  
> Modern browsers will block location requests on non-secure (http://) connections.

---

## 3. cPanel PHP Configuration

### 3.1 Select PHP Version

**Step 1:** In cPanel, go to **Select PHP Version** or **MultiPHP Manager**

**Step 2:** Set PHP version to **8.2** or higher for ramouse.com

**Step 3:** Click **Set as Current**

### 3.2 Enable Required PHP Extensions

In **Select PHP Version** → **Extensions**, enable these:

```
✅ bcmath     - Required for precise calculations
✅ ctype      - Laravel requirement
✅ curl       - API requests (WhatsApp, Telegram)
✅ dom        - XML handling
✅ fileinfo   - File type detection
✅ gd         - Image processing
✅ intl       - Internationalization
✅ json       - JSON handling
✅ mbstring   - Multibyte string handling
✅ openssl    - Encryption
✅ pdo_mysql  - MySQL database driver
✅ tokenizer  - Laravel requirement
✅ xml        - XML parsing
✅ zip        - Zip file handling
```

### 3.3 PHP INI Settings

In **MultiPHP INI Editor** or **Select PHP Version** → **Options**:

```ini
# File Upload Settings
upload_max_filesize = 64M
post_max_size = 128M

# Memory & Execution
memory_limit = 256M
max_execution_time = 300
max_input_time = 300

# Error Handling
display_errors = Off
log_errors = On

# Session Settings
session.cookie_secure = On
session.cookie_httponly = On
```

**Screenshot Reference:**
```
cPanel → Select PHP Version → Switch To PHP Options → Edit Settings
```

---

## 4. Database Setup

### 4.1 Create MySQL Database

**Step 1:** In cPanel, go to **MySQL® Database Wizard**

**Step 2:** Create Database:
```
Database Name: ramouse_main
# Full name will be: cpanelusername_ramouse_main
```

**Step 3:** Create User:
```
Username: ramouse_user
Password: [Generate Strong Password - SAVE THIS!]
```
> **Example:** `X9#mK2$vL7@nP4!qR6`

**Step 4:** Assign Privileges:
- Select **ALL PRIVILEGES** ✅
- Click **Make Changes**

### 4.2 Record Database Credentials

Save these values - you'll need them for the `.env` file:

```env
DB_DATABASE=cpanelusername_ramouse_main
DB_USERNAME=cpanelusername_ramouse_user
DB_PASSWORD=your_generated_password
```

### 4.3 Verify MySQL Version

Via SSH Terminal in cPanel:
```bash
mysql -V
```

Expected output:
```
mysql  Ver 8.0.x for Linux on x86_64
```

> [!IMPORTANT]
> MySQL 8.0+ is required for spatial functions like `ST_Distance_Sphere` used in location-based features.

---

## 5. Backend Deployment

### 5.1 Prepare Backend Files Locally

**Step 1:** Open PowerShell/Terminal in your local Backend folder:
```powershell
cd c:\laragon\www\ramouse\Backend
```

**Step 2:** Clear development cache:
```bash
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

**Step 3:** Remove development files:
```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force tests -ErrorAction SilentlyContinue
Remove-Item storage/logs/*.log -ErrorAction SilentlyContinue
```

### 5.2 Create Backend ZIP File

**Step 1:** Navigate to parent directory:
```powershell
cd c:\laragon\www\ramouse
```

**Step 2:** Create ZIP archive:
```powershell
# Using 7-Zip (recommended)
& "C:\Program Files\7-Zip\7z.exe" a -tzip ramouse_backend.zip Backend\* -xr!node_modules -xr!.git -xr!tests -xr!*.log

# OR using Windows built-in
Compress-Archive -Path Backend\* -DestinationPath ramouse_backend.zip -Force
```

### 5.3 Upload Backend to Server

**Method A: cPanel File Manager**

1. Login to cPanel
2. Go to **File Manager**
3. Navigate to home directory (`/home/username/`)
4. Click **Upload** → Select `ramouse_backend.zip`
5. Wait for upload to complete
6. Right-click the zip → **Extract**
7. Rename extracted folder to `ramouse_api`

**Method B: SFTP/FileZilla**

```
Host: ramouse.com (or server IP)
Port: 22
Username: [cPanel username]
Password: [cPanel password]
Protocol: SFTP

# Upload to:
/home/username/ramouse_api/
```

### 5.4 Server Directory Structure

After upload, your server should look like:
```
/home/username/
├── ramouse_api/          ← Laravel Backend
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── lang/
│   ├── public/
│   │   └── index.php    ← Laravel entry point
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   ├── artisan
│   └── composer.json
├── public_html/          ← Will contain frontend
└── ...
```

### 5.5 Install Composer Dependencies (On Server)

**Step 1:** Access SSH via cPanel **Terminal** or SSH client

**Step 2:** Navigate to backend directory:
```bash
cd /home/username/ramouse_api
```

**Step 3:** Install dependencies:
```bash
# Production install (no dev dependencies)
composer install --no-dev --optimize-autoloader
```

> [!NOTE]
> If composer is not available, try:
> ```bash
> php composer.phar install --no-dev --optimize-autoloader
> ```

### 5.6 Set Directory Permissions

```bash
cd /home/username/ramouse_api

# Storage directories must be writable
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Secure .env file
chmod 600 .env

# Ensure proper ownership
chown -R $(whoami):$(whoami) storage bootstrap/cache
```

---

## 6. Frontend Build & Deployment

### 6.1 Configure Production Environment

**Step 1:** Navigate to Frontend folder locally:
```powershell
cd c:\laragon\www\ramouse\Frontend
```

**Step 2:** Create/Edit `.env.production` file:
```env
# API Configuration
VITE_API_URL=https://ramouse.com

# Reverb WebSocket Configuration (HTTPS)
VITE_REVERB_APP_KEY=ramouse-app-key
VITE_REVERB_HOST=ramouse.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https

# Optional: Gemini API Key (for AI features)
# GEMINI_API_KEY=your_gemini_api_key
```

### 6.2 Build Frontend

**Step 1:** Install dependencies (if not already):
```bash
npm install
```

**Step 2:** Build for production:
```bash
npm run build
```

**Step 3:** Verify build output:
```powershell
# Check dist folder was created
ls dist

# Expected output:
# assets/
# index.html
# manifest.webmanifest
# registerSW.js
# sw.js
# *.png (PWA icons)
```

### 6.3 Upload Frontend to Server

**Method A: cPanel File Manager**

1. In File Manager, go to `/home/username/public_html/`
2. **Delete all existing files** (backup first if needed)
3. Upload contents of local `Frontend/dist/` folder
4. Ensure `index.html` is directly in `public_html/`

**Method B: SFTP**

```bash
# Upload dist folder contents to:
/home/username/public_html/
```

### 6.4 Verify Frontend Structure

After upload, `public_html` should contain:
```
/home/username/public_html/
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
├── index.html
├── manifest.webmanifest
├── registerSW.js
├── sw.js
├── pwa-192x192.png
├── pwa-512x512.png
├── favicon.ico
├── apple-touch-icon.png
└── .htaccess              ← We'll create this next
```

---

## 7. Server Configuration (.htaccess)

### 7.1 Create Main .htaccess

Create `/home/username/public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # ========================================
    # 1. FORCE HTTPS
    # ========================================
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # ========================================
    # 2. REMOVE WWW (Canonical URL)
    # ========================================
    RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
    
    # ========================================
    # 3. API PROXY TO LARAVEL
    # ========================================
    # Route /api/* requests to Laravel backend
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^api/(.*)$ /ramouse_api/public/index.php [L,QSA]
    
    # ========================================
    # 4. BROADCASTING PROXY
    # ========================================
    RewriteCond %{REQUEST_URI} ^/broadcasting
    RewriteRule ^broadcasting/(.*)$ /ramouse_api/public/index.php [L,QSA]
    
    # ========================================
    # 5. STORAGE FILES PROXY
    # ========================================
    RewriteCond %{REQUEST_URI} ^/storage
    RewriteRule ^storage/(.*)$ /ramouse_api/public/storage/$1 [L]
    
    # ========================================
    # 6. SPA FRONTEND ROUTING
    # ========================================
    # If file exists, serve it
    RewriteCond %{REQUEST_FILENAME} !-f
    # If directory exists, serve it
    RewriteCond %{REQUEST_FILENAME} !-d
    # Otherwise, route to index.html (React Router)
    RewriteRule . /index.html [L]
</IfModule>

# ========================================
# ADDITIONAL SECURITY HEADERS
# ========================================
<IfModule mod_headers.c>
    # CORS Headers for API
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Security Headers
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# ========================================
# GZIP COMPRESSION
# ========================================
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
    AddOutputFilterByType DEFLATE application/javascript application/x-javascript
    AddOutputFilterByType DEFLATE text/javascript text/xml application/xml
</IfModule>

# ========================================
# CACHE CONTROL FOR STATIC ASSETS
# ========================================
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Fonts
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    
    # CSS & JavaScript (Vite adds hash to filenames)
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    
    # HTML (no cache for SPA routing)
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

### 7.2 Create Laravel .htaccess

Create `/home/username/ramouse_api/public/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## 8. Environment Configuration

### 8.1 Backend .env Configuration

Edit `/home/username/ramouse_api/.env`:

```env
# ==========================================
# APPLICATION SETTINGS
# ==========================================
APP_NAME="Ramouse"
APP_ENV=production
APP_KEY=base64:GENERATE_NEW_KEY_ON_SERVER
APP_DEBUG=false
APP_TIMEZONE=Asia/Damascus
APP_URL=https://ramouse.com

APP_LOCALE=ar
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=ar_SA

# ==========================================
# DATABASE CONFIGURATION (MySQL)
# ==========================================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cpanelusername_ramouse_main
DB_USERNAME=cpanelusername_ramouse_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# ==========================================
# SESSION & AUTHENTICATION
# ==========================================
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.ramouse.com

SANCTUM_STATEFUL_DOMAINS=ramouse.com,www.ramouse.com

# ==========================================
# CACHE & QUEUE
# ==========================================
CACHE_STORE=database
QUEUE_CONNECTION=database

# ==========================================
# FILESYSTEM
# ==========================================
FILESYSTEM_DISK=public

# ==========================================
# BROADCASTING (REVERB)
# ==========================================
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=ramouse-app-id
REVERB_APP_KEY=ramouse-app-key
REVERB_APP_SECRET=ramouse-app-secret-generate-random

REVERB_HOST=ramouse.com
REVERB_PORT=443
REVERB_SCHEME=https

# Server-side Reverb configuration
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=6001

# ==========================================
# WHATSAPP OTP INTEGRATION
# ==========================================
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# ==========================================
# LOGGING
# ==========================================
LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

# ==========================================
# MAIL (Optional)
# ==========================================
MAIL_MAILER=smtp
MAIL_HOST=mail.ramouse.com
MAIL_PORT=587
MAIL_USERNAME=noreply@ramouse.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@ramouse.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### 8.2 Generate Application Key

Via SSH on server:
```bash
cd /home/username/ramouse_api
php artisan key:generate
```

This will automatically update the `APP_KEY` in your `.env` file.

---

## 9. Laravel Final Setup

### 9.1 Run Migrations

```bash
cd /home/username/ramouse_api

# Run migrations
php artisan migrate --force
```

### 9.2 Seed Database

```bash
# Seed with initial data
php artisan db:seed --force
```

### 9.3 Create Storage Link

```bash
# Create public storage symlink
php artisan storage:link
```

This creates a symlink from `public/storage` to `storage/app/public`.

### 9.4 Optimize for Production

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### 9.5 Verify Laravel Installation

```bash
# Test artisan commands
php artisan --version
# Expected: Laravel Framework 11.x.x

# Test database connection
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Connected!';"
# Expected: Connected!
```

---

## 10. Cron Jobs & Queue Workers

### 10.1 Laravel Scheduler (REQUIRED)

In cPanel, go to **Cron Jobs**:

**Add New Cron Job:**
```
Frequency: Every Minute (Common Settings)
Or manually: * * * * *

Command:
cd /home/username/ramouse_api && php artisan schedule:run >> /dev/null 2>&1
```

This runs Laravel's task scheduler every minute for:
- Sending scheduled notifications
- Cleaning up expired OTPs
- Processing queued jobs
- System maintenance tasks

### 10.2 Queue Worker (For Background Jobs)

**Option A: Scheduler-based (Recommended for Shared Hosting)**

The cron job above will handle queued jobs through the scheduler.

**Option B: Dedicated Queue Worker (VPS/Dedicated Only)**

If you have VPS access with Supervisor:

```bash
# Create supervisor config
sudo nano /etc/supervisor/conf.d/ramouse-worker.conf
```

```ini
[program:ramouse-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/username/ramouse_api/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgi=quit
user=cpanelusername
numprocs=2
redirect_stderr=true
stdout_logfile=/home/username/ramouse_api/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ramouse-worker:*
```

### 10.3 Verify Cron Jobs

Check cron is working:
```bash
# Check Laravel schedule status
cd /home/username/ramouse_api
php artisan schedule:list
```

---

## 11. WebSocket (Reverb) Configuration

> [!WARNING]
> **Important:** Laravel Reverb requires a persistent process. Most shared hosting does NOT support this. You may need a VPS for real-time features.

### 11.1 Shared Hosting Alternative

For shared hosting without WebSocket support, switch to **polling**:

Edit `Frontend/src/services/echo.ts` (if applicable) to use:
```javascript
// Fallback to polling instead of WebSocket
const pollInterval = 10000; // 10 seconds
```

### 11.2 VPS/Dedicated: Running Reverb

If you have VPS/root access:

**Step 1:** Create Supervisor config:
```bash
sudo nano /etc/supervisor/conf.d/ramouse-reverb.conf
```

```ini
[program:ramouse-reverb]
command=php /home/username/ramouse_api/artisan reverb:start --host=0.0.0.0 --port=6001
autostart=true
autorestart=true
user=cpanelusername
redirect_stderr=true
stdout_logfile=/home/username/ramouse_api/storage/logs/reverb.log
```

**Step 2:** Start Reverb:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ramouse-reverb
```

**Step 3:** Configure Nginx/Apache proxy for WebSocket (port 443 → 6001)

### 11.3 Verify WebSocket Connection

In browser console:
```javascript
Echo.connector.pusher.connection.state
// Expected: "connected"
```

---

## 12. Testing & Verification

### 12.1 Backend API Tests

```bash
# Test API is accessible
curl -I https://ramouse.com/api/health
# Expected: HTTP/2 200

# Test a public endpoint
curl https://ramouse.com/api/technician-specialties
# Expected: JSON response with specialties
```

### 12.2 Frontend Tests

1. **Homepage Load:**
   - Visit `https://ramouse.com`
   - Verify page loads without errors

2. **PWA Installation:**
   - Open Chrome DevTools → Application → Manifest
   - Verify manifest is loaded
   - Try "Add to Home Screen"

3. **User Registration:**
   - Try registering a new user
   - Verify OTP is sent (check WhatsApp)
   - Complete registration

4. **Geolocation:**
   - Allow location access
   - Verify "Near Me" search works

5. **File Upload:**
   - Try uploading a profile picture
   - Verify image is stored and displayed

### 12.3 Admin Panel

1. Login to admin: `https://ramouse.com/admin`
2. Configure Telegram settings in Vehicle Categories
3. Create a test order and verify Telegram notification

### 12.4 Browser Console Check

Open DevTools (F12) → Console:
- Should have no red errors
- Network requests should return 200/201

---

## 13. Troubleshooting Guide

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **500 Internal Server Error** | White page, error 500 | Check `storage/logs/laravel.log` for details |
| **419 Page Expired** | CSRF token errors | Verify `SESSION_DOMAIN=.ramouse.com` in `.env` |
| **401 Unauthenticated** | API returns unauthorized | Check `SANCTUM_STATEFUL_DOMAINS` includes domain |
| **Geolocation Failed** | Location not working | Ensure HTTPS is enabled |
| **Images Not Loading** | 404 on /storage/ URLs | Run `php artisan storage:link` |
| **API Not Found** | 404 on /api/ routes | Check `.htaccess` rewrite rules |
| **Database Error** | Connection refused | Verify DB credentials in `.env` |
| **CORS Errors** | Blocked by CORS policy | Add domain to allowed origins |
| **Queue Jobs Not Running** | Notifications delayed | Verify cron job is running |
| **WebSocket Failed** | Real-time not working | Check Reverb configuration |

### Debug Commands

```bash
# View Laravel logs
tail -f /home/username/ramouse_api/storage/logs/laravel.log

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Clear all caches
php artisan optimize:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Check route list
php artisan route:list

# Test queue
php artisan queue:work --once

# Check PHP version
php -v
```

### Log Files Location

```
# Laravel Logs
/home/username/ramouse_api/storage/logs/laravel.log

# PHP Error Logs (cPanel)
/home/username/logs/error.log

# Apache Access Logs
/var/log/apache2/ramouse.com-access.log

# Apache Error Logs
/var/log/apache2/ramouse.com-error.log
```

---

## 📋 Final Deployment Checklist

Before going live, verify each item:

### Pre-Launch
- [ ] SSL certificate is active and valid
- [ ] PHP 8.2+ is selected in cPanel
- [ ] All PHP extensions are enabled
- [ ] MySQL database created with correct credentials
- [ ] Backend files uploaded to `/home/username/ramouse_api/`
- [ ] Composer dependencies installed
- [ ] Directory permissions set (775 for storage/bootstrap/cache)
- [ ] `.env` file configured with production values
- [ ] `APP_KEY` generated
- [ ] `APP_DEBUG=false` in production
- [ ] Frontend built with production environment
- [ ] Frontend dist files uploaded to `public_html/`
- [ ] `.htaccess` configured correctly
- [ ] Migrations run successfully
- [ ] Database seeded with initial data
- [ ] Storage link created
- [ ] Cron job added for scheduler

### Post-Launch Testing
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] OTP verification works
- [ ] User login works
- [ ] File upload works
- [ ] Geolocation works
- [ ] Order creation works
- [ ] Telegram notifications work
- [ ] Admin panel accessible
- [ ] PWA installable
- [ ] No console errors

---

## 🎉 Congratulations!

Your Ramouse application should now be live at **https://ramouse.com**!

For support or updates, check the project documentation in `/project_documentation/`.

---

*Document Version: 1.0*  
*Created: December 2024*  
*For: ramouse.com Deployment*
