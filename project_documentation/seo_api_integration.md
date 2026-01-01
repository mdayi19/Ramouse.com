# SEO Management API Integration

## Overview
The SEO Management feature has been fully integrated with the backend API. SEO settings are stored in the system settings table and can be managed through the admin dashboard.

## Backend Implementation

### 1. Database Structure
SEO settings are stored as a JSON object in the `system_settings` table under the key `seoSettings`.

**Fields included:**
- `title` - Page title for search engines
- `description` - Meta description
- `keywords` - Meta keywords
- `canonicalUrl` - Canonical URL
- `themeColor` - Browser theme color
- `ogType` - Open Graph type (website, article, etc.)
- `ogUrl` - Open Graph URL
- `ogTitle` - Open Graph title
- `ogDescription` - Open Graph description
- `ogImage` - Open Graph image URL
- `twitterCard` - Twitter card type
- `twitterUrl` - Twitter URL
- `twitterTitle` - Twitter title
- `twitterDescription` - Twitter description
- `twitterImage` - Twitter image URL
- `jsonLd` - Structured data (JSON-LD)

### 2. API Endpoints

#### Get Settings
```
GET /api/admin/settings
```
Returns all system settings including SEO settings.

**Response:**
```json
{
  "logoUrl": "...",
  "appName": "...",
  "seoSettings": {
    "title": "Ramouse Auto Parts | راموسة لقطع غيار السيارات",
    "description": "...",
    "ogImage": "https://ramouse.com/og-image.png",
    ...
  },
  ...
}
```

#### Update Settings
```
PUT /api/admin/settings
```
Updates system settings including SEO settings. **Supports base64 image uploads** for `ogImage` and `twitterImage`.

**Request Body:**
```json
{
  "seoSettings": {
    "title": "New Title",
    "ogImage": "data:image/png;base64,iVBORw0KG...",
    "twitterImage": "data:image/jpeg;base64,/9j/4AAQ..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    ...updated settings...
  }
}
```

### 3. Image Upload Handling

The `SettingsController` automatically detects base64-encoded images in the `ogImage` and `twitterImage` fields and:
1. Decodes the base64 string
2. Saves the image to `storage/app/public/seo/`
3. Returns the public URL path (`/storage/seo/filename.ext`)
4. Stores the URL in the database

**Supported formats:** JPG, PNG, GIF

### 4. Database Seeder

Run the seeder to populate initial SEO settings:
```bash
php artisan db:seed --class=SystemSettingSeeder
```

## Frontend Implementation

### 1. Component
The `SeoManagementView.tsx` component is located at:
```
Frontend/src/components/DashboardParts/SeoManagementView.tsx
```

### 2. Integration with Admin Dashboard
The component is already integrated in `AdminDashboard.tsx` and accessible via the "إدارة SEO" menu item.

### 3. Data Flow

**Loading Settings:**
1. When admin logs in, `useAppState` hook fetches settings via `AdminService.getSettings()`
2. Settings (including `seoSettings`) are stored in React state
3. `SeoManagementView` receives `settings.seoSettings` as prop

**Saving Settings:**
1. User edits SEO fields in `SeoManagementView`
2. User uploads images (converted to base64)
3. On submit, `onSave({ seoSettings: updatedSettings })` is called
4. `updateSettings` in `useAppState` calls `AdminService.updateSettings()`
5. API processes the request (saves images, updates database)
6. Settings are updated in React state
7. Success toast is shown

### 4. Service Layer

The `AdminService` already has methods for settings:

```typescript
// In Frontend/src/services/admin.service.ts
getSettings: async () => {
  const response = await api.get('/admin/settings');
  return response.data;
},

updateSettings: async (settings: any) => {
  const response = await api.put('/admin/settings', settings);
  return response.data;
},
```

## Testing

### Manual Testing Steps

1. **Login as Admin**
   - Navigate to `/admin` 
   - Use admin credentials

2. **Access SEO Management**
   - Click "إدارة SEO" in the sidebar under "محتوى الموقع"

3. **Edit SEO Settings**
   - Modify any text fields
   - Upload images for Open Graph and Twitter
   - Click "حفظ التغييرات"

4. **Verify Save**
   - Check for success toast message
   - Refresh the page
   - Confirm changes persist

5. **Check API Response**
   - Open browser DevTools > Network tab
   - Edit and save SEO settings
   - Check the PUT request to `/api/admin/settings`
   - Verify response contains updated settings

### API Testing with cURL

**Get Settings:**
```bash
curl -X GET http://localhost:8000/api/admin/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Update SEO Settings:**
```bash
curl -X PUT http://localhost:8000/api/admin/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "seoSettings": {
      "title": "Updated Title",
      "description": "Updated Description"
    }
  }'
```

## File Locations

### Backend
- Controller: `Backend/app/Http/Controllers/Admin/SettingsController.php`
- Model: `Backend/app/Models/SystemSettings.php`
- Routes: `Backend/routes/api.php` (lines 119-120)
- Seeder: `Backend/database/seeders/SystemSettingSeeder.php`

### Frontend
- Component: `Frontend/src/components/DashboardParts/SeoManagementView.tsx`
- Service: `Frontend/src/services/admin.service.ts`
- Hook: `Frontend/src/hooks/useAppState.ts`
- Types: `Frontend/src/types.ts` (lines 511-528, 559)

## Notes

1. **Authentication Required:** All settings endpoints require admin authentication via Sanctum token
2. **Image Storage:** Uploaded images are stored in `storage/app/public/seo/` and served via `/storage/seo/`
3. **Automatic Sync:** Settings are automatically loaded from the API when admin logs in
4. **Local Fallback:** If API is unavailable, settings fall back to localStorage cache
5. **Real-time Updates:** Settings updates are immediately reflected in the UI after save

## Future Enhancements

- Add validation for SEO field lengths and formats
- Implement image optimization for uploaded OG/Twitter images
- Add preview of how the page will appear in search results and social media
- Support for multiple languages/locales in SEO settings
- Automated SEO auditing and recommendations
