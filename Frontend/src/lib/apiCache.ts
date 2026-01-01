import axios, { AxiosResponse } from 'axios';

// API Request Cache and Deduplication Layer
interface CacheEntry {
    data: any;
    timestamp: number;
    expiresAt: number;
}

interface PendingRequest {
    promise: Promise<AxiosResponse>;
    timestamp: number;
}

class APICache {
    private cache: Map<string, CacheEntry> = new Map();
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private readonly DEFAULT_TTL = 60000; // 1 minute
    private readonly MAX_CACHE_SIZE = 100;

    /**
     * Get cached data if available and not expired
     */
    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set cache entry with TTL
     */
    set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
        // Implement LRU-like behavior
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
        });
    }

    /**
     * Check if a request is pending (for deduplication)
     */
    getPendingRequest(key: string): Promise<AxiosResponse> | null {
        const pending = this.pendingRequests.get(key);
        if (!pending) return null;

        // Clean up old pending requests (> 30 seconds)
        if (Date.now() - pending.timestamp > 30000) {
            this.pendingRequests.delete(key);
            return null;
        }

        return pending.promise;
    }

    /**
     * Register a pending request
     */
    setPendingRequest(key: string, promise: Promise<AxiosResponse>): void {
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now(),
        });

        // Auto-cleanup when promise resolves
        promise.finally(() => {
            this.pendingRequests.delete(key);
        });
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Clear cache by pattern
     */
    clearPattern(pattern: RegExp): void {
        const keysToDelete: string[] = [];
        this.cache.forEach((_, key) => {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            pending: this.pendingRequests.size,
        };
    }
}

// Create singleton instance
export const apiCache = new APICache();

/**
 * Create cache key from URL and params
 */
export function createCacheKey(url: string, method: string = 'GET', params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
}

/**
 * Determine if request should be cached (only GET requests by default)
 */
export function shouldCache(method: string, url: string): boolean {
    // Only cache GET requests
    if (method.toUpperCase() !== 'GET') return false;

    // Don't cache real-time endpoints
    if (url.includes('/notifications') || url.includes('/realtime')) return false;

    return true;
}

/**
 * Clear cache when mutations occur
 */
export function invalidateCache(patterns: string[]) {
    patterns.forEach(pattern => {
        apiCache.clearPattern(new RegExp(pattern));
    });
}
