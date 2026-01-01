# TowTruck Profile Management - Implementation Documentation

## Overview
This document outlines the complete implementation of the TowTruck Profile Management system, including frontend components, backend API, validation, and error handling.

## Architecture

### Frontend Components

#### 1. **ProfileView.tsx** (`Frontend/src/components/TowTruckDashboardParts/ProfileView.tsx`)
The main component for tow truck operators to manage their profiles.

**Features:**
- Profile photo upload with preview
- Gallery management (add/remove multiple images/videos)
- Social media links (WhatsApp, Facebook, Instagram)
- Location detection using browser Geolocation API
- Form validation with error feedback
- Print/PDF export functionality
- Loading states and error handling

**Key Improvements:**
- ✅ Added comprehensive form validation
- ✅ Better error handling with user-friendly messages
- ✅ Visual feedback for validation errors
- ✅ Improved UX with loading states
- ✅ Gallery size limits with user feedback
- ✅ WhatsApp number format validation (9639XXXXXXXX)

#### 2. **TowTruckService** (`Frontend/src/services/tow-truck.service.ts`)
Dedicated service for all tow truck-related API calls.

**Methods:**
- `getAll()` - Fetch allactive and verified tow trucks
- `getById(id)` - Get a specific tow truck
- `updateProfile(truckId, data)` - Update tow truck profile
- `rate(truckId, rating, review?)` - Rate a tow truck
- `toggleFavorite(truckId)` - Toggle favorite status
- `search(filters)` - Search with filters

### Backend API

#### 1. **AuthController** (`Backend/app/Http/Controllers/AuthController.php`)

**Endpoint:** `PUT /api/profile`
**Method:** `updateProfile(Request $request)`

**Handles:**
- ✅ Basic profile fields (name, city, vehicleType, serviceArea, description)
- ✅ Profile photo (base64 → storage)
- ✅ Gallery items (array of {type, data})
- ✅ Social media links (object)
- ✅ Location (latitude, longitude → PostGIS POINT)
- ✅ Password updates

**File Upload Processing:**
- Accepts base64-encoded images/videos
- Saves to `storage/app/public/tow_trucks/profile_photos` and `./gallery`
- Returns storage URLs for frontend consumption
- Handles both new uploads and existing URLs

**Location Handling:**
Uses PostgreSQL PostGIS to store geolocation data:
```php
DB::table('tow_trucks')
    ->where('id', $user->id)
    ->update(['location' => DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)")]);
```

#### 2. **DirectoryController** (`Backend/app/Http/Controllers/DirectoryController.php`)

**Endpoints:**
- `GET /api/directory/tow-trucks` - List all tow trucks
- `GET /api/directory/tow-trucks/{id}` - Get specific tow truck

**Response Format:**
```json
{
  "data": {
    "id": "string",
    "uniqueId": "string",
    "name": "string",
    "vehicleType": "string",
    "city": "string",
    "serviceArea": "string",
    "description": "string",
    "isVerified": boolean,
    "isActive": boolean,
    "profilePhoto": "string",
    "gallery": [{"type": "image|video", "data": "url"}],
    "socials": {"facebook": "string", "instagram": "string", "whatsapp": "string"},
    "qrCodeUrl": "string",
    "averageRating": number,
    "location": {"latitude": number, "longitude": number},
    "reviews": []
  }
}
```

### Database Schema

#### **tow_trucks** Table
```sql
- id (string, primary key, phone number)
- unique_id (string, 6-digit unique identifier)
- name (string)
- password (hashed)
- vehicle_type (string)
- city (string)
- service_area (string, nullable)
- location (POINT geometry, nullable) -- PostGIS spatial data
- description (text, nullable)
- is_verified (boolean, default: false)
- is_active (boolean, default: true)
- profile_photo (string URL, nullable)
- gallery (JSON array, nullable)
- socials (JSON object, nullable)
- qr_code_url (string, nullable)
- notification_settings (JSON, nullable)
- flash_purchases (JSON array, nullable)
- average_rating (decimal, nullable)
- registration_date (timestamp)
- created_at, updated_at (timestamps)
```

### Data Flow

#### Profile Update Flow:
```
User fills form → Validates input → Converts files to base64 
→ Calls updateTowTruckData() → AuthService.updateProfile() 
→ Backend receives data → Validates & processes files 
→ Saves to storage → Updates database 
→ Returns updated data → UI updates → Shows success message
```

#### Location Update Flow:
```
User clicks "Get Location" → Browser requests permission 
→ User grants → Gets lat/lng → Updates form state 
→ Saves with profile → Backend converts to PostGIS POINT 
→ Stored in database → Retrieved as {latitude, longitude}
```

## Form Validation

### Frontend Validation Rules:
1. **Name**: Minimum 3 characters, required
2. **Vehicle Type**: Required, must be from predefined list
3. **City**: Required, must be Syrian city
4. **WhatsApp**: Optional, format `9639XXXXXXXX` (12 digits starting with 9639)
5. **Gallery**: Maximum 10 items total

### Backend Validation:
- Handled by Laravel's validation system
- Additional custom validation in `AuthController::updateProfile()`
- File type validation (images/videos only)
- Size limits enforced

## Security Considerations

1. **Authentication**: All profile updates require valid Sanctum token
2. **Authorization**: Users can only update their own profiles
3. **File Upload**: 
   - Base64 validation prevents malicious uploads
   - File extension checking
   - Storage in isolated directory
4. **SQL Injection**: Protected via Eloquent ORM and parameter binding
5. **XSS**: React automatically escapes output

## Error Handling

### Frontend:
- Form validation errors displayed inline
- API errors caught and displayed as toasts
- Loading states prevent double submissions
- Fallback error messages for unexpected errors

### Backend:
- Try-catch blocks for file operations
- Database transaction support
- Graceful degradation for PostGIS operations
- Detailed error logging

## Testing Checklist

- [ ] Profile photo upload
- [ ] Gallery add/remove
- [ ] Social media links save
- [ ] Location detection
- [ ] Form validation (all fields)
- [ ] WhatsApp format validation
- [ ] PDF export
- [ ] Print functionality
- [ ] Error handling (network errors)
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] Dark mode compatibility

## Future Enhancements

1. **Image Optimization**: Compress images client-side before upload
2. **Progress Indicators**: Show upload progress for large files
3. **Drag & Drop**: Gallery reordering
4. **Crop Tool**: Built-in image cropping for profile photos
5. **Video Thumbnails**: Auto-generate thumbnails for gallery videos
6. **Batch Operations**: Delete multiple gallery items at once
7. **Undo/Redo**: For gallery operations
8. **Preview Mode**: See how profile looks to customers before saving

## API Documentation

### Update Profile
**Endpoint:** `PUT /api/profile`  
**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "string",
  "vehicleType": "string",
  "city": "string",
  "serviceArea": "string",
  "description": "string",
  "profilePhoto": "base64 string or URL",
  "gallery": [
    {"type": "image", "data": "base64 or URL"},
    {"type": "video", "data": "base64 or URL"}
  ],
  "socials": {
    "whatsapp": "9639XXXXXXXX",
    "facebook": "https://facebook.com/...",
    "instagram": "username"
  },
  "location": {
    "latitude": 33.5138,
    "longitude": 36.2765
  },
  "password": "new_password (optional)"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

## Troubleshooting

### Images not displaying
- Check storage link: `php artisan storage:link`
- Verify `BASE_URL` in frontend config
- Check file permissions on `storage/app/public`

### Location not saving
- Ensure PostGIS extension is installed
- Verify `location` column type is `GEOMETRY`
- Check browser permissions for geolocation

### Validation errors
- Check frontend console for detailed error messages
- Verify backend logs in `storage/logs/laravel.log`
- Ensure all required fields are present

## Dependencies

### Frontend:
- React 18+
- TypeScript
- Axios (HTTP client)
- html2pdf.js (PDF generation)

### Backend:
- Laravel 10+
- Sanctum (Authentication)
- PostGIS (Geolocation)
- Storage (File handling)

## Maintenance

- Regularly clean up orphaned images in storage
- Monitor storage disk usage
- Review and optimize database queries
- Keep dependencies updated
- Backup database regularly (especially spatial data)

---

**Last Updated:** 2025-11-26  
**Version:** 1.0.0  
**Author:** Development Team
