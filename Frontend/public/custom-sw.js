// Custom Service Worker for Web Push
// Features: Action Buttons, Sound, Grouping (via tag), Deep Links

console.log('🔵 [SW] Custom service worker script loaded');

// 1. Force Immediate Activation
self.addEventListener('install', (event) => {
    console.log('✅ [SW] Installing & Skipping Waiting...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('✅ [SW] Activating & Claiming Clients...');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('🔔 [SW] Push event received:', event);

    if (!(self.Notification && self.Notification.permission === 'granted')) {
        console.warn('⚠️ [SW] Notification permission not granted');
        return;
    }

    if (event.data) {
        console.log('🔵 [SW] Push data:', event.data.text());
        const data = event.data.json();
        console.log('🔵 [SW] Parsed push data:', data);

        // Build notification options
        const options = {
            body: data.body,
            icon: data.icon || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [100, 50, 100],

            // Deep Link Data
            data: {
                dateOfArrival: Date.now(),
                url: data.data?.url || '/',
                type: data.data?.type || 'general'
            },

            // Action Buttons (1)
            actions: data.actions || [
                { action: 'view', title: 'عرض', icon: '/pwa-192x192.png' },
                { action: 'dismiss', title: 'إغلاق', icon: '/pwa-192x192.png' }
            ],

            // Notification Grouping (4) - Group by type
            tag: data.tag || data.data?.type || 'ramouse-notification',
            renotify: true, // Alert even if same tag exists

            // Sound (3) - Note: Browser support varies
            silent: false,

            // Other options
            requireInteraction: data.requireInteraction || false,
            timestamp: Date.now()
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options).then(() => {
                // Update app badge
                if ('setAppBadge' in navigator) {
                    navigator.setAppBadge().catch(err => console.log('Badge error:', err));
                }
            })
        );
    }
});

// Handle notification click (7 - Deep Links)
self.addEventListener('notificationclick', function (event) {
    const notification = event.notification;
    const action = event.action;
    const urlToOpen = notification.data?.url || '/';

    notification.close();

    // Handle different action buttons (1)
    if (action === 'dismiss') {
        // Just close, don't navigate
        return;
    }

    // For 'view' action or direct click, navigate to the URL (7 - Deep Links)
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (windowClients) {
                // Try to find existing window and navigate
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // Check if already on the same origin
                    if (client.url.startsWith(self.registration.scope) && 'navigate' in client) {
                        return client.navigate(urlToOpen).then(c => c.focus());
                    }
                }
                // If no existing window, open new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', function (event) {
    console.log('Notification closed:', event.notification.tag);
});

// ========================================
// Cache Management Message Handlers
// ========================================

self.addEventListener('message', (event) => {
    console.log('🔵 [SW] Message received:', event.data);

    // Handle cache management commands
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'CLEAR_CACHE':
                handleClearAllCaches(event);
                break;

            case 'CLEAR_CACHE_BY_NAME':
                handleClearCacheByName(event);
                break;

            case 'UPDATE_CACHE_VERSION':
                handleUpdateCacheVersion(event);
                break;

            case 'GET_CACHE_NAMES':
                handleGetCacheNames(event);
                break;

            default:
                console.log('🔵 [SW] Unknown message type:', event.data.type);
        }
    }
});

/**
 * Clear all caches
 */
async function handleClearAllCaches(event) {
    console.log('🗑️ [SW] Clearing all caches...');

    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));

        console.log('✅ [SW] All caches cleared successfully');

        // Notify the client
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CACHE_CLEARED',
                success: true,
                message: 'All caches cleared'
            });
        }

        // Broadcast to all clients
        const allClients = await clients.matchAll({ includeUncontrolled: true });
        allClients.forEach(client => {
            client.postMessage({
                type: 'CACHE_UPDATED',
                cacheType: 'serviceWorker',
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('❌ [SW] Error clearing caches:', error);

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CACHE_CLEARED',
                success: false,
                error: error.message
            });
        }
    }
}

/**
 * Clear specific cache by name
 */
async function handleClearCacheByName(event) {
    const cacheName = event.data.cacheName;
    console.log('🗑️ [SW] Clearing cache:', cacheName);

    try {
        const deleted = await caches.delete(cacheName);

        console.log(`✅ [SW] Cache "${cacheName}" ${deleted ? 'deleted' : 'not found'}`);

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CACHE_CLEARED',
                success: deleted,
                cacheName
            });
        }

        // Broadcast to all clients
        const allClients = await clients.matchAll({ includeUncontrolled: true });
        allClients.forEach(client => {
            client.postMessage({
                type: 'CACHE_UPDATED',
                cacheType: 'serviceWorker',
                cacheName,
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('❌ [SW] Error clearing cache:', error);

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CACHE_CLEARED',
                success: false,
                error: error.message
            });
        }
    }
}

/**
 * Update cache version
 */
async function handleUpdateCacheVersion(event) {
    const version = event.data.version;
    console.log('🔄 [SW] Updating cache version to:', version);

    try {
        // Clear old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => !name.includes(version));

        await Promise.all(oldCaches.map(name => caches.delete(name)));

        console.log(`✅ [SW] Cleared ${oldCaches.length} old cache(s)`);

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'VERSION_UPDATED',
                success: true,
                version,
                clearedCaches: oldCaches.length
            });
        }
    } catch (error) {
        console.error('❌ [SW] Error updating cache version:', error);

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'VERSION_UPDATED',
                success: false,
                error: error.message
            });
        }
    }
}

/**
 * Get all cache names
 */
async function handleGetCacheNames(event) {
    try {
        const cacheNames = await caches.keys();

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CACHE_NAMES',
                success: true,
                cacheNames
            });
        }
    } catch (error) {
        console.error('❌ [SW] Error getting cache names:', error);

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CACHE_NAMES',
                success: false,
                error: error.message
            });
        }
    }
}

console.log('✅ [SW] Cache management handlers registered');
