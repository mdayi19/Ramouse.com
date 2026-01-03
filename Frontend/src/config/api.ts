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

    // Fix for Mixed Content: If on HTTPS but API is localhost (default), use relative path
    // This assumes Nginx is configured to serve /storage locally
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.includes('localhost')) {
        return `/storage/${path}`;
    }

    // Construct full URL with API base
    return `${API_BASE_URL}/storage/${path}`;
};
