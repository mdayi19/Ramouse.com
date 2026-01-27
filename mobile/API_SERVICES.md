# API Services - Quick Reference

## Overview
Created three API service modules to handle all backend communication:

---

## 1. Authentication Service
**File:** `src/services/auth.service.ts`

### Methods

#### `login(phone, password)`
Authenticate user with phone and password.
```typescript
const response = await AuthService.login('+963XXXXXXXXX', 'password');
// Returns: { token, user, role }
```

#### `logout()`
Logout current user and clear tokens.
```typescript
await AuthService.logout();
```

#### `checkPhone(phone)`
Check if phone number is registered.
```typescript
const { exists, role } = await AuthService.checkPhone('+963XXXXXXXXX');
```

#### `sendOtp(phone)`
Send OTP verification code to phone.
```typescript
await AuthService.sendOtp('+963XXXXXXXXX');
```

#### `verifyOtp(phone, otp)`
Verify OTP code.
```typescript
await AuthService.verifyOtp('+963XXXXXXXXX', '123456');
```

#### `resetPassword(phone, password)`
Reset user password after OTP verification.
```typescript
await AuthService.resetPassword('+963XXXXXXXXX', 'newPassword');
```

#### Registration Methods
- `registerCustomer(data)` - Register new customer
- `registerTechnician(data)` - Register new technician
- `registerTowTruck(data)` - Register new tow truck
- `registerCarProvider(data)` - Register new car provider

#### Profile Methods
- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update user profile

---

## 2. Customer Service
**File:** `src/services/customer.service.ts`

### Favorites
```typescript
// Get favorites
const favorites = await CustomerService.getFavorites();

// Add to favorites
await CustomerService.addFavorite(carId);

// Remove from favorites
await CustomerService.removeFavorite(carId);

// Toggle favorite
await CustomerService.toggleFavorite(carId);
```

### Garage (Saved Vehicles)
```typescript
// Get garage
const vehicles = await CustomerService.getGarage();

// Add vehicle
await CustomerService.addToGarage(vehicleData);

// Remove vehicle
await CustomerService.removeFromGarage(vehicleId);
```

### Wallet & Transactions
```typescript
// Get wallet balance
const { balance } = await CustomerService.getWalletBalance();

// Get transactions
const transactions = await CustomerService.getTransactions();
```

### Orders
```typescript
// Get customer orders
const orders = await CustomerService.getOrders();
```

### Profile
```typescript
// Get profile
const profile = await CustomerService.getProfile();

// Update profile
await CustomerService.updateProfile(data);
```

---

## 3. Marketplace Service
**File:** `src/services/marketplace.service.ts`

### Get Listings
```typescript
// Get all listings with filters
const response = await MarketplaceService.getListings({
  listing_type: 'sale',
  category: 'sedan',
  brand: 'Toyota',
  price_from: 10000,
  price_to: 50000,
  city: 'Damascus',
  page: 1,
  per_page: 20,
});

// Get sale listings only
const saleListings = await MarketplaceService.getSaleListings();

// Get rent listings only
const rentListings = await MarketplaceService.getRentListings();
```

### Search
```typescript
// Search listings
const results = await MarketplaceService.searchListings('Toyota Camry', {
  year_from: 2020,
  city: 'Damascus',
});
```

### Featured & Latest
```typescript
// Get featured listings
const featured = await MarketplaceService.getFeaturedListings();

// Get latest listings
const latest = await MarketplaceService.getLatestListings(10);
```

### Car Details
```typescript
// Get car by ID
const { car, provider, similar_cars } = await MarketplaceService.getListingById(123);
```

### Metadata
```typescript
// Get categories
const categories = await MarketplaceService.getCategories();

// Get brands
const brands = await MarketplaceService.getBrands('sedan');

// Get models
const models = await MarketplaceService.getModels('Toyota');

// Get cities
const cities = await MarketplaceService.getCities();
```

### Provider
```typescript
// Get provider listings
const listings = await MarketplaceService.getProviderListings('provider-id');

// Get provider profile
const provider = await MarketplaceService.getProviderProfile('provider-id');
```

---

## Filter Options

### MarketplaceFilters Interface
```typescript
{
  listing_type?: 'sale' | 'rent';
  category?: string;
  brand?: string;
  model?: string;
  year_from?: number;
  year_to?: number;
  price_from?: number;
  price_to?: number;
  city?: string;
  engine_type?: string;
  transmission?: string;
  search?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'created_desc';
  page?: number;
  per_page?: number;
}
```

---

## Usage with React Query

### Example: Fetch Listings
```typescript
import { useQuery } from '@tanstack/react-query';
import { MarketplaceService } from '@/services/marketplace.service';

function useCarListings(filters) {
  return useQuery({
    queryKey: ['car-listings', filters],
    queryFn: () => MarketplaceService.getListings(filters),
  });
}

// In component
const { data, isLoading, error } = useCarListings({ listing_type: 'sale' });
```

### Example: Add to Favorites
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService } from '@/services/customer.service';

function useAddFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (carId: number) => CustomerService.addFavorite(carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// In component
const addFavorite = useAddFavorite();
addFavorite.mutate(carId);
```

---

## Next Steps

1. **Create React Query Hooks** (`src/hooks/`)
   - `useCarListings.ts`
   - `useFavorites.ts`
   - `useAuth.ts`

2. **Build UI Components** (`src/components/`)
   - `CarCard.tsx`
   - `FilterBar.tsx`
   - `SearchInput.tsx`

3. **Create Screens** (`app/`)
   - Marketplace listing
   - Car detail view
   - Favorites screen
   - Profile screen

---

**All services are fully typed and ready to use!** 🚀
