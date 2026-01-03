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
