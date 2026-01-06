# Advanced Search Engine

## 🔍 نظام البحث المتقدم

### 1. Full-Text Search Setup

#### Database - FULLTEXT Index

```sql
-- Add FULLTEXT index for search
ALTER TABLE car_listings ADD FULLTEXT INDEX ft_search (title, description, brand, model);

-- For better Arabic support
ALTER TABLE car_listings MODIFY title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE car_listings MODIFY description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 2. Search Query with Scoring

```php
// app/Http/Controllers/CarListingController.php

public function search(Request $request)
{
    $validated = $request->validate([
        'q' => 'nullable|string|max:255',          // Search query
        'category' => 'nullable|exists:car_categories,id',
        'brand' => 'nullable|string',
        'min_price' => 'nullable|numeric|min:0',
        'max_price' => 'nullable|numeric',
        'year_from' => 'nullable|integer',
        'year_to' => 'nullable|integer',
        'condition' => 'nullable|in:new,used',
        'listing_type' => 'nullable|in:sale,rent',
        'lat' => 'nullable|numeric',               // User location
        'lng' => 'nullable|numeric',
        'radius' => 'nullable|integer|max:100',    // km
        'trusted_only' => 'nullable|boolean',
        'with_warranty' => 'nullable|boolean',
        'sort' => 'nullable|in:relevance,price_asc,price_desc,date,rating',
        'page' => 'nullable|integer|min:1',
    ]);
    
    $query = CarListing::query()
        ->where('is_available', true)
        ->where('is_hidden', false)
        ->with(['carProvider', 'carCategory']);
    
    // ===================================
    // 1. FULL-TEXT SEARCH
    // ===================================
    if (!empty($validated['q'])) {
        $searchTerm = $validated['q'];
        
        // MySQL FULLTEXT with relevance score
        $query->selectRaw("
            car_listings.*,
            MATCH(title, description, brand, model) 
            AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score
        ", [$searchTerm])
        ->havingRaw('relevance_score > 0')
        ->orWhere('title', 'LIKE', "%{$searchTerm}%")
        ->orWhere('brand', 'LIKE', "%{$searchTerm}%")
        ->orWhere('model', 'LIKE', "%{$searchTerm}%");
    } else {
        $query->selectRaw('car_listings.*, 0 as relevance_score');
    }
    
    // ===================================
    // 2. FILTERS
    // ===================================
    if (!empty($validated['category'])) {
        $query->where('car_category_id', $validated['category']);
    }
    
    if (!empty($validated['brand'])) {
        $query->where('brand', $validated['brand']);
    }
    
    if (!empty($validated['min_price'])) {
        $query->where('price', '>=', $validated['min_price']);
    }
    
    if (!empty($validated['max_price'])) {
        $query->where('price', '<=', $validated['max_price']);
    }
    
    if (!empty($validated['year_from'])) {
        $query->where('year', '>=', $validated['year_from']);
    }
    
    if (!empty($validated['year_to'])) {
        $query->where('year', '<=', $validated['year_to']);
    }
    
    if (!empty($validated['condition'])) {
        $query->where('condition', $validated['condition']);
    }
    
    if (!empty($validated['listing_type'])) {
        $query->where('listing_type', $validated['listing_type']);
    }
    
    // Trusted providers only
    if (!empty($validated['trusted_only'])) {
        $query->whereHas('carProvider', function($q) {
            $q->where('is_trusted', true);
        });
    }
    
    // With warranty
    if (!empty($validated['with_warranty'])) {
        $query->whereNotNull('warranty')
              ->where('warranty', '!=', '');
    }
    
    // ===================================
    // 3. LOCATION-BASED RANKING
    // ===================================
    if (!empty($validated['lat']) && !empty($validated['lng'])) {
        $lat = $validated['lat'];
        $lng = $validated['lng'];
        $radius = $validated['radius'] ?? 50; // default 50km
        
        $query->selectRaw("
            *,
            (6371 * acos(cos(radians(?)) 
            * cos(radians(ST_X(location))) 
            * cos(radians(ST_Y(location)) - radians(?)) 
            + sin(radians(?)) 
            * sin(radians(ST_X(location))))) AS distance
        ", [$lat, $lng, $lat])
        ->havingRaw('distance < ?', [$radius]);
    } else {
        $query->selectRaw('*, NULL as distance');
    }
    
    // ===================================
    // 4. PROVIDER TRUST SCORE
    // ===================================
    $query->addSelect([
        'provider_trust_score' => CarProvider::selectRaw('
            CASE
                WHEN is_trusted = 1 THEN 3
                WHEN is_verified = 1 THEN 2
                ELSE 1
            END
        ')
        ->whereColumn('car_providers.id', 'car_listings.car_provider_id')
        ->limit(1)
    ]);
    
    // ===================================
    // 5. SORTING & RANKING
    // ===================================
    $sort = $validated['sort'] ?? 'relevance';
    
    switch ($sort) {
        case 'relevance':
            // Complex scoring algorithm
            $query->orderByRaw('
                (
                    -- 1. Sponsored (highest priority)
                    (CASE 
                        WHEN is_sponsored = 1 AND sponsored_until > NOW() 
                        THEN 1000 
                        ELSE 0 
                    END) +
                    
                    -- 2. Full-text relevance
                    (relevance_score * 100) +
                    
                    -- 3. Provider trust
                    (provider_trust_score * 50) +
                    
                    -- 4. Location proximity (if available)
                    (CASE 
                        WHEN distance IS NOT NULL 
                        THEN (100 - distance) 
                        ELSE 0 
                    END) +
                    
                    -- 5. Price relevance (closer to average = better)
                    (100 - ABS(
                        (price - (SELECT AVG(price) FROM car_listings WHERE is_available = 1)) 
                        / (SELECT STDDEV(price) FROM car_listings WHERE is_available = 1)
                    )) +
                    
                    -- 6. Recency (newer = better)
                    (DATEDIFF(NOW(), created_at) * -0.1) +
                    
                    -- 7. Views count (popularity)
                    (LOG10(views_count + 1) * 10)
                    
                ) DESC
            ');
            break;
            
        case 'price_asc':
            $query->orderByRaw('
                CASE WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 0 ELSE 1 END,
                price ASC
            ');
            break;
            
        case 'price_desc':
            $query->orderByRaw('
                CASE WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 0 ELSE 1 END,
                price DESC
            ');
            break;
            
        case 'date':
            $query->orderByRaw('
                CASE WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 0 ELSE 1 END,
                created_at DESC
            ');
            break;
            
        case 'rating':
            $query->join('car_providers', 'car_listings.car_provider_id', '=', 'car_providers.id')
                  ->orderByRaw('
                      CASE WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 0 ELSE 1 END,
                      car_providers.average_rating DESC
                  ');
            break;
    }
    
    // ===================================
    // 6. PAGINATION
    // ===================================
    $results = $query->paginate(20);
    
    return response()->json($results);
}
```

---

### 3. Score Breakdown (for debugging/analytics)

```php
public function searchWithScoreBreakdown(Request $request)
{
    // Same as above but return score details
    $query->selectRaw("
        car_listings.*,
        
        -- Score components
        (CASE WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 1000 ELSE 0 END) as sponsored_score,
        (MATCH(title, description, brand, model) AGAINST(? IN NATURAL LANGUAGE MODE) * 100) as text_score,
        provider_trust_score * 50 as trust_score,
        (CASE WHEN distance IS NOT NULL THEN (100 - distance) ELSE 0 END) as location_score,
        views_count as popularity_score,
        
        -- Total score
        (
            (CASE WHEN is_sponsored = 1 AND sponsored_until > NOW() THEN 1000 ELSE 0 END) +
            (MATCH(title, description, brand, model) AGAINST(? IN NATURAL LANGUAGE MODE) * 100) +
            (provider_trust_score * 50) +
            (CASE WHEN distance IS NOT NULL THEN (100 - distance) ELSE 0 END) +
            (LOG10(views_count + 1) * 10)
        ) as total_score
    ", [$searchTerm, $searchTerm]);
}
```

---

### 4. Laravel Scout Integration (Advanced - Optional)

```php
// composer require laravel/scout
// For Elasticsearch or Algolia

// app/Models/CarListing.php
use Laravel\Scout\Searchable;

class CarListing extends Model
{
    use Searchable;
    
    /**
     * Get the indexable data array for the model
     */
    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'brand' => $this->brand,
            'model' => $this->model,
            'year' => $this->year,
            'price' => $this->price,
            'location' => [
                'lat' => $this->location ? $this->location->getLat() : null,
                'lon' => $this->location ? $this->location->getLng() : null,
            ],
            'is_sponsored' => $this->is_sponsored,
            'provider_trust_score' => $this->carProvider->is_trusted ? 3 : 
                                     ($this->carProvider->is_verified ? 2 : 1),
        ];
    }
    
    /**
     * Scout search with filters
     */
    public static function advancedSearch($query, $filters = [])
    {
        return static::search($query)
            ->where('is_available', true)
            ->when($filters['min_price'] ?? null, function($search, $price) {
                return $search->where('price', '>=', $price);
            })
            ->when($filters['max_price'] ?? null, function($search, $price) {
                return $search->where('price', '<=', $price);
            })
            // ... more filters
            ->orderBy('_score', 'desc') // Elasticsearch score
            ->orderBy('is_sponsored', 'desc')
            ->get();
    }
}
```

---

### 5. Frontend - Search Component

```tsx
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('relevance');
  
  const { data, isLoading } = useQuery({
    queryKey: ['search', query, filters, sort],
    queryFn: () => api.search({ q: query, ...filters, sort }),
    enabled: query.length > 2 || Object.keys(filters).length > 0,
  });
  
  return (
    <div>
      {/* Search Input */}
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="ابحث عن سيارة (ماركة، موديل، سنة...)"
      />
      
      {/* Sort Options */}
      <SortDropdown value={sort} onChange={setSort}>
        <option value="relevance">الأكثر صلة</option>
        <option value="price_asc">السعر: الأقل</option>
        <option value="price_desc">السعر: الأعلى</option>
        <option value="date">الأحدث</option>
        <option value="rating">التقييم</option>
      </SortDropdown>
      
      {/* Results */}
      {data?.data.map(listing => (
        <SearchResultCard 
          key={listing.id} 
          listing={listing}
          scoreBreakdown={listing.total_score} // for debugging
        />
      ))}
    </div>
  );
};
```

---

### 6. Search Analytics

```php
// Track search queries
CREATE TABLE search_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    query VARCHAR(255),
    user_id BIGINT NULL,
    results_count INT,
    filters JSON,
    clicked_listing_id BIGINT NULL,
    created_at TIMESTAMP,
    
    INDEX idx_query (query),
    INDEX idx_created (created_at)
);

// Log searches
SearchLog::create([
    'query' => $request->q,
    'user_id' => auth()->id(),
    'results_count' => $results->total(),
    'filters' => $request->except(['q', 'page']),
]);

// Popular searches report
SearchLog::select('query', DB::raw('COUNT(*) as count'))
    ->groupBy('query')
    ->orderBy('count', 'desc')
    ->limit(20)
    ->get();
```

---

## Scoring Algorithm Summary

```
Total Score = 
  + 1000 (if sponsored)
  + (FULLTEXT relevance × 100)
  + (Provider trust × 50)
    - 3 pts if trusted
    - 2 pts if verified
    - 1 pt otherwise
  + (100 - distance in km)
  + (100 - price deviation from average)
  + (recency bonus: -0.1 per day old)
  + (popularity: LOG10(views) × 10)
```

**Example Scores:**
- Sponsored + 5-star match: ~1500 pts
- Non-sponsored + perfect match: ~500 pts
- Old listing far away: ~50 pts

---

## Performance Optimization

1. **Indexes:**
   - FULLTEXT on (title, description, brand, model)
   - SPATIAL on location
   - Regular indexes on price, year, created_at

2. **Caching:**
   - Cache popular searches for 1 hour
   - Cache category counts

3. **Query Optimization:**
   - Use EXPLAIN to verify index usage
   - Limit subqueries
   - Use joins wisely

4. **Alternative: Elasticsearch** (for very large scale)
   - 1M+ listings
   - Complex faceted search
   - Better Arabic support

---

## Summary

| Feature | Implementation | Priority |
|---------|----------------|----------|
| **FULLTEXT search** | ✅ MySQL MATCH AGAINST | High |
| **Sponsored priority** | ✅ +1000 score | High |
| **Provider trust** | ✅ +50-150 score | High |
| **Location proximity** | ✅ Distance scoring | Medium |
| **Price relevance** | ✅ Deviation from avg | Medium |
| **Popularity** | ✅ Views count | Medium |
| **Recency** | ✅ Date bonus | Low |
| **Scout/ES** | ⏳ Optional Phase 2 | Low |

**البحث الآن متقدم وذكي!** 🎯
