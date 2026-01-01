# 🚀 Complete VPS Deployment Guide for Ramouse.com

> **Domain:** ramouse.com  
> **Stack:** Laravel 11 + React/Vite + MySQL 8.0 + Nginx + Reverb WebSocket  
> **Server OS:** Ubuntu 22.04 LTS (Recommended)  
> **Last Updated:** December 2024

---

## 📑 Table of Contents

1. [Initial VPS Setup & Security](#1-initial-vps-setup--security)
2. [Install Required Software](#2-install-required-software)
3. [MySQL Database Setup](#3-mysql-database-setup)
4. [Domain & DNS Configuration](#4-domain--dns-configuration)
5. [SSL Certificate with Certbot](#5-ssl-certificate-with-certbot)
6. [Backend Deployment](#6-backend-deployment)
7. [Frontend Build & Deployment](#7-frontend-build--deployment)
8. [Nginx Configuration](#8-nginx-configuration)
9. [Environment Configuration](#9-environment-configuration)
10. [Laravel Setup & Optimization](#10-laravel-setup--optimization)
11. [Supervisor: Queue Workers & Reverb](#11-supervisor-queue-workers--reverb)
12. [Cron Jobs Configuration](#12-cron-jobs-configuration)
13. [Firewall Configuration](#13-firewall-configuration)
14. [Testing & Verification](#14-testing--verification)
15. [Maintenance & Updates](#15-maintenance--updates)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Initial VPS Setup & Security

### 1.1 Connect to Your VPS

```bash
# Connect via SSH (replace with your server IP)
ssh root@YOUR_SERVER_IP
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
```

### 1.3 Create Deploy User (Security Best Practice)

```bash
# Create new user
adduser ramouse

# Add to sudo group
usermod -aG sudo ramouse

# Switch to new user
su - ramouse
```

### 1.4 Configure SSH Key Authentication

On your **local machine**:
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy key to server
ssh-copy-id ramouse@YOUR_SERVER_IP
```

### 1.5 Secure SSH (Optional but Recommended)

```bash
sudo nano /etc/ssh/sshd_config
```

Change these settings:
```
PermitRootLogin no
PasswordAuthentication no
Port 2222  # Change default port (optional)
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

> [!CAUTION]
> Before disabling password authentication, ensure your SSH key works!

### 1.6 Set Server Timezone

```bash
sudo timedatectl set-timezone Asia/Damascus
```

---

## 2. Install Required Software

### 2.1 Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

Verify:
```bash
sudo systemctl status nginx
# Should show "active (running)"
```

### 2.2 Install PHP 8.2 & Extensions

```bash
# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 with all required extensions
sudo apt install -y php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mysql php8.2-zip php8.2-gd php8.2-mbstring \
    php8.2-curl php8.2-xml php8.2-bcmath php8.2-intl \
    php8.2-readline php8.2-tokenizer php8.2-fileinfo
```

Verify:
```bash
php -v
# Should show PHP 8.2.x
```

### 2.3 Configure PHP-FPM

```bash
sudo nano /etc/php/8.2/fpm/php.ini
```

Update these values:
```ini
upload_max_filesize = 64M
post_max_size = 128M
memory_limit = 256M
max_execution_time = 300
max_input_time = 300
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.2-fpm
```

### 2.4 Install MySQL 8.0

```bash
sudo apt install mysql-server -y
sudo systemctl enable mysql
sudo systemctl start mysql
```

Secure MySQL:
```bash
sudo mysql_secure_installation
```
- Set root password: **Yes**
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privileges: **Yes**

### 2.5 Install Composer

```bash
cd ~
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

Verify:
```bash
composer --version
# Should show Composer version 2.x.x
```

### 2.6 Install Node.js 20 LTS

```bash
# Install Node.js using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:
```bash
node --version
# Should show v20.x.x

npm --version
# Should show 10.x.x
```

### 2.7 Install Supervisor

```bash
sudo apt install supervisor -y
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

### 2.8 Install Git

```bash
sudo apt install git -y
```

### 2.9 Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 3. MySQL Database Setup

### 3.1 Create Database and User

```bash
sudo mysql -u root -p
```

Run these SQL commands:
```sql
-- Create database
CREATE DATABASE ramouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with strong password
CREATE USER 'ramouse_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON ramouse_db.* TO 'ramouse_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;

-- Exit
EXIT;
```

### 3.2 Verify MySQL Version

```bash
mysql -V
# Should show: mysql  Ver 8.0.x for Linux on x86_64
```

### 3.3 Record Credentials

Save these for your `.env`:
```
DB_DATABASE=ramouse_db
DB_USERNAME=ramouse_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

---

## 4. Domain & DNS Configuration

### 4.1 Point Domain to VPS

In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

```
Type    Name    Value               TTL
A       @       YOUR_VPS_IP         3600
A       www     YOUR_VPS_IP         3600
CNAME   api     ramouse.com         3600
```

### 4.2 Verify DNS Propagation

```bash
# On your VPS
dig ramouse.com +short
# Should return your VPS IP

# Or use online tool
# https://dnschecker.org/#A/ramouse.com
```

### 4.3 Configure Server Hostname

```bash
sudo hostnamectl set-hostname ramouse.com
```

---

## 5. SSL Certificate with Certbot

### 5.1 Obtain SSL Certificate

```bash
sudo certbot --nginx -d ramouse.com -d www.ramouse.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose redirect HTTP to HTTPS (option 2)

### 5.2 Verify Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Check timer
sudo systemctl list-timers | grep certbot
```

### 5.3 Certificate Location

Certificates are stored at:
```
/etc/letsencrypt/live/ramouse.com/fullchain.pem
/etc/letsencrypt/live/ramouse.com/privkey.pem
```

---

## 6. Backend Deployment

### 6.1 Create Directory Structure

```bash
# Create web directory
sudo mkdir -p /var/www/ramouse
sudo chown -R ramouse:ramouse /var/www/ramouse
cd /var/www/ramouse
```

### 6.2 Option A: Upload via SFTP

From your local machine (PowerShell):
```powershell
# Create backend zip (excluding unnecessary files)
cd c:\laragon\www\ramouse
Compress-Archive -Path Backend\* -DestinationPath ramouse_backend.zip -Force
```

Upload using SFTP (FileZilla or WinSCP):
- Host: `ramouse.com` or `YOUR_VPS_IP`
- Port: `22` (or custom SSH port)
- Protocol: `SFTP`
- User: `ramouse`
- Upload to: `/var/www/ramouse/`

On server, extract:
```bash
cd /var/www/ramouse
unzip ramouse_backend.zip -d api
rm ramouse_backend.zip
```

### 6.2 Option B: Clone from Git Repository

If using Git:
```bash
cd /var/www/ramouse
git clone https://github.com/your-username/ramouse-backend.git api
```

### 6.3 Install Dependencies

```bash
cd /var/www/ramouse/api
composer install --no-dev --optimize-autoloader
```

### 6.4 Set Permissions

```bash
# Set ownership
sudo chown -R ramouse:www-data /var/www/ramouse/api
sudo chmod -R 755 /var/www/ramouse/api

# Writable directories
sudo chmod -R 775 /var/www/ramouse/api/storage
sudo chmod -R 775 /var/www/ramouse/api/bootstrap/cache

# Secure .env
sudo chmod 600 /var/www/ramouse/api/.env
```

### 6.5 Create Storage Link

```bash
cd /var/www/ramouse/api
php artisan storage:link
```

---

## 7. Frontend Build & Deployment

### 7.1 Configure Production Environment (Local)

On your local machine, create `Frontend/.env.production`:
```env
# API URL
VITE_API_URL=https://ramouse.com

# Reverb WebSocket Configuration
VITE_REVERB_APP_KEY=ramouse-app-key
VITE_REVERB_HOST=ramouse.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https

# Optional: Gemini API Key
# GEMINI_API_KEY=your_api_key
```

### 7.2 Build Frontend

```powershell
cd c:\laragon\www\ramouse\Frontend
npm install
npm run build
```

### 7.3 Upload Frontend

```bash
# On server, create frontend directory
mkdir -p /var/www/ramouse/frontend
```

Upload `Frontend/dist/` contents to `/var/www/ramouse/frontend/` via SFTP.

Or zip and upload:
```powershell
# Local: Create zip
Compress-Archive -Path Frontend\dist\* -DestinationPath frontend_dist.zip
```

```bash
# Server: Extract
cd /var/www/ramouse
unzip frontend_dist.zip -d frontend
rm frontend_dist.zip
```

### 7.4 Set Permissions

```bash
sudo chown -R ramouse:www-data /var/www/ramouse/frontend
sudo chmod -R 755 /var/www/ramouse/frontend
```

---

## 8. Nginx Configuration

### 8.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/ramouse.com
```

Paste this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ramouse.com www.ramouse.com;
    return 301 https://ramouse.com$request_uri;
}

# Redirect www to non-www
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.ramouse.com;

    ssl_certificate /etc/letsencrypt/live/ramouse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ramouse.com/privkey.pem;

    return 301 https://ramouse.com$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ramouse.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ramouse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ramouse.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Root for frontend (React SPA)
    root /var/www/ramouse/frontend;
    index index.html;

    # Client max body size for file uploads
    client_max_body_size 128M;

    # ===========================================
    # API ROUTES (Laravel Backend)
    # ===========================================
    location /api {
        alias /var/www/ramouse/api/public;
        try_files $uri $uri/ @api;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/ramouse/api/public/index.php;
            include fastcgi_params;
            fastcgi_param REQUEST_URI $request_uri;
        }
    }

    location @api {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    # ===========================================
    # BROADCASTING AUTH (Laravel)
    # ===========================================
    location /broadcasting {
        rewrite ^/broadcasting/(.*)$ /api/broadcasting/$1 last;
    }

    # ===========================================
    # STORAGE (Public Files)
    # ===========================================
    location /storage {
        alias /var/www/ramouse/api/storage/app/public;
        try_files $uri $uri/ =404;

        # Cache static files
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ===========================================
    # REVERB WEBSOCKET PROXY
    # ===========================================
    location /app {
        proxy_pass http://127.0.0.1:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /apps {
        proxy_pass http://127.0.0.1:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ===========================================
    # STATIC ASSETS (Frontend)
    # ===========================================
    location /assets {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PWA files
    location ~* ^/(manifest\.webmanifest|sw\.js|registerSW\.js)$ {
        try_files $uri =404;
        add_header Cache-Control "no-cache";
    }

    # ===========================================
    # SPA FALLBACK (React Router)
    # ===========================================
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/ramouse.access.log;
    error_log /var/log/nginx/ramouse.error.log;
}
```

### 8.2 Enable Site Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ramouse.com /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
# Should show: syntax is ok, test is successful

# Reload Nginx
sudo systemctl reload nginx
```

---

## 9. Environment Configuration

### 9.1 Create Production .env

```bash
sudo nano /var/www/ramouse/api/.env
```

```env
# ==========================================
# APPLICATION SETTINGS
# ==========================================
APP_NAME="Ramouse"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=Asia/Damascus
APP_URL=https://ramouse.com

APP_LOCALE=ar
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=ar_SA

# ==========================================
# DATABASE (MySQL 8.0)
# ==========================================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ramouse_db
DB_USERNAME=ramouse_user
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
REVERB_APP_SECRET=your-random-secret-string-here

REVERB_HOST=ramouse.com
REVERB_PORT=443
REVERB_SCHEME=https

# Reverb server settings
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=6001

# ==========================================
# WHATSAPP OTP
# ==========================================
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
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

### 9.2 Generate Application Key

```bash
cd /var/www/ramouse/api
php artisan key:generate
```

### 9.3 Generate Reverb Secret

```bash
# Generate random secret
openssl rand -hex 32
# Copy output to REVERB_APP_SECRET in .env
```

---

## 10. Laravel Setup & Optimization

### 10.1 Run Migrations

```bash
cd /var/www/ramouse/api
php artisan migrate --force
```

### 10.2 Seed Database

```bash
php artisan db:seed --force
```

### 10.3 Optimize for Production

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize Composer autoloader
composer dump-autoload --optimize
```

### 10.4 Verify Installation

```bash
# Check Laravel version
php artisan --version

# Test database connection
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Connected!';"

# List routes
php artisan route:list | head -20
```

---

## 11. Supervisor: Queue Workers & Reverb

### 11.1 Create Queue Worker Config

```bash
sudo nano /etc/supervisor/conf.d/ramouse-worker.conf
```

```ini
[program:ramouse-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ramouse/api/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=ramouse
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/ramouse/api/storage/logs/worker.log
stopwaitsecs=3600
```

### 11.2 Create Telegram Queue Worker

```bash
sudo nano /etc/supervisor/conf.d/ramouse-telegram-worker.conf
```

```ini
[program:ramouse-telegram]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ramouse/api/artisan queue:work database --queue=telegram --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=ramouse
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/ramouse/api/storage/logs/telegram-worker.log
stopwaitsecs=3600
```

### 11.3 Create Reverb WebSocket Config

```bash
sudo nano /etc/supervisor/conf.d/ramouse-reverb.conf
```

```ini
[program:ramouse-reverb]
process_name=%(program_name)s
command=php /var/www/ramouse/api/artisan reverb:start --host=0.0.0.0 --port=6001
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=ramouse
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/ramouse/api/storage/logs/reverb.log
stopwaitsecs=10
```

### 11.4 Start All Supervisor Processes

```bash
# Reload configuration
sudo supervisorctl reread
sudo supervisorctl update

# Start all processes
sudo supervisorctl start all

# Check status
sudo supervisorctl status
```

Expected output:
```
ramouse-reverb                   RUNNING   pid 1234, uptime 0:00:05
ramouse-telegram:ramouse-telegram_00 RUNNING   pid 1235, uptime 0:00:05
ramouse-worker:ramouse-worker_00     RUNNING   pid 1236, uptime 0:00:05
ramouse-worker:ramouse-worker_01     RUNNING   pid 1237, uptime 0:00:05
```

### 11.5 Supervisor Management Commands

```bash
# Restart all
sudo supervisorctl restart all

# Restart specific program
sudo supervisorctl restart ramouse-reverb

# Stop all
sudo supervisorctl stop all

# View logs
tail -f /var/www/ramouse/api/storage/logs/reverb.log
tail -f /var/www/ramouse/api/storage/logs/worker.log
```

---

## 12. Cron Jobs Configuration

### 12.1 Edit Crontab

```bash
sudo crontab -u ramouse -e
```

Add these lines:
```cron
# Laravel Scheduler - Run every minute
* * * * * cd /var/www/ramouse/api && php artisan schedule:run >> /dev/null 2>&1

# Clear expired sessions daily at 2 AM
0 2 * * * cd /var/www/ramouse/api && php artisan session:gc >> /dev/null 2>&1

# Optimize daily at 3 AM
0 3 * * * cd /var/www/ramouse/api && php artisan optimize >> /dev/null 2>&1
```

### 12.2 Verify Crontab

```bash
sudo crontab -u ramouse -l
```

---

## 13. Firewall Configuration

### 13.1 Configure UFW

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (use your custom port if changed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Reverb WebSocket (internal only - Nginx proxies)
# sudo ufw allow 6001/tcp  # Only if direct access needed

# Check status
sudo ufw status
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)
```

### 13.2 Additional Security (Optional)

```bash
# Install fail2ban for brute-force protection
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 14. Testing & Verification

### 14.1 Test API Endpoints

```bash
# Health check
curl -I https://ramouse.com/api/health

# Public endpoint
curl https://ramouse.com/api/technician-specialties
```

### 14.2 Test WebSocket Connection

In browser console:
```javascript
// Check Echo connection
Echo.connector.pusher.connection.state
// Should return: "connected"
```

### 14.3 Test Frontend

1. Visit `https://ramouse.com`
2. Check browser console for errors (F12 → Console)
3. Test user registration
4. Test file upload
5. Test geolocation features

### 14.4 Test PWA

1. Open DevTools → Application → Manifest
2. Verify manifest loads correctly
3. Try "Install" prompt

### 14.5 Test Telegram Notifications

1. Login to admin panel
2. Configure Telegram bot in Vehicle Categories
3. Create test order
4. Verify notification arrives

---

## 15. Maintenance & Updates

### 15.1 Deploy Updates

```bash
cd /var/www/ramouse/api

# Put in maintenance mode
php artisan down

# Pull latest code (if using Git)
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear and rebuild caches
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue workers
sudo supervisorctl restart ramouse-worker:*

# Bring back up
php artisan up
```

### 15.2 Update Frontend

```bash
# On local machine: rebuild
npm run build

# Upload new dist/ to server
# Or via Git on server:
cd /var/www/ramouse/frontend
git pull origin main
```

### 15.3 View Logs

```bash
# Laravel logs
tail -f /var/www/ramouse/api/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/ramouse.error.log
tail -f /var/log/nginx/ramouse.access.log

# Supervisor/worker logs
tail -f /var/www/ramouse/api/storage/logs/worker.log
tail -f /var/www/ramouse/api/storage/logs/reverb.log
```

### 15.4 Backup Database

```bash
# Create backup
mysqldump -u ramouse_user -p ramouse_db > /home/ramouse/backups/ramouse_$(date +%Y%m%d).sql

# Automate daily backups (add to crontab)
0 4 * * * mysqldump -u ramouse_user -p'PASSWORD' ramouse_db > /home/ramouse/backups/ramouse_$(date +\%Y\%m\%d).sql
```

---

## 16. Troubleshooting

### Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **502 Bad Gateway** | Nginx can't reach PHP | `sudo systemctl restart php8.2-fpm` |
| **Permission Denied** | Storage write errors | `sudo chmod -R 775 storage bootstrap/cache` |
| **WebSocket Fails** | Real-time not working | Check Reverb is running: `sudo supervisorctl status` |
| **Queue Not Processing** | Jobs stuck | `sudo supervisorctl restart ramouse-worker:*` |
| **SSL Certificate Error** | HTTPS not working | `sudo certbot renew --force-renewal` |
| **Database Error** | Connection refused | Verify MySQL running: `sudo systemctl status mysql` |

### Debug Commands

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
sudo supervisorctl status

# Test PHP-FPM
php -v

# Test MySQL connection
mysql -u ramouse_user -p -e "SELECT 1"

# Test Laravel
cd /var/www/ramouse/api
php artisan tinker
>>> DB::connection()->getPdo()

# Check disk space
df -h

# Check memory
free -m

# Check processes
htop
```

### Emergency Recovery

```bash
# Restart everything
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart mysql
sudo supervisorctl restart all

# Clear all Laravel caches
cd /var/www/ramouse/api
php artisan optimize:clear
```

---

## 📋 Final Deployment Checklist

### Server Setup
- [ ] VPS provisioned with Ubuntu 22.04
- [ ] Non-root deploy user created
- [ ] SSH key authentication configured
- [ ] System packages updated

### Software Installation
- [ ] Nginx installed and running
- [ ] PHP 8.2-FPM installed with extensions
- [ ] MySQL 8.0 installed and secured
- [ ] Composer installed
- [ ] Node.js 20 installed
- [ ] Supervisor installed
- [ ] Certbot installed

### Domain & SSL
- [ ] DNS pointing to VPS
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured

### Application
- [ ] Backend uploaded to `/var/www/ramouse/api`
- [ ] Composer dependencies installed
- [ ] Frontend built and uploaded
- [ ] Nginx configuration created and enabled
- [ ] `.env` configured with production values
- [ ] Application key generated
- [ ] Migrations run
- [ ] Database seeded
- [ ] Storage link created

### Background Services
- [ ] Queue workers configured in Supervisor
- [ ] Reverb WebSocket configured in Supervisor
- [ ] All Supervisor processes running
- [ ] Laravel scheduler cron job added

### Security
- [ ] Firewall (UFW) configured
- [ ] SSH secured
- [ ] `.env` permissions set to 600
- [ ] `APP_DEBUG=false`

### Testing
- [ ] Homepage loads
- [ ] API responds
- [ ] WebSocket connects
- [ ] User registration works
- [ ] File upload works
- [ ] Notifications work

---

## 🎉 Congratulations!

Your Ramouse application is now deployed on your VPS with full WebSocket support!

**Live URL:** https://ramouse.com

---

*Document Version: 1.0*  
*Created: December 2024*  
*For: ramouse.com VPS Deployment*
