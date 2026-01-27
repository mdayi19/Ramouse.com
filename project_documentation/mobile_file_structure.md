# Mobile App - Complete File Structure

## 📁 New Architecture (Production Ready)

```
mobile/
├── src/
│   ├── app/                                    # Routes (Expo Router)
│   │   ├── (auth)/                            # Auth routes
│   │   │   └── login.tsx                      ✅ Login route
│   │   │
│   │   ├── (customer)/                        # Customer routes
│   │   │   ├── index.tsx                      ✅ Dashboard route
│   │   │   ├── orders.tsx                     ✅ Orders route
│   │   │   ├── marketplace.tsx                ✅ Marketplace route
│   │   │   └── store.tsx                      ✅ Store route
│   │   │
│   │   └── (parts-provider)/                  # Parts Provider routes
│   │       └── index.tsx                      ✅ Provider dashboard route
│   │
│   ├── components/
│   │   ├── shared/                            # Shared UI Components (10 files)
│   │   │   ├── Button.tsx                     ✅ 4 variants, 3 sizes
│   │   │   ├── Input.tsx                      ✅ Label, error states
│   │   │   ├── Card.tsx                       ✅ Shadow container
│   │   │   ├── Badge.tsx                      ✅ 5 color variants
│   │   │   ├── Avatar.tsx                     ✅ Image or initials
│   │   │   ├── BottomSheet.tsx                ✅ Mobile modal
│   │   │   ├── SearchBar.tsx                  ✅ With icon
│   │   │   ├── EmptyState.tsx                 ✅ Empty placeholder
│   │   │   ├── ErrorState.tsx                 ✅ With retry
│   │   │   ├── LoadingState.tsx               ✅ Loading spinner
│   │   │   └── index.ts                       ✅ Re-exports
│   │   │
│   │   ├── layout/                            # Layout Components (2 files)
│   │   │   ├── Header.tsx                     ✅ App header
│   │   │   ├── TabBar.tsx                     ✅ Bottom nav
│   │   │   └── index.ts                       ✅ Re-exports
│   │   │
│   │   ├── customer/                          # Customer Screens (2 files)
│   │   │   ├── DashboardScreen.tsx            ✅ Dashboard (220 lines)
│   │   │   └── OrdersScreen.tsx               ✅ Orders list (180 lines)
│   │   │
│   │   ├── marketplace/                       # Marketplace Components (2 files)
│   │   │   ├── CarListingCard.tsx             ✅ Car card
│   │   │   └── MarketplaceScreen.tsx          ✅ Marketplace (200 lines)
│   │   │
│   │   ├── store/                             # Store Components (2 files)
│   │   │   ├── ProductCard.tsx                ✅ Product card
│   │   │   └── StoreScreen.tsx                ✅ Store grid (180 lines)
│   │   │
│   │   ├── parts-provider/                    # Parts Provider (1 file)
│   │   │   └── DashboardScreen.tsx            ✅ Provider dashboard (250 lines)
│   │   │
│   │   └── auth/                              # Auth Components (1 file)
│   │       └── LoginScreen.tsx                ✅ Login form (200 lines)
│   │
│   ├── services/                              # API Services (existing)
│   │   ├── order.service.ts                   ✅ Order API calls
│   │   └── ... (other services)
│   │
│   ├── hooks/                                 # Custom Hooks (existing)
│   │   ├── useRealtime.ts                     ✅ Real-time updates
│   │   └── ... (other hooks)
│   │
│   ├── types/                                 # TypeScript Types (existing)
│   │   └── ... (type definitions)
│   │
│   └── utils/                                 # Utilities (existing)
│       └── ... (helper functions)
│
└── project_documentation/
    └── mobile_rebuild_status.md               ✅ Project status report

```

## 🗑️ Legacy Structure (To Be Deprecated)

```
mobile/src/components/
└── screens/                                    ❌ DELETE AFTER MIGRATION
    ├── customer/
    │   ├── new_order/
    │   │   ├── Step1Category.tsx              ⚠️ Migrate to OrderWizard
    │   │   ├── Step2Brand.tsx                 ⚠️ Migrate to OrderWizard
    │   │   ├── Step3Model.tsx                 ⚠️ Migrate to OrderWizard
    │   │   ├── Step4PartType.tsx              ⚠️ Migrate to OrderWizard
    │   │   ├── Step5Details.tsx               ⚠️ Migrate to OrderWizard
    │   │   ├── Step6Review.tsx                ⚠️ Migrate to OrderWizard
    │   │   └── Step7Success.tsx               ⚠️ Migrate to OrderWizard
    │   └── ... (other old screens)
    │
    ├── technician/                            ⚠️ To be migrated
    ├── tow-truck/                             ⚠️ To be migrated
    └── ... (other old screens)
```

## 📊 File Count Summary

| Category | Files | Status |
|----------|-------|--------|
| **Shared Components** | 10 | ✅ Complete |
| **Layout Components** | 2 | ✅ Complete |
| **Customer Screens** | 2 | ✅ Complete |
| **Marketplace Components** | 2 | ✅ Complete |
| **Store Components** | 2 | ✅ Complete |
| **Parts Provider Screens** | 1 | ✅ Complete |
| **Auth Components** | 1 | ✅ Complete |
| **Route Files** | 7 | ✅ Complete |
| **Index Files** | 2 | ✅ Complete |
| **Total New Files** | **27** | **✅ Production Ready** |

## 🎯 Planned Structure (Remaining 104 files)

```
components/
├── customer/                                   # 16 more files needed
│   ├── OrderWizard/                           ⏳ 7 files (migrate from old)
│   ├── GarageScreen.tsx                       ⏳ To build
│   ├── WalletScreen.tsx                       ⏳ To build
│   ├── AuctionsScreen.tsx                     ⏳ To build
│   └── ... (other screens)
│
├── parts-provider/                            # 8 more files needed
│   ├── OrdersScreen.tsx                       ⏳ Available orders
│   ├── BidsScreen.tsx                         ⏳ My bids
│   └── ... (other screens)
│
├── car-provider/                              # 17 files needed
│   ├── DashboardScreen.tsx                    ⏳ To build
│   ├── ListingsScreen.tsx                     ⏳ To build
│   └── ... (other screens)
│
├── technician/                                # 8 files needed
├── tow-truck/                                 # 8 files needed
├── directory/                                 # 7 files needed
├── auction/                                   # 9 files needed
└── admin/                                     # 6 files needed
```

---

**Legend:**
- ✅ = Complete and production ready
- ⏳ = Planned, not yet built
- ⚠️ = Legacy code, needs migration
- ❌ = To be deleted after migration

**Last Updated**: 2026-01-25
**Status**: 27/131 files complete (~25%)
