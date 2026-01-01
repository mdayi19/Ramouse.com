# Laravel Reverb Real-Time Implementation

## Overview

This document describes the complete Laravel Reverb WebSocket implementation for the Ramouse Auto Parts application. Reverb provides real-time, bidirectional communication between the Laravel backend and React frontend.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Events Reference](#events-reference)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Hooks: useRealtime, useOrderQuotes, etc.            │   │
│  │  Echo Client (Pusher Protocol)                       │   │
│  └──────────────────┬───────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                      │ WebSocket (ws://localhost:6001)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               Laravel Reverb Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Port: 8080 (dev) / 443 (prod)                       │   │
│  │  Protocol: Pusher-compatible                         │   │
│  │  Channels: Public, Private, Presence                 │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                      │ Broadcasting Events
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Laravel Backend (API)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Events: QuoteReceived, OrderStatusUpdated, etc.     │   │
│  │  Controllers trigger broadcasts                       │   │
│  │  Channel Authorization (routes/channels.php)         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Setup

### Installation

Laravel Reverb was installed with:
```bash
composer require laravel/reverb
php artisan install:broadcasting
```

### Configuration Files

#### **config/reverb.php**
```php
'servers' => [
    'reverb' => [
        'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),
        'port' => env('REVERB_SERVER_PORT', 6001),
        // ... see full file
    ],
],
```

#### **config/broadcasting.php**
```php
'default' => env('BROADCAST_CONNECTION', 'reverb'),

'connections' => [
    'reverb' => [
        'driver' => 'reverb',
        'key' => env('REVERB_APP_KEY'),
        // ... see full file
    ],
],
```

### Environment Variables

Add to `.env`:
```bash
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret

REVERB_HOST=localhost
REVERB_PORT=6001
REVERB_SCHEME=http

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=6001
```

**Generate keys**:
```bash
# App ID (any string)
REVERB_APP_ID=ramouse-app

# App Key (use this in frontend too)
REVERB_APP_KEY=ramouse-app-key

# App Secret (keep secure)
REVERB_APP_SECRET=$(openssl rand -base64 32)
```

### Starting Reverb Server

**Development**:
```bash
php artisan reverb:start
```

**With Debug Output**:
```bash
php artisan reverb:start --debug
```

**Production** (see Deployment section)

---

## Events

### Created Events

#### **1. QuoteReceived**
**File**: `app/Events/QuoteReceived.php`

**Triggered When**: A provider submits a quote on an order

**Channels**:
- `orders.{orderNumber}` (private)
- `users.{userId}` (private)

**Payload**:
```json
{
  "quote": {
    "id": "uuid",
    "provider_name": "Provider Name",
    "provider_unique_id": "PRO001",
    "price": 1500.00,
    "part_status": "new",
    "timestamp": "2025-11-25T14:30:00Z"
  },
  "order": {
    "order_number": "ORD-123456",
    "status": "قيد المراجعة"
  },
  "message": "تم استلام عرض سعر جديد"
}
```

**Usage in Controller**:
```php
use App\Events\QuoteReceived;

// In OrderController@submitQuote
event(new QuoteReceived($quote, $order));
```

---

#### **2. OrderStatusUpdated**
**File**: `app/Events/OrderStatusUpdated.php`

**Triggered When**: Order status changes

**Channels**:
- `orders.{orderNumber}` (private)
- `users.{userId}` (private)

**Payload**:
```json
{
  "order": {
    "order_number": "ORD-123456",
    "status": "تم الشحن للعميل",
    "previous_status": "جاري التجهيز",
    "updated_at": "2025-11-25T15:00:00Z"
  },
  "message": "تم تحديث حالة الطلب"
}
```

**Usage**:
```php
use App\Events\OrderStatusUpdated;

$previousStatus = $order->status;
$order->status = 'تم الشحن للعميل';
$order->save();

event(new OrderStatusUpdated($order, $previousStatus));
```

---

#### **3. NewOrderCreated**
**File**: `app/Events/NewOrderCreated.php`

**Triggered When**: New order is created

**Channels** (public):
- `orders`
- `orders.category.{category}` for each relevant category

**Payload**:
```json
{
  "order": {
    "order_number": "ORD-123456",
    "status": "قيد المراجعة",
    "date": "2025-11-25T12:00:00Z",
    "category": "German",
    "brand": "BMW",
    "model": "X5",
    "part_types": ["Engine Parts", "Brakes"]
  },
  "message": "طلب جديد متاح"
}
```

**Usage**:
```php
use App\Events\NewOrderCreated;

// After creating order
$categories = [$formData['category']]; // Can be multiple
event(new NewOrderCreated($order, $categories));
```

---

#### **4. UserNotification**
**File**: `app/Events/UserNotification.php`

**Triggered When**: General notification sent to user

**Channels**:
- `users.{userId}` (private)

**Payload**:
```json
{
  "notification": {
    "id": "notif-uuid",
    "title": "Notification Title",
    "message": "Notification message",
    "timestamp": "2025-11-25T16:00:00Z",
    "read": false,
    "link": {
      "view": "myOrders",
      "params": {"orderNumber": "ORD-123456"}
    }
  }
}
```

**Usage**:
```php
use App\Events\UserNotification;

$notification = [
    'id' => Str::uuid(),
    'title' => 'New Quote',
    'message' => 'You received a new quote',
    'timestamp' => now(),
    'read' => false,
];

event(new UserNotification($userId, $notification));
```

---

### Channel Authorization

**File**: `routes/channels.php`

#### **Private User Channels**
```php
Broadcast::channel('users.{userId}', function ($user, $userId) {
    return $user->id === $userId || $user->phone === $userId;
});
```

#### **Private Order Channels**
```php
Broadcast::channel('orders.{orderNumber}', function ($user, $orderNumber) {
    $order = Order::where('order_number', $orderNumber)->first();
    
    // Allow order creator, providers with quotes, or admin
    return $order && (
        $order->user_id === ($user->id ?? $user->phone) ||
        Quote::where('order_number', $orderNumber)
            ->where('provider_id', $user->id)
            ->exists() ||
        ($user->is_admin ?? false)
    );
});
```

#### **Admin Dashboard Channel**
```php
Broadcast::channel('admin.dashboard', function ($user) {
    return isset($user->is_admin) && $user->is_admin === true;
});
```

#### **Presence Channel** (Online Users)
```php
Broadcast::channel('online', function ($user) {
    if ($user) {
        return [
            'id' => $user->id ?? $user->phone,
            'name' => $user->name,
            'role' => $user->role ?? 'customer',
        ];
    }
    return false;
});
```

---

## Frontend Setup

### Installation

Packages installed in `package.json`:
```json
{
  "dependencies": {
    "laravel-echo": "^1.16.1",
    "pusher-js": "^8.4.0-rc2"
  }
}
```

**Install**:
```bash
npm install
```

### Configuration

**File**: `src/lib/echo.ts`

Initializes Laravel Echo with Reverb connection.

### Environment Variables

Add to frontend `.env`:
```bash
VITE_REVERB_APP_KEY=ramouse-app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

**Production**:
```bash
VITE_REVERB_APP_KEY=ramouse-app-key
VITE_REVERB_HOST=yourdomain.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

---

## React Hooks

### **useRealtime**

Base hook for all real-time features.

```typescript
const { listenToPrivateChannel, listenToChannel, echo } = useRealtime();
```

### **useOrderQuotes**

Listen for new quotes on an order.

```typescript
import { useOrderQuotes } from './hooks/useRealtime';

function MyOrderComponent() {
    useOrderQuotes(orderNumber, (quoteData) => {
        showToast('New quote received!');
        // Update quotes list
        setQuotes(prev => [...prev, quoteData.quote]);
    });
}
```

### **useOrderStatus**

Listen for status updates.

```typescript
import { useOrderStatus } from './hooks/useRealtime';

function OrderTracking() {
    useOrderStatus(orderNumber, (data) => {
        showToast(`Status: ${data.order.status}`);
        setOrderStatus(data.order.status);
    });
}
```

### **useUserNotifications**

Listen for user-specific notifications.

```typescript
import { useUserNotifications } from './hooks/useRealtime';

function App() {
    useUserNotifications(userPhone, (notification) => {
        addNotification(notification);
        showToast(notification.title);
    });
}
```

### **useNewOrders** (for Providers)

Listen for new orders in assigned categories.

```typescript
import { useNewOrders } from './hooks/useRealtime';

function ProviderDashboard() {
    const provider = getLoggedInProvider();
    
    useNewOrders(provider.assignedCategories, (orderData) => {
        showToast('New order available!');
        playNotificationSound();
        // Add to available orders
    });
}
```

### **useOnlineUsers**

Monitor online users (presence channel).

```typescript
import { useOnlineUsers } from './hooks/useRealtime';

function OnlineUsersList() {
    const [onlineUsers, setOnlineUsers] = useState([]);
    
    useOnlineUsers(
        (users) => setOnlineUsers(users),
        (user) => console.log('User joined:', user),
        (user) => console.log('User left:', user)
    );
}
```

---

## Usage Examples

### Example 1: Real-Time Quote Notifications (Customer)

**Backend** (`OrderController@submitQuote`):
```php
public function submitQuote(Request $request, $orderNumber)
{
    // ... validate and create quote
    
    $quote = Quote::create([...]);
    $order = Order::where('order_number', $orderNumber)->first();
    
    // Broadcast event
    event(new QuoteReceived($quote, $order));
    
    return response()->json([
        'success' => true,
        'quote' => $quote,
    ]);
}
```

**Frontend** (`MyOrders.tsx`):
```typescript
import { useOrderQuotes } from '../hooks/useRealtime';

function MyOrders() {
    const [orders, setOrders] = useState([]);
    
    orders.forEach(order => {
        useOrderQuotes(order.orderNumber, (data) => {
            // Real-time quote received!
            showToast(`New quote: $${data.quote.price}`);
            
            // Update order quotes
            setOrders(prev => prev.map(o => 
                o.orderNumber === order.orderNumber
                    ? { ...o, quotes: [...o.quotes, data.quote] }
                    : o
            ));
        });
    });
    
    return <div>...</div>;
}
```

---

### Example 2: Live Order Status Updates

**Backend** (`AdminController@updateOrderStatus`):
```php
public function updateOrderStatus(Request $request, $orderNumber)
{
    $order = Order::where('order_number', $orderNumber)->first();
    $previousStatus = $order->status;
    
    $order->status = $request->status;
    $order->save();
    
    // Broadcast status change
    event(new OrderStatusUpdated($order, $previousStatus));
    
    return response()->json(['success' => true]);
}
```

**Frontend** (`OrderTracking.tsx`):
```typescript
import { useOrderStatus } from '../hooks/useRealtime';

function OrderTracking({ orderNumber }) {
    const [status, setStatus] = useState('');
    
    useOrderStatus(orderNumber, (data) => {
        setStatus(data.order.status);
        showToast(`Order ${data.order.status}`, 'success');
    });
    
    return (
        <div>
            <h3>Order Status</h3>
            <p>{status}</p>
        </div>
    );
}
```

---

### Example 3: Provider New Order Alerts

**Backend** (`OrderController@create`):
```php
public function create(Request $request)
{
    // ... create order
    
    $order = Order::create([...]);
    
    // Determine which categories to notify
    $formData = json_decode($order->form_data, true);
    $categories = [$formData['category']];
    
    // Broadcast to providers
    event(new NewOrderCreated($order, $categories));
    
    return response()->json([
        'success' => true,
        'orderNumber' => $order->order_number,
    ]);
}
```

**Frontend** (`ProviderDashboard.tsx`):
```typescript
import { useNewOrders } from '../hooks/useRealtime';

function ProviderDashboard({ provider }) {
    useNewOrders(provider.assignedCategories, (orderData) => {
        // New order notification
        showToast(`New ${orderData.order.category} order!`);
        playSound('/notification.mp3');
        
        // Optionally auto-refresh orders list
        fetchAvailableOrders();
    });
    
    return <div>...</div>;
}
```

---

## Testing

### Test Reverb Server

```bash
# Start Reverb
php artisan reverb:start --debug

# You should see:
# Reverb server started on 0.0.0.0:6001
```

### Test Events

**Create a test route** (`routes/web.php`):
```php
Route::get('/test-broadcast', function () {
    $userId = '201234567890'; // Test phone
    
    $notification = [
        'id' => Str::uuid(),
        'title' => 'Test Notification',
        'message' => 'This is a test broadcast',
        'timestamp' => now(),
    ];
    
    event(new \App\Events\UserNotification($userId, $notification));
    
    return 'Event broadcasted!';
});
```

**Frontend Test**:
```typescript
// In browser console
window.Echo.private('users.201234567890')
    .listen('.user.notification', (e) => {
        console.log('Received:', e);
    });

// Then visit: http://localhost:8000/test-broadcast
```

### Chrome DevTools

1. Open Network tab
2. Filter by "WS" (WebSocket)
3. Click on WebSocket connection
4. View Messages tab
5. See real-time messages

---

## Deployment

### Production Setup

#### **1. Environment Variables**

**Backend** `.env`:
```bash
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=ramouse-prod
REVERB_APP_KEY=your-production-key
REVERB_APP_SECRET=your-production-secret

REVERB_HOST=yourdomain.com
REVERB_PORT=443
REVERB_SCHEME=https

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=6001
```

**Frontend** `.env`:
```bash
VITE_REVERB_APP_KEY=your-production-key
VITE_REVERB_HOST=yourdomain.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

#### **2. Run Reverb as Service**

**Using Supervisor** (Linux):

Create `/etc/supervisor/conf.d/reverb.conf`:
```ini
[program:reverb]
command=php /var/www/ramouse/Backend/artisan reverb:start
directory=/var/www/ramouse/Backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/reverb.log
```

Start:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start reverb
```

#### **3. Nginx Configuration**

Add WebSocket proxy:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # API location
    location /api {
        proxy_pass http://localhost:8000;
    }
    
    # WebSocket location
    location /app {
        proxy_pass http://localhost:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Troubleshooting

### Connection Failed

**Problem**: Frontend can't connect to Reverb

**Solution**:
1. Check Reverb is running: `php artisan reverb:start --debug`
2. Verify environment variables match
3. Check firewall allows port 6001
4. Ensure CORS is configured

### Authorization Failed

**Problem**: Private channel authorization fails

**Solution**:
1. Check token is included in Echo config
2. Verify `/broadcasting/auth` endpoint exists
3. Check user is authenticated
4. Review channel authorization logic in `routes/channels.php`

### Events Not Received

**Problem**: Events broadcast but not received in frontend

**Solution**:
1. Check event name matches (e.g., `.quote.received`)
2. Verify channel name is correct
3. Check browser console for errors
4. Use DevTools to see WebSocket messages
5. Ensure event implements `ShouldBroadcast`

### Development Issues

**Problem**: CORS errors

**Solution**:
Add to `config/cors.php`:
```php
'paths' => ['api/*', 'broadcasting/auth'],
'allowed_origins' => ['http://localhost:5173'],
'supports_credentials' => true,
```

---

## Performance Tips

1. **Limit Channel Subscriptions**: Only subscribe to channels you need
2. **Unsubscribe on Unmount**: Clean up listeners in useEffect
3. **Debounce Updates**: Don't update state too frequently
4. **Use Presence Wisely**: Presence channels are resource-intensive
5. **Queue Events**: For high-volume events, use Laravel queues

---

## Security Best Practices

1. **Always Authorize Private Channels**: Implement proper authorization in `channels.php`
2. **Validate Broadcast Data**: Don't broadcast sensitive information
3. **Use HTTPS in Production**: Always use WSS (secure WebSocket)
4. **Rotate Secrets**: Change `REVERB_APP_SECRET` periodically
5. **Rate Limit**: Implement rate limiting on broadcast endpoints

---

## Next Steps

### Planned Enhancements

- [ ] Real-time chat between customers and providers
- [ ] Live admin dashboard statistics
- [ ] Provider online/offline status indicators
- [ ] Typing indicators for chat
- [ ] Read receipts for messages
- [ ] Push notifications (browser)
- [ ] Mobile app push notifications

---

## References

- [Laravel Broadcasting Documentation](https://laravel.com/docs/11.x/broadcasting)
- [Laravel Reverb Documentation](https://reverb.laravel.com)
- [Laravel Echo Documentation](https://laravel.com/docs/11.x/broadcasting#client-side-installation)
- [Pusher Protocol](https://pusher.com/docs/channels/library_auth_reference/pusher-websockets-protocol/)

---

**Last Updated**: November 25, 2025  
**Version**: 1.0.0  
**Authors**: Ramouse Development Team
