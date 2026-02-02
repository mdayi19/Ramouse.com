# Print Components Backup
Created: 2026-02-02 15:36:03
Purpose: Backup before mobile print/PDF fix implementation

## Backup Summary
- Total files to backup: 16
- Successfully backed up: 16
- Not found: 0

## Files Included
- shared\PrintPreviewModal.tsx - ShippingReceipt.tsx - PrintableTechnicianProfile.tsx - PrintableTowTruckProfile.tsx - Store\CustomerStoreReceipt.tsx - DashboardParts\Store\StoreReceipt.tsx - TechnicianDashboardParts\ProfileView.tsx - TowTruckDashboardParts\ProfileView.tsx - CarMarketplace\PrintableCarProviderProfile.tsx - CarMarketplace\CarProviderDashboard\PrintableSaleCar.tsx - CarMarketplace\CarProviderDashboard\PrintableRentCar.tsx - CarMarketplace\CarProviderDashboard\ListingsView.tsx - CarMarketplace\CarProviderDashboard\SettingsView.tsx - CarMarketplace\SharedCarListings\UserPrintableSaleCar.tsx - CarMarketplace\SharedCarListings\UserPrintableRentCar.tsx - CarMarketplace\SharedCarListings\MyCarListingsView.tsx shared\PrintPreviewModal.tsx
- ShippingReceipt.tsx
- PrintableTechnicianProfile.tsx
- PrintableTowTruckProfile.tsx
- Store\CustomerStoreReceipt.tsx
- DashboardParts\Store\StoreReceipt.tsx
- TechnicianDashboardParts\ProfileView.tsx
- TowTruckDashboardParts\ProfileView.tsx
- CarMarketplace\PrintableCarProviderProfile.tsx
- CarMarketplace\CarProviderDashboard\PrintableSaleCar.tsx
- CarMarketplace\CarProviderDashboard\PrintableRentCar.tsx
- CarMarketplace\CarProviderDashboard\ListingsView.tsx
- CarMarketplace\CarProviderDashboard\SettingsView.tsx
- CarMarketplace\SharedCarListings\UserPrintableSaleCar.tsx
- CarMarketplace\SharedCarListings\UserPrintableRentCar.tsx
- CarMarketplace\SharedCarListings\MyCarListingsView.tsx

## Restore Instructions

### Restore Single File
To restore a specific file:

1. Open PowerShell
2. Run:
   Copy-Item "c:\laragon\www\ramouse\backups\print-components-2026-02-02-153603\[filename].tsx" "c:\laragon\www\ramouse\Frontend\src\components\[filename].tsx" -Force

Example:
   Copy-Item "c:\laragon\www\ramouse\backups\print-components-2026-02-02-153603\ShippingReceipt.tsx" "c:\laragon\www\ramouse\Frontend\src\components\ShippingReceipt.tsx" -Force

### Restore All Files
To restore all files:

1. Open PowerShell
2. Run:
   Copy-Item "c:\laragon\www\ramouse\backups\print-components-2026-02-02-153603\*" "c:\laragon\www\ramouse\Frontend\src\components\" -Recurse -Force

### Git Restore Alternative
If you created a git backup branch:

1. Open terminal in project root
2. Run:
   git checkout backup/before-print-fix-2026-02-02

## Contact
If you need help restoring files, refer to:
c:\laragon\www\ramouse\project_documentation\mobile_print_compatibility_safety.md

## Backup Location
c:\laragon\www\ramouse\backups\print-components-2026-02-02-153603
