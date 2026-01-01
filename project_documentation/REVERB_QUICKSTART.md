# Laravel Reverb - Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies

**Frontend** (you need to run this):
```bash
cd Frontend
npm install
```

### 2. Configure Environment

**Backend** - Add to `.env`:
```bash
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=ramouse-app
REVERB_APP_KEY=ramouse-app-key
REVERB_APP_SECRET=your-secret-here

REVERB_HOST=localhost
REVERB_PORT=6001
REVERB_SCHEME=http

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=6001
```

**Frontend** - Add to `.env`:
```bash
VITE_REVERB_APP_KEY=ramouse-app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=6001
VITE_REVERB_SCHEME=http
```

### 3. Start Reverb Server

```bash
cd Backend
php artisan reverb:start
```

You should see:
```
Reverb server started on 0.0.0.0:8080
```

### 4. Test It!

**In your React app**, add to `App.tsx`:
```typescript
import './lib/echo'; // Initialize Echo

// In a component:
import { useUserNotifications } from './hooks/useRealtime';

useUserNotifications(userPhone, (notification) => {
  console.log('Realtime notification:', notification);
  showToast(notification.title);
});
```

---

## 📋 What Was Created

### Backend Files
- ✅ `config/reverb.php` - Reverb configuration
- ✅ `app/Events/QuoteReceived.php` - New quote event
- ✅ `app/Events/OrderStatusUpdated.php` - Status change event  
- ✅ `app/Events/NewOrderCreated.php` - New order event
- ✅ `app/Events/UserNotification.php` - General notification event
- ✅ `routes/channels.php` - Channel authorization (updated)

### Frontend Files
- ✅ `src/lib/echo.ts` - Echo initialization
- ✅ `src/hooks/useRealtime.ts` - Real-time hooks
- ✅ `package.json` - Added laravel-echo & pusher-js (updated)

### Documentation
- ✅ `project_documentation/reverb_implementation.md` - Full guide

---

## 💡 Common Use Cases

### 1. Customer Receives Quote Notification

```typescript
// In MyOrders.tsx or similar
import { useOrderQuotes } from '../hooks/useRealtime';

useOrderQuotes(orderNumber, (data) => {
  showToast(`New quote: $${data.quote.price}`);
  updateQuotesList(data.quote);
});
```

### 2. Provider Gets New Order Alert

```typescript
// In ProviderDashboard.tsx
import { useNewOrders } from '../hooks/useRealtime';

useNewOrders(provider.assignedCategories, (data) => {
  showToast('New order available!');
  refreshOrdersList();
});
```

### 3. Real-Time Status Updates

```typescript
// In OrderTracking component
import { useOrderStatus } from '../hooks/useRealtime';

useOrderStatus(orderNumber, (data) => {
  setStatus(data.order.status);
  showToast(`Status: ${data.order.status}`);
});
```

---

## 🔧 Integration Points

### Where to Add Broadcasts

**OrderController.php**:
```php
// In submitQuote()
event(new QuoteReceived($quote, $order));

// In updateOrderStatus()
event(new OrderStatusUpdated($order, $previousStatus));

// In create()
event(new NewOrderCreated($order, [$category]));
```

**AdminController.php**:
```php
// When updating any order status
event(new OrderStatusUpdated($order, $previousStatus));

// When sending notifications
event(new UserNotification($userId, $notificationData));
```

---

## 🧪 Testing

### Backend Test
```bash
# Terminal 1:
php artisan reverb:start --debug

# Terminal 2:
php artisan tinker

# In tinker:
>>> $notification = ['id' => '123', 'title' => 'Test', 'message' => 'Hello'];
>>> event(new App\Events\UserNotification('201234567890', $notification));
```

### Frontend Test
```javascript
// In browser console:
window.Echo.private('users.201234567890')
  .listen('.user.notification', (e) => {
    console.log('Received:', e);
  });
```

---

## 📦 Running Everything

**Terminal Setup** (3 terminals):

```bash
# Terminal 1: Backend API
cd Backend
php artisan serve

# Terminal 2: Reverb Server
cd Backend
php artisan reverb:start

# Terminal 3: Frontend
cd Frontend
npm run dev
```

---

## 🔗 Quick Links

- **Full Documentation**: [reverb_implementation.md](./reverb_implementation.md)
- **Events Reference**: See Events section in full docs
- **Hooks API**: See React Hooks section in full docs
- **Troubleshooting**: See Troubleshooting section in full docs

---

## ✨ What's Next?

1. **Run `npm install`** in Frontend directory
2. **Configure environment variables** in both .env files  
3. **Start Reverb server**: `php artisan reverb:start`
4. **Test real-time features** using the examples above
5. **Integrate into existing components** where needed

---

## 📞 Need Help?

Check the full documentation: `project_documentation/reverb_implementation.md`

**Common Issues**:
- Can't connect? Check Reverb is running and ports match
- Not receiving events? Check channel names and event names
- Authorization failed? Verify token in Echo config
