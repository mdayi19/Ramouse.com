# 🚀 Ramouse Production Deployment Guide (VPS)

Use this guide to deploy the application on your Linux VPS.

## 1. Prerequisites
- **Docker** & **Docker Compose** must be installed.
- **Git** must be installed.
- Ports `80` (HTTP) and `443` (HTTPS) must be open.

## 2. Setup (Run on VPS)

### Step A: Get the Latest Code
Navigate to your project directory (or clone if it's new):
```bash
# If new clone:
git clone https://github.com/mdayi19/Ramouse.com.git ramouse
cd ramouse

# If existing:
cd ramouse
git reset --hard
git pull
```

### Step B: Configure Environment
We have created a fail-safe example file for you. Copy it:
```bash
cp production.env.example .env
```
Now edit the `.env` file **(Optional, but recommended for security)**:
```bash
nano .env
```
*Note: Ensure `REVERB_APP_KEY` is a simple string like `ramouse-app-key` and MATCHES `VITE_REVERB_APP_KEY`.*

### Step C: Start Containers & Build
This command handles everything. It builds the frontend with your env vars and starts the backend.
```bash
# -d runs in background
# --build ensures changes to Dockerfiles/frontend are applied
docker-compose down
docker-compose up -d --build
```

### Step D: Final Initialization
Run these commands once to set up the database and storage:

1. **Install Dependencies (if needed inside container)**
   *(Usually handled by Dockerfile, but good to ensure)*:
   ```bash
   docker-compose exec app composer install --optimize-autoloader --no-dev
   ```

2. **Run Migrations**:
   ```bash
   docker-compose exec app php artisan migrate --force
   ```

3. **Link Storage**:
   ```bash
   docker-compose exec app php artisan storage:link
   ```

4. **Clear Caches**:
   ```bash
   docker-compose exec app php artisan optimize:clear
   docker-compose exec app php artisan config:cache
   docker-compose exec app php artisan route:cache
   docker-compose exec app php artisan view:cache
   ```

## 3. Verify Deployment
Visit `https://ramouse.com`.
- Check if the site loads.
- Open Developer Tools (F12) -> Console.
- Ensure no red WebSocket connection errors appear.

## Troubleshooting

**Real-time not working?**
1. Check if `docker-compose.yml` has `REVERB_SCHEME: http` for the reverb service.
2. Check if `.env` has `REVERB_APP_KEY=ramouse-app-key` (NOT base64).
3. Rebuild frontend: `docker-compose up -d --build frontend`
