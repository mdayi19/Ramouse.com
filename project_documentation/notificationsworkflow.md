---
description: Notifications Workflow (A‑Z)
---

# 📣 Notifications Workflow – A to Z

This document provides a **complete, end‑to‑end guide** for the real‑time notifications system in the **Ramouse Auto Parts** application. It covers everything from database design to backend events, Reverb broadcasting, API contracts, frontend consumption with Laravel Echo, UI components, admin tooling, and troubleshooting.

---

## 📦 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Schema](#database-schema)
3. [Eloquent Model](#eloquent-model)
4. [Backend Events & Broadcasting](#backend-events--broadcasting)
5. [Channel Authorization](#channel-authorization)
6. [API Endpoints](#api-endpoints)
7. [Controllers & Services](#controllers--services)
8. [Laravel Reverb Setup](#laravel-reverb-setup)
9. [Frontend – Echo Configuration](#frontend--echo-configuration)
10. [Frontend – Notification Service](#frontend--notification-service)
11. [UI Components](#ui-components)
12. [Admin UI – Sending Notifications](#admin-ui--sending-notifications)
13. [Notification Settings (User Preferences)](#notification-settings-user-preferences)
14. [Error Handling & Edge Cases](#error-handling--edge-cases)
15. [Testing the Whole Flow](#testing-the-whole-flow)
16. [FAQ & Common Pitfalls](#faq--common-pitfalls)
17. [Version History](#version-history)
---

## 1️⃣ Prerequisites
- **Laravel Sanctum** – API authentication must be configured and functional for all user types (`Customer`, `Technician`, `TowTruck`, `Provider`, `Admin`).
- **Laravel Reverb** – Real‑time server must be running (`php artisan reverb:start`).
- **Frontend** – Vite/React project with **Laravel Echo** client (`src/lib/echo.ts`).
- **Node ≥ 18**, **PHP ≥ 8.2**, **PostgreSQL/MySQL** (any supported DB).
- **Auth token** stored in `localStorage` under `authToken` (set by `AuthService.login`).
---

## 2️⃣ Database Schema
Create the `notifications` table via migration:
```php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users'); // works for any Authenticatable model
    $table->string('title');
    $table->text('message');
    $table->enum('type', NotificationType::cases()); // see types list below
    $table->json('link')->nullable(); // { view: string, params: object }
    $table->boolean('read')->default(false);
    $table->timestamps();
});
```
**Columns**:
- `id` – primary key.
- `user_id` – owner of the notification.
- `title` / `message` – displayed text.
- `type` – one of the `NotificationType` values (see `types.ts`).
- `link` – optional navigation data used by the UI.
- `read` – boolean flag.
- `created_at` / `updated_at` – timestamps.
---

## 3️⃣ Eloquent Model
File: `app/Models/Notification.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'message', 'type', 'link', 'read',
    ];

    protected $casts = [
        'link' => 'array',
        'read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```
---

## 4️⃣ Backend Events & Broadcasting
### Event Class
`app/Events/UserNotification.php`
```php
<?php
namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function broadcastOn(): Channel
    {
        // Private channel per user ID
        return new PrivateChannel('user.' . $this->notification->user_id);
    }

    public function broadcastWith(): array
    {
        return $this->notification->toArray();
    }
}
```
### Dispatching the Event
Whenever a notification is created (admin UI, system triggers, etc.), store it **first**, then dispatch:
```php
$notification = Notification::create([
    'user_id' => $user->id,
    'title'   => $title,
    'message' => $message,
    'type'    => $type,
    'link'    => $link,
]);

event(new UserNotification($notification));
```
---

## 5️⃣ Channel Authorization
File: `routes/channels.php`
```php
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{id}', function ($user, $id) {
    // Only allow the authenticated user to listen to his own channel
    return (int) $user->id === (int) $id;
});
```
The channel name **must match** the one used in `UserNotification::broadcastOn` (`user.{id}`).
---

## 6️⃣ API Endpoints
All routes are placed inside the `auth:sanctum` middleware group in `routes/api.php`.
| Method | URI | Description | Controller Method |
|--------|-----|-------------|-------------------|
| `GET` | `/notifications` | List latest 50 notifications for the authenticated user. | `NotificationController@index` |
| `GET` | `/notifications/unread-count` | Return unread count. | `NotificationController@unreadCount` |
| `POST` | `/notifications/{id}/read` | Mark a single notification as read. | `NotificationController@markAsRead` |
| `DELETE` | `/notifications/{id}` | Delete a single notification. | `NotificationController@destroy` |
| `DELETE` | `/notifications` | Clear all notifications for the user. | `NotificationController@clearAll` |
| `POST` | `/notifications/send` | **Admin only** – send a notification to a specific user (or broadcast). | `AdminController@sendNotification` |
---

## 7️⃣ Controllers & Services
### NotificationController (Backend)
```php
<?php
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();
        return response()->json(['notifications' => $notifications]);
    }

    public function unreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->count();
        return response()->json(['unread_count' => $count]);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();
        $notification->update(['read' => true]);
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->delete();
        return response()->json(['success' => true]);
    }

    public function clearAll()
    {
        Notification::where('user_id', Auth::id())->delete();
        return response()->json(['success' => true]);
    }
}
```
### AdminController – Sending Notifications
```php
public function sendNotification(Request $request)
{
    $request->validate([
        'user_id' => 'required|exists:users,id',
        'title'   => 'required|string',
        'message' => 'required|string',
        'type'    => 'required|string|in:' . implode(',', array_keys(NotificationType::cases())) ,
        'link'    => 'nullable|array',
    ]);

    $notification = Notification::create([
        'user_id' => $request->user_id,
        'title'   => $request->title,
        'message' => $request->message,
        'type'    => $request->type,
        'link'    => $request->link,
    ]);

    event(new UserNotification($notification));
    return response()->json(['success' => true]);
}
```
---

## 8️⃣ Laravel Reverb Setup
1. **Install Reverb** (already done in the project). 
2. **Environment variables** in `.env`:
   ```env
   REVERB_APP_ID=ramouse
   REVERB_HOST=127.0.0.1
   REVERB_PORT=6001
   REVERB_SCHEME=http
   REVERB_KEY=your-reverb-key
   ```
3. **Start server**: `php artisan reverb:start` (already running).
4. **CORS** – ensure `config/cors.php` includes `broadcasting/auth` path.
---

## 9️⃣ Frontend – Echo Configuration
File: `src/lib/echo.ts`
```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const echo = new Echo({
  broadcaster: 'pusher',
  key: (import.meta as any).env.VITE_REVERB_KEY,
  wsHost: (import.meta as any).env.VITE_REVERB_HOST,
  wsPort: Number((import.meta as any).env.VITE_REVERB_PORT),
  wssPort: Number((import.meta as any).env.VITE_REVERB_PORT),
  forceTLS: false,
  disableStats: true,
  encrypted: false,
  authEndpoint: `${API_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  },
});

export default echo;
```
---

## 🔟 Frontend – Notification Service
File: `src/services/notification.service.ts` (already exists). Ensure the following methods are present:
```ts
export const NotificationService = {
  async getAll() { ... },
  async getUnreadCount() { ... },
  async markAsRead(id: string) { ... },
  async markAllAsRead() { await api.post('/notifications/mark-all-read'); },
  async delete(id: string) { await api.delete(`/notifications/${id}`); },
  async clearAll() { await api.delete('/notifications'); },
  async send(userId: string, title: string, message: string, type: NotificationType, link?: Notification['link']) {
    await api.post('/notifications/send', { user_id: userId, title, message, type, link });
  },
};
```
---

## 1️⃣1️⃣ UI Components
### NotificationDropdown (frontend)
- Subscribes to Echo channel on mount:
  ```tsx
  useEffect(() => {
    if (!userId) return;
    const channel = echo.private(`user.${userId}`);
    channel.listen('UserNotification', (e) => {
      addNotificationForUser(e.notification);
    });
    return () => channel.stopListening('UserNotification');
  }, [userId]);
  ```
- Renders a list of notifications with **read/unread styling**.
- Calls `onMarkAsRead`, `onDelete`, `onClearAll` (provided by `App.tsx`).

### NotificationCenter (full‑screen view)
- Shows all notifications, pagination, and bulk actions.
- Uses `NotificationService.getAll` on open and updates local state.

### Toast (already in `components/Toast.tsx`)
- Used for quick feedback when a notification arrives or an action succeeds.
---

## 1️⃣2️⃣ Admin UI – Sending Notifications
1. **Form fields**: Recipient phone / user selector, title, message, type (dropdown), optional link (view + params).
2. **Submit handler**:
   ```tsx
   await NotificationService.send(userId, title, message, type, link);
   showToast('تم إرسال الإشعار', 'success');
   ```
3. **Backend** validates and creates the `Notification` record, then fires `UserNotification`.
---

## 1️⃣3️⃣ Notification Settings (User Preferences)
- Stored in `user.notificationSettings` (snake_case in DB, camelCase in API).
- UI component `NotificationSettingsForm` lets users toggle each `NotificationType`.
- When updating profile (`AuthService.updateProfile`), the settings are sent as `notificationSettings` (camelCase) and transformed to `notification_settings` for the backend.
---

## 1️⃣4️⃣ Error Handling & Edge Cases
| Situation | Frontend Reaction | Backend Response |
|-----------|-------------------|------------------|
| **Unauthenticated** (no token) | Redirect to login (`/`) via API interceptor. | 401 – token missing/invalid. |
| **Token expired** | Show toast “انتهت صلاحية الجلسة” and logout. | 401 – token invalid. |
| **Reverb connection lost** | Show subtle banner “الاتصال بالخادم مفقود”. Echo will automatically reconnect. | N/A |
| **Network failure on API call** | Toast error, keep UI state unchanged. | 500/503 – generic error. |
| **User tries to mark already‑read notification** | No API call (optimistic UI). | 200 – idempotent. |
---

## 1️⃣5️⃣ Testing the Whole Flow
1. **Start services**:
   ```bash
   php artisan serve
   php artisan reverb:start
   npm run dev
   ```
2. **Login as a Customer** – open the app, log in, verify `authToken` in localStorage.
3. **Open Notification dropdown** – ensure the unread count matches DB.
4. **From Admin panel**, send a notification to the logged‑in customer.
5. **Observe** – the dropdown should instantly show the new notification (real‑time). The toast appears, unread count increments.
6. **Mark as read** – click the notification; UI updates, backend `read` flag set.
7. **Clear all** – click “مسح الكل”; verify DB is empty for that user.
8. **Refresh page** – notifications persist via API fetch.
---

## 1️⃣6️⃣ FAQ & Common Pitfalls
- **Why don’t I see notifications?**
  - Ensure the Sanctum token is present and not expired.
  - Verify the Echo channel name matches the user ID (`user.{id}`).
  - Check Reverb logs for connection errors.
- **Duplicate notifications appear**
  - The backend may be dispatching the event twice; confirm you only call `event(new UserNotification(...))` **once** after creating the record.
- **Notification link does not navigate**
  - The `link` object must contain a valid `view` (one of the routes defined in `App.tsx`) and optional `params`. The UI component uses `onNavigate(view, params)`.
- **Admin cannot send notification**
  - Route `/notifications/send` is protected by `isAdmin` middleware; ensure the admin token is used.
---

## 📅 Version History
| Date | Version | Changes |
|------|---------|---------|
| 2025‑11‑25 | 1.0 | Initial A‑Z workflow created. |
| 2025‑11‑25 | 1.1 | Added detailed DB schema, channel auth, and UI component list. |
| 2025‑11‑25 | 1.2 | Expanded error handling and testing steps. |
---

*Document generated automatically on **2025‑11‑25**. Adjust as the system evolves.*
