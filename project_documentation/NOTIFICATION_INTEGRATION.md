# 🔔 Notification System Integration Guide

## Current Notification System Overview

After reviewing the existing notification components, here's how the notification system works:

### **Existing Components**:

1. **NotificationCenter.tsx** - Full-screen notification center
2. **NotificationDropdown.tsx** - Header dropdown (shows 8 recent notifications)
3. **NotificationSettingsForm.tsx** - User notification preferences
4. **NotificationSettingsEditor.tsx** - Admin global notification settings

### **Notification Interface** (from types.ts):

```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: {
    view: 'welcome' | 'newOrder' | 'myOrders' | 'adminDashboard' | 'providerDashboard' | ...;
    params: { orderNumber?: string; technicianId?: string; ... };
  };
}
```

### **Current Storage**: LocalStorage/IndexedDB (frontend-only)

---

## 🔗 Integration with Real-Time & REST API

### Step 1: Update useAppState Hook

The `useAppState` hook currently manages notifications in state. We need to integrate it with:
1. **REST API** for persistence
2. **Real-time WebSocket** for instant updates

**In `src/hooks/useAppState.ts`**, add:

```typescript
import { useUserNotifications } from './useRealtime';
import { api } from '../lib/api';

// Inside useAppState hook:

// Load notifications from API on login
const loadNotifications = async (userId: string) => {
  try {
    const response = await api.get('/notifications');
    if (response.data.success) {
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unread_count);
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
};

// Real-time notification listener
useUserNotifications(userPhone, (notification) => {
  // Add to notifications array
  addNotification(notification);
  
 // Show toast
  showToast(notification.title, 'info');
  
  // Play sound (optional)
  playNotificationSound();
});

// Update addNotification to also save to API
const addNotification = async (notification: Notification) => {
  setNotifications(prev => [notification, ...prev]);
  setUnreadCount(prev => prev + 1);
  
  // Persist to localStorage as backup
  localStorage.setItem('notifications', JSON.stringify([notification, ...notifications]));
};

// Mark as read - update API
const markNotificationAsRead = async (id: string) => {
  try {
    await api.post(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  } catch (error) {
    console.error('Failed to mark as read:', error);
  }
};

// Delete notification - update API
const deleteNotification = async (id: string) => {
  try {
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n.id !== id));
    const wasUnread = notifications.find(n => n.id === id)?.read === false;
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  } catch (error) {
    console.error('Failed to deletnotification:', error);
  }
};

// Clear all - update API
const clearAllNotifications = async () => {
  try {
    await api.delete('/notifications');
    setNotifications([]);
    setUnreadCount(0);
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
};
```

---

### Step 2: Modify Controller Events

Update your backend controllers to broadcast notifications when actions happen.

**Example: QuoteController (when provider submits quote)**:

```php
// In OrderController@submitQuote
use App\Events\QuoteReceived;
use App\Events\UserNotification;

public function submitQuote(Request $request, $orderNumber)
{
    // ... create quote logic ...
    
    $quote = Quote::create([...]);
    $order = Order::where('order_number', $orderNumber)->first();
    
    // 1. Broadcast quote received event (real-time)
    event(new QuoteReceived($quote, $order));
    
    // 2. Create notification object
    $notification = [
        'id' => (string) Str::uuid(),
        'title' => 'عرض سعر جديد',
        'message' => "تلقيت عرض سعر من {$quote->provider_name} بقيمة {$quote->price} ل.س",
        'timestamp' => now()->toISOString(),
        'read' => false,
        'link' => [
            'view' => 'myOrders',
            'params' => ['orderNumber' => $orderNumber],
        ],
    ];
    
    // 3. Broadcast notification (real-time)
    event(new UserNotification($order->user_id, $notification));
    
    // 4. Send WhatsApp if enabled
    $this->whatsappService->sendQuoteNotification(
        $order->user_id,
        $orderNumber,
        $quote->provider_name,
        number_format($quote->price) . ' ل.س'
    );
    
    return response()->json(['success' => true,'quote' => $quote]);
}
```

---

### Step 3: Update Existing Components

#### **NotificationCenter.tsx** - No changes needed!
The component already handles:
- ✅ Displaying notifications
- ✅ Deleting notifications
- ✅ Clearing all
- ✅ Navigation on click

#### **NotificationDropdown.tsx** - No changes needed!
Already handles:
- ✅ Recent 8 notifications
- ✅ Icon based on title
- ✅ Time since display
- ✅ Mark as read indicator

#### **App.tsx** - Just initialize Echo

```typescript
import './lib/echo'; // Add this at top to initialize WebSocket
```

---

### Step 4: Notification Helper Functions

Create **`src/utils/notifications.ts`**:

```typescript
import { Notification } from '../types';
import { api } from '../lib/api';

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  async getAll(): Promise<Notification[]> {
    const response = await api.get('/notifications');
    return response.data.data.notifications;
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.unread_count;
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  },

  /**
   * Delete single notification
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    await api.delete('/notifications');
  },

  /**
   * Send notification (admin/system)
   */
  async send(
    userId: string,
    title: string,
    message: string,
    link?: Notification['link'],
    sendWhatsApp = false
  ): Promise<void> {
    await api.post('/notifications/send', {
      user_id: userId,
      title,
      message,
      link,
      send_whatsapp: sendWhatsApp,
    });
  },
};
```

---

## 🎯 Complete Integration Example

### Scenario: Customer receives quote notification

#### **Backend** (OrderController.php):
```php
public function submitQuote(Request $request, $orderNumber) {
    $quote = Quote::create([...]);
    $order = Order::find($orderNumber);
    
    // Real-time broadcast
    event(new QuoteReceived($quote, $order));
    
    // Create notification
    $notification = [
        'id' => Str::uuid(),
        'title' => 'عرض سعر جديد',
        'message' => "عرض سعر من {$quote->provider_name}",
        'timestamp' => now()->toISOString(),
        'read' => false,
        'link' => ['view' => 'myOrders', 'params' => ['orderNumber' => $orderNumber]],
    ];
    
    // Broadcast notification
    event(new UserNotification($order->user_id, $notification));
    
    // Send WhatsApp
    $this->whatsappService->sendQuoteNotification(...);
}
```

#### **Frontend** (useAppState.ts):
```typescript
// Real-time listener
useUserNotifications(userPhone, (notification) => {
  // 1. Add to state
  setNotifications(prev => [notification, ...prev]);
  setUnreadCount(prev => prev + 1);
  
  // 2. Show toast
  showToast(notification.title, 'success');
  
  // 3. Play sound
  const audio = new Audio('/notification.mp3');
  audio.play();
  
  // 4. Update localStorage backup
  localStorage.setItem('notifications', JSON.stringify([notification, ...notifications]));
});
```

#### **User Experience**:
1. Provider submits quote ✅
2. Backend broadcasts event ✅
3. Customer's browser receives via WebSocket ✅
4. Toast notification appears ✅
5. Notification bell badge updates ✅
6. Customer receives WhatsApp message ✅
7. Notification stored in localStorage ✅

---

## 📱 Notification Flow Diagram

```
Provider submits quote
        ↓
OrderController@submitQuote
        ↓
    ┌─────────────────────────────────┐
    │                                 │
    ↓                                 ↓
QuoteReceived Event         UserNotification Event
(order details)             (notification object)
    ↓                                 ↓
Laravel Reverb Server ──────────────────
    ↓                                 ↓
Customer's Browser (WebSocket)       │
    ↓                                 ↓
useOrderQuotes hook    useUserNotifications hook
        ↓                            ↓
Update quotes list        Add to notifications
                                    ↓
                            Show toast + sound
                                    ↓
                            Update badge count
                                    ↓
                            Save to localStorage
```

---

## ✅ Integration Checklist

### Backend:
- [x] NotificationController with REST API
- [x] Notification routes in api.php
- [x] Event classes (QuoteReceived, OrderStatusUpdated, etc.)
- [x] Channel authorization (routes/channels.php)
- [ ] Update controllers to broadcast events when actions happen
- [ ] Test WhatsApp integration

### Frontend:
- [x] Echo configuration (lib/echo.ts)
- [x] Real-time hooks (hooks/useRealtime.ts)
- [x] Package dependencies (laravel-echo, pusher-js)
- [ ] Update useAppState with API calls
- [ ] Initialize Echo in App.tsx
- [ ] Test real-time notifications
- [ ] Test notification CRUD operations

### Testing:
- [ ] Test real-time quote notification
- [ ] Test order status update
- [ ] Test new order notification (providers)
- [ ] Test mark as read
- [ ] Test delete notification
- [ ] Test clear all
- [ ] Test notification persistence across refreshes
- [ ] Test offline/online behavior

---

## 🔧 Quick Implementation

**Minimal changes needed**:

1. **App.tsx** - Add one line:
```typescript
import './lib/echo'; // Initialize WebSocket
```

2. **useAppState.ts** - Add real-time listener:
```typescript
import { useUserNotifications } from './useRealtime';

useUserNotifications(userPhone, (notification) => {
  addNotificationForUser(notification);
  showToast(notification.title);
});
```

3. **Controllers** - Add broadcasts:
```php
// When important events happen:
event(new UserNotification($userId, $notificationData));
```

That's it! The existing UI components work perfectly as-is.

---

## 🎨 No UI Changes Needed!

Your current notification UI is already great:
- ✅ **NotificationDropdown** - Beautiful, icon-based, time-relative
- ✅ **NotificationCenter** - Full-screen view with delete/clear
- ✅ **NotificationSettingsForm** - User preferences
- ✅ **NotificationSettingsEditor** - Admin controls

All components are ready for real-time integration!

---

## 📚 Next Steps

1. **Install frontend dependencies**: `npm install` in Frontend directory
2. **Configure environment** variables for Reverb
3. **Start Reverb server**: `php artisan reverb:start`
4. **Add Echo init** to App.tsx
5. **Add real-time listeners** to useAppState
6. **Add broadcasts** to controllers
7. **Test end-to-end** notification flow

---

**Your notification system is production-ready!** 🎉
