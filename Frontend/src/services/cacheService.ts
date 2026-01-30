// Cache Service for Managing Browser Caches
// Handles localStorage, Service Worker, and IndexedDB cache operations

export interface CacheStats {
    localStorage: {
        size: number;
        items: number;
        sizeInMB: string;
    };
    serviceWorker: {
        available: boolean;
        caches: CacheInfo[];
        totalSize: number;
        totalSizeInMB: string;
    };
    indexedDB: {
        databases: string[];
        count: number;
    };
    version: string;
    lastCleared: string | null;
}

export interface CacheInfo {
    name: string;
    size: number;
    resourceCount: number;
}

class CacheService {
    private broadcastChannel: BroadcastChannel | null = null;

    constructor() {
        // Initialize BroadcastChannel for cross-tab communication
        if ('BroadcastChannel' in window) {
            this.broadcastChannel = new BroadcastChannel('cache-updates');
        }
    }

    /**
     * Get comprehensive cache statistics
     */
    async getCacheStatistics(): Promise<CacheStats> {
        const localStorageStats = this.getLocalStorageStats();
        const serviceWorkerStats = await this.getServiceWorkerStats();
        const indexedDBStats = await this.getIndexedDBStats();
        const version = localStorage.getItem('cache_version') || 'Unknown';
        const lastCleared = localStorage.getItem('last_cache_cleared');

        return {
            localStorage: localStorageStats,
            serviceWorker: serviceWorkerStats,
            indexedDB: indexedDBStats,
            version,
            lastCleared
        };
    }

    /**
     * Get localStorage statistics
     */
    private getLocalStorageStats() {
        let totalSize = 0;
        let items = 0;

        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        totalSize += key.length + value.length;
                        items++;
                    }
                }
            }
        } catch (error) {
            console.error('Error calculating localStorage size:', error);
        }

        // Convert to bytes (each character is 2 bytes in JavaScript)
        const sizeInBytes = totalSize * 2;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

        return {
            size: sizeInBytes,
            items,
            sizeInMB: `${sizeInMB} MB`
        };
    }

    /**
     * Get Service Worker cache statistics
     */
    private async getServiceWorkerStats() {
        const stats = {
            available: false,
            caches: [] as CacheInfo[],
            totalSize: 0,
            totalSizeInMB: '0 MB'
        };

        if (!('caches' in window)) {
            return stats;
        }

        try {
            stats.available = true;
            const cacheNames = await caches.keys();

            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                let cacheSize = 0;

                // Estimate cache size by fetching response sizes
                for (const request of keys) {
                    try {
                        const response = await cache.match(request);
                        if (response && response.headers.get('content-length')) {
                            cacheSize += parseInt(response.headers.get('content-length') || '0', 10);
                        }
                    } catch (error) {
                        // Skip errors for individual items
                    }
                }

                stats.caches.push({
                    name,
                    size: cacheSize,
                    resourceCount: keys.length
                });

                stats.totalSize += cacheSize;
            }

            stats.totalSizeInMB = `${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`;
        } catch (error) {
            console.error('Error getting Service Worker cache stats:', error);
        }

        return stats;
    }

    /**
     * Get IndexedDB statistics
     */
    private async getIndexedDBStats() {
        const stats = {
            databases: [] as string[],
            count: 0
        };

        if (!('indexedDB' in window)) {
            return stats;
        }

        try {
            const databases = await indexedDB.databases();
            stats.databases = databases.map(db => db.name || 'Unknown');
            stats.count = databases.length;
        } catch (error) {
            console.error('Error getting IndexedDB stats:', error);
        }

        return stats;
    }

    /**
     * Clear localStorage
     */
    clearLocalStorage(preserveVersion: boolean = true): void {
        const version = localStorage.getItem('cache_version');
        localStorage.clear();

        if (preserveVersion && version) {
            localStorage.setItem('cache_version', version);
        }

        localStorage.setItem('last_cache_cleared', new Date().toISOString());
        this.broadcastCacheUpdate('localStorage');
    }

    /**
     * Clear Service Worker caches
     */
    async clearServiceWorkerCache(cacheName?: string): Promise<void> {
        if (!('caches' in window)) {
            throw new Error('Service Worker caches not supported');
        }

        try {
            if (cacheName) {
                await caches.delete(cacheName);
            } else {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // Notify service worker to update
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_CACHE',
                    cacheName
                });
            }

            this.broadcastCacheUpdate('serviceWorker');
        } catch (error) {
            console.error('Error clearing Service Worker cache:', error);
            throw error;
        }
    }

    /**
     * Clear IndexedDB databases
     */
    async clearIndexedDB(): Promise<void> {
        if (!('indexedDB' in window)) {
            throw new Error('IndexedDB not supported');
        }

        try {
            const databases = await indexedDB.databases();

            for (const db of databases) {
                if (db.name) {
                    await new Promise<void>((resolve, reject) => {
                        const request = indexedDB.deleteDatabase(db.name!);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            }

            this.broadcastCacheUpdate('indexedDB');
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            throw error;
        }
    }

    /**
     * Clear all browser caches
     */
    async clearAllCaches(): Promise<void> {
        this.clearLocalStorage(true);
        await this.clearServiceWorkerCache();
        await this.clearIndexedDB();
        this.broadcastCacheUpdate('all');
    }

    /**
     * Broadcast cache update to other tabs
     */
    private broadcastCacheUpdate(cacheType: string): void {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'CACHE_UPDATED',
                cacheType,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Listen for cache updates from other tabs
     */
    onCacheUpdate(callback: (cacheType: string) => void): () => void {
        if (!this.broadcastChannel) {
            return () => { };
        }

        const handler = (event: MessageEvent) => {
            if (event.data.type === 'CACHE_UPDATED') {
                callback(event.data.cacheType);
            }
        };

        this.broadcastChannel.addEventListener('message', handler);

        // Return cleanup function
        return () => {
            if (this.broadcastChannel) {
                this.broadcastChannel.removeEventListener('message', handler);
            }
        };
    }

    /**
     * Get list of all cached resources from Service Worker
     */
    async listCachedResources(): Promise<string[]> {
        if (!('caches' in window)) {
            return [];
        }

        try {
            const cacheNames = await caches.keys();
            const resources: string[] = [];

            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                resources.push(...keys.map(req => req.url));
            }

            return resources;
        } catch (error) {
            console.error('Error listing cached resources:', error);
            return [];
        }
    }

    /**
     * Invalidate backend cache (admin only)
     */
    async invalidateBackendCache(type: 'all' | 'config' | 'routes' | 'views' = 'all'): Promise<void> {
        try {
            const response = await fetch(`/api/admin/cache/clear-${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to invalidate backend cache');
            }

            this.broadcastCacheUpdate('backend');
        } catch (error) {
            console.error('Error invalidating backend cache:', error);
            throw error;
        }
    }

    /**
     * Force update Service Worker
     */
    async updateServiceWorker(): Promise<void> {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
            }
        } catch (error) {
            console.error('Error updating Service Worker:', error);
            throw error;
        }
    }

    /**
     * Cleanup - close broadcast channel
     */
    destroy(): void {
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = null;
        }
    }
}

// Export singleton instance
export const cacheService = new CacheService();
