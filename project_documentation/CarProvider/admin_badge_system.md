# Admin Panel Badge System

## 🏷️ نظام الشارات (Badges) للأدمن

### Badge Types & Colors

```typescript
type BadgeType = 
  | 'verified'      // ✓ موثق - Green
  | 'trusted'       // ⭐ معرض موثوق - Blue
  | 'sponsored'     // 💎 ممول - Gold
  | 'active'        // 🟢 نشط - Green
  | 'inactive'      // 🔴 غير نشط - Red
  | 'pending';      // ⏳ قيد المراجعة - Orange

const BADGE_STYLES = {
  verified: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    icon: '✓',
    label: 'موثق'
  },
  trusted: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    icon: '⭐',
    label: 'معرض موثوق'
  },
  sponsored: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    icon: '💎',
    label: 'ممول'
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    icon: '🟢',
    label: 'نشط'
  },
  inactive: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    icon: '🔴',
    label: 'غير نشط'
  },
  pending: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    icon: '⏳',
    label: 'قيد المراجعة'
  }
};
```

---

## 📋 CarProvidersView - Badge Usage

```tsx
<Table>
  <thead>
    <tr>
      <th>الاسم</th>
      <th>الحالة</th>
      <th>الإعلانات</th>
      <th>التقييم</th>
      <th>إجراءات</th>
    </tr>
  </thead>
  <tbody>
    {providers.map(provider => (
      <tr key={provider.id}>
        <td>
          <div className="flex items-center gap-2">
            <Avatar src={provider.profile_photo} />
            <div>
              <div className="font-semibold">{provider.name}</div>
              <div className="text-sm text-gray-500">{provider.phone}</div>
            </div>
          </div>
        </td>
        <td>
          <BadgeGroup>
            {/* Status Badge */}
            <Badge type={provider.is_active ? 'active' : 'inactive'} />
            
            {/* Verified Badge */}
            {provider.is_verified && <Badge type="verified" />}
            
            {/* Trusted Badge */}
            {provider.is_trusted && <Badge type="trusted" />}
            
            {/* Pending if not verified */}
            {!provider.is_verified && <Badge type="pending" />}
          </BadgeGroup>
        </td>
        <td>{provider.listings_count}</td>
        <td>⭐ {provider.average_rating}</td>
        <td>
          <ActionButtons provider={provider} />
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 📋 CarListingsSponsorView - Badge Usage

```tsx
<Table>
  <tbody>
    {listings.map(listing => (
      <tr key={listing.id}>
        <td>
          <img src={listing.photos[0]} className="w-16 h-16" />
        </td>
        <td>
          <div className="font-semibold">{listing.title}</div>
          <div className="text-sm text-gray-500">
            {listing.carProvider.name}
          </div>
        </td>
        <td>
          <BadgeGroup>
            {/* Sponsored Badge */}
            {listing.is_sponsored && (
              <Badge 
                type="sponsored" 
                tooltip={`حتى ${formatDate(listing.sponsored_until)}`}
              />
            )}
            
            {/* Status Badge */}
            <Badge type={listing.is_available ? 'active' : 'inactive'} />
            
            {/* Provider Badges */}
            {listing.carProvider.is_trusted && <Badge type="trusted" size="sm" />}
          </BadgeGroup>
        </td>
        <td>{listing.price} ريال</td>
        <td>{listing.views_count} 👁️</td>
        <td>
          <ActionButtons listing={listing} />
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 🎨 Badge Component

```tsx
// components/Badge.tsx
interface BadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  type, 
  size = 'md', 
  tooltip,
  className 
}) => {
  const style = BADGE_STYLES[type];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border
        font-medium whitespace-nowrap
        ${style.bg} ${style.text} ${style.border}
        ${sizeClasses[size]}
        ${className}
      `}
      title={tooltip}
    >
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </span>
  );
};

// BadgeGroup for multiple badges
const BadgeGroup: React.FC = ({ children }) => (
  <div className="flex flex-wrap gap-1.5">
    {children}
  </div>
);
```

---

## 📊 Admin Dashboard Overview - Cards with Badges

```tsx
<DashboardCards>
  <StatCard>
    <div className="flex items-center justify-between">
      <div>
        <h3>معارض السيارات</h3>
        <div className="text-3xl font-bold">{stats.totalProviders}</div>
      </div>
      <div className="space-y-1">
        <Badge type="verified" size="sm" />
        <span className="text-xs">{stats.verifiedProviders}</span>
      </div>
    </div>
    <div className="mt-4 flex gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Badge type="active" size="sm" />
        <span>{stats.activeProviders}</span>
      </div>
      <div className="flex items-center gap-1">
        <Badge type="trusted" size="sm" />
        <span>{stats.trustedProviders}</span>
      </div>
    </div>
  </StatCard>
  
  <StatCard>
    <h3>الإعلانات</h3>
    <div className="text-3xl font-bold">{stats.totalListings}</div>
    <div className="mt-4 flex gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Badge type="sponsored" size="sm" />
        <span>{stats.sponsoredListings}</span>
      </div>
      <div className="flex items-center gap-1">
        <Badge type="active" size="sm" />
        <span>{stats.activeListings}</span>
      </div>
    </div>
  </StatCard>
</DashboardCards>
```

---

## 🔍 Quick Filters Based on Badges

```tsx
<QuickFilters>
  <FilterButton 
    onClick={() => setFilter('all')}
    active={filter === 'all'}
  >
    جميع المعارض ({stats.totalProviders})
  </FilterButton>
  
  <FilterButton 
    onClick={() => setFilter('verified')}
    active={filter === 'verified'}
  >
    <Badge type="verified" size="sm" />
    ({stats.verifiedProviders})
  </FilterButton>
  
  <FilterButton 
    onClick={() => setFilter('trusted')}
    active={filter === 'trusted'}
  >
    <Badge type="trusted" size="sm" />
    ({stats.trustedProviders})
  </FilterButton>
  
  <FilterButton 
    onClick={() => setFilter('inactive')}
    active={filter === 'inactive'}
  >
    <Badge type="inactive" size="sm" />
    ({stats.inactiveProviders})
  </FilterButton>
</QuickFilters>
```

---

## ✅ Summary

**Badges في كل مكان:**
- ✅ Provider lists (active/inactive, verified, trusted)
- ✅ Listing lists (sponsored, available)
- ✅ Dashboard cards (stats with badges)
- ✅ Quick filters (badge-based filtering)
- ✅ Detail views (all statuses visible)

**Consistent Styling:**
- 🟢 Green = Good (active, verified)
- 🔴 Red = Bad (inactive)
- 🔵 Blue = Premium (trusted)
- 🟡 Gold = Paid (sponsored)
- 🟠 Orange = Pending
