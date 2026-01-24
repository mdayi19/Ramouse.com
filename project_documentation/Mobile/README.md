# Ramouse Mobile App - Complete Documentation

**Production-Grade React Native (Expo) Mobile Application**

This folder contains comprehensive planning and architecture documentation for the Ramouse mobile application, designed to support millions of users across 5 distinct user roles.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Documentation Structure](#documentation-structure)
3. [Quick Start Guide](#quick-start-guide)
4. [User Roles](#user-roles)
5. [Technology Stack](#technology-stack)
6. [Implementation Phases](#implementation-phases)
7. [Key Features](#key-features)

---

## Overview

**Project:** Ramouse Mobile Application  
**Platform:** React Native (Expo)  
**Backend:** Laravel 11 REST API (existing, no modifications)  
**Target:** iOS & Android  
**Scale:** Millions of users  
**User Roles:** 5 distinct types (Customer, Technician, Car Provider, Tow Truck, Admin)

### Goals

- ✅ Production-grade architecture (no MVP shortcuts)
- ✅ Multi-role user system with role-based dashboards
- ✅ Scalable to millions of users
- ✅ Reuse 60-70% of existing web frontend code
- ✅ Real-time notifications (WebSockets + Push)
- ✅ Offline-first architecture
- ✅ Type-safe with TypeScript
- ✅ Comprehensive testing

---

## Documentation Structure

### 📄 Core Planning Documents

#### 1. **[implementation_plan.md](./implementation_plan.md)** ⭐ START HERE
**Purpose:** Master implementation plan with 8-phase roadmap  
**Contents:**
- Scalable architecture design
- State management strategy (Zustand + React Query)
- API layer abstraction (Axios + interceptors)
- Security best practices (token storage, biometrics, certificate pinning)
- Authentication flow (login, register, token refresh, RBAC)
- Suggested libraries for all features
- Code reusability strategy
- API versioning approach
- 8-phase implementation timeline (12 weeks)

**Key Sections:**
- Phase 1: Foundation & Infrastructure
- Phase 2: Authentication
- Phase 3: Core Features
- Phase 4: Advanced Features
- Phase 5: Polish & Optimization
- Phase 6: Testing
- Phase 7: Deployment

---

#### 2. **[multi-role-analysis.md](./multi-role-analysis.md)** ⭐ CRITICAL
**Purpose:** Complete analysis of 5 user roles and their requirements  
**Contents:**
- User roles overview (Customer, Technician, Car Provider, Tow Truck, Admin)
- Registration flow for each role (simple vs complex)
- Admin approval system for service providers
- Dashboard requirements per role
- Permissions and limitations
- Role-based navigation structure
- Updated implementation plan with multi-role architecture

**Key Findings:**
- **Customer:** Immediate access, max 3 car listings
- **Technician:** Requires admin approval, profile with gallery, reviews
- **Car Provider:** Requires admin approval, unlimited listings, business profile
- **Tow Truck:** Requires admin approval, real-time GPS location tracking
- **Admin:** Web-only features, mobile monitoring only

---

#### 3. **[feature-breakdown.md](./feature-breakdown.md)** ⭐ DETAILED
**Purpose:** Comprehensive feature specification for all 5 user roles  
**Contents:**
- Complete API endpoint mapping per role
- Detailed feature lists with permissions
- Feature comparison matrix
- Implementation priorities (Customer → Car Provider → Technician → Tow Truck)
- Technical implementation notes
- Code examples for key features

**Highlights:**
- **Customer:** 40+ API endpoints (marketplace, auctions, store, wallet)
- **Car Provider:** 30+ endpoints (unlimited listings, analytics, sponsorship)
- **Technician:** 15+ endpoints (profile, gallery, reviews)
- **Tow Truck:** 15+ endpoints (location tracking, service area)

---

#### 4. **[frontend-analysis.md](./frontend-analysis.md)** ⭐ REUSABILITY
**Purpose:** Analysis of existing React web frontend for code reuse  
**Contents:**
- Folder structure analysis
- Reusable code identification (types, services, hooks, utils)
- Code sharing strategy with platform adapters
- What NOT to share (UI components, routing)
- Implementation roadmap for shared package

**Reusability Summary:**
- ✅ **100% Reusable:** Types (1,287 lines), Constants, Utilities
- ✅ **95% Reusable:** API Services (14 files), API Client
- ✅ **80% Reusable:** Custom Hooks (24 files)
- ❌ **0% Reusable:** UI Components (308 files), SEO, PWA

**Overall:** 60-70% of business logic is reusable!

---

#### 5. **[notification-system-analysis.md](./notification-system-analysis.md)** ⭐ REAL-TIME
**Purpose:** Complete notification system architecture and mobile adaptation  
**Contents:**
- Current architecture (Reverb WebSockets + Web Push)
- 21 broadcast events catalog
- 7 private channels with authorization
- Mobile adaptation strategy (Reverb + Expo Push)
- Backend changes needed (ExpoPushChannel, token storage)
- Mobile implementation (Expo Notifications setup)
- 4-week implementation roadmap

**Key Points:**
- ✅ **Reverb (WebSockets):** 100% compatible with React Native
- ✅ **All 21 events:** Reusable in mobile
- ✅ **Channel authorization:** Works identically
- 🔄 **Web Push → Expo Push:** Requires backend changes

**Reusability:** ~80% of notification logic is reusable!

---

#### 6. **[project-structure.md](./project-structure.md)**
**Purpose:** Complete starter project structure and configuration  
**Contents:**
- Detailed folder structure (modular, scalable)
- `package.json` with all dependencies
- `tsconfig.json` configuration
- `app.json` Expo configuration
- ESLint, Prettier, Babel configs
- `.env` examples for all environments
- Installation commands
- Quick start guide

**Folder Structure:**
```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Auth screens
│   ├── (customer)/        # Customer dashboard
│   ├── (technician)/      # Technician dashboard
│   ├── (car-provider)/    # Car Provider dashboard
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
│   └── schemas/           # Zod validation schemas
└── assets/                # Images, fonts, etc.
```

---

#### 7. **[code-examples.md](./code-examples.md)**
**Purpose:** Production-ready code examples for key components  
**Contents:**
- Axios API client with token refresh
- Zustand authentication store with RBAC
- Protected routes with RoleGuard
- Environment configuration
- React Query hooks (data fetching, mutations)
- Login form with React Hook Form + Zod
- Offline support configuration
- Push notifications service

**Examples Include:**
- Complete API client with interceptors
- Token refresh queue mechanism
- Role-based permission checks
- Form validation with Zod schemas
- React Query cache configuration
- Expo Notifications setup

---

#### 8. **[task.md](./task.md)**
**Purpose:** Implementation task checklist  
**Contents:**
- Phase-by-phase task breakdown
- Progress tracking (✅ completed, ⏭️ pending)
- Current status: Phase 1 (Planning) 100% complete

**Phases:**
- ✅ Phase 1: Architecture & Planning (COMPLETE)
- ⏭️ Phase 2: Project Setup
- ⏭️ Phase 3: Core Infrastructure
- ⏭️ Phase 4: Authentication
- ⏭️ Phase 5-8: Feature Implementation
- ⏭️ Phase 9-10: Testing & Deployment

---

### 📁 Code Examples Folder

#### **[examples/](./examples/)**
Contains production-ready code snippets:
- `api-client.example.ts` - Complete Axios setup with interceptors

---

## Quick Start Guide

### 1. Read Documentation (Recommended Order)

1. **[implementation_plan.md](./implementation_plan.md)** - Understand overall architecture
2. **[multi-role-analysis.md](./multi-role-analysis.md)** - Learn about user roles
3. **[feature-breakdown.md](./feature-breakdown.md)** - Review features per role
4. **[project-structure.md](./project-structure.md)** - See folder structure
5. **[code-examples.md](./code-examples.md)** - Study code patterns
6. **[frontend-analysis.md](./frontend-analysis.md)** - Understand code reuse
7. **[notification-system-analysis.md](./notification-system-analysis.md)** - Real-time features

### 2. Setup Project

```bash
# Navigate to workspace
cd c:\laragon\www\ramouse

# Create mobile app folder
npx create-expo-app@latest mobile --template blank-typescript

# Navigate to mobile folder
cd mobile

# Install dependencies (see project-structure.md for full list)
npm install zustand @tanstack/react-query axios expo-router
npm install react-hook-form zod @hookform/resolvers
npm install expo-secure-store expo-notifications
npm install laravel-echo pusher-js

# Start development
npx expo start
```

### 3. Follow Implementation Plan

- Start with Phase 2 (Project Setup) in `task.md`
- Implement features in priority order (Customer → Car Provider → Others)
- Test thoroughly on both iOS and Android

---

## User Roles

### 1. Customer (80% of users)
- **Access:** Immediate (no approval)
- **Features:** Browse marketplace, auctions, store, wallet, favorites
- **Listings:** Max 3 car listings (sale only)
- **Priority:** HIGHEST

### 2. Car Provider (Revenue driver)
- **Access:** Requires admin approval
- **Features:** Unlimited listings (sale + rent), analytics, sponsorship, business profile
- **Listings:** Unlimited
- **Priority:** HIGH

### 3. Technician (Service provider)
- **Access:** Requires admin approval
- **Features:** Profile with gallery, reviews, max 3 car listings
- **Listings:** Max 3 (sale only)
- **Priority:** MEDIUM

### 4. Tow Truck (Service provider with location)
- **Access:** Requires admin approval
- **Features:** Real-time GPS tracking, profile, reviews, max 3 car listings
- **Listings:** Max 3 (sale only)
- **Priority:** MEDIUM

### 5. Admin (Monitoring only)
- **Access:** Immediate
- **Features:** Quick verifications, system monitoring (full features web-only)
- **Priority:** LOW

---

## Technology Stack

### Core
- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)

### State Management
- **Client State:** Zustand (lightweight, TypeScript-first)
- **Server State:** @tanstack/react-query (caching, background refetch)

### API & Networking
- **HTTP Client:** Axios (with interceptors)
- **WebSockets:** Laravel Echo + Pusher.js
- **Offline:** React Query persistence + NetInfo

### Forms & Validation
- **Forms:** React Hook Form
- **Validation:** Zod

### Security
- **Token Storage:** expo-secure-store (encrypted)
- **Biometrics:** expo-local-authentication
- **Certificate Pinning:** Production only

### Notifications
- **Push:** Expo Notifications
- **Real-time:** Laravel Echo (Reverb)

### UI
- **UI Library:** React Native Paper (Material Design)
- **Icons:** @expo/vector-icons
- **Date/Time:** date-fns

### Platform Features
- **Image Picker:** expo-image-picker
- **Camera:** expo-camera
- **Location:** expo-location
- **File System:** expo-file-system

---

## Implementation Phases

### Phase 1: Architecture & Planning ✅ COMPLETE
- ✅ Define scalable folder structure
- ✅ Design state management strategy
- ✅ Plan API layer abstraction
- ✅ Define security best practices
- ✅ Create authentication flow design
- ✅ Analyze multi-role user system
- ✅ Document registration flows
- ✅ Define dashboard requirements
- ✅ Map API endpoints per role
- ✅ Analyze frontend for reusability
- ✅ Analyze notification system

### Phase 2: Project Setup (Week 1)
- [ ] Initialize Expo project
- [ ] Set up folder structure
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up TypeScript paths

### Phase 3: Core Infrastructure (Week 2)
- [ ] Implement API client
- [ ] Create auth store
- [ ] Set up role-based navigation
- [ ] Implement secure token storage
- [ ] Create error handling utilities

### Phase 4: Authentication (Week 3)
- [ ] Login screen (universal)
- [ ] Role selection screen
- [ ] Customer registration (simple)
- [ ] Technician registration (complex)
- [ ] Car Provider registration (business)
- [ ] Tow Truck registration (vehicle)
- [ ] OTP verification
- [ ] Pending approval screen

### Phase 5: Customer Features (Weeks 4-5)
- [ ] Customer dashboard
- [ ] Car marketplace
- [ ] Favorites & garage
- [ ] Orders & wallet
- [ ] Auctions

### Phase 6: Car Provider Features (Weeks 6-7)
- [ ] Car Provider dashboard
- [ ] Listings management
- [ ] Add/Edit listing wizard
- [ ] Analytics & sponsorship
- [ ] Business profile

### Phase 7: Service Providers (Week 8)
- [ ] Technician dashboard & profile
- [ ] Tow Truck dashboard & location tracking
- [ ] Reviews display

### Phase 8: Shared Features (Week 9)
- [ ] Wallet system (all roles)
- [ ] Notifications (push + real-time)
- [ ] Reviews system
- [ ] Settings screens

### Phase 9: Advanced Features (Week 10)
- [ ] Offline support
- [ ] Image optimization
- [ ] Biometric authentication
- [ ] Deep linking

### Phase 10: Testing & Polish (Week 11)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization

### Phase 11: Deployment (Week 12)
- [ ] App Store submission
- [ ] Google Play submission
- [ ] CI/CD pipeline
- [ ] Monitoring setup

---

## Key Features

### Authentication & Security
- ✅ Multi-role authentication (5 user types)
- ✅ Token-based auth with auto-refresh
- ✅ Secure token storage (encrypted)
- ✅ Biometric authentication (Face ID/Touch ID)
- ✅ Role-based access control (RBAC)
- ✅ Certificate pinning (production)

### Real-Time Features
- ✅ WebSocket connections (Reverb)
- ✅ Push notifications (Expo)
- ✅ Live auction updates
- ✅ Real-time order status
- ✅ Wallet balance updates
- ✅ Location tracking (Tow Trucks)

### Offline Support
- ✅ React Query cache persistence
- ✅ Offline-first architecture
- ✅ Background sync
- ✅ Network status detection

### Performance
- ✅ Image optimization
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Cache management
- ✅ Background refetch

### User Experience
- ✅ Role-based dashboards
- ✅ Smooth animations
- ✅ Pull-to-refresh
- ✅ Infinite scroll
- ✅ Search & filters
- ✅ Deep linking

---

## Next Steps

1. ✅ **Review all documentation** (you are here)
2. ⏭️ **Set up development environment**
   - Install Node.js, Expo CLI
   - Set up iOS Simulator / Android Emulator
3. ⏭️ **Initialize project** (Phase 2)
   - Create Expo app
   - Set up folder structure
   - Install dependencies
4. ⏭️ **Implement core infrastructure** (Phase 3)
   - API client
   - Auth store
   - Navigation
5. ⏭️ **Build authentication** (Phase 4)
   - Login/Register screens
   - Token management
6. ⏭️ **Develop features by role** (Phases 5-8)
   - Customer first (80% of users)
   - Then Car Provider (revenue)
   - Then service providers
7. ⏭️ **Test & deploy** (Phases 9-11)

---

## Additional Resources

### Backend API
- **Base URL:** `https://ramouse.com/api`
- **Documentation:** See `api.php` routes file
- **Authentication:** Bearer token (Sanctum)

### Environment Variables
```env
EXPO_PUBLIC_API_URL=https://ramouse.com/api
EXPO_PUBLIC_REVERB_APP_KEY=ramouse-app-key
EXPO_PUBLIC_REVERB_HOST=ramouse.com
EXPO_PUBLIC_REVERB_PORT=443
EXPO_PUBLIC_REVERB_SCHEME=https
```

### Useful Commands
```bash
# Start development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android

# Build for production
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Support & Contact

For questions or clarifications, refer to the detailed documentation files or contact the development team.

---

**Last Updated:** January 24, 2026  
**Version:** 1.0.0  
**Status:** Planning Phase Complete ✅
