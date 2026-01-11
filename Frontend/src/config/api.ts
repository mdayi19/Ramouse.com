// API Configuration
// This will work both locally and in production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to get full storage URL
export const getStorageUrl = (path: string): string => {
    if (!path) return '';

    // If it's a blob URL, return as is
    if (path.startsWith('blob:')) {
        return path;
    }

    // Fix incorrect port from old database records
    if (path.includes('localhost:8001')) {
        return path.replace('localhost:8001', 'localhost:8000');
    }

    // If it's already a full URL with correct configuration, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Clean up path: remove leading slashes and 'storage/' prefix to avoid duplication
    let cleanPath = path.replace(/^\/+/, ''); // Remove leading slashes
    if (cleanPath.startsWith('storage/')) {
        cleanPath = cleanPath.substring(8); // Remove 'storage/' prefix
    }

    // Determine Base URL for storage
    // If API_BASE_URL ends with /api, remove it to get the server root
    const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

    // Construct full URL pointing to storage root
    return `${SERVER_URL}/storage/${cleanPath}`;
};
