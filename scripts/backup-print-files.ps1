# Print Components Backup Script
# Purpose: Backup all print-related files before implementing mobile print fix
# Date: 2026-02-02

$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "c:\laragon\www\ramouse\backups\print-components-$timestamp"
$sourceDir = "c:\laragon\www\ramouse\Frontend\src\components"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Print Components Backup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Files to backup
$files = @(
    "shared\PrintPreviewModal.tsx",
    "ShippingReceipt.tsx",
    "PrintableTechnicianProfile.tsx",
    "PrintableTowTruckProfile.tsx",
    "Store\CustomerStoreReceipt.tsx",
    "DashboardParts\Store\StoreReceipt.tsx",
    "TechnicianDashboardParts\ProfileView.tsx",
    "TowTruckDashboardParts\ProfileView.tsx",
    "CarMarketplace\PrintableCarProviderProfile.tsx",
    "CarMarketplace\CarProviderDashboard\PrintableSaleCar.tsx",
    "CarMarketplace\CarProviderDashboard\PrintableRentCar.tsx",
    "CarMarketplace\CarProviderDashboard\ListingsView.tsx",
    "CarMarketplace\CarProviderDashboard\SettingsView.tsx",
    "CarMarketplace\SharedCarListings\UserPrintableSaleCar.tsx",
    "CarMarketplace\SharedCarListings\UserPrintableRentCar.tsx",
    "CarMarketplace\SharedCarListings\MyCarListingsView.tsx"
)

# Create backup directory
Write-Host "Creating backup directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Write-Host "✅ Created: $backupDir" -ForegroundColor Green
Write-Host ""

# Backup each file
Write-Host "Backing up files..." -ForegroundColor Yellow
$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $sourcePath = Join-Path $sourceDir $file
    $destPath = Join-Path $backupDir $file
    
    # Create directory structure
    $destDir = Split-Path $destPath
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    
    # Copy file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✅ $file" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ⚠️  NOT FOUND: $file" -ForegroundColor Yellow
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Create backup info file
$readmeContent = @"
# Print Components Backup
Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Purpose: Backup before mobile print/PDF fix implementation

## Backup Summary
- Total files to backup: $($files.Count)
- Successfully backed up: $successCount
- Not found: $failCount

## Files Included
$(
    $files | ForEach-Object { "- $_" }
    $files -join "`n- "
)

## Restore Instructions

### Restore Single File
To restore a specific file:

1. Open PowerShell
2. Run:
   Copy-Item "$backupDir\[filename].tsx" "c:\laragon\www\ramouse\Frontend\src\components\[filename].tsx" -Force

Example:
   Copy-Item "$backupDir\ShippingReceipt.tsx" "c:\laragon\www\ramouse\Frontend\src\components\ShippingReceipt.tsx" -Force

### Restore All Files
To restore all files:

1. Open PowerShell
2. Run:
   Copy-Item "$backupDir\*" "c:\laragon\www\ramouse\Frontend\src\components\" -Recurse -Force

### Git Restore Alternative
If you created a git backup branch:

1. Open terminal in project root
2. Run:
   git checkout backup/before-print-fix-2026-02-02

## Contact
If you need help restoring files, refer to:
c:\laragon\www\ramouse\project_documentation\mobile_print_compatibility_safety.md

## Backup Location
$backupDir
"@

$readmeContent | Out-File -FilePath (Join-Path $backupDir "README.txt") -Encoding UTF8

# Summary
Write-Host ""
Write-Host "✅ BACKUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Files backed up: $successCount" -ForegroundColor White
if ($failCount -gt 0) {
    Write-Host "  - Files not found: $failCount" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "📂 Backup Location:" -ForegroundColor Cyan
Write-Host "  $backupDir" -ForegroundColor White
Write-Host ""
Write-Host "📄 For restore instructions, see:" -ForegroundColor Cyan
Write-Host "  $backupDir\README.txt" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ You can now safely proceed with the implementation!" -ForegroundColor Green
Write-Host ""

# Pause so user can read the output
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
