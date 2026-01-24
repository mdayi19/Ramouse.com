# Ramouse Mobile App - Setup Guide

## ✅ Project Created Successfully!

Your Expo project has been created at: `c:\laragon\www\ramouse\mobile\`

---

## 🚀 Quick Setup (3 Steps)

Run these commands in **Git Bash** (MINGW64):

### Step 1: Install Dependencies
```bash
cd /c/laragon/www/ramouse/mobile
chmod +x 01-install-dependencies.sh
./01-install-dependencies.sh
```

### Step 2: Create Folder Structure
```bash
chmod +x 02-create-folders.sh
./02-create-folders.sh
```

### Step 3: Let me know when done!
I'll then create all the configuration files and base code.

---

## 📦 What Will Be Installed

### Core (Step 1)
- ✅ Zustand (state management)
- ✅ React Query (server state/caching)
- ✅ Axios (HTTP client)
- ✅ Expo Router (navigation)
- ✅ React Hook Form + Zod (forms/validation)
- ✅ Expo Secure Store (encrypted storage)
- ✅ Expo Notifications (push notifications)
- ✅ Laravel Echo + Pusher.js (WebSockets)
- ✅ React Native Paper (UI components)
- ✅ Date-fns (date utilities)
- ✅ Expo Image Picker, Camera, Location
- ✅ AsyncStorage, NetInfo

**Total:** ~30 packages

### Folder Structure (Step 2)
```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, register
│   ├── (customer)/        # Customer dashboard
│   ├── (car-provider)/    # Car Provider dashboard
│   ├── (technician)/      # Technician dashboard
│   ├── (tow-truck)/       # Tow Truck dashboard
│   └── (admin)/           # Admin monitoring
├── src/
│   ├── api/               # API client & endpoints
│   ├── store/             # Zustand stores
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom hooks
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   ├── types/             # TypeScript types
│   ├── config/            # Configuration
│   ├── constants/         # Constants
│   └── schemas/           # Zod validation
└── assets/                # Images, fonts, icons
```

---

## ⏭️ After Setup

Once you run both scripts, I'll create:

1. ✅ `tsconfig.json` - TypeScript configuration
2. ✅ `app.json` - Expo configuration
3. ✅ `babel.config.js` - Babel configuration
4. ✅ `.env.development` - Development environment
5. ✅ `.env.production` - Production environment
6. ✅ `src/api/client.ts` - Axios API client
7. ✅ `src/store/authStore.ts` - Authentication store
8. ✅ `src/types/index.ts` - TypeScript types
9. ✅ `src/config/api.ts` - API configuration
10. ✅ Base screens and components

---

## 🎯 Current Status

- ✅ Expo project created
- ⏭️ Dependencies installation (run script 1)
- ⏭️ Folder structure (run script 2)
- ⏭️ Configuration files (I'll create after step 2)
- ⏭️ Base code (I'll create after step 2)

---

## 🐛 Troubleshooting

### If scripts don't run:
```bash
# Make them executable
chmod +x *.sh

# Run them
./01-install-dependencies.sh
./02-create-folders.sh
```

### If you prefer manual installation:
Let me know and I'll provide the npm commands one by one.

---

**Ready? Run the scripts and let me know when done!** 🚀
