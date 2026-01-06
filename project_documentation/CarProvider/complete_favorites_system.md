# Complete Favorites System

## 🔖 نظام المفضلة الكامل

### 1. Database Migration

```php
// database/migrations/YYYY_MM_DD_create_user_favorites_table.php
public function up()
{
    Schema::create('user_favorites', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('car_listing_id')->constrained()->onDelete('cascade');
        $table->timestamp('created_at');
        
        // Unique constraint - كل user يحفظ كل listing مرة واحدة فقط
        $table->unique(['user_id', 'car_listing_id']);
        
        // Index للسرعة
        $table->index('user_id');
        $table->index('car_listing_id');
    });
}
```

---

### 2. Model

```php
// app/Models/UserFavorite.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserFavorite extends Model
{
    protected $fillable = ['user_id', 'car_listing_id'];
    
    public $timestamps = false; // فقط created_at
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;
    
    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function carListing()
    {
        return $this->belongsTo(CarListing::class);
    }
}

// في User Model - إضافة relationship
public function favoriteCarListings()
{
    return $this->belongsToMany(
        CarListing::class,
        'user_favorites',
        'user_id',
        'car_listing_id'
    )->withTimestamps();
}

// في CarListing Model - إضافة relationship
public function favoritedByUsers()
{
    return $this->belongsToMany(
        User::class,
        'user_favorites',
        'car_listing_id',
        'user_id'
    )->withTimestamps();
}

// Helper method
public function isFavoritedBy($userId)
{
    return $this->favoritedByUsers()->where('user_id', $userId)->exists();
}
```

---

### 3. FavoriteController

```php
// app/Http/Controllers/FavoriteController.php
namespace App\Http\Controllers;

use App\Models\UserFavorite;
use App\Models\CarListing;
use App\Models\CarListingAnalytics;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * Toggle favorite (add/remove)
     */
    public function toggle(Request $request, $listingId)
    {
        $userId = auth()->id();
        $listing = CarListing::findOrFail($listingId);
        
        // Check if already favorited
        $existing = UserFavorite::where('user_id', $userId)
            ->where('car_listing_id', $listingId)
            ->first();
        
        if ($existing) {
            // Remove from favorites
            $existing->delete();
            
            return response()->json([
                'favorited' => false,
                'message' => 'تم الإزالة من المفضلة'
            ]);
        } else {
            // Add to favorites
            UserFavorite::create([
                'user_id' => $userId,
                'car_listing_id' => $listingId,
            ]);
            
            // Track analytics event
            CarListingAnalytics::create([
                'car_listing_id' => $listingId,
                'event_type' => 'favorite',
                'user_ip' => $request->ip(),
                'user_id' => $userId,
            ]);
            
            return response()->json([
                'favorited' => true,
                'message' => 'تم الإضافة إلى المفضلة'
            ]);
        }
    }
    
    /**
     * Get user's favorites
     */
    public function index(Request $request)
    {
        $userId = auth()->id();
        
        $favorites = CarListing::whereHas('favoritedByUsers', function($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['carProvider', 'carCategory'])
            ->where('is_available', true) // فقط المتاحة
            ->orderBy('user_favorites.created_at', 'desc')
            ->paginate(20);
        
        return response()->json($favorites);
    }
    
    /**
     * Check if listing is favorited
     */
    public function check($listingId)
    {
        $userId = auth()->id();
        
        $isFavorited = UserFavorite::where('user_id', $userId)
            ->where('car_listing_id', $listingId)
            ->exists();
        
        return response()->json(['favorited' => $isFavorited]);
    }
    
    /**
     * Get favorites count for listing
     */
    public function count($listingId)
    {
        $count = UserFavorite::where('car_listing_id', $listingId)->count();
        
        return response()->json(['count' => $count]);
    }
}
```

---

### 4. Routes

```php
// routes/api.php

// Public - check favorite count
Route::get('/car-listings/{id}/favorites/count', [FavoriteController::class, 'count']);

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Toggle favorite
    Route::post('/favorites/{listingId}/toggle', [FavoriteController::class, 'toggle']);
    
    // Check if favorited
    Route::get('/favorites/{listingId}/check', [FavoriteController::class, 'check']);
    
    // Get my favorites
    Route::get('/favorites', [FavoriteController::class, 'index']);
});
```

---

### 5. Frontend Service

```typescript
// services/favorites.service.ts
import api from './api';

export const favoritesService = {
  toggle: async (listingId: number) => {
    const { data } = await api.post(`/favorites/${listingId}/toggle`);
    return data;
  },
  
  check: async (listingId: number) => {
    const { data } = await api.get(`/favorites/${listingId}/check`);
    return data.favorited;
  },
  
  getMyFavorites: async (page = 1) => {
    const { data } = await api.get(`/favorites?page=${page}`);
    return data;
  },
  
  getCount: async (listingId: number) => {
    const { data } = await api.get(`/car-listings/${listingId}/favorites/count`);
    return data.count;
  }
};
```

---

### 6. Favorite Button Component

```tsx
// components/FavoriteButton.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '../services/favorites.service';
import { useAppState } from '../hooks/useAppState';

interface FavoriteButtonProps {
  listingId: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  listingId, 
  showCount = true,
  size = 'md' 
}) => {
  const { isLoggedIn } = useAppState();
  const queryClient = useQueryClient();
  
  // Check if favorited
  const { data: isFavorited } = useQuery({
    queryKey: ['favorite', listingId],
    queryFn: () => favoritesService.check(listingId),
    enabled: isLoggedIn,
  });
  
  // Get count
  const { data: count } = useQuery({
    queryKey: ['favoriteCount', listingId],
    queryFn: () => favoritesService.getCount(listingId),
    enabled: showCount,
  });
  
  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: () => favoritesService.toggle(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorite', listingId]);
      queryClient.invalidateQueries(['favoriteCount', listingId]);
      queryClient.invalidateQueries(['favorites']); // My favorites list
    }
  });
  
  const handleClick = () => {
    if (!isLoggedIn) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    toggleMutation.mutate();
  };
  
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      className={`
        flex items-center gap-2 rounded-lg border-2 transition-all
        ${isFavorited 
          ? 'bg-red-50 border-red-500 text-red-600' 
          : 'bg-white border-gray-300 text-gray-600 hover:border-red-400'
        }
        ${sizeClasses[size]}
        disabled:opacity-50
      `}
    >
      <span className="text-xl">
        {isFavorited ? '❤️' : '🤍'}
      </span>
      <span className="font-medium">
        {isFavorited ? 'محفوظ' : 'حفظ'}
      </span>
      {showCount && count > 0 && (
        <span className="text-sm opacity-75">
          ({count})
        </span>
      )}
    </button>
  );
};
```

---

### 7. My Favorites Page

```tsx
// components/MyFavorites.tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { favoritesService } from '../services/favorites.service';

export const MyFavorites = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['favorites'],
    queryFn: ({ pageParam = 1 }) => favoritesService.getMyFavorites(pageParam),
    getNextPageParam: (lastPage) => lastPage.next_page_url ? lastPage.current_page + 1 : undefined,
  });
  
  if (isLoading) return <Spinner />;
  
  const favorites = data?.pages.flatMap(page => page.data) ?? [];
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        ❤️ المفضلة ({data?.pages[0]?.total ?? 0})
      </h1>
      
      {favorites.length === 0 ? (
        <EmptyState>
          <p>لا توجد إعلانات محفوظة</p>
          <Link to="/car-marketplace" className="btn-primary">
            تصفح السوق
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(listing => (
              <CarCard 
                key={listing.id} 
                listing={listing}
                showFavoriteButton={true}
              />
            ))}
          </div>
          
          {hasNextPage && (
            <button 
              onClick={() => fetchNextPage()}
              className="btn-secondary mt-6 w-full"
            >
              تحميل المزيد
            </button>
          )}
        </>
      )}
    </div>
  );
};
```

---

### 8. Usage in CarListingDetail

```tsx
<CarListingDetail>
  <Header>
    <Title>{listing.title}</Title>
    <Actions>
      <FavoriteButton listingId={listing.id} showCount={true} />
      <ShareButton listing={listing} />
    </Actions>
  </Header>
  
  {/* Rest of listing details */}
</CarListingDetail>
```

---

### 9. Analytics Integration

```php
// عند الـ favorite، يتم تسجيل في:
// 1. user_favorites (persistent)
// 2. car_listing_analytics (tracking)

// في daily stats aggregation:
CarListingDailyStats::updateOrCreate([
    'car_listing_id' => $listing->id,
    'date' => $yesterday
], [
    'favorites' => CarListingAnalytics::where('car_listing_id', $listing->id)
        ->where('event_type', 'favorite')
        ->whereDate('created_at', $yesterday)
        ->count(),
    // ... other stats
]);
```

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Database table | ✅ user_favorites |
| Model relationships | ✅ User ↔ CarListing |
| Toggle endpoint | ✅ POST /favorites/{id}/toggle |
| List favorites | ✅ GET /favorites |
| Check status | ✅ GET /favorites/{id}/check |
| Favorite count | ✅ GET /car-listings/{id}/favorites/count |
| Frontend button | ✅ FavoriteButton component |
| My Favorites page | ✅ Full page with grid |
| Analytics tracking | ✅ Logs to analytics table |
| Unique constraint | ✅ One favorite per user per listing |

**الآن favorite دائمة وليست مجرد event!** ❤️
