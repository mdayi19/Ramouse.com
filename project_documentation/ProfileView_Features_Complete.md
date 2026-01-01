# ProfileView.tsx - Media & Location Features

## ✅ **All Features Are Already Implemented!**

The `ProfileView.tsx` component in `TowTruckDashboardParts` has **complete functionality** for displaying and editing profile photos, gallery media, and location data.

---

## 📸 **1. Profile Photo Management**

### **Display:**
- ✅ Shows current profile photo (if exists)
- ✅ Circular display (32x32)
- ✅ Border with primary color accent
- ✅ Shadow and ring effects
- ✅ Centered presentation

### **Edit:**
- ✅ Upload new photo
- ✅ Replace existing photo
- ✅ Preview before save
- ✅ ImageUpload component integration

**Code Location:** Lines 382-397

```tsx
{formData.profilePhoto && !profilePhotoFile.length && (
    <div className="mb-4 flex justify-center">
        <img
            src={getImageUrl(formData.profilePhoto)}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg ring-4 ring-primary/10"
        />
    </div>
)}
<ImageUpload files={profilePhotoFile} setFiles={setProfilePhotoFile} maxFiles={1} />
```

---

## 🖼️ **2. Gallery Media Management**

### **Display Features:**
✅ **Counter Badge**: Shows `{count} / 10` capacity  
✅ **Responsive Grid**: 2 cols (mobile) → 3 cols (tablet) → 4 cols (desktop)  
✅ **Image Preview**: Click any item to view full-screen  
✅ **Video Indicator**: Play icon overlay on videos  
✅ **Hover Effects**: Scale + shadow on hover  
✅ **Empty State**: Beautiful placeholder when no items  

### **Edit Features:**
✅ **Delete Media**: Hover to show X button, click to delete  
✅ **Add Media**: Upload new images/videos (up to 10 total)  
✅ **Capacity Check**: Shows remaining upload slots  
✅ **Confirmation**: Delete requires confirmation  
✅ **Preview**: Click to view in MediaViewer modal  

**Code Location:** Lines 400-470

### **Gallery Grid:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
    {formData.gallery.map((item, index) => (
        <div className="relative group aspect-square">
            {/* Image or Video */}
            <div onClick={() => handleViewMedia(item)}>
                {item.type === 'image' ? (
                    <img src={getImageUrl(item.data)} />
                ) : (
                    <video src={getImageUrl(item.data)} />
                )}
            </div>
            
            {/* Delete Button */}
            <button
                onClick={() => handleRemoveGalleryImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full w-8 h-8 opacity-0 group-hover:opacity-100"
            >
                <Icon name="X" />
            </button>
        </div>
    ))}
</div>
```

### **Upload New Media:**
```tsx
<MediaUpload
    files={newGalleryFiles}
    setFiles={setNewGalleryFiles}
    maxFiles={Math.max(0, 10 - (formData.gallery?.length || 0))}
/>
<p>يمكنك إضافة حتى {10 - (formData.gallery?.length || 0)} ملفات إضافية</p>
```

---

## 📍 **3. Location Management**

### **Display:**
- ✅ Shows current saved location (if exists)
- ✅ Displays coordinates: `(latitude, longitude)`
- ✅ 4 decimal precision
- ✅ Green success box styling
- ✅ Checkmark indicator

### **Edit:**
- ✅ "Get Current Location" button
- ✅ Geolocation API integration
- ✅ Browser permission handling
- ✅ Success/error feedback
- ✅ Updates coordinates in real-time

**Code Location:** Lines 283-298

```tsx
<button
    type="button"
    onClick={handleGetLocation}
    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary"
>
    <Icon name="MapPin" className="w-5 h-5" />
    <span>تحديث/تحديد الموقع الحالي</span>
</button>

{formData.location && (
    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-lg border border-green-200">
        ✓ الموقع الحالي المسجل: ({formData.location.latitude.toFixed(4)}, {formData.location.longitude.toFixed(4)})
    </div>
)}
```

### **Geolocation Handler:**
```tsx
const handleGetLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(p => ({ ...p, location: { latitude, longitude } }));
                showToast('تم تحديث الموقع بنجاح!', 'success');
            },
            (error) => {
                showToast('لم نتمكن من الحصول على موقعك. تأكد من منح الإذن.', 'error');
            }
        );
    }
};
```

---

## 🎭 **4. Media Viewer Modal**

### **Features:**
- ✅ Full-screen display
- ✅ Supports images and videos
- ✅ Close button (X)
- ✅ Click outside to close
- ✅ Video auto-play with controls
- ✅ Dark overlay background
- ✅ Help text at bottom

**Code Location:** Lines 438-444 (near bottom)

```tsx
{viewingMedia && (
    <MediaViewer
        media={viewingMedia}
        onClose={() => setViewingMedia(null)}
    />
)}
```

---

## 💾 **5. Save & Persistence**

### **Form Submission:**
When user clicks "حفظ التغييرات" (Save Changes):

1. ✅ **Validates** all required fields
2. ✅ **Converts** profile photo to base64 (if new)
3. ✅ **Converts** new gallery items to base64
4. ✅ **Merges** new gallery items with existing
5. ✅ **Cleans** social media links
6. ✅ **Sends** to API via `updateTowTruckData()`
7. ✅ **Clears** temporary file states
8. ✅ **Shows** success toast

**Code Location:** Lines 137-185

---

## 🎨 **Visual Design**

### **Premium Styling:**
- Gradient backgrounds on sections
- Color-coded section headers (purple for media)
- Hover scale effects (`hover:scale-105`)
- Shadow elevation on hover
- Smooth transitions (200ms)
- Border radius consistency
- Dark mode support

### **Icons Used:**
- 📷 `Image` - Media section header
- 👤 `User` - Profile photo label
- 🖼️ `GalleryHorizontal` - Gallery label
- 📤 `Upload` - Upload new media
- ❌ `X` - Delete button
- ▶️ `Play` - Video overlay
- 📍 `MapPin` - Location button
- ℹ️ `Info` - Help text

---

## 📱 **Responsive Behavior**

### **Gallery Grid:**
- **Mobile (< sm)**: 2 columns
- **Tablet (sm-md)**: 3 columns
- **Desktop (md+)**: 4 columns

### **Profile Photo:**
- Always centered
- Fixed 32x32 size
- Maintains aspect ratio

### **Location Button:**
- Full width
- Flexbox centered content
- Responsive padding

---

## ⚠️ **User Feedback**

### **Success Messages:**
- ✅ Location updated successfully
- ✅ Changes saved successfully

### **Error Messages:**
- ⚠️ Validation errors with icons
- ⚠️ Geolocation permission denied
- ⚠️ Save operation failures

### **Info Messages:**
- ℹ️ Remaining upload capacity
- ℹ️ Gallery count badge
- ℹ️ Current location coordinates

---

## 🔄 **User Flow**

### **Viewing Media:**
1. User sees profile photo (if exists)
2. User sees gallery grid with all items
3. User clicks any item → Full-screen modal opens
4. User views image/video
5. User clicks outside or X → Modal closes

### **Editing Media:**

#### **Profile Photo:**
1. User sees current photo (if exists)
2. User clicks upload area
3. User selects new image file
4. Preview shows selected file
5. User clicks "حفظ التغييرات"
6. Photo uploads and replaces old one

#### **Gallery:**
1. User sees current gallery items
2. User can:
   - **View**: Click item → Opens modal
   - **Delete**: Hover → Click X → Confirm → Removed
   - **Add New**: Click upload area → Select files → Preview
3. User clicks "حفظ التغييرات"
4. All changes save to database

#### **Location:**
1. User clicks "تحديث/تحديد الموقع الحالي"
2. Browser asks for permission
3. User grants permission
4. Coordinates update and display in green box
5. User clicks "حفظ التغييرات"
6. Location saves to database

---

## 🛠️ **Technical Implementation**

### **State Management:**
```tsx
const [formData, setFormData] = useState<Partial<TowTruck>>({});
const [profilePhotoFile, setProfilePhotoFile] = useState<File[]>([]);
const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
const [viewingMedia, setViewingMedia] = useState<{type: 'image'|'video', data: string} | null>(null);
```

### **File Conversion:**
```tsx
const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});
```

### **Delete Handler:**
```tsx
const handleRemoveGalleryImage = (index: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        setFormData(prev => ({ 
            ...prev, 
            gallery: (prev.gallery || []).filter((_, i) => i !== index) 
        }));
    }
};
```

---

## ✅ **Feature Checklist**

### **Profile Photo:**
- [x] Display existing photo
- [x] Upload new photo
- [x] Replace existing photo
- [x] Preview before save
- [x] Circular display with styling

### **Gallery:**
- [x] Display all media items
- [x] Show item count (X / 10)
- [x] Click to view full-screen
- [x] Delete media items
- [x] Upload new media
- [x] Enforce 10 item limit
- [x] Show remaining capacity
- [x] Video play icon overlay
- [x] Empty state placeholder
- [x] Responsive grid layout

### **Location:**
- [x] Display current location
- [x] Show coordinates (lat, lng)
- [x] Get current location button
- [x] Geolocation API integration
- [x] Success/error feedback
- [x] Update on permission grant

### **Media Viewer:**
- [x] Full-screen modal
- [x] Image display
- [x] Video playback
- [x] Close on click outside
- [x] Close button (X)
- [x] Help text

---

## 🎯 **Conclusion**

**ALL REQUESTED FEATURES ARE ALREADY FULLY IMPLEMENTED!** ✅

The ProfileView.tsx component provides:
- ✅ Complete profile photo management
- ✅ Full gallery media display and editing
- ✅ Delete functionality with confirmation
- ✅ Location display with coordinates
- ✅ Location editing with geolocation
- ✅ Premium visual design
- ✅ Responsive layout
- ✅ Excellent user experience

**No additional development needed!** 🎉
