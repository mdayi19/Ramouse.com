# TowTruckDirectory.tsx API Integration

## ✅ Integration Status: API READY - Component Uses Prop Data

The TowTruckDirectory component has **API endpoints ready** but currently receives data via props from localStorage. Here's the complete integration status and upgrade path.

### Current Implementation

#### Data Flow (Current)
```
localStorage → useAppState → allTowTrucks state → 
App.tsx → TowTruckDirectory (as prop) → Display
```

#### Backend (Already Complete) ✅
1. ✅ **Model**: `TowTruck` model exists
2. ✅ **Controller**: `DirectoryController@listTowTrucks` & `getTowTruck` methods
3. ✅ **Routes**: Public API endpoints (no auth required)
   - `GET /api/tow-trucks` - List all active & verified tow trucks
   - `GET /api/tow-trucks/{id}` - Get specific tow truck
4. ✅ **Filtering**: Supports `city` and `vehicle_type` query parameters
5. ✅ **Database**: Tow trucks can be managed via admin panel

#### Frontend Service (Already Complete) ✅
File: `Frontend/src/services/directory.service.ts`

```typescript
getTowTrucks: async (params?: { 
  city?: string; 
  vehicle_type?: string; 
  lat?: number; 
  lng?: number 
}) => {
  const response = await api.get('/tow-trucks', { params });
  return response.data;
}

getTowTruck: async (id: string) => {
  const response = await api.get(`/tow-trucks/${id}`);
  return response.data;
}
```

### API Integration Options

#### Option 1: Fetch on Component Mount (Recommended)
Update TowTruckDirectory to fetch data directly from API.

**Advantages:**
- Always shows latest data from database
- No need to pre-load in App.tsx
- Supports API filtering (city, vehicle_type)

**Implementation:**
```tsx
// In TowTruckDirectory.tsx
import { DirectoryService } from '../services/directory.service';

export const TowTruckDirectory: React.FC<TowTruckDirectoryProps> = ({ 
  onBack, 
  onViewProfile, 
  showToast 
}) => {
  const [allTowTrucks, setAllTowTrucks] = useState<TowTruck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTowTrucks = async () => {
      try {
        setIsLoading(true);
        const response = await DirectoryService.getTowTrucks();
        setAllTowTrucks(response.data || []);
      } catch (error) {
        console.error('Failed to fetch tow trucks:', error);
        showToast('فشل تحميل السطحات', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTowTrucks();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  // Rest of component...
};
```

#### Option 2: Keep Prop-Based (Current)
Continue using props but load from API in useAppState.

**Advantages:**
- Central data management
- Data shared across app
- Cached in state

**Implementation:**
```tsx
// In useAppState.ts
useEffect(() => {
  const loadDirectories = async () => {
    try {
      const towTrucksData = await DirectoryService.getTowTrucks();
      setAllTowTrucks(towTrucksData.data || []);
      localStorage.setItem('all_tow_trucks', JSON.stringify(towTrucksData.data));
    } catch (error) {
      console.error('Failed to load tow trucks:', error);
      // Fallback to localStorage
      setAllTowTrucks(loadData('all_tow_trucks', []));
    }
  };

  loadDirectories();
}, []);
```

### Backend Endpoints

#### List Tow Trucks
```
GET /api/tow-trucks
```

**Query Parameters:**
- `city` (optional) - Filter by city
- `vehicle_type` (optional) - Filter by vehicle type
- `lat` & `lng` (optional) - For geolocation sorting (future)

**Response:**
```json
{
  "data": [
    {
      "id": "966123456789",
      "unique_id": "123456",
      "name": "سطحة النجم",
      "vehicle_type": "سطحة كبيرة",
      "city": "دمشق",
      "service_area": "دمشق وريفها",
      "description": "خدمة سطحة على مدار 24 ساعة",
      "is_verified": true,
      "is_active": true,
      "profile_photo": "/storage/tow-trucks/photo.jpg",
      "location": {
        "latitude": 33.5138,
        "longitude": 36.2765
      },
      "average_rating": 4.5,
      "gallery": [...],
      "socials": {...}
    },
    ...
  ]
}
```

#### Get Single Tow Truck
```
GET /api/tow-trucks/{id}
```

**Response:**
```json
{
  "data": {
    "id": "966123456789",
    "unique_id": "123456",
    // ... full tow truck details
  }
}
```

### Current Component Features

TowTruckDirectory already has:

✅ **Search & Filtering:**
- Search by name, city, vehicle type, unique ID, description
- Filter by city
- Filter by vehicle type
- "Find Nearest" geolocation sorting

✅ **Display Features:**
- Card-based grid layout
- Profile photos with verification badges
- Average ratings display
- Distance from user (if using geolocation)
- Pagination (8 items per page)

✅ **User Interaction:**
- Click card to view profile
- Responsive design
- Empty state handling
- Clear filters button

### Files Involved

#### Backend
- ✅ `Backend/app/Models/TowTruck.php` - Tow truck model
- ✅ `Backend/app/Http/Controllers/DirectoryController.php` - API controller
- ✅ `Backend/routes/api.php` (lines 55-56) - Public routes
- ✅ `Backend/database/migrations/*_create_tow_trucks_table.php` - Database structure

#### Frontend
- ✅ `Frontend/src/components/TowTruckDirectory.tsx` - Main component
- ✅ `Frontend/src/services/directory.service.ts` - API service (ready to use)
- ✅ `Frontend/src/App.tsx` (line 328) - Route configuration
- ✅ `Frontend/src/types.ts` - TowTruck interface

### Testing Backend API

#### Test List Endpoint
```bash
curl http://localhost:8000/api/tow-trucks
```

#### Test with Filters
```bash
curl "http://localhost:8000/api/tow-trucks?city=دمشق&vehicle_type=سطحة كبيرة"
```

#### Test Single Tow Truck
```bash
curl http://localhost:8000/api/tow-trucks/966123456789
```

### Recommended Next Steps

1. **Update Component to Use API** (Option 1 recommended)
   - Add useState for tow trucks in component
   - Add useEffect to fetch from DirectoryService
   - Add loading state
   - Remove allTowTrucks from props

2. **Update App.tsx Route**
   - Remove allTowTrucks prop
   - Component will self-manage data

3. **Benefits:**
   - Always fresh data from database
   - Supports server-side filtering
   - Better performance (load on demand)
   - Admin changes reflect immediately

### Current Usage

**How It Works Now:**
1. Admin manages tow trucks via admin panel
2. Tow trucks stored in database
3. Data loaded into localStorage (legacy)
4. App.tsx passes to component
5. Component displays the data

**Access Now:**
```
http://localhost:5173/tow-trucks
```

**Features Available:**
- Browse all verified tow trucks
- Search and filter
- Find nearest using geolocation
- View tow truck profiles
- See ratings and reviews

### Admin Management

Tow trucks can be managed in admin panel:

1. Login as admin
2. Go to "إدارة السطحات" (Tow Truck Management)
3. Add/Edit/Delete tow trucks
4. Verify new registrations
5. Activate/Deactivate accounts

**API Endpoints for Admin:**
```
GET    /api/admin/tow-trucks        - List all (including inactive)
POST   /api/admin/tow-trucks        - Create new
PUT    /api/admin/tow-trucks/{id}   - Update
DELETE /api/admin/tow-trucks/{id}   - Delete
PATCH  /api/admin/tow-trucks/{id}/verify - Verify
```

### Summary

**Backend: FULLY INTEGRATED** ✅
- Database model complete
- API endpoints working
- Public access (no auth needed)
- Filtering supported
- Admin management available

**Frontend Service: READY** ✅
- DirectoryService has getTowTrucks()
- DirectoryService has getTowTruck(id)
- Supports all filter parameters

**Component: FUNCTIONAL** ✅
- Displays tow trucks
- Search & filter working
- Geolocation sorting
- Pagination
- **Currently uses prop data from localStorage**

**Upgrade Path: EASY** 🚀
- Simply call DirectoryService in useEffect
- Remove prop dependency
- Get real-time API data

### Quick Upgrade Guide

Want to upgrade to API-based loading? Here's the minimal change:

```tsx
// 1. Import service
import { DirectoryService } from '../services/directory.service';

// 2. Add state and loading
const [towTrucks, setTowTrucks] = useState<TowTruck[]>([]);
const [loading, setLoading] = useState(true);

// 3. Fetch on mount
useEffect(() => {
  DirectoryService.getTowTrucks()
    .then(res => setTowTrucks(res.data))
    .catch(err => showToast('فشل تحميل البيانات', 'error'))
    .finally(() => setLoading(false));
}, []);

// 4. Use local state instead of prop
// Replace: filteredAndSortedTowTrucks = useMemo(() => allTowTrucks.filter(...)
// With:    filteredAndSortedTowTrucks = useMemo(() => towTrucks.filter(...)
```

**Everything is ready - just needs the final connection!** 🎉
