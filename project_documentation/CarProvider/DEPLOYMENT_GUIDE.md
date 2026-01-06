# Git Workflow & Deployment Guide

## 🔀 Git Branch Strategy for CarProvider Feature

**Production Environment:** Docker + GitHub  
**Branch Strategy:** Feature branch → Testing → Main

---

## 1. Create Feature Branch

### Step 1: Ensure you're on latest main

```bash
# On both Backend and Frontend
cd c:\laragon\www\ramouse\Backend
git checkout main
git pull origin main

cd c:\laragon\www\ramouse\Frontend
git checkout main
git pull origin main
```

### Step 2: Create feature branch

```bash
# Backend
cd c:\laragon\www\ramouse\Backend
git checkout -b feature/carprovider
git push -u origin feature/carprovider

# Frontend
cd c:\laragon\www\ramouse\Frontend
git checkout -b feature/carprovider
git push -u origin feature/carprovider
```

---

## 2. Development Workflow

### Daily Commits

```bash
# After completing a task
git add .
git commit -m "feat: add car_listings migration with owner_id"
git push origin feature/carprovider
```

**Commit Message Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Build/config

**Examples:**
```bash
git commit -m "feat: add CarProvider model with relationships"
git commit -m "feat: implement FULLTEXT search with scoring"
git commit -m "feat: add 6-step car listing wizard"
git commit -m "fix: correct owner_id validation in CarListingPolicy"
git commit -m "refactor: simplify ownership model to use single owner_id"
```

### Weekly Progress Commits

```bash
# End of Week 1
git add .
git commit -m "feat: complete backend foundation (migrations, models, policies)"
git push origin feature/carprovider

# End of Week 2
git commit -m "feat: complete core API (providers, listings, auth)"
git push origin feature/carprovider

# End of Week 3
git commit -m "feat: complete advanced features (search, analytics, queues)"
git push origin feature/carprovider
```

---

## 3. Testing Before Merge

### Step 1: Local Testing

```bash
# Backend tests
cd c:\laragon\www\ramouse\Backend
php artisan test

# Frontend tests (if any)
cd c:\laragon\www\ramouse\Frontend
npm run test
```

### Step 2: Staging Environment

#### Option A: Deploy to Staging Branch

```bash
# Create staging branch from feature
git checkout -b staging/carprovider
git push origin staging/carprovider
```

#### Option B: Test in Docker Locally

```bash
# Build and run locally with Docker
docker-compose up --build

# Test all endpoints
# Test all user flows
# Verify database migrations
```

---

## 4. Merge to Main (Production)

### Step 1: Create Pull Request

**On GitHub:**
1. Go to repository
2. Click "Pull Requests"
3. Click "New Pull Request"
4. Base: `main` ← Compare: `feature/carprovider`
5. Title: "Feature: CarProvider System Implementation"
6. Description: Link to documentation

**PR Template:**
```markdown
## Summary
Complete implementation of CarProvider system with two-tier seller model.

## Changes
- 10 new database tables
- 40+ API endpoints
- 30+ frontend components
- Advanced search engine
- Analytics system
- Scheduler & queue jobs

## Documentation
See: `project_documentation/CarProvider/`

## Testing
- [x] All migrations run successfully
- [x] All API endpoints tested
- [x] Frontend components verified
- [x] Queue jobs working
- [x] Cron jobs scheduled
- [x] Performance tested

## Deployment Notes
- Requires database migrations
- Requires queue worker restart
- Requires cron job setup
- Requires .env updates (if any)

## Rollback Plan
- Backup database before migration
- Keep feature branch for quick revert
```

### Step 2: Code Review

- Assign reviewers
- Address feedback
- Make necessary changes
- Push updates to feature branch

### Step 3: Merge

**After approval:**
```bash
# Squash and merge (recommended for large features)
# OR
# Standard merge

# GitHub will do this automatically when you click "Merge Pull Request"
```

---

## 5. Production Deployment with Docker

### Pre-Deployment Checklist

```bash
# ✅ Backup database
mysqldump -u root -p ramouse > backup_$(date +%Y%m%d_%H%M%S).sql

# ✅ Document .env changes (if any)
# Add any new environment variables needed

# ✅ Tag release
git tag -a v2.0.0-carprovider -m "CarProvider System Release"
git push origin v2.0.0-carprovider
```

### Deployment Steps

#### Step 1: Pull Latest Code on Server

```bash
# SSH to production server
ssh user@your-server.com

# Navigate to project
cd /path/to/ramouse

# Backend
cd Backend
git pull origin main

# Frontend
cd ../Frontend
git pull origin main
```

#### Step 2: Update Docker Containers

```bash
# Stop containers
docker-compose down

# Rebuild images
docker-compose build

# Start containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

#### Step 3: Run Migrations

```bash
# Run migrations inside Docker container
docker-compose exec backend php artisan migrate

# Seed categories
docker-compose exec backend php artisan db:seed --class=CarCategorySeeder

# Clear cache
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan route:clear
```

#### Step 4: Restart Queue Workers

```bash
# If using Supervisor inside Docker
docker-compose exec backend supervisorctl restart all

# OR if queue:work runs as Docker service
docker-compose restart queue-worker
```

#### Step 5: Set Up Cron

```bash
# Add to server crontab (outside Docker)
# OR configure inside Docker container

docker-compose exec backend crontab -e

# Add this line:
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

#### Step 6: Verify Deployment

```bash
# Check backend health
curl https://api.ramouse.com/api/health

# Check database
docker-compose exec backend php artisan tinker
>>> \DB::table('car_categories')->count()

# Check queue is processing
docker-compose exec backend php artisan queue:work --once

# Check scheduler is running
docker-compose exec backend php artisan schedule:run
```

---

## 6. Rollback Plan

### If Issues Occur

#### Quick Rollback (Revert Code)

```bash
# On server
cd /path/to/ramouse/Backend
git revert HEAD~10  # Revert last 10 commits (or specific range)
git push origin main

# Rebuild Docker
docker-compose down
docker-compose build
docker-compose up -d
```

#### Database Rollback

```bash
# Rollback migrations (if needed)
docker-compose exec backend php artisan migrate:rollback --step=10

# OR restore from backup
mysql -u root -p ramouse < backup_YYYYMMDD_HHMMSS.sql
```

#### Complete Rollback to Previous Tag

```bash
# Checkout previous stable version
git checkout v1.9.0  # Previous stable tag

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 7. Monitoring After Deployment

### Day 1-3: Watch Closely

```bash
# Monitor logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Monitor queue
docker-compose exec backend php artisan queue:failed

# Monitor scheduler
grep "schedule:run" /var/log/cron.log

# Monitor database
docker-compose exec backend php artisan tinker
>>> \DB::table('car_listings')->count()
```

### Week 1: Regular Checks

- Check error logs daily
- Monitor API response times
- Verify background jobs running
- Check user feedback

---

## 8. Docker Configuration

### docker-compose.yml Updates (if needed)

```yaml
# Add queue worker service
queue-worker:
  build:
    context: ./Backend
    dockerfile: Dockerfile
  command: php artisan queue:work --tries=3
  depends_on:
    - mysql
    - redis
  volumes:
    - ./Backend:/var/www/html
  restart: unless-stopped

# Add scheduler service (alternative to cron)
scheduler:
  build:
    context: ./Backend
    dockerfile: Dockerfile
  command: >
    /bin/sh -c "
    while true; do
      php artisan schedule:run --verbose --no-interaction &
      sleep 60
    done"
  depends_on:
    - mysql
    - redis
  volumes:
    - ./Backend:/var/www/html
  restart: unless-stopped
```

---

## 9. Environment Variables

### Backend .env Updates

```env
# Add if new config needed
CAR_LISTING_MAX_PHOTOS=15
CAR_LISTING_MAX_FILE_SIZE=5120  # KB
ANALYTICS_RETENTION_DAYS=180
SITEMAP_BASE_URL=https://ramouse.com

# Queue configuration
QUEUE_CONNECTION=redis
REDIS_HOST=redis
REDIS_PORT=6379

# Scheduler
SCHEDULER_ENABLED=true
```

### Frontend .env Updates

```env
# Add if new config needed
VITE_CAR_API_BASE_URL=https://api.ramouse.com/api
VITE_ENABLE_CAR_MARKETPLACE=true
```

---

## 10. GitHub Actions (Optional CI/CD)

### .github/workflows/deploy.yml

```yaml
name: Deploy CarProvider Feature

on:
  push:
    branches:
      - main
  
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run Backend Tests
        run: |
          cd Backend
          composer install
          php artisan test
      
      - name: Run Frontend Tests
        run: |
          cd Frontend
          npm install
          npm run test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/ramouse
            git pull origin main
            docker-compose down
            docker-compose up -d --build
            docker-compose exec backend php artisan migrate --force
```

---

## 11. Branch Protection Rules (GitHub)

### Recommended Settings for `main` branch:

- ✅ Require pull request before merging
- ✅ Require approvals (1+)
- ✅ Dismiss stale approvals
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require signed commits (optional)
- ✅ Include administrators

---

## 12. Deployment Timeline

### Initial Deployment

```
Week 6 Day 5: Code Complete
  ↓
Create PR + Review (1-2 days)
  ↓
Merge to Main
  ↓
Deploy to Staging (test 2-3 days)
  ↓
Deploy to Production (Friday evening)
  ↓
Monitor closely (Weekend + Week 7)
```

**Best Practice:**
- Deploy on Friday evening (low traffic)
- Full team available for monitoring
- Monday morning review

---

## 13. Communication Plan

### Before Deployment

**Team:**
- [ ] All developers notified
- [ ] QA team ready
- [ ] DevOps team ready

**Users:**
- [ ] Announce new features (if needed)
- [ ] Prepare support team

### During Deployment

**Status Updates:**
- Tweet/status page updates
- Team Slack notifications
- Rollback decision criteria

### After Deployment

**Week 1 Report:**
- Usage metrics
- Error rates
- Performance metrics
- User feedback

---

## Summary

**Branch Name:** `feature/carprovider`  
**Merge Target:** `main`  
**Deployment Method:** Docker + GitHub  
**Testing:** Staging → Production  
**Rollback:** Tag + Database backup  

**Ready to start?** Create the branch and begin Week 1! 🚀

```bash
# Create feature branch now
git checkout -b feature/carprovider
git push -u origin feature/carprovider
```
