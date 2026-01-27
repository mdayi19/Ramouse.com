# API Integration Debugging Guide

## Current Issue: Wallet Not Showing Balance

### Possible Causes:

1. **User Not Logged In**
   - Check if you're logged in
   - Token might be expired
   - Check browser console for 401 errors

2. **Backend Endpoint Missing**
   - The `/customer/wallet` endpoint might not exist yet
   - Check backend routes

3. **Response Structure Mismatch**
   - Backend might return different structure
   - Expected: `{ balance: number }`
   - Actual: might be `{ data: { balance: number } }`

### How to Debug:

#### 1. Check if Logged In
Open browser console and check:
```javascript
// Check if token exists
localStorage.getItem('authToken')
```

#### 2. Check API Calls
In browser console, look for:
- Network tab → Filter by "wallet"
- Check response status (200, 401, 404, 500)
- Check response body

#### 3. Test Backend Endpoint
Use Postman or curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://ramouse.com/api/customer/wallet
```

### Quick Fixes:

#### If 401 (Unauthorized):
- You need to log in first
- Go to login screen and authenticate

#### If 404 (Not Found):
- Backend endpoint doesn't exist
- Need to create `/customer/wallet` endpoint in Laravel

#### If 500 (Server Error):
- Check Laravel logs
- Database issue or code error

### Expected Backend Response:

```json
{
  "balance": 1000
}
```

Or:

```json
{
  "data": {
    "balance": 1000
  }
}
```

### Mobile App API Calls:

All these endpoints need to exist in your Laravel backend:

**Authentication:**
- POST `/auth/login`
- POST `/auth/register-customer`
- POST `/auth/send-otp`

**Customer:**
- GET `/customer/wallet` ← **This one for wallet balance**
- GET `/customer/transactions`
- GET `/customer/favorites`
- GET `/customer/orders`
- GET `/customer/profile`

**Marketplace:**
- GET `/marketplace/listings`
- GET `/marketplace/listings/:id`

**Orders:**
- POST `/orders`
- GET `/orders/:id`
- POST `/orders/:orderNumber/accept-quote`

### Next Steps:

1. **First**: Try logging in to the app
2. **Second**: Check browser console for errors
3. **Third**: Verify backend endpoints exist
4. **Fourth**: Check Laravel API routes

### Testing Login:

1. Open the app in browser
2. Go to login screen
3. Enter credentials
4. Check if dashboard loads
5. Navigate to wallet screen
6. Check browser console for errors
