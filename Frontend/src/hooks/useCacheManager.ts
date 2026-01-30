import { useState, useEffect, useCallback } from 'react';
import { cacheService, CacheStats } from '../services/cacheService';

export const useCacheManager = (showToast: (msg: string, type: 'success' | 'error' | 'info') => void) => {
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    /**
     * Load cache statistics
     */
    const loadCacheStats = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const stats = await cacheService.getCacheStatistics();
            setCacheStats(stats);
        } catch (error) {
            console.error('Error loading cache stats:', error);
            showToast('فشل تحميل إحصائيات ذاكرة التخزين المؤقت', 'error');
        } finally {
            setIsRefreshing(false);
        }
    }, [showToast]);

    /**
     * Clear localStorage
     */
    const clearLocalStorage = useCallback(async () => {
        if (!window.confirm('هل أنت متأكد من مسح localStorage؟ سيتم حذف جميع البيانات المحفوظة محليًا.')) {
            return;
        }

        setIsLoading(true);
        try {
            cacheService.clearLocalStorage(true);
            showToast('تم مسح localStorage بنجاح', 'success');
            await loadCacheStats();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            showToast('فشل مسح localStorage', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, loadCacheStats]);

    /**
     * Clear Service Worker cache
     */
    const clearServiceWorkerCache = useCallback(async (cacheName?: string) => {
        const message = cacheName
            ? `هل أنت متأكد من مسح الذاكرة المؤقتة "${cacheName}"؟`
            : 'هل أنت متأكد من مسح جميع ذاكرات التخزين المؤقتة لـ Service Worker؟';

        if (!window.confirm(message)) {
            return;
        }

        setIsLoading(true);
        try {
            await cacheService.clearServiceWorkerCache(cacheName);
            showToast('تم مسح ذاكرة Service Worker بنجاح', 'success');
            await loadCacheStats();
        } catch (error) {
            console.error('Error clearing Service Worker cache:', error);
            showToast('فشل مسح ذاكرة Service Worker', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, loadCacheStats]);

    /**
     * Clear IndexedDB
     */
    const clearIndexedDB = useCallback(async () => {
        if (!window.confirm('هل أنت متأكد من مسح جميع قواعد بيانات IndexedDB؟')) {
            return;
        }

        setIsLoading(true);
        try {
            await cacheService.clearIndexedDB();
            showToast('تم مسح IndexedDB بنجاح', 'success');
            await loadCacheStats();
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            showToast('فشل مسح IndexedDB', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, loadCacheStats]);

    /**
     * Clear all caches
     */
    const clearAllCaches = useCallback(async () => {
        if (!window.confirm('⚠️ هل أنت متأكد من مسح جميع ذاكرات التخزين المؤقت؟ سيتم إعادة تحميل الصفحة بعد ذلك.')) {
            return;
        }

        setIsLoading(true);
        try {
            await cacheService.clearAllCaches();
            showToast('تم مسح جميع ذاكرات التخزين المؤقت. سيتم إعادة التحميل...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Error clearing all caches:', error);
            showToast('فشل مسح بعض ذاكرات التخزين المؤقت', 'error');
            setIsLoading(false);
        }
    }, [showToast]);

    /**
     * Clear and reseed data
     */
    const clearAndReseed = useCallback(async () => {
        if (!window.confirm('⚠️ تحذير خطير: سيتم مسح جميع البيانات وإعادة ملء البيانات الأولية. هل تريد المتابعة؟')) {
            return;
        }

        setIsLoading(true);
        try {
            localStorage.clear();
            await cacheService.clearServiceWorkerCache();
            showToast('تم مسح جميع البيانات. سيتم إعادة التحميل...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Error clearing and reseeding:', error);
            showToast('فشل إعادة التعيين', 'error');
            setIsLoading(false);
        }
    }, [showToast]);

    /**
     * Invalidate backend cache (admin only)
     */
    const invalidateBackendCache = useCallback(async (type: 'all' | 'config' | 'routes' | 'views' = 'all') => {
        if (!window.confirm(`هل أنت متأكد من مسح ذاكرة الخادم (${type})؟`)) {
            return;
        }

        setIsLoading(true);
        try {
            await cacheService.invalidateBackendCache(type);
            showToast(`تم مسح ذاكرة الخادم (${type}) بنجاح`, 'success');
        } catch (error) {
            console.error('Error invalidating backend cache:', error);
            showToast('فشل مسح ذاكرة الخادم. تأكد من صلاحيات المسؤول.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    /**
     * Update Service Worker
     */
    const updateServiceWorker = useCallback(async () => {
        setIsLoading(true);
        try {
            await cacheService.updateServiceWorker();
            showToast('تم تحديث Service Worker بنجاح', 'success');
            await loadCacheStats();
        } catch (error) {
            console.error('Error updating Service Worker:', error);
            showToast('فشل تحديث Service Worker', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, loadCacheStats]);

    // Load cache stats on mount
    useEffect(() => {
        loadCacheStats();
    }, [loadCacheStats]);

    // Listen for cache updates from other tabs
    useEffect(() => {
        const cleanup = cacheService.onCacheUpdate((cacheType) => {
            console.log('Cache updated in another tab:', cacheType);
            loadCacheStats();
        });

        return cleanup;
    }, [loadCacheStats]);

    return {
        cacheStats,
        isLoading,
        isRefreshing,
        clearLocalStorage,
        clearServiceWorkerCache,
        clearIndexedDB,
        clearAllCaches,
        clearAndReseed,
        invalidateBackendCache,
        updateServiceWorker,
        refreshStats: loadCacheStats
    };
};
