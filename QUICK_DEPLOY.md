# 🚀 Quick Deploy Commands (Copy-Paste Ready)

## Step 1: Connect to VPS
```bash
ssh -p 44334 root@168.119.22.44
```
Password: `IhgdZim4C2jp9u7VSqG`

---

## Step 2: Install Docker (Rocky Linux 8.10)
```bash
dnf install -y dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl start docker && systemctl enable docker
```

---

## Step 3: Clone Project
```bash
mkdir -p /var/www && cd /var/www
git clone git@github.com:mdayi19/Ramouse.com.git ramouse
cd ramouse
```

---

## Step 4: Create .env
```bash
cat > .env << 'EOF'
APP_NAME=Ramouse
APP_ENV=production
APP_DEBUG=false
APP_URL=https://ramouse.com
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=ramouse_db
DB_USERNAME=ramouse_user
DB_PASSWORD=YourSecurePassword123!
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
VITE_API_URL=/api
VITE_REVERB_HOST=ramouse.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=ramouse-app-key
EOF

cp .env Backend/.env
```

---

## Step 5: Build & Run
```bash
docker compose up -d --build
```

---

## Step 6: Post-Setup (Migrations & Seeders)
```bash
# Note: APP_KEY and storage:link are now automatically generated during build!

# Run migrations (create database tables)
docker compose exec app php artisan migrate --force

# Run seeders (creates admin user & initial data)
docker compose exec app php artisan db:seed --force

# Cache for production
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

---

## ✅ Done!
- **Frontend**: [https://ramouse.com](https://ramouse.com)
- **phpMyAdmin**: [https://ramouse.com/phpmyadmin/](https://ramouse.com/phpmyadmin/) (User: `root`, Pass: `YourSecurePassword123!`)

