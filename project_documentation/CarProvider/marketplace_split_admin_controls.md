# Marketplace Split & Enhanced Admin Controls

## 🏪 Split Marketplace into Two Pages

### 1. CarMarketplace (للبيع)
**Route:** `/car-marketplace`

**Focus:** Cars for sale only

```tsx
const CarMarketplace = () => {
  const [filters, setFilters] = useState({
    listing_type: 'sale', // FIXED - sale only
    // ... other filters
  });
  
  return (
    <div>
      <PageHeader>
        <h1>🚗 سوق السيارات - البيع</h1>
        <p>تصفح آلاف السيارات المعروضة للبيع</p>
      </PageHeader>
      
      {/* Sale-specific filters */}
      <Filters>
        <CategoryFilter />
        <BrandFilter />
        <PriceRangeSlider label="سعر البيع" />
        <ConditionFilter /> {/* New/Used */}
        <YearRangeSlider />
        <MileageFilter />
        <LocationFilter />
        <TrustedProvidersCheckbox />
        <WithWarrantyCheckbox />
      </Filters>
      
      <SortOptions>
        <option value="relevance">الأكثر صلة</option>
        <option value="price_asc">السعر: الأقل</option>
        <option value="price_desc">السعر: الأعلى</option>
        <option value="date">الأحدث</option>
      </SortOptions>
      
      {/* Results grid */}
      <ListingsGrid listings={saleListings} />
    </div>
  );
};
```

---

### 2. RentCar (للإيجار)
**Route:** `/rent-car`

**Focus:** Cars for rent only

```tsx
const RentCar = () => {
  const [filters, setFilters] = useState({
    listing_type: 'rent', // FIXED - rent only
    // ... other filters
  });
  
  return (
    <div>
      <PageHeader>
        <h1>🔄 تأجير السيارات</h1>
        <p>استأجر السيارة المناسبة ليومك أو رحلتك</p>
      </PageHeader>
      
      {/* Rent-specific filters */}
      <Filters>
        <CategoryFilter />
        <BrandFilter />
        
        {/* RENTAL-SPECIFIC */}
        <RentalPeriodFilter>
          <option value="daily">يومي</option>
          <option value="weekly">أسبوعي</option>
          <option value="monthly">شهري</option>
        </RentalPeriodFilter>
        
        <PriceRangeSlider label="السعر اليومي" />
        <PriceRangeSlider label="السعر الأسبوعي" />
        <PriceRangeSlider label="السعر الشهري" />
        
        <YearFilter min={2020} /> {/* Newer cars for rental */}
        <LocationFilter /> {/* More important for rental */}
        <InsuranceIncludedCheckbox />
        <DriverIncludedCheckbox />
      </Filters>
      
      <SortOptions>
        <option value="price_daily">السعر اليومي</option>
        <option value="rating">التقييم</option>
        <option value="date">الأحدث</option>
      </SortOptions>
      
      {/* Results with rental info */}
      <RentalListingsGrid listings={rentListings} />
    </div>
  );
};
```

---

## 🛡️ Enhanced Admin Controls

### 1. Manual Listing Approval (Optional)

```sql
-- Add approval fields
ALTER TABLE car_listings 
  ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE,
  ADD COLUMN approved_by_admin_id BIGINT NULL,
  ADD COLUMN approved_at TIMESTAMP NULL;
```

**Admin can enable/disable approval:**
- Manual review before listing goes live
- Bulk approve/reject functionality
- Notification to provider when approved

### 2. Featured Listings Management

```sql
ALTER TABLE car_listings 
  ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN featured_until TIMESTAMP NULL,
  ADD COLUMN featured_position INT NULL;
```

**Admin can:**
- Pin specific listings to top
- Set featured duration
- Manual ordering (position)
- Different from sponsored (free for admin)

### 3. Category & Brand Management

**Full CRUD for categories:**
- Add/edit/delete categories
- Set sort order
- Enable/disable categories
- Upload custom icons

### 4. Price Limits

**Set min/max prices per category:**
- Prevent unrealistic prices
- Separate limits for sale/rent
- Auto-reject out-of-range listings

### 5. Bulk Actions

**Admin can select multiple listings and:**
- ✅ Bulk approve
- 🔒 Bulk hide
- ⭐ Bulk feature
- 💎 Bulk sponsor (free)
- 🗑️ Bulk delete

### 6. Provider Limits Configuration

**Admin settings:**
- Max listings for individual sellers (default: 3)
- Free listings limit for providers (e.g., 10 free)
- Fee for extra listings
- Enable/disable manual approval

---

## Summary

**Marketplace Split:**
- `/car-marketplace` - Sale only
- `/rent-car` - Rental only

**Admin Enhancements:**
- Manual approval toggle
- Featured listings
- Category management
- Price limits
- Bulk actions
- Provider limits config
- Comprehensive analytics
