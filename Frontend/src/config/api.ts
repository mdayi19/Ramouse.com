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

    // Construct full URL with API base
    return `${API_BASE_URL}/storage/${path}`;
};
