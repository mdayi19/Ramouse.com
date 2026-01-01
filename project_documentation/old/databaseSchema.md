
# Ramouse Auto Parts - Database Schema

This document outlines the database schema for the Ramouse Auto Parts application. The schema is designed to support the relational data models used in the frontend `types.ts` definitions and the backend guide.

## 1. Users & Authentication

### 1.1. Customers
Stores information about end-users requesting parts.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(20) | Primary Key. Phone number is used as ID. |
| `uniqueId` | VARCHAR(10) | 6-digit unique display ID. |
| `name` | VARCHAR(255) | Full name of the customer. |
| `password` | VARCHAR(255) | Hashed password (SHA-256). |
| `address` | TEXT | Default delivery address. |
| `isActive` | BOOLEAN | Account status. |
| `garage` | JSONB | Array of `Vehicle` objects owned by the customer. |
| `notificationSettings` | JSONB | User preferences for notifications. |
| `flashPurchases` | JSONB | History of flash sale purchases (snapshot). |
| `createdAt` | TIMESTAMP | Record creation time. |

### 1.2. Providers
Stores information about parts suppliers.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(20) | Primary Key. Phone number. |
| `uniqueId` | VARCHAR(10) | 6-digit unique display ID. |
| `name` | VARCHAR(255) | Business or Shop name. |
| `password` | VARCHAR(255) | Hashed password. |
| `isActive` | BOOLEAN | Account activation status. |
| `walletBalance` | DECIMAL(10, 2) | Current funds available for withdrawal. |
| `assignedCategories` | TEXT[] | Array of car categories the provider services (e.g., ['German', 'Korean']). |
| `paymentInfo` | JSONB | Array of payout methods configured by the provider. |
| `notificationSettings` | JSONB | User preferences. |
| `lastLoginTimestamp` | TIMESTAMP | Last active time. |
| `inactivityWarningSent` | BOOLEAN | Flag to track if inactivity warning has been sent. |
| `averageRating` | DECIMAL(3, 2) | Calculated average from fulfilled orders. |
| `flashPurchases` | JSONB | History of B2B purchases. |

### 1.3. Technicians
Stores information about verified mechanics/technicians.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(20) | Primary Key. Phone number. |
| `uniqueId` | VARCHAR(10) | 6-digit unique display ID. |
| `name` | VARCHAR(255) | Name of the technician or workshop. |
| `password` | VARCHAR(255) | Hashed password. |
| `specialty` | VARCHAR(100) | e.g., 'Mechanic', 'Electrician'. |
| `city` | VARCHAR(100) | City of operation. |
| `workshopAddress` | TEXT | Physical address. |
| `location` | GEOGRAPHY(POINT) | GPS coordinates (Lat, Lng). |
| `description` | TEXT | Bio or service description. |
| `isVerified` | BOOLEAN | Admin approval status. |
| `isActive` | BOOLEAN | Account status. |
| `profilePhoto` | VARCHAR(255) | URL/Path to profile image. |
| `gallery` | JSONB | Array of media objects (work samples). |
| `socials` | JSONB | Social media links (Facebook, Instagram, WhatsApp). |
| `qrCodeUrl` | VARCHAR(255) | URL to generated QR code. |
| `averageRating` | DECIMAL(3, 2) | Calculated from `Reviews`. |
| `registrationDate` | TIMESTAMP | Date joined. |

### 1.4. Tow Trucks
Stores information about tow truck operators.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(20) | Primary Key. Phone number. |
| `uniqueId` | VARCHAR(10) | 6-digit unique display ID. |
| `name` | VARCHAR(255) | Operator name. |
| `password` | VARCHAR(255) | Hashed password. |
| `vehicleType` | VARCHAR(100) | e.g., 'Flatbed', 'Winch'. |
| `city` | VARCHAR(100) | Base city. |
| `serviceArea` | TEXT | Description of coverage area. |
| `location` | GEOGRAPHY(POINT) | GPS coordinates. |
| `description` | TEXT | Bio. |
| `isVerified` | BOOLEAN | Admin approval status. |
| `isActive` | BOOLEAN | Account status. |
| `profilePhoto` | VARCHAR(255) | URL/Path. |
| `gallery` | JSONB | Vehicle images. |
| `socials` | JSONB | Social links. |
| `averageRating` | DECIMAL(3, 2) | Calculated from `Reviews`. |
| `registrationDate` | TIMESTAMP | Date joined. |

---

## 2. Orders & Transactions

### 2.1. Orders
The core entity linking Customers to Providers.

| Column | Type | Description |
| :--- | :--- | :--- |
| `orderNumber` | VARCHAR(50) | Primary Key. |
| `date` | TIMESTAMP | Creation date. |
| `status` | VARCHAR(50) | Enum: 'Pending Review', 'Awaiting Payment', 'Processing', 'Received', 'Shipped', 'Delivered', 'Cancelled', etc. |
| `userPhone` | VARCHAR(20) | FK to Customer/Technician/TowTruck ID. |
| `userType` | VARCHAR(20) | Enum: 'customer', 'technician', 'tow_truck'. |
| `formData` | JSONB | Stores vehicle details, part description, and media references. |
| `customerName` | VARCHAR(255) | Name for shipping. |
| `customerAddress` | TEXT | Shipping address. |
| `customerPhone` | VARCHAR(20) | Contact for shipping. |
| `paymentMethodId` | VARCHAR(50) | Selected payment method ID. |
| `paymentMethodName` | VARCHAR(100) | Snapshot of payment method name. |
| `paymentReceiptUrl` | VARCHAR(255) | URL to uploaded payment receipt. |
| `shippingPrice` | DECIMAL(10, 2) | Calculated shipping cost based on city/size. |
| `deliveryMethod` | VARCHAR(20) | 'shipping' or 'pickup'. |
| `shippingNotes` | TEXT | Admin/Provider notes for shipping. |
| `rejectionReason` | TEXT | Reason if order/payment is rejected. |
| `acceptedQuoteId` | VARCHAR(50) | FK to `Quotes`. Null if no quote accepted yet. |
| `review` | JSONB | Customer review snapshot for this order. |
| `staleNotified` | BOOLEAN | Flag indicating if a stale order notification has been sent. |

### 2.2. Quotes
Offers submitted by Providers for specific Orders.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key. |
| `orderNumber` | VARCHAR(50) | FK to `Orders`. |
| `providerId` | VARCHAR(20) | FK to `Providers`. |
| `price` | DECIMAL(10, 2) | Part price (excluding shipping). |
| `partStatus` | VARCHAR(20) | 'new' or 'used'. |
| `partSizeCategory` | VARCHAR(10) | 'xs', 's', 'm', 'l', 'vl'. Used for shipping calc. |
| `notes` | TEXT | Provider comments. |
| `images` | TEXT[] | Array of image filenames/URLs. |
| `video` | VARCHAR(255) | Video filename/URL. |
| `voiceNote` | VARCHAR(255) | Voice note filename/URL. |
| `timestamp` | TIMESTAMP | Submission time. |
| `viewedByCustomer` | BOOLEAN | Track if customer has seen the quote. |

---

## 3. Store & E-Commerce

### 3.1. Store Categories
Hierarchy for organizing products.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `name` | VARCHAR(100) | Category name (e.g., Oils). |
| `icon` | VARCHAR(50) | Icon identifier. |
| `subcategories` | JSONB | Array of sub-objects `{id, name}`. |
| `isFeatured` | BOOLEAN | Determines if category is highlighted on homepage. |

### 3.2. Products (AdminFlashProduct)
Inventory items for the store and flash sales.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `name` | VARCHAR(255) | Product name. |
| `description` | TEXT | Detailed description. |
| `price` | DECIMAL(10, 2) | Unit price. |
| `media` | JSONB | Array of `{type, data/url}`. |
| `targetAudience` | VARCHAR(20) | 'all', 'technicians', 'providers', etc. |
| `specialty` | VARCHAR(100) | Filter for technicians (optional). |
| `totalStock` | INTEGER | Available quantity. |
| `purchaseLimitPerBuyer` | INTEGER | Max qty per user. |
| `isFlash` | BOOLEAN | True if flash sale, False if regular store item. |
| `createdAt` | TIMESTAMP | |
| `expiresAt` | TIMESTAMP | For flash sales. |
| `storeCategoryId` | VARCHAR(50) | FK to `StoreCategories`. |
| `storeSubcategoryId` | VARCHAR(50) | |
| `shippingSize` | VARCHAR(10) | For shipping cost calc. |
| `staticShippingCost` | DECIMAL(10, 2) | Fixed shipping cost overriding size calculation. |
| `allowedPaymentMethods`| TEXT[] | Specific payment methods IDs. |
| `averageRating` | DECIMAL(3, 2) | |

### 3.3. Product Reviews
Reviews for specific store products.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `productId` | VARCHAR(50) | FK to `Products`. |
| `userId` | VARCHAR(20) | FK to User. |
| `rating` | INTEGER | 1-5 stars. |
| `comment` | TEXT | |
| `date` | TIMESTAMP | |

### 3.4. Store Orders (FlashProductBuyerRequest)
Purchase requests for store items.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `productId` | VARCHAR(50) | FK to `Products`. |
| `buyerId` | VARCHAR(20) | FK to User. |
| `buyerType` | VARCHAR(20) | User role. |
| `buyerName` | VARCHAR(255) | Snapshot of buyer name for admin display. |
| `buyerUniqueId` | VARCHAR(20) | Snapshot of buyer display ID. |
| `quantity` | INTEGER | |
| `totalPrice` | DECIMAL(10, 2) | Product price * qty + shipping. |
| `shippingCost` | DECIMAL(10, 2) | |
| `status` | VARCHAR(50) | 'pending', 'payment_verification', 'shipped', etc. |
| `requestDate` | TIMESTAMP | |
| `deliveryMethod` | VARCHAR(20) | |
| `shippingAddress` | TEXT | |
| `contactPhone` | VARCHAR(20) | |
| `paymentMethodId` | VARCHAR(50) | |
| `paymentMethodName` | VARCHAR(100) | Snapshot of payment method name. |
| `paymentReceiptUrl` | VARCHAR(255) | |
| `adminNotes` | TEXT | |

---

## 4. Content & System

### 4.1. Blog Posts
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | PK. |
| `slug` | VARCHAR(100) | Unique URL slug. |
| `title` | VARCHAR(255) | |
| `summary` | TEXT | Short description. |
| `content` | TEXT | Markdown body. |
| `imageUrl` | VARCHAR(255) | Cover image. |
| `author` | VARCHAR(100) | |
| `publishedAt` | TIMESTAMP | |

### 4.2. FAQ
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | PK. |
| `question` | TEXT | |
| `answer` | TEXT | |

### 4.3. Announcements
System-wide broadcasts.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | PK. |
| `title` | VARCHAR(255) | |
| `message` | TEXT | |
| `target` | VARCHAR(20) | 'all', 'customers', 'providers', etc. |
| `imageUrl` | VARCHAR(255) | |
| `timestamp` | TIMESTAMP | |

### 4.4. Reviews (Service)
Reviews for Technicians and Tow Trucks.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | PK. |
| `targetId` | VARCHAR(20) | FK to Technician/TowTruck. |
| `customerId` | VARCHAR(20) | FK to Customer. |
| `rating` | INTEGER | |
| `comment` | TEXT | |
| `status` | VARCHAR(20) | 'pending', 'approved', 'rejected'. |
| `response` | TEXT | Provider's reply. |
| `timestamp` | TIMESTAMP | |

---

## 5. Financials

### 5.1. Transactions
Ledger for provider wallet history.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | PK. |
| `providerId` | VARCHAR(20) | FK to Provider. |
| `type` | VARCHAR(20) | 'deposit', 'withdrawal', 'manual_deposit'. |
| `amount` | DECIMAL(10, 2) | Positive or negative value. |
| `timestamp` | TIMESTAMP | |
| `description` | TEXT | |
| `relatedOrderId` | VARCHAR(50) | Optional FK to Order. |
| `relatedWithdrawalId`| VARCHAR(50) | Optional FK to WithdrawalRequest. |
| `balanceAfter` | DECIMAL(10, 2) | Snapshot of balance. |

### 5.2. Withdrawal Requests
Requests from providers to cash out.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | PK. |
| `providerId` | VARCHAR(20) | FK to Provider. |
| `amount` | DECIMAL(10, 2) | |
| `status` | VARCHAR(20) | 'Pending', 'Approved', 'Rejected'. |
| `requestTimestamp` | TIMESTAMP | |
| `decisionTimestamp` | TIMESTAMP | |
| `paymentMethodId` | VARCHAR(50) | Provider's selected payout method. |
| `receiptUrl` | VARCHAR(255) | Admin upload of transfer proof. |
| `adminNotes` | TEXT | |

---

## 6. System Settings (Singleton)
Stored as a single configuration object.

| Field | Type | Description |
| :--- | :--- | :--- |
| `appName` | String | |
| `adminPhone` | String | Root admin login. |
| `paymentMethods` | Array | System-defined payment options for orders. |
| `storePaymentMethods`| Array | Payment options for store purchases. |
| `storeBanners` | Array | Array of banner objects `{id, title, imageUrl, isActive}`. |
| `limitSettings` | Object | Config for max uploads, timeouts, fees, shipping prices. |
| `notificationSettings`| Object | Toggle switches for system events. |
| `messageTemplates` | Object | WhatsApp message templates. |
| `seoSettings` | Object | Meta tags and OG data. |
| `companyDetails` | Object | Address, Phone, Email, CEO Message. |

---

## 7. Dynamic System Data
Entities managed via the Admin Dashboard (Model Management). These models drive the dropdowns and filters throughout the application.

### 7.1. Car Categories
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `name` | VARCHAR(100) | Category name (e.g., German, Korean). |
| `flag` | VARCHAR(10) | Emoji flag representation. |
| `brands` | TEXT[] | Array of brand names associated with this category. |
| `telegramBotToken` | VARCHAR(255) | Bot token for automated notifications. |
| `telegramChannelId` | VARCHAR(100) | Channel ID for automated notifications. |
| `telegramNotificationsEnabled` | BOOLEAN | Toggle for Telegram integration. |

### 7.2. Brands
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `name` | VARCHAR(100) | Brand name (e.g., BMW, Toyota). |
| `logo` | VARCHAR(255) | Base64 string or URL to logo image. |

### 7.3. Part Types
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `name` | VARCHAR(100) | Type name (e.g., Engine, Body). |
| `icon` | VARCHAR(50) | Lucide icon name. |

### 7.4. Technician Specialties
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key. |
| `name` | VARCHAR(100) | Specialty name (e.g., Mechanic, Electrician). |
| `icon` | VARCHAR(50) | Lucide icon name. |
