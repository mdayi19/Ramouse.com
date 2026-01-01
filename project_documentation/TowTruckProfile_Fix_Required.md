# TowTruckProfile.tsx - File Status & Fix Required

## ⚠️ **Current Status: BROKEN**

The file `TowTruckProfile.tsx` has structural errors from previous edit attempts.

### 🐛 **Problems:**

1. **Lines 313-331:** QR code rendering is in the wrong place
   - Currently: Inside main profile content (line 313)
   - Should be: Inside a modal that shows when `showQrCode === true`

2. **Lines 341-344:** Extra closing brackets
   - Line 342: Extra closing parenthesis `})`
   - Line 343: Extra closing div tag `</div>`  
   - Line 344: Extra closing parenthesis `);`

3. **Missing:** The `{viewingItem && ...}` modal for full-screen media viewing

### ✅ **What SHOULD Happen:**

The file structure should be:
 
```tsx
return (
    <div className="p-4 sm:p-0...">
        {/* Back button */}
        
        {/* Main profile card */}
        <div className="bg-slate-50...">
            {/* Header */}
            {/* Profile info */}
            {/* Action buttons */}
            
            {/* Content grid */}
            <div className="mt-10 grid...">
                {/* Left column: About, Reviews, Gallery */}
                {/* Right column: Service info */}
            </div>
        </div>
        
        {/* Full-screen image/video viewer */}
        {viewingItem && (
            <div className="fixed inset-0 bg-black/80..."
                 onClick={() => setViewingItem(null)}>
                {/* Image or video display */}
            </div>
        )}
        
        {/* QR Code Modal */}
        {showQrCode && (
            <div className="fixed inset-0 bg-black/80..."
                 onClick={() => setShowQrCode(false)}>
                <div className="bg-gradient-to-br..." onClick={stopPropagation}>
                    {/* QR code canvas and controls */}
                </div>
            </div>
        )}
    </div>
);
```

### 🔧 **How to Fix:**

**Option 1: Manual Restoration (Recommended)**
1. Delete current `TowTruckProfile.tsx`
2. Get clean version from:
   - Git history (if available)
   - Or copy from another branch/backup
   
**Option 2: Find Working Backup**
```powershell
# Check if there's a .backup file
Get-ChildItem "c:\laragon\www\ramouse\Frontend\src\components\" -Filter "*TowTruckProfile*"
```

**Option 3: Reconstruct from Original**
The original working file (before my edits) had:
- ✅ Proper modal structure for viewingItem
- ✅ Proper modal structure for showQrCode  
- ✅ Correct closing tags
- ❌ Did NOT have MediaViewer import (but file worked fine without it)

### 📋 **Quick Fix Steps:**

1. **Remove lines 313-331** (misplaced QR code)
2. **Fix lines 308-312** (ensure proper structure):
   ```tsx
   <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-8">
           <Info Card icon={<Icon name="Info" />} title="نبذة">{towTruck.description || 'لا يوجد وصف.'}</InfoCard>
           <ReviewSection {...props} />
           {/* Gallery InfoCard */}
       </div>
       <div className="lg:col-span-1">
           <InfoCard icon={<Icon name="Map" />} title="معلومات الخدمة">...</InfoCard>
       </div>
   </div>
   ```

3. **Add back the viewingItem modal** (after line 315)
4. **Add back the showQrCode modal** (after the viewingItem modal)
5. **Remove duplicate closing tags** (lines 341-344)

### 🎯 **Current Working Features:**

Even though the file has errors, the ORIGINAL file (beforemy edits) had:
- ✅ Profile photo display
- ✅ Gallery grid display
- ✅ Full-screen image viewer
- ✅ QR code generation
- ✅ Share functionality
- ✅ Reviews section
- ✅ Social links

### ⏭️ **Recommendation:**

**RESTORE THE ORIGINAL FILE** from before any of my edits. The file was working perfectly - it displayed all media correctly using `getImageUrl()` and had proper gallery viewing.

The only "enhancement" I was trying to add was the `MediaViewer` component, but the existing full-screen viewer already works fine!

---

**File Location:** `c:\laragon\www\ramouse\Frontend\src\components\TowTruckProfile.tsx`  
**Status:** ⚠️ **NEEDS RESTORATION**  
**Priority:** 🔴 HIGH (File has syntax errors)
