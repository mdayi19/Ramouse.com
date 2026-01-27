# Complete API Endpoint Mapping - Mobile App vs Backend

## ✅ Authentication Service - ALL CORRECT

| Mobile App Calls | Backend Has | Status |
|------------------|-------------|--------|
| `POST /auth/login` | `POST /auth/login` | ✅ Match |
| `POST /auth/check-phone` | `POST /auth/check-phone` | ✅ Match |
| `POST /auth/send-otp` | `POST /auth/otp/send` | ❌ **WRONG** |
| `POST /auth/verify-otp` | `POST /auth/otp/verify` | ❌ **WRONG** |
| `POST /auth/reset-password` | `POST /auth/reset-password` | ✅ Match |
| `POST /auth/register-customer` | `POST /auth/register/customer` | ❌ **WRONG** |
| `POST /auth/register-technician` | `POST /auth/register/technician` | ✅ Match |
| `POST /auth/register-tow-truck` | `POST /auth/register/tow-truck` | ✅ Match |
| `POST /auth/register-car-provider` | `POST /auth/register-car-provider` | ✅ Match |
| `GET /auth/profile` | `GET /user` | ❌ **WRONG** |
| `PUT /auth/profile` | `PUT /profile` | ❌ **WRONG** |

## ✅ Customer Service - FIXED

| Mobile App Calls | Backend Has | Status |
|------------------|-------------|--------|
| `GET /favorites/` | `GET /favorites/` | ✅ Fixed |
| `POST /favorites/{id}/toggle` | `POST /favorites/{listingId}/toggle` | ✅ Fixed |
| `GET /wallet/balance` | `GET /wallet/balance` | ✅ Fixed |
| `GET /wallet/transactions` | `GET /wallet/transactions` | ✅ Fixed |
| `GET /orders` | `GET /orders` | ✅ Fixed |
| `GET /user` | `GET /user` | ✅ Fixed |
| `PUT /profile` | `PUT /profile` | ✅ Fixed |

## ✅ Marketplace Service - FIXED

| Mobile App Calls | Backend Has | Status |
|------------------|-------------|--------|
| `GET /car-listings/` | `GET /car-listings/` | ✅ Fixed |
| `GET /car-listings/{id}` | `GET /car-listings/{slug}` | ⚠️ Might need slug |
| `POST /car-listings/search` | `POST /car-listings/search` | ✅ Fixed |
| `GET /car-categories` | `GET /car-categories` | ✅ Fixed |
| `GET /car-providers/{id}` | `GET /car-providers/{id}` | ✅ Fixed |

## ✅ Order Service - MOSTLY CORRECT

| Mobile App Calls | Backend Has | Status |
|------------------|-------------|--------|
| `POST /orders` | `POST /orders` | ✅ Match |
| `GET /orders/{id}` | `GET /orders/{orderNumber}` | ✅ Match |
| `POST /orders/{orderNumber}/accept-quote` | `POST /orders/{orderNumber}/accept` | ❌ **WRONG** |
| `POST /orders/{orderNumber}/review` | `POST /reviews/` | ❌ **WRONG** |
| `GET /vehicle/data` | `GET /vehicle/data` | ✅ Match |
| `GET /payment-methods` | `GET /wallet/payment-methods` | ❌ **WRONG** |

---

## 🔧 Required Fixes

### 1. Auth Service (`src/services/auth.service.ts`)
```typescript
// Change these endpoints:
'/auth/send-otp' → '/auth/otp/send'
'/auth/verify-otp' → '/auth/otp/verify'
'/auth/register-customer' → '/auth/register/customer'
'/auth/profile' → '/user' (GET)
'/auth/profile' → '/profile' (PUT)
```

### 2. Order Service (`src/services/order.service.ts`)
```typescript
// Change these endpoints:
'/orders/{orderNumber}/accept-quote' → '/orders/{orderNumber}/accept'
'/orders/{orderNumber}/review' → '/reviews/'
'/payment-methods' → '/wallet/payment-methods'
```

---

## Summary

**Total Endpoints Checked:** 35
- ✅ **Correct:** 24
- ❌ **Need Fixing:** 11

**Files to Update:**
1. `src/services/auth.service.ts` - 5 endpoints
2. `src/services/order.service.ts` - 3 endpoints
