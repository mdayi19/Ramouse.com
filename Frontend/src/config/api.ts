
import { BASE_URL } from '../lib/api';

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

    // Use BASE_URL from lib/api which is already configured correctly (https://ramouse.com in dev)
    const serverUrl = BASE_URL || '';

    // Construct full URL pointing to storage root
    // If serverUrl is empty (prod maybe), result is /storage/... which is correct for same-origin
    // If serverUrl is https://ramouse.com (dev), result is https://ramouse.com/storage/...
    return `${serverUrl}/storage/${cleanPath}`;
};
