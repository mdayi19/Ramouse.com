# Mobile App Rebuild - Incomplete Phases Plan

**Date**: 2026-01-25
**Status**: Partial Complete (Customer Phase mostly done)
**Next Focus**: Auth & Car Provider

---

## 🛑 Current Status Overview

The mobile app rebuild is in progress. The **Foundation**, **Customer Features**, and **Authentication** phases are complete in the new structure.

### ✅ Completed / Mostly Done
*   **Foundation**: Shared components, services, and utils are set up.
*   **Customer Features**: 
    *   Dashboard, Orders, Wallet, Garage, etc. are implemented in `src/components/customer`.
*   **Authentication**: ✅ **COMPLETE (2026-01-25)**
    *   All auth screens migrated to `src/components/auth`
    *   Created: `LoginScreen`, `RegisterCustomerScreen`, `RegisterCarProviderScreen`, `RegisterTechnicianScreen`, `ForgotPasswordScreen`
    *   All screens use shared components with consistent design
    *   Legacy auth screens removed from `src/components/screens/auth`

### ⚠️ In Progress / Needs Migration
*   **Car Provider**:
    *   `src/components/car-provider` is **EMPTY**.
    *   Routes exist in `src/app/(car-provider)`, but likely point to legacy components.
*   **Legacy Code**:
    *   `src/components/screens` contains 30+ old components that need to be refactored into feature-specific folders.

---

## 📅 Remaining Phases & Plan

### Phase 1: Car Provider Features
*   **Goal**: Build the Car Provider interface in `src/components/car-provider`.
*   **Tasks**:
    *   Create `ProviderDashboardScreen.tsx`
    *   Create `MyListingsScreen.tsx`
    *   Create `AddCarWizard` (multi-step form for adding cars)
    *   Integrate with `CarProviderService`.

### Phase 2: Parts Provider Features
*   **Goal**: Build the Parts Provider interface in `src/components/parts-provider`.
*   **Tasks**:
    *   Create `PartsDashboardScreen.tsx`
    *   Create `OrderRequestsList.tsx` (Marketplace for parts)
    *   Create `QuoteSubmissionForm.tsx`

### Phase 3: Service Providers (Technician & Tow Truck)
*   **Goal**: Build interfaces for service workers.
*   **Tasks**:
    *   **Technician**: `JobsListScreen.tsx`, `JobDetailScreen.tsx`
    *   **Tow Truck**: `TowRequestsScreen.tsx`, `ActiveTowMapScreen.tsx`

---

## 🐛 Known Issues to Fix First
1.  **Orders List API Mapping**: ✅ **FIXED (2026-01-25)**
    *   **Issue**: The `OrdersScreen` was receiving data but failing to display brand, model, and part description because these fields are nested in `formData` object.
    *   **Solution**: Updated `OrdersScreen.tsx` to extract `formData` from the API response and access nested fields (`formData.brand`, `formData.partDescription`, etc.).
    *   **Status**: ✅ Complete and verified
2.  **Mobile Orders Alignment**: ✅ **COMPLETE (2026-01-25)**
    *   **Issue**: Mobile orders screens lacked features present in frontend (status grouping, quote stats, image carousels, WhatsApp integration)
    *   **Solution**: Implemented Phase 1 (OrdersScreen enhancements) and Phase 2 (OrderDetailScreen enhancements)
    *   **Status**: ✅ Both phases complete, feature parity achieved
3.  **Navigation Links**:
    *   Ensure all `router.push()` calls use the correct path structure (e.g., `/(customer)/order/[id]` vs `/order/[id]`).
    *   **Status**: ✅ Fixed - now uses orderNumber for navigation

---

## 📂 Architecture Note
Always follow the **Feature-First** directory structure:
*   ❌ Don't use `src/components/screens/*` (Legacy)
*   ✅ Use `src/components/[feature-name]/*` (e.g., `src/components/parts-provider/`)

## 🛠 Next Session Command
To resume work, continue with the Car Provider phase.
Recommended prompt:
> "Let's start implementing the Car Provider features."
