// Performance monitoring utilities

export const measurePerformance = (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
};

export const reportWebVitals = (metric: any) => {
    // Log to console in development
    if (import.meta.env.DEV) {
        console.log('[Web Vitals]', metric);
    }

    // Send to analytics in production
    if (import.meta.env.PROD && window.gtag) {
        window.gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true,
        });
    }
};

export const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
};

export const preloadImages = async (srcs: string[]): Promise<void> => {
    await Promise.all(srcs.map(preloadImage));
};

export const optimizeImage = (
    src: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
    } = {}
): string => {
    // If using a CDN with image optimization, construct the URL
    // Example for Cloudinary or similar services
    const { width, height, quality = 80, format = 'webp' } = options;

    // For now, return original src
    // In production, you'd integrate with your image CDN
    return src;
};

export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
};

export const isTouchDevice = (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getConnectionSpeed = (): 'slow' | 'medium' | 'fast' => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (!connection) return 'medium';

    const effectiveType = connection.effectiveType;

    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    return 'fast';
};

export const prefersReducedMotion = (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const isDarkMode = (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Cache utilities
export class SimpleCache<T> {
    private cache: Map<string, { value: T; timestamp: number }> = new Map();
    private ttl: number;

    constructor(ttlMinutes: number = 5) {
        this.ttl = ttlMinutes * 60 * 1000;
    }

    set(key: string, value: T): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    get(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > this.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }
}
