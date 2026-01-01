# Web Push Notifications Implementation Guide

This guide details the implementation of Web Push Notifications in the Ramouse application (Backend + Frontend) and providing deployment instructions.

## Overview
Web Push Notifications allow the application to send real-time alerts to users even when the application is closed or in the background. This is achieved using the **Web Push API**, **Service Workers**, and the **Laravel WebPush** package.

---

## 1. Backend Implementation (Laravel)

### Package Installation
We use `laravel-notification-channels/webpush`.
- **Composer**: `composer require laravel-notification-channels/webpush`
- **Migrations**: `database/migrations/xxxx_xx_xx_xxxxxx_create_push_subscriptions_table.php` (Published and Migrated)
- **Config**: `config/webpush.php` (Published)

### Support in User Model
The `App\Models\User` model now implements `HasPushSubscriptions`.

```php
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    use HasPushSubscriptions;
    // ...
}
```

### VAPID Keys
VAPID (Voluntary Application Server Identification) keys are used to safely identify the server to the push service.
- Keys are generated causing `php artisan webpush:vapid`.
- **Environment Variables** (`.env`):
    ```env
    VAPID_PUBLIC_KEY=your_public_key
    VAPID_PRIVATE_KEY=your_private_key
    VAPID_SUBJECT=mailto:admin@ramouse.com
    ```

### Notifications
We created a generic notification class `App\Notifications\GenericWebPushNotification` for sending flexible push messages.
- **Channel**: `WebPushChannel::class`
- **Payload**: Includes title, body, icon, and action URL.

**Usage Example:**
```php
$user->notify(new \App\Notifications\GenericWebPushNotification(
    'Title',
    'Body text',
    '/target-url'
));
```

### API Endpoints
- **POST** `/api/notifications/subscribe`: Saves the user's push subscription (endpoint, keys) to the database.

---

## 2. Frontend Implementation (React/Vite)

### Service Worker
A custom service worker `public/custom-sw.js` handles the `push` and `notificationclick` events.
- **Push Event**: Displays the notification with the system UI.
- **Click Event**: Opens the app or focuses the existing tab.

### Vite Configuration
`vite.config.ts` was updated to inject the custom service worker via `VitePWA` plugin:
```typescript
workbox: {
  importScripts: ['custom-sw.js'],
  // ...
}
```

### Environment Variables
The frontend needs the **Public Key** to subscribe.
- **file**: `Frontend/.env` (and build args)
- **Variable**: `VITE_VAPID_PUBLIC_KEY`

### Subscription Logic
`src/services/notification.service.ts` contains `subscribeToPush()`:
1.  Checks for Service Worker support.
2.  Converts VAPID key to Uint8Array.
3.  Calls `registration.pushManager.subscribe()`.
4.  Sends the subscription object to the Backend API.

---

## 3. Server Deployment (Docker/VPS)

Since the Frontend requires the VAPID key at **build time**, and the Backend requires the keys at **runtime**, specific steps are needed for deployment.

### Step 1: Update .env on Server
Add these lines to the end of your `.env` file on the VPS:

```env
# Web Push Keys
VAPID_PUBLIC_KEY=BABw0vEagc-H-dWVBEb0Eb6djj3JuFcXAQsBZnDB8KwSCaWTpri-y8832vqSSmOFhY7MWyNJZ25OhjYoKm992Uk
VAPID_PRIVATE_KEY=zwpd3xzsddw6gop37CfLOt0B93SvUM13LsyccMV_NzQ
VAPID_SUBJECT=mailto:admin@ramouse.com
VITE_VAPID_PUBLIC_KEY=BABw0vEagc-H-dWVBEb0Eb6djj3JuFcXAQsBZnDB8KwSCaWTpri-y8832vqSSmOFhY7MWyNJZ25OhjYoKm992Uk
```

### Step 2: Rebuild Containers
You **MUST** rebuild the containers to pass the `VITE_VAPID_PUBLIC_KEY` to the React build process.

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
docker-compose up -d --build
```

### Step 3: Run Migrations
Ensure the new `push_subscriptions` table is created.

```bash
docker-compose exec app php artisan migrate
```

---

## 4. Troubleshooting

**Notification not appearing?**
1.  **Check Browser Permissions**: Ensure you allowed notifications for the site.
2.  **Check Service Worker**: In Chrome DevTools > Application > Service Workers, ensure `custom-sw.js` is active.
3.  **Check Database**: Look at the `push_subscriptions` table. If empty, the subscription failed.
4.  **Check Logs**: `docker-compose logs -f app` to see if the Laravel queue or application is throwing errors when sending.

**Build Failed?**
- Ensure `VITE_VAPID_PUBLIC_KEY` is in the `.env` file **before** running `docker-compose build`.
