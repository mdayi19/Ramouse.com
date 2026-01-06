# Docker Commands for CarProvider Migration

## 🐳 Running Migrations on Production Server

### Step 1: SSH to Server
```bash
ssh user@your-production-server.com
cd /path/to/ramouse
```

### Step 2: Pull Latest Code
```bash
# Backend
cd Backend
git pull origin feature/carprovider

# Verify changes
git log -1
```

### Step 3: Rebuild Docker Containers
```bash
# Go to project root
cd /path/to/ramouse

# Stop containers
docker-compose down

# Rebuild (if Dockerfile changed)
docker-compose build

# Start containers
docker-compose up -d

# Check status
docker-compose ps
```

### Step 4: Run Migrations Inside Docker
```bash
# Run migrations
docker-compose exec backend php artisan migrate

# Expected output:
# Migration table created successfully.
# Migrating: 2026_01_06_184456_create_car_providers_table
# Migrated:  2026_01_06_184456_create_car_providers_table
# Migrating: 2026_01_06_184524_create_car_listings_table
# Migrated:  2026_01_06_184524_create_car_listings_table
# ... (10 migrations total)
```

### Step 5: Seed Categories
```bash
docker-compose exec backend php artisan db:seed --class=CarCategorySeeder

# Verify seeding
docker-compose exec backend php artisan tinker
>>> DB::table('car_categories')->count()
=> 8
>>> DB::table('car_categories')->get(['name_ar', 'name_en'])
```

### Step 6: Verify Tables Created
```bash
docker-compose exec backend php artisan tinker

>>> Schema::hasTable('car_providers')
=> true

>>> Schema::hasTable('car_listings')
=> true

>>> DB::table('car_listings')->getConnection()->getDoctrineSchemaManager()->listTableIndexes('car_listings')
# Should show ft_search FULLTEXT index
```

### Step 7: Clear Caches
```bash
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan route:clear
docker-compose exec backend php artisan view:clear
```

### Step 8: Restart Services (if needed)
```bash
# Restart queue workers
docker-compose restart queue-worker

# Restart all services
docker-compose restart
```

---

## 🔄 Rollback Commands (If Issues Occur)

### Rollback Last Batch of Migrations
```bash
docker-compose exec backend php artisan migrate:rollback

# Rollback specific number of migrations
docker-compose exec backend php artisan migrate:rollback --step=10
```

### Rollback Code Changes
```bash
cd Backend
git revert HEAD
git push origin feature/carprovider

# Rebuild
docker-compose down
docker-compose up -d --build
```

---

## 📊 Monitoring Commands

### Check Logs
```bash
# Backend logs
docker-compose logs -f backend

# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Check Database
```bash
docker-compose exec mysql mysql -u root -p ramouse

# Inside MySQL
SHOW TABLES LIKE 'car_%';
DESCRIBE car_listings;
SELECT COUNT(*) FROM car_categories;
```

### Check Disk Space
```bash
df -h
docker system df
```

---

## 🚨 Troubleshooting

### Migration Failed
```bash
# Check error details
docker-compose logs backend | grep -i "error"

# Check migration status
docker-compose exec backend php artisan migrate:status

# Fix and retry
docker-compose exec backend php artisan migrate --force
```

### FULLTEXT Index Not Created
```bash
# Manually add if failed
docker-compose exec mysql mysql -u root -p ramouse

# Inside MySQL
ALTER TABLE car_listings ADD FULLTEXT INDEX ft_search (title, description, brand, model);
```

### Permission Issues
```bash
# Fix storage permissions
docker-compose exec backend chmod -R 775 storage
docker-compose exec backend chown -R www-data:www-data storage
```

---

## ✅ Verification Checklist

After running migrations, verify:

- [ ] All 10 tables created
- [ ] FULLTEXT index on car_listings exists
- [ ] SPATIAL index on car_providers.location exists
- [ ] 8 car categories seeded
- [ ] No migration errors in logs
- [ ] Backend API responding
- [ ] Database connections working

---

## 📝 Quick Reference

```bash
# Common Docker Compose Commands
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose ps                 # List running containers
docker-compose exec backend bash  # Enter backend container
docker-compose logs -f backend    # Follow backend logs
docker-compose restart backend    # Restart backend service
docker-compose build --no-cache   # Rebuild from scratch

# Laravel Commands Inside Docker
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan migrate:status
docker-compose exec backend php artisan migrate:rollback
docker-compose exec backend php artisan db:seed
docker-compose exec backend php artisan tinker
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan queue:work
```

---

## 🎯 Summary

**What's Deployed:**
- 10 new database tables
- Simplified owner_id ownership model
- FULLTEXT search capability
- Wallet & analytics infrastructure
- 8 car categories

**Next Steps:**
1. Run migrations on server ✅
2. Create CarProvider model (Week 1 Day 2)
3. Implement API endpoints (Week 2)

**Branch:** `feature/carprovider`  
**Commit:** `feat: add CarProvider database migrations (Week 1 Day 1)`  
**Files Changed:** 33 files, 11,018 insertions
