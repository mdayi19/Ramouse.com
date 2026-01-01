# Professional Deployment Guide: Ramouse.com (MySQL Version)

This document provides a streamlined, step-by-step workflow for deploying the Ramouse application (Laravel 11 + React + MySQL) to a cPanel hosting environment.

---

## Phase 1: Prerequisites & Environment Setup

### 1.1 SSL & HTTPS (Mandatory)
Modern browsers block **Geolocation** on non-secure connections.
- Go to **SSL/TLS Status** in cPanel.
- Ensure **AutoSSL** is active for `ramouse.com`.

### 1.2 PHP Configuration (8.2+)
In **Select PHP Version** or **MultiPHP Ini Editor**, enable these extensions:
- `bcmath`, `ctype`, `fileinfo`, `intl`, `mbstring`, `openssl`, `pdo_mysql`, `xml`, `zip`.

Set these optimized values for media uploads:
- `upload_max_filesize = 64M`
- `post_max_size = 128M`
- `memory_limit = 256M`
- `max_execution_time = 300`

### 1.3 MySQL Requirements
- **MySQL 8.0+** is required for spatial functions (`ST_Distance_Sphere`, `ST_PointFromText`)
- Most modern cPanel hosts provide MySQL 8.0 by default

---

## Phase 2: Local File Preparation

### 2.1 Backend Packaging
Clean your local Laravel files before uploading to reduce size and avoid errors:
1. Run `php artisan optimize:clear` locally.
2. Select all files in the `Backend` folder.
3. **Exclude**: `.git`, `node_modules`, `tests`, and `storage/logs/*.log`.
4. Zip the remaining files into `ramouse_api.zip`.

### 2.2 Frontend Build
1. Update `Frontend/.env.production`:
   ```env
   VITE_API_URL=https://ramouse.com/api
   ```
2. Run `npm run build`.
3. Locate the `dist/` folder; this contains your frontend files.

---

## Phase 3: Backend Deployment

### 3.1 Uploading Files
1. Create a directory: `/home/username/ramouse_api`.
2. Upload and extract `ramouse_api.zip` there.
3. Link the public folder to your web root:
   ```bash
   rm -rf /home/username/public_html
   ln -s /home/username/ramouse_api/public /home/username/public_html
   ```

### 3.2 Permissions & Security
Set these permissions via SSH or File Manager:
- `storage/` and `bootstrap/cache/`: **775** (Recursive).
- `.env`: **600** (Read-only for the user).
- Run `php artisan storage:link` inside `ramouse_api`.

### 3.3 Production .env
Update `/home/username/ramouse_api/.env` with these values:
```env
APP_NAME="Ramouse"
APP_ENV=production
APP_URL=https://ramouse.com/api

# MySQL Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ramouse_db
DB_USERNAME=ramouse_user
DB_PASSWORD=your_secure_password

# Authentication
SANCTUM_STATEFUL_DOMAINS=ramouse.com
SESSION_DOMAIN=.ramouse.com

# Broadcast & Queues
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database

# Reverb SSL
REVERB_HOST="ramouse.com"
REVERB_PORT=443
REVERB_SCHEME=https
```

---

## Phase 4: Database Setup (MySQL)

### 4.1 cPanel Wizard
1. Use **MySQL® Database Wizard** to create your database and user.
2. Assign the user to the database with **ALL PRIVILEGES**.

### 4.2 Run Migrations
Via SSH or Terminal in cPanel:
```bash
cd /home/username/ramouse_api
php artisan migrate --force
php artisan db:seed --force
```

### 4.3 Verify MySQL Version
To ensure spatial functions work correctly, verify MySQL is 8.0+:
```bash
mysql -V
```
Or run this SQL query:
```sql
SELECT VERSION();
```

---

## Phase 5: Frontend Deployment

### 5.1 Uploading dist
Upload the contents of your local `Frontend/dist/` folder to `public_html/`.

### 5.2 Routing & API Proxy (.htaccess)
Create a `.htaccess` file in `public_html/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # 1. Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. Proxy API and Storage
  RewriteRule ^api/(.*)$ ramouse_api/public/index.php [L]
  RewriteRule ^storage/(.*)$ ramouse_api/storage/app/public/$1 [L]

  # 3. SPA Frontend Routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Phase 6: Service Configuration

### 6.1 Background Queue (Cron Job)
Add this Cron Job to handle Telegram notifications and system cleanup:
- **Interval**: Every Minute (`* * * * *`)
- **Command**: `php /home/username/ramouse_api/artisan schedule:run >> /dev/null 2>&1`

### 6.2 Admin Panel Setup
1. Log in to your deployed Admin Dashboard.
2. Go to **Vehicle Categories**.
3. Input **Telegram Bot Tokens** and **Channel IDs** for each category.

---

## Phase 7: Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **419 Page Expired** | Verify `SESSION_DOMAIN=.ramouse.com` in `.env`. |
| **Geolocation Failed** | Verify you are on `https://`. |
| **500 Internal Error** | Check `ramouse_api/storage/logs/laravel.log`. |
| **Spatial functions not found** | Ensure MySQL is version 8.0+. |
| **WS connection failed** | Ensure Reverb is configured for port 443 with HTTPS. |

---

## Final Launch Checklist
1. [ ] Run `php artisan optimize` on the server.
2. [ ] Verify SSL via **SSL/TLS Status**.
3. [ ] Test User Registration and File Upload.
4. [ ] Verify Telegram notifications arrive in the specified channel.
5. [ ] Test "Nearest Me" search for Technicians (spatial queries).
