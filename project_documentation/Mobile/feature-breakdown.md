# Complete Feature Breakdown by User Role

Comprehensive specification of features, permissions, and API endpoints for each user role in the Ramouse mobile application.

---

## 1. Customer Features

### Core Capabilities
- ✅ Browse and search all content (no approval needed)
- ✅ Immediate access after registration
- ✅ Can create up to 3 car listings (as individual seller)
- ✅ Full marketplace access
- ✅ Wallet system
- ✅ Auction participation

### Detailed Features

#### 1.1 Car Marketplace
**Endpoints:**
- `GET /api/car-listings` - Browse sale listings
- `GET /api/rent-car` - Browse rental listings
- `GET /api/car-listings/{slug}` - View listing details
- `POST /api/car-listings/search` - Full-text search
- `GET /api/car-providers/{id}` - View provider profiles
- `GET /api/car-providers/{id}/listings` - Provider's listings

**Features:**
- Browse sale and rental cars
- Advanced search and filters
- View car details with photos/videos
- Contact sellers (call, WhatsApp)
- View provider profiles and reviews

#### 1.2 My Car Listings (Individual Seller)
**Endpoints:**
- `GET /api/customer/listings` - My listings
- `POST /api/customer/listings` - Create listing
- `PUT /api/customer/listings/{id}` - Update listing
- `DELETE /api/customer/listings/{id}` - Delete listing
- `PATCH /api/customer/listings/{id}/toggle` - Show/hide listing
- `PATCH /api/customer/listings/{id}/quick-edit` - Quick price edit
- `GET /api/customer/stats` - Listing statistics
- `GET /api/customer/analytics` - View analytics

**Limitations:**
- **Maximum 3 listings** (sale only, no rentals)
- Basic analytics (views, favorites)
- Cannot bulk manage listings

#### 1.3 Favorites
**Endpoints:**
- `GET /api/favorites` - My favorites
- `POST /api/favorites/{listingId}/toggle` - Add/remove favorite
- `GET /api/favorites/{listingId}/check` - Check if favorited
- `GET /api/favorites/{listingId}/count` - Public favorite count

**Features:**
- Save favorite cars
- Quick access to saved listings
- Remove from favorites

#### 1.4 Garage Management
**Features:**
- Save owned vehicles
- Track vehicle details
- Stored in `garage` JSON field

#### 1.5 Parts Store
**Endpoints:**
- `GET /api/store/products` - Browse products
- `GET /api/store/products/{id}` - Product details
- `GET /api/store/categories` - Product categories
- `POST /api/store/purchase` - Purchase product
- `GET /api/store/orders` - My orders
- `POST /api/store/products/{id}/review` - Add review
- `POST /api/store/orders/{id}/cancel` - Cancel order
- `GET /api/store/saved-address` - Get saved address
- `POST /api/store/calculate-shipping` - Calculate shipping

**Features:**
- Browse car parts and accessories
- Purchase products
- Track orders
- Save delivery addresses
- Leave product reviews

#### 1.6 Services Directory
**Endpoints:**
- `GET /api/technicians` - Browse technicians
- `GET /api/technicians/{id}` - Technician profile
- `GET /api/technicians/{id}/reviews` - Technician reviews
- `GET /api/tow-trucks` - Browse tow trucks
- `GET /api/tow-trucks/{id}` - Tow truck profile
- `GET /api/tow-trucks/{id}/reviews` - Tow truck reviews

**Features:**
- Find technicians by specialty and location
- Find tow trucks by area
- View profiles, ratings, and reviews
- Contact service providers

#### 1.7 Auctions
**Endpoints:**
- `GET /api/auctions` - Browse auctions
- `GET /api/auctions/{id}` - Auction details
- `GET /api/auctions/{id}/bids` - View bids
- `POST /api/auctions/{id}/register` - Register for auction
- `POST /api/auctions/{id}/bid` - Place bid
- `POST /api/auctions/{id}/buy-now` - Buy now
- `POST /api/auctions/{id}/pay` - Submit payment
- `POST /api/auctions/{id}/remind` - Set reminder
- `GET /api/auctions/my-auctions` - My auctions
- `GET /api/auctions/watchlist` - My watchlist
- `POST /api/auctions/watchlist/{auctionId}` - Add to watchlist
- `POST /api/sell-car` - Submit car for auction

**Features:**
- Browse live auctions
- Register and bid on cars
- Buy now option
- Set reminders
- Watchlist management
- Submit own car for auction
- Payment submission

#### 1.8 Wallet System
**Endpoints:**
- `GET /api/wallet/balance` - Check balance
- `GET /api/wallet/transactions` - Transaction history
- `GET /api/wallet/deposits` - Deposit history
- `GET /api/wallet/withdrawals` - Withdrawal history
- `POST /api/wallet/deposit` - Submit deposit
- `POST /api/wallet/withdraw` - Request withdrawal
- `POST /api/wallet/pay` - Pay from wallet
- `GET /api/wallet/payment-methods` - Payment methods
- `POST /api/wallet/payment-methods` - Add payment method
- `PUT /api/wallet/payment-methods/{id}` - Update method
- `DELETE /api/wallet/payment-methods/{id}` - Delete method

**Features:**
- View wallet balance
- Deposit funds
- Withdraw funds
- Payment methods management
- Transaction history
- Pay for services/products

#### 1.9 Reviews
**Endpoints:**
- `POST /api/reviews` - Submit review
- `GET /api/reviews/my-reviews` - My reviews

**Features:**
- Review technicians
- Review tow trucks
- Review car providers
- Review products
- View own review history

#### 1.10 International License
**Endpoints:**
- `GET /api/international-license/pricing` - Get pricing
- `POST /api/international-license/step1` - Submit application
- `POST /api/international-license/upload-documents` - Upload docs
- `POST /api/international-license/upload-payment-proof` - Upload payment
- `POST /api/international-license/final-submit` - Final submission
- `GET /api/international-license/my-requests` - My requests
- `POST /api/international-license/requests/{id}/reupload-payment` - Reupload
- `POST /api/international-license/requests/{id}/reupload-documents` - Reupload

**Features:**
- Apply for international license
- Upload required documents
- Submit payment proof
- Track application status
- Reupload if rejected

#### 1.11 Notifications
**Endpoints:**
- `GET /api/notifications` - My notifications
- `GET /api/notifications/unread-count` - Unread count
- `POST /api/notifications/{id}/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read
- `DELETE /api/notifications/{id}` - Delete notification
- `DELETE /api/notifications` - Clear all
- `POST /api/notifications/subscribe` - Push notification subscription

**Features:**
- Real-time notifications
- Push notifications
- In-app notifications
- Notification history
- Mark as read/unread

#### 1.12 Profile Management
**Endpoints:**
- `GET /api/user` - Get profile
- `PUT /api/profile` - Update profile

**Features:**
- Update name, address
- Change password
- Notification settings
- Saved addresses

---

## 2. Technician Features

### Core Capabilities
- ✅ Provide repair services
- ✅ Manage profile and gallery
- ✅ Can create up to 3 car listings (sale only)
- ✅ Wallet system
- ⏳ Requires admin verification to login

### Detailed Features

#### 2.1 Dashboard
**Endpoints:**
- `GET /api/technician/stats` - Dashboard statistics

**Features:**
- Total views
- Average rating
- Total reviews
- Wallet balance
- Recent activity

#### 2.2 Profile Management
**Endpoints:**
- `GET /api/technician/profile` - Get profile
- `PUT /api/technician/profile` - Update profile
- `POST /api/technician/profile/photo` - Upload profile photo
- `POST /api/technician/profile/gallery` - Upload gallery image
- `DELETE /api/technician/profile/gallery/{index}` - Delete gallery item

**Features:**
- Update specialty
- Update city and workshop address
- Update description
- Upload profile photo (base64)
- Manage gallery (photos/videos)
- Update social links
- Update GPS location
- Update working hours

**Profile Fields:**
- Name
- Specialty (dropdown)
- City
- Workshop address
- Description
- Profile photo
- Gallery (images/videos)
- Social links (Facebook, Instagram, WhatsApp)
- Location (GPS coordinates)
- Phone number

#### 2.3 Reviews Management
**Endpoints:**
- `GET /api/technicians/{id}/reviews` - Public reviews

**Features:**
- View customer reviews
- Average rating display
- Review count
- Cannot respond to reviews (customer-only feature)

#### 2.4 Car Listings (Same as Customer)
**Endpoints:**
- `GET /api/technician/listings` - My listings
- `POST /api/technician/listings` - Create listing
- `PUT /api/technician/listings/{id}` - Update listing
- `DELETE /api/technician/listings/{id}` - Delete listing
- `PATCH /api/technician/listings/{id}/toggle` - Show/hide
- `PATCH /api/technician/listings/{id}/quick-edit` - Quick edit
- `GET /api/technician/stats` - Stats
- `GET /api/technician/analytics` - Analytics

**Limitations:**
- **Maximum 3 listings** (sale only, no rentals)
- Basic analytics

#### 2.5 Wallet (Same as Customer)
**Endpoints:** Same as customer wallet endpoints

**Features:**
- Receive payments for services
- Withdraw earnings
- Transaction history

#### 2.6 Notifications (Same as Customer)
**Features:**
- Service requests
- New reviews
- Payment notifications

---

## 3. Car Provider Features

### Core Capabilities
- ✅ Sell and rent cars (unlimited listings)
- ✅ Business profile management
- ✅ Advanced analytics
- ✅ Bulk operations
- ✅ Sponsorship system
- ✅ Wallet with provider-specific features
- ⏳ Requires admin verification to login

### Detailed Features

#### 3.1 Dashboard
**Endpoints:**
- `GET /api/car-provider/stats` - Dashboard stats
- `GET /api/car-provider/analytics` - Analytics overview
- `GET /api/car-provider/analytics/detailed` - Detailed analytics
- `GET /api/car-provider/analytics/export` - Export analytics

**Features:**
- Total listings (sale + rent)
- Total views
- Total favorites
- Active sponsorships
- Wallet balance
- Revenue tracking
- Performance metrics
- Detailed analytics by listing
- Export reports (CSV/PDF)

#### 3.2 Business Profile Management
**Endpoints:**
- `GET /api/car-provider/profile` - Get profile
- `PUT /api/car-provider/profile` - Update profile
- `GET /api/car-provider/phones` - Get phone numbers

**Features:**
- Update business name
- Update business type
- Update business license
- Update city and address
- Update description
- Upload profile photo (file upload)
- Manage gallery (file uploads)
- Update social links
- Update GPS coordinates
- Update email
- Update working hours
- Update website
- Manage multiple phone numbers

**Profile Fields:**
- Business name
- Business type (dealership, showroom, rental, etc.)
- Business license number
- City
- Address
- GPS coordinates
- Description
- Profile photo
- Cover photo
- Gallery
- Social links
- Email
- Website
- Working hours
- Multiple phone numbers (primary, WhatsApp)

#### 3.3 Phone Numbers Management
**Features:**
- Add multiple phone numbers
- Set primary phone
- Mark WhatsApp numbers
- Label phones (Main, Sales, Service, etc.)
- Stored in separate `car_provider_phones` table

#### 3.4 Car Listings Management
**Endpoints:**
- `GET /api/car-provider/listings` - My listings
- `POST /api/car-provider/listings` - Create listing
- `PUT /api/car-provider/listings/{id}` - Update listing
- `DELETE /api/car-provider/listings/{id}` - Delete listing
- `PATCH /api/car-provider/listings/{id}/toggle` - Show/hide
- `PATCH /api/car-provider/listings/{id}/quick-edit` - Quick price edit
- `POST /api/car-provider/listings/{id}/duplicate` - Duplicate listing
- `GET /api/car-provider/listings/{id}/analytics` - Listing analytics

**Features:**
- **Unlimited listings** (sale and rent)
- Create sale listings
- Create rental listings
- Upload multiple photos per listing
- Set pricing (sale price or daily/weekly/monthly rent)
- Quick edit (price, availability)
- Duplicate listings
- Per-listing analytics

**Listing Fields:**
- Type (sale/rent)
- Brand, model, year
- Price (sale) or rental rates (daily, weekly, monthly)
- Mileage
- Condition
- Features
- Description
- Photos (multiple)
- City
- Category
- Availability status

#### 3.5 Bulk Operations
**Endpoints:**
- `POST /api/car-provider/listings/bulk-hide` - Hide multiple
- `POST /api/car-provider/listings/bulk-show` - Show multiple
- `POST /api/car-provider/listings/bulk-delete` - Delete multiple

**Features:**
- Select multiple listings
- Bulk hide/show
- Bulk delete
- Efficient management of large inventory

#### 3.6 Sponsorship System
**Endpoints:**
- `GET /api/car-provider/listings/sponsor-price` - Calculate price
- `POST /api/car-provider/listings/{id}/sponsor` - Sponsor listing
- `POST /api/car-provider/listings/{id}/unsponsor` - Remove sponsorship
- `GET /api/car-provider/sponsorships` - My sponsorships

**Features:**
- Sponsor listings for visibility
- Choose duration (1, 7, 30 days)
- Pay from wallet
- Track active sponsorships
- Auto-expiry handling

#### 3.7 Provider Wallet
**Endpoints:**
- `GET /api/provider/wallet-balance` - Get balance
- `GET /api/provider/transactions` - Transactions
- `GET /api/provider/withdrawals` - Withdrawals
- `POST /api/provider/withdrawals` - Request withdrawal

**Features:**
- Receive payments from sales/rentals
- Pay for sponsorships
- Withdraw earnings
- Transaction history
- Withdrawal requests

#### 3.8 Reviews Management
**Endpoints:**
- `GET /api/provider/reviews` - My reviews
- `POST /api/provider/reviews/{id}/moderate` - Flag review
- `POST /api/provider/reviews/{id}/respond` - Respond to review

**Features:**
- View customer reviews
- Respond to reviews
- Flag inappropriate reviews
- Average rating display

#### 3.9 Orders Management (if applicable)
**Endpoints:**
- `GET /api/provider/open-orders` - Open orders
- `GET /api/provider/my-bids` - My bids
- `GET /api/provider/accepted-orders` - Accepted orders
- `PUT /api/provider/orders/{orderNumber}/status` - Update status
- `GET /api/provider/overview-data` - Overview

**Features:**
- View customer inquiries
- Manage orders
- Update order status

---

## 4. Tow Truck Provider Features

### Core Capabilities
- ✅ Provide towing services
- ✅ Real-time location tracking
- ✅ Manage profile and gallery
- ✅ Can create up to 3 car listings (sale only)
- ✅ Wallet system
- ⏳ Requires admin verification to login

### Detailed Features

#### 4.1 Dashboard
**Endpoints:**
- `GET /api/tow-truck/stats` - Dashboard statistics

**Features:**
- Total views
- Average rating
- Total reviews
- Wallet balance
- Recent activity
- Service requests (if implemented)

#### 4.2 Profile Management
**Endpoints:**
- `GET /api/user` - Get profile (generic)
- `PUT /api/profile` - Update profile (generic)

**Features:**
- Update name
- Update vehicle type
- Update city and service area
- Update description
- Upload profile photo (base64)
- Manage gallery (photos/videos)
- Update social links
- **Update GPS location (real-time)**
- Update working hours

**Profile Fields:**
- Name
- Vehicle type (flatbed, wheel-lift, etc.)
- City
- Service area
- Description
- Profile photo
- Gallery (vehicle photos)
- Social links
- **Location (GPS - real-time tracking)**
- Phone number

#### 4.3 Location Tracking
**Features:**
- **Real-time GPS location updates**
- Update location via mobile GPS
- Display on map for customers
- Service area radius
- Availability status

**Implementation:**
- Use Expo Location API
- Background location updates
- Send location to backend periodically
- Store in `location` field (PostGIS POINT)

#### 4.4 Reviews Management
**Endpoints:**
- `GET /api/tow-trucks/{id}/reviews` - Public reviews

**Features:**
- View customer reviews
- Average rating display
- Review count

#### 4.5 Car Listings (Same as Technician)
**Endpoints:**
- `GET /api/tow-truck/listings` - My listings
- `POST /api/tow-truck/listings` - Create listing
- `PUT /api/tow-truck/listings/{id}` - Update listing
- `DELETE /api/tow-truck/listings/{id}` - Delete listing
- `PATCH /api/tow-truck/listings/{id}/toggle` - Show/hide
- `PATCH /api/tow-truck/listings/{id}/quick-edit` - Quick edit
- `GET /api/tow-truck/stats` - Stats
- `GET /api/tow-truck/analytics` - Analytics

**Limitations:**
- **Maximum 3 listings** (sale only, no rentals)

#### 4.6 Wallet (Same as Customer)
**Features:**
- Receive payments for towing services
- Withdraw earnings
- Transaction history

#### 4.7 Notifications (Same as Customer)
**Features:**
- Service requests
- New reviews
- Payment notifications

---

## 5. Admin Features (Mobile - Limited)

### Core Capabilities
- ✅ Monitor system status
- ✅ Quick verifications
- ✅ View pending approvals
- ❌ Full admin features (web-only)

### Mobile Admin Features (Limited)

#### 5.1 Dashboard
**Features:**
- System overview
- Pending verifications count
- Recent registrations
- Critical alerts

#### 5.2 Quick Verifications
**Endpoints:**
- `GET /api/admin/technicians` - Pending technicians
- `PATCH /api/admin/technicians/{id}/verify` - Verify technician
- `GET /api/admin/car-providers` - Pending providers
- `PATCH /api/admin/car-providers/{id}/verify` - Verify provider
- `GET /api/admin/tow-trucks` - Pending tow trucks
- `PATCH /api/admin/tow-trucks/{id}/verify` - Verify tow truck

**Features:**
- View pending verifications
- Quick approve/reject
- View profile details

#### 5.3 Notifications
**Features:**
- New registration alerts
- System alerts
- Critical issues

**Note:** Full admin panel remains web-only. Mobile admin is for monitoring and quick actions only.

---

## Feature Comparison Matrix

| Feature | Customer | Technician | Car Provider | Tow Truck | Admin |
|---------|----------|------------|--------------|-----------|-------|
| **Registration** | Simple | Complex | Complex | Complex | N/A |
| **Approval Required** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | N/A |
| **Car Listings** | Max 3 (sale) | Max 3 (sale) | Unlimited (sale+rent) | Max 3 (sale) | View all |
| **Marketplace Access** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Wallet** | ✅ Yes | ✅ Yes | ✅ Yes (advanced) | ✅ Yes | ❌ No |
| **Auctions** | ✅ Full | ✅ Browse only | ✅ Browse only | ✅ Browse only | ✅ Manage |
| **Parts Store** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Manage |
| **Reviews** | ✅ Leave | ✅ Receive | ✅ Receive + Respond | ✅ Receive | ✅ Moderate |
| **Analytics** | Basic | Basic | Advanced | Basic | Full |
| **Bulk Operations** | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes |
| **Sponsorship** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Manage |
| **Location Tracking** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Multiple Phones** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Business Profile** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Gallery** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |

---

## Implementation Priorities

### Phase 1: Core + Customer (Weeks 1-4)
**Priority: HIGHEST** - 80% of users

1. **Week 1:** Project setup, API client, auth store
2. **Week 2:** Customer registration, login, profile
3. **Week 3:** Car marketplace (browse, search, details)
4. **Week 4:** Favorites, basic wallet, notifications

**Deliverable:** Customers can register, browse cars, save favorites

---

### Phase 2: Car Provider (Weeks 5-6)
**Priority: HIGH** - Main revenue driver

1. **Week 5:** Car Provider registration, business profile, phone management
2. **Week 6:** Listings management, bulk operations, analytics, sponsorship

**Deliverable:** Car providers can register, manage unlimited listings, sponsor cars

---

### Phase 3: Technician (Week 7)
**Priority: MEDIUM** - Service provider

1. **Week 7:** Technician registration, profile with gallery, reviews display

**Deliverable:** Technicians can register, manage profile, receive reviews

---

### Phase 4: Tow Truck (Week 8)
**Priority: MEDIUM** - Service provider with location

1. **Week 8:** Tow Truck registration, profile with gallery, **real-time location tracking**

**Deliverable:** Tow trucks can register, manage profile, update location

---

### Phase 5: Advanced Features (Weeks 9-10)
**Priority: MEDIUM**

1. **Week 9:** 
   - Customer car listings (max 3)
   - Technician car listings (max 3)
   - Tow Truck car listings (max 3)
   - Parts store integration
   - Auctions (browse + bid)

2. **Week 10:**
   - Advanced wallet features
   - International license application
   - Reviews system
   - Push notifications

**Deliverable:** All roles can create listings, full wallet, auctions, store

---

### Phase 6: Polish & Testing (Week 11)
**Priority: HIGH**

1. Unit tests for all features
2. Integration tests
3. E2E tests for critical flows
4. Performance optimization
5. Accessibility improvements
6. Bug fixes

**Deliverable:** Production-ready, tested app

---

### Phase 7: Deployment (Week 12)
**Priority: CRITICAL**

1. App Store submission (iOS)
2. Google Play submission (Android)
3. CI/CD pipeline setup
4. Monitoring and analytics
5. Crash reporting (Sentry)
6. Performance monitoring (Firebase)

**Deliverable:** Live app on both stores

---

## Technical Implementation Notes

### 1. Location Tracking (Tow Truck Only)

```typescript
// src/services/location.service.ts
import * as Location from 'expo-location';
import { apiClient } from '@/api/client';

export const locationService = {
  async startTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // Watch position
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 100, // 100 meters
      },
      async (location) => {
        // Send to backend
        await apiClient.put('/tow-truck/profile', {
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });
      }
    );
  },
};
```

### 2. File Upload Strategy

**Technician/Tow Truck (Base64):**
```typescript
const uploadPhoto = async (uri: string) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  await apiClient.post('/technician/profile/photo', {
    profilePhoto: `data:image/jpeg;base64,${base64}`,
  });
};
```

**Car Provider (FormData):**
```typescript
const uploadPhoto = async (uri: string) => {
  const formData = new FormData();
  formData.append('profile_photo', {
    uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);
  
  await apiClient.post('/car-provider/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

### 3. Role-Based Navigation

```typescript
// app/_layout.tsx
const getRoleRoute = (role: string) => {
  switch (role) {
    case 'customer': return '/(customer)';
    case 'technician': return '/(technician)';
    case 'car_provider': return '/(car-provider)';
    case 'tow_truck': return '/(tow-truck)';
    case 'admin': return '/(admin)';
    default: return '/(auth)/login';
  }
};
```

---

## Next Steps

1. ✅ Review and approve this feature breakdown
2. ✅ Confirm implementation priorities
3. ⏭️ Begin Phase 1: Project setup
4. ⏭️ Implement customer features first
5. ⏭️ Roll out other roles incrementally

---

> [!IMPORTANT]
> **Key Decisions Confirmed:**
> - ✅ Implement all roles simultaneously (phased approach)
> - ✅ Real-time location tracking for Tow Trucks only
> - ✅ Admin features web-only (mobile monitoring only)
> - ✅ Each role has specific features and limitations

> [!TIP]
> **Development Strategy:**
> Focus on Customer first (80% of users), then Car Provider (revenue), then service providers (Technician, Tow Truck). This ensures immediate value delivery while building toward full feature set.
