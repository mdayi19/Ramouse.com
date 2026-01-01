# Frontend Structure Documentation

## Overview
The Ramouse Auto Parts frontend is a **React 18** application built with **TypeScript** and **Vite**. It features a fully responsive, RTL (Right-to-Left) Arabic interface with multi-role support, real-time state management, and seamless API integration with the Laravel backend.

## Technology Stack
- **Framework**: React 18.2
- **Build Tool**: Vite 5.1
- **Language**: TypeScript 5.4
- **Routing**: React Router DOM 6.22
- **Styling**: TailwindCSS 3.4
- **HTTP Client**: Axios 1.6
- **Icons**: Lucide React 0.344
- **AI Integration**: Google Generative AI 0.21
- **QR Generation**: qrcode 1.5
- **Utilities**: clsx, tailwind-merge

---

## Directory Structure

```
Frontend/
├── src/
│   ├── components/          # All React components (66 files)
│   │   ├── DashboardParts/  # Admin dashboard views (31 components)
│   │   │   ├── Store/       # Store management components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── OverviewView.tsx
│   │   │   ├── OrdersView.tsx
│   │   │   ├── UsersView.tsx
│   │   │   ├── TechniciansView.tsx
│   │   │   ├── TowTruckManagementView.tsx
│   │   │   ├── BlogManagementView.tsx
│   │   │   ├── FaqManagementView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   ├── WhatsappManagementView.tsx
│   │   │   └── ... (25+ more views)
│   │   ├── CustomerDashboardParts/  # Customer dashboard views (10 components)
│   │   │   ├── Store/               # Store browsing components
│   │   │   ├── StoreView.tsx
│   │   │   ├── FlashProductsView.tsx
│   │   │   └── OverviewView.tsx
│   │   ├── ProviderDashboardParts/  # Provider dashboard views (11 components)
│   │   ├── TechnicianDashboardParts/ # Technician dashboard views (6 components)
│   │   ├── TowTruckDashboardParts/   # Tow truck dashboard views (6 components)
│   │   ├── AdminDashboard.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── ProviderDashboard.tsx
│   │   ├── TechnicianDashboard.tsx
│   │   ├── TowTruckDashboard.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MyOrders.tsx
│   │   ├── Step1Category.tsx → Step7Success.tsx (Order flow)
│   │   └── ... (40+ more components)
│   ├── services/            # API service layer (6 files)
│   │   ├── admin.service.ts
│   │   ├── auth.service.ts
│   │   ├── content.service.ts
│   │   ├── directory.service.ts
│   │   ├── order.service.ts
│   │   └── store.service.ts
│   ├── hooks/               # Custom React hooks (2 files)
│   │   ├── useAppState.ts   # Main app state management
│   │   └── useTelegram.ts   # Telegram integration
│   ├── lib/                 # Core utilities (3 files)
│   │   ├── api.ts           # Axios instance & interceptors
│   │   ├── config.ts        # App configuration
│   │   └── db.ts            # IndexedDB for offline storage
│   ├── utils/               # Utility functions
│   │   └── helpers.ts       # Helper functions
│   ├── App.tsx              # Main application component
│   ├── index.tsx            # Application entry point
│   ├── types.ts             # TypeScript type definitions (572 lines)
│   ├── constants.tsx        # App constants & seed data
│   └── lucide-icon-list.ts  # Icon registry
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # TailwindCSS configuration
└── package.json             # Dependencies

```

---

## Core Architecture

### Application Entry Flow
```
index.html
  ↓
index.tsx (ReactDOM.createRoot)
  ↓
App.tsx (Main Application)
  ↓
useAppState Hook (State Management)
  ↓
View Components (Routing Logic)
```

### State Management Pattern
The application uses a **centralized state management** pattern via the `useAppState` custom hook, which manages:
- Authentication state
- User roles and permissions
- Navigation and routing
- Data caching
- Notifications
- Forms and orders
- Settings and configuration

---

## Key Components

### 1. App.tsx (Main Application)

**Purpose**: Root application component that manages routing, layout, and global UI.

**Key Features**:
- **Lazy Loading**: Code-splitting for better performance
- **View Routing**: 24 different views with conditional rendering
- **Dark Mode**: Theme toggle with persistence
- **Multi-Role Support**: Different dashboards for different user types
- **Responsive Layout**: Mobile-first design with adaptive UI

**View Types**:
```typescript
type View = 'welcome' | 'newOrder' | 'myOrders' | 'adminDashboard' | 
            'providerDashboard' | 'customerDashboard' | 'technicianDashboard' | 
            'towTruckDashboard' | 'notificationCenter' | 'announcements' | 
            'store' | 'technicianDirectory' | 'technicianProfile' | 
            'technicianRegistration' | 'towTruckDirectory' | 'towTruckProfile' | 
            'towTruckRegistration' | 'blog' | 'blogPost' | 'faq' | 
            'privacyPolicy' | 'termsOfUse' | 'contact';
```

**Layout Structure**:
```jsx
<div>
  <Header />
  <main>
    <ProgressBar /> {/* For order flow */}
    <Suspense fallback={<PageLoader />}>
      {renderCurrentView()}
    </Suspense>
  </main>
  <Footer />
  <PublicMobileMenu />
  <LoginScreen /> {/* Modal */}
  <ToastContainer />
</div>
```

---

### 2. useAppState Hook

**Location**: `src/hooks/useAppState.ts` (21,733 bytes)

**Purpose**: Centralized state management for the entire application.

**State Categories**:

#### **Authentication State**
```typescript
- isAuthenticated: boolean
- isAdmin: boolean
- isProvider: boolean
- isTechnician: boolean
- isTowTruck: boolean
- userPhone: string
- userName: string
- showLogin: boolean
```

#### **User Data**
```typescript
- loggedInProvider: Provider | null
- loggedInTechnician: Technician | null
- loggedInTowTruck: TowTruck | null
- allCustomers: Customer[]
- allTechnicians: Technician[]
- allTowTrucks: TowTruck[]
```

#### **Order Management**
```typescript
- formData: OrderFormData
- currentStep: number
- orderNumber: string
- allOrders: Order[]
- isSubmitting: boolean
```

#### **Application Data**
```typescript
- carCategories: Category[]
- allBrands: Brand[]
- brandModels: CarModel[]
- partTypes: PartType[]
- technicianSpecialties: TechnicianSpecialty[]
- storeCategories: StoreCategory[]
```

#### **Navigation**
```typescript
- currentView: View
- navigationParams: any
- isSidebarOpen: boolean
- isPublicMenuOpen: boolean
```

#### **Content**
```typescript
- settings: Settings
- announcements: AnnouncementPost[]
- blogPosts: BlogPost[]
- faqItems: FaqItem[]
- notifications: Notification[]
- unreadCount: number
```

#### **UI State**
```typescript
- isDarkMode: boolean
- isLoading: boolean
- toastMessages: ToastMessage[]
```

**Key Methods**:
```typescript
- handleLoginSuccess()
- handleLogout()
- handleStartNewOrder()
- handleNavigate(view, params)
- submitForm()
- updateFormData()
- nextStep() / prevStep()
- showToast(message, type)
- addNotificationForUser()
- sendMessage() // WhatsApp integration
- publishAnnouncement()
- deleteAnnouncement()
- updateSettings()
```

**Data Persistence**:
- Uses `IndexedDB` for offline caching
- Implements cache versioning
- Auto-syncs with backend on load

---

### 3. Dashboard Components

#### **AdminDashboard.tsx**
**Purpose**: Admin control panel with full CRUD operations.

**Features**:
- **Overview**: Statistics and analytics
- **Orders Management**: View and manage all orders
- **Users Management**: CRUD for all user types
- **Content Management**: Blog, FAQ, announcements
- **Store Management**: Products, categories, orders
- **Settings**: System configuration
- **Financial Management**: Withdrawals, transactions
- **Vehicle Data**: Categories, brands, models, parts
- **WhatsApp/Telegram**: Messaging API configuration

**Sidebar Navigation** (26 menu items):
```
- Overview
- Orders
- Users
- Technicians
- Tow Trucks
- Store Products
- Store Categories
- Store Orders
- Blog
- FAQ
- Announcements
- Messages & Templates
- Settings (General, WhatsApp, Telegram, Shipping, Limits, SEO, CEO)
- Accounting
- Model Management
```

#### **CustomerDashboard.tsx**
**Purpose**: Customer portal for orders and store.

**Features**:
- **Overview**: Recent orders and stats
- **My Orders**: Order history and tracking
- **Store**: Browse and purchase products
- **Flash Products**: Limited-time offers
- **Garage**: Vehicle management
- **Settings**: Profile and preferences

#### **ProviderDashboard.tsx**
**Purpose**: Service provider dashboard for quotes and orders.

**Features**:
- **Overview**: Earnings and statistics
- **Available Orders**: Browse and quote on orders
- **My Quotes**: Track submitted quotes
- **Active Orders**: Manage accepted orders
- **Wallet**: Balance and transactions
- **Withdrawals**: Request withdrawals
- **Settings**: Profile and payment methods

#### **TechnicianDashboard.tsx**
**Purpose**: Technician profile and service management.

**Features**:
- **Overview**: Profile stats and reviews
- **Services**: Order service requests
- **Profile Management**: Edit details, gallery, socials
- **Settings**: Notification preferences
- **Store Access**: Browse and purchase supplies

#### **TowTruckDashboard.tsx**
**Purpose**: Tow truck service management.

**Features**:
- **Overview**: Service stats and availability
- **Profile Management**: Vehicle details, service area
- **Settings**: Availability and preferences
- **Store Access**: Equipment and supplies

---

### 4. Authentication Components

#### **LoginScreen.tsx**
**Purpose**: Phone-based authentication with OTP.

**Flow**:
```
1. Enter Phone Number
   ↓
2. Check Phone Exists (API)
   ↓
3a. New User → Registration Form + OTP
3b. Existing User → Password or OTP
   ↓
4. Verify OTP / Password
   ↓
5. Login Success → Redirect to Dashboard
```

**Features**:
- Phone number validation
- OTP via WhatsApp
- Password login for existing users
- Multi-role registration (Customer, Technician, Tow Truck)
- Forgot password flow

#### **TechnicianRegistration.tsx**
**Purpose**: Technician onboarding.

**Fields**:
- Name, phone, password
- Specialty selection
- City and workshop address
- Location coordinates
- Profile photo
- Gallery (images/videos)
- Social media links
- Description

#### **TowTruckRegistration.tsx**
**Purpose**: Tow truck service registration.

**Fields**:
- Name, phone, password
- Vehicle type and details
- Service area and city
- Location coordinates
- Profile photo and gallery
- Social media links

---

### 5. Order Flow Components

#### **Step 1-7: Wizard Flow**

**Step1Category.tsx**: Select vehicle category
- Grid of categories with flags
- Visual selection UI

**Step2Brand.tsx**: Select or enter brand
- Category-specific brands
- Manual entry option
- Brand logos

**Step3Model.tsx**: Select vehicle model
- Brand-specific models
- Year selection
- VIN entry

**Step4PartType.tsx**: Select part types
- Multi-select checkboxes
- Part type icons
- Custom part entry

**Step5Details.tsx**: Enter detailed information
- Part description
- Part number
- Engine type & transmission
- Images (up to limit)
- Video upload
- Voice note recorder
- Contact method preference
- City selection

**Step6Review.tsx**: Review and confirm
- Summary of all entered data
- Edit capability (jump to any step)
- Terms acceptance
- Submit button

**Step7Success.tsx**: Order confirmation
- Order number display
- QR code generation
- Next actions
- Share options

---

### 6. Public Directory Components

#### **TechnicianDirectory.tsx**
**Purpose**: Browse verified technicians.

**Features**:
- Search and filter by specialty/city
- Grid/list view toggle
- Ratings and reviews display
- Call to action buttons
- Responsive cards

#### **TechnicianProfile.tsx**
**Purpose**: View technician details.

**Features**:
- Profile information
- Photo gallery (lightbox)
- Reviews and ratings
- Add review (authenticated customers)
- Social media links
- Location map
- Contact buttons (WhatsApp, Call)
- QR code for sharing
- Printable profile

#### **TowTruckDirectory.tsx** & **TowTruckProfile.tsx**
Similar to technician components but for tow truck services.

---

### 7. Content Components

#### **BlogScreen.tsx**
**Purpose**: Blog listing page.

**Features**:
- Fetches from `/api/blog`
- Card grid layout
- Pagination
- Featured images
- Read more links

#### **BlogPostScreen.tsx**
**Purpose**: Individual blog post view.

**Features**:
- Fetches by slug: `/api/blog/{slug}`
- Rich content display
- Author and date
- Share buttons
- Related posts

#### **FaqScreen.tsx**
**Purpose**: FAQ accordion.

**Features**:
- Fetches from `/api/faq`
- Expandable Q&A
- Category filtering
- Search functionality

#### **AnnouncementsScreen.tsx**
**Purpose**: System announcements.

**Features**:
- Admin can create/delete (with media)
- Targeted announcements (customers, providers, etc.)
- Image support
- Timestamp display

---

### 8. Store Components

#### **StoreView.tsx** (62,954 bytes - Largest component)
**Purpose**: E-commerce product browsing and purchasing.

**Features**:
- **Product Catalog**: Grid/list view
- **Categories**: Hierarchical navigation
- **Search & Filters**: By category, price, rating
- **Product Details**: Images, description, specs, reviews
- **Shopping Cart**: Add/remove items, quantity
- **Checkout**: Payment method selection, shipping
- **Order Tracking**: Store order history
- **Reviews**: Rate and review products
- **Flash Products**: Limited-time deals
- **Banners**: Promotional carousels

**Flow**:
```
Browse Products → Add to Cart → Checkout → Payment Proof Upload → 
Order Confirmation → Admin Approval → Shipping → Delivery
```

#### **FlashProductsView.tsx**
**Purpose**: Manage flash/limited-time products.

**Features**:
- Create flash products
- Set expiration dates
- Target specific audiences
- Stock management
- Purchase limits per buyer
- Request approval system

---

### 9. Shared UI Components

#### **Header.tsx**
**Purpose**: Top navigation bar.

**Features**:
- Logo and branding
- Dark mode toggle
- User menu (authenticated)
- Notification bell with badge
- Login button (guest)
- Mobile hamburger menu
- Responsive design

#### **Footer.tsx**
**Purpose**: Site footer with links and info.

**Features**:
- Fetches info from API `/api/settings`
- Company information
- CEO message
- Social media links
- Quick links (Blog, FAQ, Contact, etc.)
- Multi-column responsive layout

#### **Modal.tsx**
**Purpose**: Reusable modal component.

**Props**:
- `isOpen`, `onClose`
- `title`, `children`
- Dark mode support

#### **Toast.tsx** & **ToastContainer.tsx**
**Purpose**: Notification toasts.

**Types**:
- Success (green)
- Error (red)
- Info (blue)

**Features**:
- Auto-dismiss (3 seconds)
- Manual close
- Stacked display

#### **Pagination.tsx**
**Purpose**: Paginated data display.

**Features**:
- Previous/Next buttons
- Page numbers
- Current page highlight
- Responsive

#### **Rating.tsx**
**Purpose**: Star rating display/input.

**Modes**:
- Display only
- Interactive (for reviews)
- Half-star support

#### **ProgressBar.tsx**
**Purpose**: Order wizard progress indicator.

**Features**:
- Step names
- Current step highlight
- Clickable steps (backward navigation)
- Responsive layout

#### **NotificationDropdown.tsx**
**Purpose**: Header notification dropdown.

**Features**:
- Recent notifications (max 5)
- Unread badge
- Mark as read
- Clear all
- Navigate to notification center

#### **PublicMobileMenu.tsx**
**Purpose**: Mobile navigation menu.

**Features**:
- Slide-out menu
- All public links
- User-specific items
- Login/logout

---

## Services Layer

### 1. **api.ts** - HTTP Client Configuration

```typescript
export const API_URL = 'http://localhost:8000/api'
export const BASE_URL = 'http://localhost:8000'

// Axios instance with:
- baseURL: API_URL
- Content-Type: application/json
- withCredentials: true (for Sanctum)

// Request Interceptor:
- Adds Bearer token from localStorage

// Response Interceptor:
- Handles 401 → logout and redirect
- Global error handling
```

### 2. **auth.service.ts**

```typescript
AuthService.checkPhone(phone)
AuthService.login(phone, password)
AuthService.sendOtp(phone)
AuthService.verifyOtp(phone, otp, userData)
AuthService.registerCustomer(data)
AuthService.registerTechnician(data)
AuthService.registerTowTruck(data)
AuthService.resetPassword(phone, newPassword)
```

### 3. **admin.service.ts**

```typescript
AdminService.login(email, password)
AdminService.getStats()
AdminService.getSettings()
AdminService.updateSettings(settings)
AdminService.listUsers()
AdminService.updateUser(id, data)
AdminService.deleteUser(id)
AdminService.resetUserPassword(id)
AdminService.verifyTechnician(id)
AdminService.verifyTowTruck(id)
// ... more CRUD operations
```

### 4. **content.service.ts**

```typescript
ContentService.getBlogPosts()
ContentService.getBlogPost(slug)
ContentService.getFaqItems()
ContentService.getAnnouncements()
```

### 5. **directory.service.ts**

```typescript
DirectoryService.getTechnicians()
DirectoryService.getTechnician(id)
DirectoryService.getTowTrucks()
DirectoryService.getTowTruck(id)
```

### 6. **order.service.ts**

```typescript
OrderService.createOrder(formData)
OrderService.listOrders()
OrderService.getOrder(orderNumber)
OrderService.submitQuote(orderNumber, quoteData)
OrderService.acceptQuote(orderNumber)
OrderService.updateOrderStatus(orderNumber, status)
```

### 7. **store.service.ts**

```typescript
StoreService.getProducts(filters)
StoreService.getProduct(id)
StoreService.getCategories()
StoreService.purchase(orderData)
StoreService.getOrders()
StoreService.addReview(productId, review)
```

---

## Type System

### Core Types (from `types.ts`)

#### **User Types**
```typescript
interface Customer - Customer account
interface Provider - Service provider (parts)
interface Technician - Technician service
interface TowTruck - Tow truck service
interface AdminUser - Admin account
```

#### **Order Types**
```typescript
interface OrderFormData - Form state for new orders
interface StoredFormData - Persisted order data
interface Order - Complete order object
interface Quote - Provider quote
```

#### **Product Types**
```typescript
interface AdminFlashProduct - Store products
interface FlashProductPurchase - Purchase records
interface FlashProductBuyerRequest - Purchase requests
interface StoreProductReview - Product reviews
```

#### **Content Types**
```typescript
interface BlogPost
interface FaqItem
interface AnnouncementPost
```

#### **System Types**
```typescript
interface Settings - App configuration
interface LimitSettings - System limits
interface PaymentMethod
interface MessagingAPI - WhatsApp/Telegram config
interface Notification
interface NotificationSettings
```

#### **Misc Types**
```typescript
interface Category - Car categories
interface Brand - Car brands
interface PartType - Part types
interface TechnicianSpecialty
interface Transaction
interface WithdrawalRequest
```

---

## Routing System

### Navigation Pattern
The app uses a **virtual routing** system without React Router's `<Routes>`:

```typescript
// State-based routing
currentView: View
navigationParams: any

// Navigation function
handleNavigate(view: View, params?: any) {
  setCurrentView(view)
  setNavigationParams(params)
}

// View rendering
switch(currentView) {
  case 'welcome': return <WelcomeScreen />
  case 'blog': return <BlogScreen />
  case 'blogPost': return <BlogPostScreen slug={params.slug} />
  // ... 24 views total
}
```

### Why Virtual Routing?
- **Simplicity**: No URL management needed
- **State Preservation**: Easier to maintain app state
- **Deep Linking**: Can be added later with query params
- **Flexibility**: Easy to pass complex navigation params

### View Categories

**Public Views** (no auth required):
- welcome, store, technicianDirectory, technicianProfile, 
  towTruckDirectory, towTruckProfile, blog, blogPost, faq, 
  privacyPolicy, termsOfUse, contact

**Protected Views** (auth required):
- myOrders, customerDashboard, providerDashboard, 
  technicianDashboard, towTruckDashboard, notificationCenter

**Admin Only**:
- adminDashboard

**Registration**:
- technicianRegistration, towTruckRegistration

---

## State Persistence

### IndexedDB (`lib/db.ts`)

**Database**: `RamouseDB`
**Stores**:
- `settings`
- `carCategories`
- `allBrands`
- `brandModels`
- `partTypes`
- `technicianSpecialties`
- `storeCategories`
- `allCustomers`
- `allProviders`
- `allTechnicians`
- `allTowTrucks`
- `allOrders`
- `announcements`

**Functions**:
```typescript
initDB() // Initialize database
saveToIndexedDB(storeName, data)
getFromIndexedDB(storeName)
clearIndexedDB(storeName)
```

### LocalStorage
Used for:
- `authToken` - Sanctum token
- `isAuthenticated` - Auth state
- `userPhone` - Current user ID
- `userRole` - User role
- `isDarkMode` - Theme preference
- `notifications_{phone}` - User notifications
- `cacheVersion` - Cache versioning

### Cache Strategy
1. **On App Load**:
   - Check cache version
   - If outdated → fetch fresh data from API
   - If current → load from IndexedDB
2. **On Data Change**:
   - Update IndexedDB
   - Update React state
3. **On Logout**:
   - Clear IndexedDB
   - Clear localStorage (except theme)

---

## Styling System

### TailwindCSS Configuration

**Custom Colors**:
```javascript
colors: {
  primary: '#3b82f6',    // Blue
  secondary: '#10b981',  // Green
  darkbg: '#111827',     // Dark background
  darkcard: '#1f2937',   // Dark card
}
```

**RTL Support**:
- Direction: `rtl` in `index.html`
- Tailwind RTL plugin (if used)
- Flex/Grid adjustments

**Dark Mode**:
- Strategy: `class` (toggle via `.dark` class on `<html>`)
- Dark variants: `dark:bg-darkbg`, `dark:text-white`, etc.

**Responsive Breakpoints**:
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

**Custom Utilities**:
- Animations: `animate-spin`, `animate-pulse`
- Transitions: `transition-all`, `duration-300`
- Shadows: `shadow-lg`, `shadow-xl`

---

## Key Features Implementation

### 1. **Multi-Role Authentication**

**User Types**:
- **Admin**: Full system control
- **Customer**: Place orders, shop
- **Provider**: Quote on orders, manage earnings
- **Technician**: Service directory profile, shop
- **Tow Truck**: Service directory profile, shop

**Role Detection**:
```typescript
const isAdmin = userRole === 'admin'
const isProvider = userRole === 'provider'
const isTechnician = userRole === 'technician'
const isTowTruck = userRole === 'tow_truck'
const isCustomer = !isAdmin && !isProvider && !isTechnician && !isTowTruck
```

**Role-Based Views**:
- Each role has its own dashboard
- Different navigation menus
- Different permissions

### 2. **Order Management System**

**Customer Flow**:
1. Fill 7-step wizard (category → success)
2. Wait for provider quotes
3. Compare quotes
4. Accept quote
5. Upload payment proof
6. Track order status
7. Receive and review

**Provider Flow**:
1. Browse available orders
2. Submit quote (price, images, notes)
3. Wait for customer acceptance
4. Update order status as it progresses
5. Request withdrawal of earnings

**Status Lifecycle**:
```
قيد المراجعة → بانتظار تأكيد الدفع → جاري التجهيز → 
تم الاستلام من المزود → قيد التوصيل → تم الشحن للعميل → 
تم التوصيل
```

### 3. **Real-Time Notifications**

**Types**:
- Order updates (status changes)
- New quotes received
- Quote accepted/rejected
- Payment notifications
- System announcements
- Withdrawal updates
- Verification status

**Display**:
- Header bell icon with badge
- Dropdown preview (5 recent)
- Full notification center
- Toast notifications for immediate feedback

**Persistence**:
- Stored per user in localStorage
- Unread count tracking
- Mark as read functionality

### 4. **E-Commerce Store**

**Features**:
- Product catalog with categories
- Search and advanced filters
- Product details with image gallery
- Add to cart
- Checkout with payment method selection
- Upload payment receipt
- Order tracking
- Product reviews and ratings

**Flash Products**:
- Limited-time offers
- Target specific user types
- Stock and per-buyer limits
- Admin approval required for purchases

### 5. **Technician & Tow Truck Directories**

**Public Listings**:
- Only verified providers shown
- Search by specialty/city
- Grid view with cards
- Ratings and reviews visible

**Profile Pages**:
- Detailed information
- Photo/video gallery
- Customer reviews
- Social media links
- Contact buttons (WhatsApp, Call)
- QR code for sharing
- Printable profile option

**Review System**:
- Authenticated customers can review
- 5-star rating
- Text comment
- Admin approval (optional)
- Provider can respond

### 6. **Media Upload System**

**Component**: `ImageUpload.tsx`, `MediaUpload.tsx`

**Supported Types**:
- Images: JPG, PNG, WebP
- Videos: MP4, WebM
- Voice Notes: WebM audio

**Features**:
- Drag & drop
- Multiple file selection
- Preview before upload
- Progress indicator
- Size validation (from settings)
- Compression (client-side)

**Storage**:
- Uploads to `/api/upload`
- Backend stores in `storage/app/public/uploads/`
- Returns public URL

### 7. **Voice & Video Support**

**Voice Recorder** (`VoiceRecorder.tsx`):
- Browser MediaRecorder API
- Record/pause/stop
- Waveform visualization
- Playback preview
- Upload to order or quote

**Video Upload**:
- Direct file upload
- Preview player
- Size limit enforcement

### 8. **QR Code Generation**

**Library**: `qrcode`

**Use Cases**:
- Order confirmation (QR contains order number)
- Technician/Tow Truck profile sharing
- Payment information

**Implementation**:
```typescript
import QRCode from 'qrcode'
QRCode.toDataURL(data).then(url => setQrCodeUrl(url))
```

### 9. **AI Integration (Gemini)**

**Component**: `AISuggestions.tsx`

**Library**: `@google/generative-ai`

**Features**:
- Part description suggestions
- Auto-fill from VIN
- Smart categorization
- Natural language part search

**API**: Google Generative AI (Gemini)

### 10. **Dark Mode**

**Implementation**:
```typescript
const [isDarkMode, setIsDarkMode] = useState(() => 
  localStorage.getItem('isDarkMode') === 'true'
)

useEffect(() => {
  if (isDarkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('isDarkMode', String(isDarkMode))
}, [isDarkMode])
```

**Styling**:
- Tailwind dark: prefix
- Custom dark colors in config
- Persistent across sessions

---

## Performance Optimizations

### 1. **Code Splitting (Lazy Loading)**
```typescript
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const MyOrders = lazy(() => import('./components/MyOrders'))
// ... 15+ lazy-loaded components
```

**Benefits**:
- Smaller initial bundle
- Faster first paint
- Load components on demand

### 2. **Suspense Boundaries**
```tsx
<Suspense fallback={<PageLoader />}>
  {renderCurrentView()}
</Suspense>
```

### 3. **IndexedDB Caching**
- Reduces API calls
- Offline capability
- Version-based cache invalidation

### 4. **Image Optimization**
- WebP format preferred
- Lazy loading for images
- Thumbnail previews
- Compression before upload

### 5. **Memoization**
- `useCallback` for event handlers
- `useMemo` for expensive computations
- Prevents unnecessary re-renders

---

## Mobile Responsiveness

### Design Approach
- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: Full responsive grid system
- **Touch Targets**: Large buttons (min 44x44px)
- **Navigation**: Bottom nav on mobile, sidebar on desktop

### Mobile-Specific Components
- `BottomNavBar.tsx`: Sticky bottom navigation
- `PublicMobileMenu.tsx`: Slide-out menu
- Mobile-optimized header with hamburger

### Responsive Patterns
```tsx
// Hidden on mobile, visible on desktop
className="hidden md:block"

// Grid: 1 col mobile, 2 col tablet, 3 col desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Sidebar: Hidden mobile (toggle), Auto desktop
className="fixed md:relative"
```

---

## Accessibility Features

### Semantic HTML
- Proper heading hierarchy (h1 → h6)
- `<nav>`, `<main>`, `<footer>`, `<article>`
- `<button>` vs `<div>` for clickable elements

### ARIA Labels
```tsx
<button aria-label="إغلاق">
  <Icon name="X" />
</button>
```

### Keyboard Navigation
- Tab order preserved
- Enter/Space for actions
- Escape to close modals

### Screen Reader Support
- Alt text for images
- Descriptive link text
- Form labels

---

## Internationalization (i18n)

### Current State
- **Language**: Arabic (RTL)
- **Direction**: Right-to-Left
- **Text**: Hardcoded Arabic strings

### Future Extension
```typescript
// Potential structure
const translations = {
  ar: { welcome: "مرحبا", ... },
  en: { welcome: "Welcome", ... },
}

const t = (key) => translations[currentLang][key]
```

---

## Error Handling

### API Error Handling
```typescript
try {
  const response = await api.get('/endpoint')
  // Success
} catch (error) {
  if (error.response?.status === 401) {
    // Handled globally by interceptor
  } else if (error.response?.status === 422) {
    // Validation errors
    showToast(error.response.data.message, 'error')
  } else {
    // Generic error
    showToast('حدث خطأ غير متوقع', 'error')
  }
}
```

### Form Validation
- Client-side validation before submit
- Required field checks
- Format validation (phone, email)
- File size/type validation

### User Feedback
- Toast notifications for all actions
- Loading states during API calls
- Error messages in forms
- Empty states when no data

---

## Security Considerations

### 1. **Authentication**
- Sanctum token stored in localStorage
- Token sent with every protected request
- Auto-logout on 401 response

### 2. **Input Sanitization**
- React auto-escapes JSX
- No `dangerouslySetInnerHTML` (except trusted content)
- File type validation

### 3. **HTTPS (Production)**
- API calls should use HTTPS
- Secure cookie for Sanctum

### 4. **XSS Prevention**
- React's built-in protection
- Validation on user input

### 5. **Sensitive Data**
- Passwords never displayed
- Phone numbers partially masked in some views
- Admin credentials secured

---

## Environment Variables

**File**: `.env`

```bash
VITE_API_URL=http://localhost:8000/api
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_token
```

**Usage**:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Build & Deployment

### Development
```bash
npm install
npm run dev
# Runs on http://localhost:5173
```

### Production Build
```bash
npm run build
# Outputs to /dist
```

### Preview Production Build
```bash
npm run preview
```

### Deployment
- Build produces static files in `/dist`
- Can be deployed to any static host (Nginx, Apache, Vercel, Netlify)
- Ensure backend API URL is configured correctly

---

## Testing Strategy (Future)

### Unit Tests
- Component rendering
- Utility functions
- State management logic

### Integration Tests
- User flows (login, order creation)
- API integration
- Form submissions

### E2E Tests
- Critical user journeys
- Multi-role scenarios
- Payment flows

**Recommended Tools**:
- Jest for unit tests
- React Testing Library
- Cypress/Playwright for E2E

---

## Known Limitations

1. **No Real Routing**: Virtual routing limits bookmarking/sharing specific views
2. **No SSR**: Client-side only (SEO impact)
3. **No i18n**: Arabic only (hardcoded)
4. **IndexedDB Only**: No server-side session management
5. **Large Bundle**: Even with lazy loading, store components are large

---

## Future Enhancements

1. **React Router**: Implement proper URL-based routing
2. **i18n**: Multi-language support (Arabic, English)
3. **PWA**: Progressive Web App with offline mode
4. **Push Notifications**: Browser push notifications
5. **Real-Time**: WebSocket for live order updates
6. **SSR/SSG**: Next.js migration for SEO
7. **Mobile Apps**: React Native version
8. **Advanced Search**: Elasticsearch integration
9. **Analytics**: Google Analytics, Mixpanel
10. **Testing**: Comprehensive test coverage

---

## Component Breakdown by Category

### Layout Components
- Header, Footer, BottomNavBar, PublicMobileMenu

### Dashboard Components
- AdminDashboard (+ 31 DashboardParts)
- CustomerDashboard (+ 10 parts)
- ProviderDashboard (+ 11 parts)
- TechnicianDashboard (+ 6 parts)
- TowTruckDashboard (+ 6 parts)

### Authentication
- LoginScreen
- TechnicianRegistration
- TowTruckRegistration

### Order Management
- Step1Category → Step7Success (7 components)
- MyOrders
- VisualOrderTimeline

### Directory
- TechnicianDirectory, TechnicianProfile
- TowTruckDirectory, TowTruckProfile

### Content
- WelcomeScreen
- BlogScreen, BlogPostScreen
- FaqScreen
- AnnouncementsScreen
- PrivacyPolicyScreen
- TermsOfUseScreen
- ContactScreen

### Store
- StoreView (main)
- FlashProductsView

### UI/Utility
- Modal, Toast, Rating, Pagination
- Icon, IconSearch
- ImageUpload, MediaUpload, VoiceRecorder
- ProgressBar, SkeletonLoader, EmptyState
- CountdownTimer, DataCharts
- NotificationCenter, NotificationDropdown
- CustomerSettings, CustomerGarage
- VehicleInfoModal
- ShippingReceipt
- PrintableTechnicianProfile, PrintableTowTruckProfile
- ProvidersView, PaymentMethodsView

---

## Dependencies Explained

### Production
- **react** & **react-dom**: Core framework
- **react-router-dom**: Currently unused (future routing)
- **axios**: HTTP client for API calls
- **lucide-react**: Icon library (1000+ icons)
- **@google/generative-ai**: Gemini AI integration
- **qrcode**: QR code generation
- **clsx** & **tailwind-merge**: Utility for conditional classes

### Development
- **vite**: Build tool & dev server
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS
- **autoprefixer** & **postcss**: CSS processing
- **@vitejs/plugin-react**: React support for Vite
- **vite-plugin-pwa**: PWA capabilities (future)
- **@types/\***: TypeScript type definitions

---

## Configuration Files

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react(), VitePWA(...)],
  server: {
    port: 5173,
    proxy: { /* if needed */ }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### tailwind.config.js
```javascript
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { /* custom colors */ },
      fontFamily: { /* Arabic fonts */ }
    }
  }
}
```

---

## Best Practices Followed

1. **Component Organization**: Logical folder structure
2. **Code Splitting**: Lazy loading for performance
3. **Type Safety**: Comprehensive TypeScript usage
4. **State Management**: Centralized via custom hook
5. **Reusability**: Shared components for common UI
6. **Responsive Design**: Mobile-first approach
7. **Accessibility**: Semantic HTML and ARIA labels
8. **Error Handling**: Consistent error feedback
9. **Loading States**: User feedback during async operations
10. **Dark Mode**: User preference respected

---

## Quick Reference: File Sizes

**Largest Components**:
- `StoreView.tsx` - 62,954 bytes
- `MyOrders.tsx` - 48,911 bytes
- `TechnicianDirectory.tsx` - 27,072 bytes
- `TechnicianProfile.tsx` - 29,153 bytes
- `AdminDashboard.tsx` - 22,668 bytes

**Core Files**:
- `useAppState.ts` - 21,733 bytes (state management)
- `App.tsx` - 21,459 bytes (main app)
- `types.ts` - 14,560 bytes (type definitions)
- `constants.tsx` - 13,481 bytes (seed data)

---

## Documentation References

- [Backend Structure](./backendstructure.md)
- [API Documentation](./api_documentation.md)
- React Documentation: https://react.dev
- Vite Documentation: https://vitejs.dev
- TailwindCSS: https://tailwindcss.com
- TypeScript: https://www.typescriptlang.org

---

**Last Updated**: November 25, 2025  
**Frontend Version**: 1.0.0  
**React Version**: 18.2.0  
**Node Version**: 20+
