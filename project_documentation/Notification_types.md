# Real-Time Notification Types Documentation

This document outlines the real-time notification system in the Ramouse project, detailing the events, triggers, broadcasting channels, and frontend handling.

## Overview

The system uses **Laravel Reverb** (WebSocket server) and **Laravel Echo** (Frontend client) to handle real-time updates. This ensures users (Customers, Providers, Technicians, Admins) receive instant updates without refreshing the page.

### Technology Stack
- **Backend:** Laravel Events & Notifications (implementing `ShouldBroadcast`).
- **Frontend:** `laravel-echo` + `pusher-js`.
- **Channel Types:**
    - `public`: Accessible by anyone (e.g., general announcements - though not currently heavily used).
    - `private`: Requires authentication (e.g., user-specific notifications, order updates).
    - `presence`: Tracks online users (e.g., `online` channel).

---

## Notification Events

### 1. New Order Created
**Event Class:** `App\Events\NewOrderCreated`
- **Description:** Broadcasted when a customer successfully places a new order.
- **Trigger:** Order creation logic in `OrderController` or `OrderService`.
- **Channels:**
    - `orders` (Public/General channel for all providers).
    - `orders.category.{categoryId}` (Specific channel for providers subscribed to a category).
- **Payload:**
    ```json
    {
        "order": {
            "order_number": "ORD-12345",
            "status": "pending",
            "date": "2023-10-25...",
            "category": "Engine",
            "brand": "Toyota",
            "model": "Camry",
            "part_types": ["Oil Filter"]
        },
        "message": "طلب جديد متاح"
    }
    ```
- **Frontend Listener:** `useNewOrders` hook in `useRealtime.ts`.
- **UI Impact:** Providers see the new order appear instantly in the "Open Orders" list.

### 2. Order Status Updated
**Event Class:** `App\Events\OrderStatusUpdated`
- **Description:** Broadcasted when an order's status changes (e.g., Payment Confirmed, Shipped, Delivered).
- **Trigger:** `Order::updated` observer or explicit status update controller methods.
- **Channels:**
    - `private-orders.{orderNumber}` (For tracking specific order).
    - `private-user.{userId}` (For notifying the specific user involved).
- **Payload:**
    ```json
    {
        "order": {
            "order_number": "ORD-12345",
            "status": "processing",
            "previous_status": "pending",
            "updated_at": "2023-10-25..."
        },
        "message": "تم تحديث حالة الطلب"
    }
    ```
- **Frontend Listener:** `useOrderStatus` hook.
- **UI Impact:**
    - Updates status badges in real-time.
    - Triggers timeline progression in `OrderWizard` or `OrderDetails`.

### 3. Quote Received
**Event Class:** `App\Events\QuoteReceived`
- **Description:** Broadcasted when a provider submits a price quote for a request.
- **Trigger:** `OrderController@submitQuote`.
- **Channels:**
    - `private-orders.{orderNumber}`
    - `private-user.{userId}` (Customer's ID)
- **Payload:**
    ```json
    {
        "quote": {
            "id": 1,
            "provider_name": "Fast Parts",
            "price": 150,
            "part_status": "new",
            "timestamp": "..."
        },
        "order": {
            "order_number": "ORD-12345",
            "status": "quoted"
        },
        "message": "تم استلام عرض سعر جديد"
    }
    ```
- **Frontend Listener:** `useOrderQuotes` hook.
- **UI Impact:**
    - Customer receives a notification/toast.
    - Quote list updates instantly in `OrderWizard`.

### 4. User Notification (General)
**Event Class:** `App\Events\UserNotification`
- **Description:** A generic wrapper for various user-specific alerts.
- **Trigger:** Manual usage of `UserNotification::dispatch($user, $data)`.
- **Channels:** `private-user.{userId}`
- **Common Types:**
    - `OFFER_ACCEPTED_PROVIDER_WIN`: Provider won the bid.
    - `OFFER_ACCEPTED_PROVIDER_LOSS`: Another provider won.
    - `FUNDS_DEPOSITED`: Wallet balance updated.
    - `WITHDRAWAL_PROCESSED_APPROVED` / `REJECTED`: Withdrawal status.
    - `NEW_TECHNICIAN_REQUEST`: Technician specific job.
- **Payload:**
    ```json
    {
        "notification": {
            "id": "uuid",
            "type": "OFFER_ACCEPTED_PROVIDER_WIN",
            "title": "مبارك! تم قبول عرضك",
            "message": "...",
            "read": false,
            "timestamp": "...",
            "data": { ...context }
        }
    }
    ```
- **Frontend Listener:** `App.tsx` global listener on `user.{userId}`.
- **UI Impact:**
    - Shows a Toast notification.
    - Plays a sound effect (Money sound for wins, Error sound for losses/rejections).
    - Updates Notification Center counter.
    - Refreshes specific views (Wallet, Accepted Views) depending on type.

### 5. User Registered (Admin Alert)
**Event Class:** `App\Events\UserRegistered`
- **Description:** Notifies admins when a new Provider, Technician, or Tow Truck registers.
- **Trigger:** Registration Controllers.
- **Channels:** `private-admin.dashboard`
- **Payload:**
    ```json
    {
        "user": {
            "type": "provider", // or technician, tow_truck
            "typeLabel": "مزود",
            "name": "Ahmed Autos",
            "phone": "050...",
            "registered_at": "..."
        },
        "message": "مستخدم جديد: مزود"
    }
    ```
- **Frontend Listener:** `App.tsx` (Admin specific `useEffect`).
- **UI Impact:** Admins get a toast and a notification item to review the new registration.

---

## Frontend Hook Reference (`useRealtime.ts`)

| Hook | Purpose | Channels Listened |
|All Hooks| Wrapper for `Echo` | N/A |
| `useNewOrders` | Provider: Listen for new job opportunities | `orders`, `orders.category.*` |
| `useOrderStatus` | Track specific order progress | `orders.{orderNumber}` |
| `useOrderQuotes` | Customer: Watch for incoming quotes | `orders.{orderNumber}` |
| `useUserNotifications` | General personal alerts | `user.{userId}` |
| `useOnlineUsers` | Presence tracking (who is online) | `presence-online` |

## Sound Effects

Mapped in `App.tsx`:
- **Money Sound:** `OFFER_ACCEPTED_PROVIDER_WIN`, `FUNDS_DEPOSITED`
- **New Order Sound:** `NEW_ORDER_FOR_PROVIDER`, `NEW_PROVIDER_REQUEST`, `NEW_TECHNICIAN_REQUEST`
- **Error Sound:** `OFFER_ACCEPTED_PROVIDER_LOSS`, `PAYMENT_REJECTED`, `ORDER_CANCELLED`
- **Info Sound:** Default for others.
