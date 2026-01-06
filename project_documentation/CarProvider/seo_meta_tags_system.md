# SEO & Public URLs System

## 🔗 URLs & Meta Tags للـ SEO

### 1. Database - Add Slug Field

```sql
ALTER TABLE car_listings ADD COLUMN slug VARCHAR(255) UNIQUE AFTER title;
ALTER TABLE car_listings ADD INDEX idx_slug (slug);
```

**Migration:**
```php
public function up()
{
    Schema::table('car_listings', function (Blueprint $table) {
        $table->string('slug')->unique()->after('title');
        $table->index('slug');
    });
}
```

---

### 2. Auto-Generate Slug

```php
// في CarListing Model
use Illuminate\Support\Str;

protected static function boot()
{
    parent::boot();
    
    static::creating(function ($listing) {
        $listing->slug = $listing->generateUniqueSlug();
    });
    
    static::updating(function ($listing) {
        if ($listing->isDirty('title')) {
            $listing->slug = $listing->generateUniqueSlug();
        }
    });
}

public function generateUniqueSlug()
{
    // مثال: "تويوتا كامري 2022 GLX" → "toyota-camry-2022-glx"
    $slug = Str::slug($this->title);
    
    // إذا كان موجوداً، أضف ID
    $count = static::where('slug', $slug)->count();
    
    return $count > 0 ? "{$slug}-{$this->id}" : $slug;
}

// Route Model Binding بالـ slug
public function getRouteKeyName()
{
    return 'slug';
}
```

---

### 3. Public URLs

**قبل:**
```
/car-listings/123
```

**بعد:**
```
/car-listings/toyota-camry-2022-glx
```

**Backend Route:**
```php
// تلقائياً يستخدم slug بسبب getRouteKeyName()
Route::get('/car-listings/{listing}', [CarListingController::class, 'show']);

// Controller
public function show(CarListing $listing)
{
    return response()->json([
        'listing' => $listing->load(['carProvider', 'carCategory']),
        'meta' => $this->generateMetaTags($listing),
    ]);
}
```

---

### 4. Meta Tags Generator

```php
// في CarListingController
private function generateMetaTags(CarListing $listing)
{
    $provider = $listing->carProvider;
    
    return [
        // Basic SEO
        'title' => "{$listing->title} - {$provider->name} | Ramouse",
        'description' => Str::limit($listing->description, 160),
        'keywords' => implode(', ', [
            $listing->brand,
            $listing->model,
            $listing->year,
            $listing->carCategory->name,
            $provider->city,
            'سيارات للبيع',
        ]),
        
        // OpenGraph (Facebook/WhatsApp)
        'og' => [
            'title' => $listing->title,
            'description' => Str::limit($listing->description, 200),
            'type' => 'product',
            'url' => url("/car-listings/{$listing->slug}"),
            'image' => $listing->photos[0]['path'] ?? null,
            'site_name' => 'Ramouse',
            'locale' => 'ar_SA',
        ],
        
        // Twitter Card
        'twitter' => [
            'card' => 'summary_large_image',
            'title' => $listing->title,
            'description' => Str::limit($listing->description, 200),
            'image' => $listing->photos[0]['path'] ?? null,
        ],
        
        // Product Specific (Google Shopping)
        'product' => [
            'price:amount' => $listing->price,
            'price:currency' => 'SAR',
            'availability' => $listing->is_available ? 'instock' : 'outofstock',
            'condition' => $listing->condition,
        ],
    ];
}
```

---

### 5. Frontend - Meta Tags Component

```tsx
// components/MetaTags.tsx
import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  image,
  url,
  type = 'website'
}) => {
  const fullTitle = `${title} | Ramouse`;
  const fullUrl = url || window.location.href;
  const defaultImage = 'https://ramouse.com/og-image.jpg';
  
  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content="Ramouse" />
      <meta property="og:locale" content="ar_SA" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
```

---

### 6. Usage in CarListingDetail

```tsx
const CarListingDetail = () => {
  const { slug } = useParams();
  const { data: listing } = useQuery(['listing', slug], () => 
    api.getCarListing(slug)
  );
  
  if (!listing) return <Spinner />;
  
  return (
    <>
      <MetaTags
        title={listing.title}
        description={listing.description}
        image={listing.photos[0]?.path}
        url={`https://ramouse.com/car-listings/${listing.slug}`}
        type="product"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Listing content */}
      </div>
    </>
  );
};
```

---

### 7. Provider Profile Meta Tags

```tsx
const CarProviderProfile = () => {
  const { id } = useParams();
  const { data: provider } = useQuery(['provider', id], () => 
    api.getCarProvider(id)
  );
  
  return (
    <>
      <MetaTags
        title={`${provider.name} - معرض سيارات`}
        description={`تصفح ${provider.listings_count} سيارة من ${provider.name} في ${provider.city}. تقييم: ${provider.average_rating}/5 ⭐`}
        image={provider.profile_photo}
        url={`https://ramouse.com/car-providers/${provider.id}`}
        type="profile"
      />
      
      {/* Provider content */}
    </>
  );
};
```

---

### 8. Structured Data (JSON-LD)

```tsx
// components/StructuredData.tsx
export const ListingStructuredData = ({ listing }) => {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description,
    "image": listing.photos.map(p => p.path),
    "brand": {
      "@type": "Brand",
      "name": listing.brand
    },
    "offers": {
      "@type": "Offer",
      "url": `https://ramouse.com/car-listings/${listing.slug}`,
      "priceCurrency": "SAR",
      "price": listing.price,
      "availability": listing.is_available 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": listing.carProvider.name
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": listing.carProvider.average_rating,
      "reviewCount": listing.carProvider.reviews.length
    }
  };
  
  return (
    <script type="application/ld+json">
      {JSON.stringify(structuredData)}
    </script>
  );
};
```

---

### 9. Social Sharing Buttons

```tsx
const ShareButtons = ({ listing }) => {
  const url = `https://ramouse.com/car-listings/${listing.slug}`;
  const text = `${listing.title} - ${listing.price} ريال`;
  
  const shareToWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
      '_blank'
    );
  };
  
  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank'
    );
  };
  
  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };
  
  return (
    <div className="flex gap-2">
      <button onClick={shareToWhatsApp} className="btn-share">
        <WhatsAppIcon /> واتساب
      </button>
      <button onClick={shareToFacebook} className="btn-share">
        <FacebookIcon /> فيسبوك
      </button>
      <button onClick={shareToTwitter} className="btn-share">
        <TwitterIcon /> تويتر
      </button>
      <button onClick={copyLink} className="btn-share">
        <LinkIcon /> نسخ الرابط
      </button>
    </div>
  );
};
```

---

### 10. Sitemap Generation

```php
// routes/web.php
Route::get('/sitemap.xml', function() {
    $listings = CarListing::where('is_available', true)
        ->select('slug', 'updated_at')
        ->get();
    
    $providers = CarProvider::where('is_active', true)
        ->select('id', 'updated_at')
        ->get();
    
    return response()->view('sitemap', [
        'listings' => $listings,
        'providers' => $providers,
    ])->header('Content-Type', 'text/xml');
});
```

```xml
<!-- resources/views/sitemap.blade.php -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Listings -->
    @foreach($listings as $listing)
    <url>
        <loc>https://ramouse.com/car-listings/{{ $listing->slug }}</loc>
        <lastmod>{{ $listing->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
    
    <!-- Providers -->
    @foreach($providers as $provider)
    <url>
        <loc>https://ramouse.com/car-providers/{{ $provider->id }}</loc>
        <lastmod>{{ $provider->updated_at->toAtomString() }}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    @endforeach
</urlset>
```

---

## Summary

| Feature | Status |
|---------|--------|
| **URL Slugs** | ✅ Auto-generated from title |
| **SEO Meta Tags** | ✅ Title, description, keywords |
| **OpenGraph** | ✅ WhatsApp/Facebook preview |
| **Twitter Card** | ✅ Large image card |
| **Structured Data** | ✅ JSON-LD for Google |
| **Social Sharing** | ✅ WhatsApp, FB, Twitter |
| **Canonical URLs** | ✅ Prevent duplicate content |
| **Sitemap** | ✅ /sitemap.xml |
| **Image optimization** | ✅ First photo as OG image |

**WhatsApp Preview Example:**
```
┌────────────────────────────┐
│ [Car Image]                │
│                            │
│ تويوتا كامري 2022 GLX      │
│ 45,000 ريال - موديل...    │
│                            │
│ ramouse.com                │
└────────────────────────────┘
```
