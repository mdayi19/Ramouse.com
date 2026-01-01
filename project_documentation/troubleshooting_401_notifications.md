# 🔧 Fixing 401 Unauthorized Error - Notifications

## Problem
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to fetch notifications: AxiosError
```

## Root Cause
The `/notifications` endpoint requires authentication (`auth:sanctum` middleware), but no valid token is present or the user isn't logged in.

---

## ✅ Solution Steps

### **Step 1: Check Authentication Status**

Open browser console (F12) and run:
```javascript
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('Is Authenticated:', localStorage.getItem('isAuthenticated'));
```

**Expected:**
- If logged in: Token should be a long string
- If NOT logged in: Both will be `null` ← **This is your issue**

---

### **Step 2: Login to the Application**

1. **Open the app**: http://localhost:3000 (or 5173)
2. **Click "تسجيل الدخول" (Login)** button in header
3. **Enter credentials**:
   - Phone: Your registered phone number
   - Password: Your password

4. **After successful login**, check console again:
```javascript
localStorage.getItem('authToken') // Should now have a token
```

---

### **Step 3: Test Notifications**

Now that you're logged in, let's send a test notification:

#### **Option A: Using Tinker** (You already have it open!)

In your open tinker terminal:
```php
// Get your user's phone from localStorage (check browser console)
$userId = '963123456789'; // Replace with YOUR phone number

// Create a test notification
$notification = App\Models\Notification::create([
    'user_id' => $userId,
    'title' => '🎉 مرحباً!',
    'message' => 'هذا أول إشعار لك في النظام',
    'type' => 'success',
    'read' => false
]);

// Broadcast it in real-time
event(new App\Events\UserNotification($userId, $notification->toArray()));

// Verify it was created
echo "Notification created with ID: " . $notification->id . "\n";
App\Models\Notification::where('user_id', $userId)->count();
```

#### **Option B: Using API (After Login)**

1. Get your token from browser console:
```javascript
copy(localStorage.getItem('authToken'));
```

2. Send notification via API:
```bash
curl -X POST http://localhost:8000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "user_id": "YOUR_PHONE_NUMBER",
    "title": "اختبار النظام",
    "message": "الإشعارات تعمل بنجاح!",
    "type": "info"
  }'
```

---

## 🎯 Expected Results After Login

### **In Browser Console:**
```
🔴 Laravel Echo initialized
🔔 Listening for notifications for user: 963123456789
```

### **When You Send Notification:**
```
🔔 New notification: {
  id: "...",
  title: "🎉 مرحباً!",
  message: "هذا أول إشعار لك في النظام",
  ...
}
```

### **In UI:**
- Bell icon shows unread count badge
- Click bell → Notification appears in dropdown
- Toast notification shows (optional)

---

## 🐛 Still Getting 401?

### **Check 1: Token Exists**
```javascript
// Browser console
localStorage.getItem('authToken') // Should NOT be null
```

### **Check 2: Token is Valid**
```bash
# Test with curl
curl http://localhost:8000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**If you get user data** → Token is valid ✅  
**If you get 401** → Token expired, login again

### **Check 3: User Exists in Database**
```bash
# In tinker
User::where('phone', 'YOUR_PHONE')->first();
# Or
App\Models\Customer::where('phone', 'YOUR_PHONE')->first();
```

---

## 📝 Quick Test Checklist

- [ ] Open app in browser
- [ ] Click "تسجيل الدخول" (Login)
- [ ] Enter phone + password
- [ ] Check browser console for `authToken`
- [ ] Send test notification via tinker
- [ ] Watch it appear in real-time!

---

## 🎓 Understanding the Error

The error is **NOT a bug** - it's the **security system working correctly**!

### **Without Authentication:**
```
User → API /notifications → ❌ 401 "Who are you?"
```

### **With Authentication:**
```
User → API /notifications + Token → ✅ 200 "Here are your notifications"
```

---

## 🚀 Next Steps

1. **Login to the app**
2. **Verify token exists** in localStorage
3. **Run the tinker command** to send a test notification
4. **Watch the magic happen!** ✨

Your notifications system is **working perfectly** - you just need to be logged in to use it!

---

*If you need to create a test user, let me know and I'll help you with that!*
