# 🚀 Complete VPS Deployment Guide for Ramouse Application

This is a **step-by-step beginner-friendly guide** to deploy the Ramouse Laravel Backend + React Frontend application to your VPS using Docker.

---

## 📋 Table of Contents

1. [Before You Begin](#before-you-begin)
2. [Step 1: Connect to Your VPS Server](#step-1-connect-to-your-vps-server)
3. [Step 2: Install Docker](#step-2-install-docker)
4. [Step 3: Upload Your Project to the Server](#step-3-upload-your-project-to-the-server)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Build and Start the Application](#step-5-build-and-start-the-application)
7. [Step 6: Post-Deployment Setup](#step-6-post-deployment-setup)
8. [Step 7: Verify Everything Works](#step-7-verify-everything-works)
9. [Troubleshooting](#troubleshooting)
10. [Useful Commands Cheat Sheet](#useful-commands-cheat-sheet)
11. [Optional: Automated Deployment with GitHub](#optional-automated-deployment-with-github)

---

## 💡 Before You Begin

### Your VPS Server Details
| Setting | Value |
|---------|-------|
| **IP Address** | `168.119.22.44` |
| **SSH Port** | `44334` |
| **Username** | `root` |
| **Password** | `IhgdZim4C2jp9u7VSqG` |

### First-Timer Tips 🎓
- **Terminal/Command Prompt**: This is the black (or blue) window where you type commands
- **SSH**: A secure way to remotely control your VPS (like remote desktop, but with text commands)
- **How to paste in terminal**: Right-click (NOT Ctrl+V - that often doesn't work!)
- **Commands**: Copy each command from this guide, paste in terminal, and press **Enter**
- **Don't panic**: If something goes wrong, you can always run the troubleshooting commands

---

## Step 1: Connect to Your VPS Server

### On Windows

**Option A: Using PowerShell (Recommended)**
1. Press `Windows Key + X`, then click "Windows PowerShell" or "Terminal"
2. Type this command and press **Enter**:

```bash
ssh -p 44334 root@168.119.22.44
```

3. If asked "Are you sure you want to continue connecting?", type `yes` and press **Enter**
4. When prompted for password, type (or paste with right-click):
```
IhgdZim4C2jp9u7VSqG
```
> ⚠️ **Note**: The password won't show as you type - this is normal for security!

**Option B: Using PuTTY (Alternative)**
1. Download [PuTTY](https://www.putty.org/) and install it
2. Open PuTTY and enter:
   - **Host Name**: `168.119.22.44`
   - **Port**: `44334`
   - **Connection type**: SSH
3. Click **Open**
4. Login as `root` with password `IhgdZim4C2jp9u7VSqG`

### ✅ Success Check
You should see something like:
```
root@your-server:~#
```
This means you're now "inside" your VPS server!

---

## Step 2: Install Docker

Docker is a tool that packages your app with everything it needs to run. Think of it like a shipping container for software.

### Your Server OS: Rocky Linux 8.10

Your VPS is running **Rocky Linux 8.10**. Run these commands **one by one**:

```bash
# Install required utilities
dnf install -y dnf-plugins-core
```

```bash
# Add Docker repository
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

```bash
# Install Docker
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

```bash
# Start Docker and enable it on boot
systemctl start docker
systemctl enable docker
```

### ✅ Verify Docker Installation
```bash
docker --version
docker compose version
```

You should see version numbers like:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## Step 3: Upload Your Project to the Server

You have **two options**: using Git (recommended) or manual upload.

### Option A: Using Git (Recommended) 🌟

#### 1. Generate SSH Key on VPS
```bash
ssh-keygen -t ed25519 -C "vps-deploy"
```
Press **Enter** for all prompts (use default values).

#### 2. Show the Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```
**Copy the entire output** (starts with `ssh-ed25519`)

#### 3. Add Key to GitHub
1. Go to your GitHub repository: https://github.com/mdayi19/Ramouse.com
2. Click **Settings** → **Deploy keys** → **Add deploy key**
3. Title: `VPS Production`
4. Key: Paste the key you copied
5. Check "Allow write access" if needed
6. Click **Add key**

#### 4. Clone the Repository
```bash
# Create directory
mkdir -p /var/www
cd /var/www

# Clone the project
git clone git@github.com:mdayi19/Ramouse.com.git ramouse
cd ramouse
```

### Option B: Manual Upload (Using SFTP)

#### 1. Install WinSCP on Your Computer
Download from: https://winscp.net/

#### 2. Connect with WinSCP
- **File protocol**: SFTP
- **Host name**: `168.119.22.44`
- **Port**: `44334`
- **User name**: `root`
- **Password**: `IhgdZim4C2jp9u7VSqG`

#### 3. Upload Files
1. On the server (right side), navigate to `/var/www/`
2. Create a folder called `ramouse`
3. Upload your entire project (Backend, Frontend, docker-compose.yml, nginx folders, and ramouse.sql) to `/var/www/ramouse/`

> ⚠️ **Important**: Do NOT upload `node_modules` or `vendor` folders - Docker will install these!

---

## Step 4: Configure Environment Variables

This is the **most important step**! Environment variables tell your app how to connect to the database and where it's running.

### 1. Navigate to Project Folder
```bash
cd /var/www/ramouse
```

### 2. Create the Main .env File
```bash
nano .env
```

### 3. Paste This Configuration

Copy and paste the following (right-click to paste in terminal):

```env
# ================================
# APPLICATION SETTINGS
# ================================
APP_NAME=Ramouse
APP_ENV=production
APP_DEBUG=false
APP_URL=https://ramouse.com

# ================================
# DATABASE SETTINGS (for Docker)
# ================================
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=ramouse_db
DB_USERNAME=ramouse_user
DB_PASSWORD=YourSecurePassword123!

# ================================
# CACHE & SESSION (using Redis)
# ================================
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# ================================
# FRONTEND / REVERB SETTINGS
# ================================
VITE_API_URL=/api
VITE_REVERB_HOST=ramouse.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=ramouse-app-key
```

> 🔐 **IMPORTANT**: Change `YourSecurePassword123!` to a strong password of your choice!

### 4. Save the File
- Press `Ctrl + O` (letter O, not zero)
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

### 5. Copy .env to Backend Folder
```bash
cp .env Backend/.env
```

### What Do These Settings Mean?
| Setting | Meaning |
|---------|---------|
| `DB_HOST=db` | Connect to the Docker MySQL container named "db" |
| `REDIS_HOST=redis` | Connect to the Docker Redis container |
| `APP_URL` | Your server's IP address |
| `VITE_API_URL=/api` | Frontend API calls go to /api endpoint |

---

## Step 5: Build and Start the Application

Now let's start everything with Docker!

### 1. Make Sure You're in the Project Folder
```bash
cd /var/www/ramouse
```

### 2. Build and Start All Containers
```bash
docker compose up -d --build
```

> ⏱️ **This will take 5-15 minutes!** Docker is:
> - Downloading images for PHP, MySQL, Redis, Nginx, Node.js
> - Building your Laravel backend
> - Building your React frontend
> - Setting up the database

### 3. Watch the Progress (Optional)
To see what's happening in real-time:
```bash
docker compose logs -f
```
Press `Ctrl + C` to stop watching.

### ✅ Check All Containers Are Running
```bash
docker compose ps
```

You should see something like:
```
NAME              STATUS    PORTS
ramouse-app       Up        9000/tcp
ramouse-db        Up        3306/tcp
ramouse-frontend  Up        80/tcp
ramouse-nginx     Up        0.0.0.0:80->80/tcp
ramouse-queue     Up        
ramouse-redis     Up        6379/tcp
```

All containers should show **"Up"** status.

---

## Step 6: Post-Deployment Setup

After the containers are running, we need to set up Laravel properly.

### 1. Generate Application Key
This creates a unique encryption key for your app (used for sessions, passwords, etc.):
```bash
docker compose exec app php artisan key:generate
```

### 2. Create Storage Link 📁
This creates a symbolic link so uploaded files (images, documents) are accessible via URL:
```bash
docker compose exec app php artisan storage:link
```

> **What this does**: Creates a link from `public/storage` → `storage/app/public`  
> Without this, users won't be able to see uploaded images!

### 3. Set File Permissions 🔐
Laravel needs write access to certain folders. This is **CRITICAL** - without proper permissions, you'll get errors!

```bash
docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache
```

| Folder | Why Laravel Needs Write Access |
|--------|-------------------------------|
| `storage/logs` | Write error logs |
| `storage/framework/cache` | Store cached data |
| `storage/framework/sessions` | Store user sessions |
| `storage/framework/views` | Compiled Blade templates |
| `storage/app/public` | User uploaded files |
| `bootstrap/cache` | Compiled routes & config |

### 4. Run Database Migrations
The `ramouse.sql` file should auto-import, but if needed:
```bash
docker compose exec app php artisan migrate --force
```

### 5. Run Database Seeders 🌱
Seeders populate your database with initial data. Your project has these seeders:

| Seeder | What It Creates |
|--------|----------------|
| `VehicleDataSeeder` | Vehicle makes, models, years |
| `TechnicianSpecialtySeeder` | Technician skills/specialties |
| `StoreCategorySeeder` | Store product categories |
| `ProductSeeder` | Sample products |
| `UserSeeder` | Sample users |
| `AdminUserSeeder` | **Admin account** ⭐ |
| `ContentSeeder` | Page content (about, terms, etc.) |
| `SystemSettingSeeder` | App settings |
| `WhatsAppSettingsSeeder` | WhatsApp integration settings |

**Run ALL seeders at once:**
```bash
docker compose exec app php artisan db:seed --force
```

**Or run specific seeders only:**
```bash
# Just the admin user
docker compose exec app php artisan db:seed --class=AdminUserSeeder --force

# Just system settings
docker compose exec app php artisan db:seed --class=SystemSettingSeeder --force
```

> ⚠️ **Warning**: Only run seeders **ONCE** on a fresh install! Running again may cause duplicate data errors.

### 6. Cache Configuration (Production Performance)
```bash
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

### 📋 Quick Copy-Paste: All Post-Setup Commands
```bash
# Run these in order after docker compose up -d --build
docker compose exec app php artisan key:generate
docker compose exec app php artisan storage:link
docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

---

## Step 7: Verify Everything Works

### 1. Test in Browser
Open these URLs in your browser:

| URL | What It Shows |
|-----|---------------|
| http://168.119.22.44 | React Frontend (main app) |
| http://168.119.22.44/api | Backend API (should show JSON) |

### 2. Test API is Working
```bash
curl http://168.119.22.44/api
```

### 3. Check Container Logs for Errors
```bash
# All containers
docker compose logs --tail=50

# Specific container
docker compose logs app --tail=50
docker compose logs nginx --tail=50
```

---

## Troubleshooting

### ❌ "Website not loading"

1. Check if containers are running:
```bash
docker compose ps
```

2. Check nginx logs:
```bash
docker compose logs nginx --tail=100
```

3. Check if port 80 is open:
```bash
netstat -tulpn | grep 80
```

### ❌ "Database connection refused"

1. Check if database container is running:
```bash
docker compose ps db
```

2. Check database logs:
```bash
docker compose logs db --tail=100
```

3. Verify .env settings:
```bash
cat Backend/.env | grep DB_
```

### ❌ "Permission denied" errors

```bash
docker compose exec app chmod -R 775 /var/www/storage
docker compose exec app chmod -R 775 /var/www/bootstrap/cache
docker compose exec app chown -R www-data:www-data /var/www
```

### ❌ "Container keeps restarting"

Check why it's crashing:
```bash
docker compose logs app --tail=100
```

Then rebuild:
```bash
docker compose down
docker compose up -d --build
```

### ❌ "Out of disk space"

Clean up unused Docker data:
```bash
docker system prune -a
```
> ⚠️ Warning: This removes unused images and containers!

---

## Useful Commands Cheat Sheet

### Docker Commands
| Command | What It Does |
|---------|--------------|
| `docker compose up -d` | Start all containers in background |
| `docker compose down` | Stop all containers |
| `docker compose restart` | Restart all containers |
| `docker compose logs -f` | Watch live logs |
| `docker compose ps` | Show container status |
| `docker compose exec app bash` | Enter the PHP container shell |

### Laravel Commands (inside container)
| Command | What It Does |
|---------|--------------|
| `docker compose exec app php artisan migrate` | Run migrations |
| `docker compose exec app php artisan cache:clear` | Clear cache |
| `docker compose exec app php artisan config:cache` | Cache config |
| `docker compose exec app php artisan queue:work` | Start queue worker |

### Updating Your Application
```bash
cd /var/www/ramouse

# If using Git
git pull origin main

# Rebuild containers
docker compose down
docker compose up -d --build

# Run any new migrations
docker compose exec app php artisan migrate
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
```

---

## Optional: Automated Deployment with GitHub

Set up automatic deployment when you push code to GitHub.

### 1. Create GitHub Actions Workflow

The file already exists at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: 168.119.22.44
          port: 44334
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/ramouse
            git pull origin main
            docker compose up -d --build
            docker compose exec app php artisan migrate --force
            docker compose exec app php artisan config:cache
```

### 2. Add SSH Key to GitHub

1. On your VPS, get the private key:
```bash
cat ~/.ssh/id_ed25519
```

2. Go to GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the private key (including `-----BEGIN...` and `-----END...`)

Now every time you push to `main`, your VPS will automatically update! 🎉

---

## 🎊 Congratulations!

Your application is now deployed! Here's a summary:

| Component | URL | Login / Info |
|-----------|-----|--------------|
| **Frontend** | [https://ramouse.com](https://ramouse.com) | Public User Interface |
| **API** | [https://ramouse.com/api](https://ramouse.com/api) | Backend API endpoints |
| **phpMyAdmin** | [https://ramouse.com/phpmyadmin/](https://ramouse.com/phpmyadmin/) | **Server:** `db`<br>**User:** `root`<br>**Pass:** (Your `DB_PASSWORD` from .env) |
| **WebSockets** | `wss://ramouse.com/app` | Real-time events (Laravel Reverb) |

### Active Docker Containers
You should see these 9 containers running:
1. `ramouse-frontend`: React App
2. `ramouse-app`: Laravel Backend
3. `ramouse-nginx`: Web Server & Proxy (SSL)
4. `ramouse-db`: MySQL Database
5. `ramouse-redis`: Redis Cache
6. `ramouse-queue`: Background Jobs Worker
7. `ramouse-reverb`: Real-time WebSocket Server
8. `ramouse-phpmyadmin`: Database Management
9. `ramouse-certbot`: SSL certificate manager

### Next Steps
- [x] Set up a domain name
- [x] Enable HTTPS with SSL certificate
- [ ] Set up automated backups
- [ ] Monitor server health

---

## Need Help?

If you run into issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Run `docker compose logs` to see error messages
3. Make sure all containers are running with `docker compose ps`
