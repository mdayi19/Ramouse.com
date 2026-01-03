import { api } from '../lib/api';
import type { Notification } from '../types';
import { NotificationType } from '../types';

export interface NotificationResponse {
    notifications: Notification[];
    unread_count: number;
}

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// App Badge API helpers
const updateAppBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
        if (count > 0) {
            (navigator as any).setAppBadge(count).catch((err: Error) => console.log('Badge error:', err));
        } else {
            (navigator as any).clearAppBadge().catch((err: Error) => console.log('Clear badge error:', err));
        }
    }
};

const clearAppBadge = () => {
    if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().catch((err: Error) => console.log('Clear badge error:', err));
    }
};

export const NotificationService = {
    /**
     * Subscribe to Web Push Notifications
     */
    async subscribeToPush(): Promise<boolean> {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('❌ Push messaging is not supported in this browser');
            return false;
        }

        try {
            console.log('🔵 [Push] Starting subscription process...');

            // Step 1: Request notification permission first
            console.log('🔵 [Push] Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('🔵 [Push] Permission result:', permission);

            if (permission !== 'granted') {
                console.warn('⚠️ [Push] Notification permission denied by user');
                return false;
            }

            // Step 2: Ensure service worker is registered first
            console.log('🔵 [Push] Checking service worker registration...');

            // Check if service worker is even registered
            const swRegistration = await navigator.serviceWorker.getRegistration();
            if (!swRegistration) {
                console.error('❌ [Push] No service worker registered');
                throw new Error('Service worker not registered. Please reload the page.');
            }

            console.log('✅ [Push] Service worker is registered');

            // Step 3: Wait for SW to be ready with increased timeout (15s)
            console.log('🔵 [Push] Waiting for service worker to be ready...');
            const registration = (await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker not ready after 15s. Please reload the page.')), 15000))
            ])) as ServiceWorkerRegistration;

            console.log('✅ [Push] Service worker ready:', registration.scope);

            // Step 3: Check VAPID key
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            console.log('🔵 [Push] VAPID key present:', !!vapidKey);

            if (!vapidKey) {
                console.error('❌ [Push] VITE_VAPID_PUBLIC_KEY not found in environment');
                throw new Error('VAPID key is missing. Environmental variable not found.');
            }

            // Step 4: Check for existing subscription
            console.log('🔵 [Push] Checking for existing subscription...');
            let subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log('✅ [Push] Found existing subscription, updating backend...');
            } else {
                // Step 5: Create new subscription
                console.log('🔵 [Push] Creating new push subscription...');
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });
                console.log('✅ [Push] New subscription created');
            }

            console.log('🔵 [Push] Subscription endpoint:', subscription.endpoint);

            // Step 6: Send to backend
            console.log('🔵 [Push] Sending subscription to backend...');
            const response = await api.post('/notifications/subscribe', subscription.toJSON());
            console.log('✅ [Push] Backend response:', response.data);

            if (response.data.subscription_id) {
                console.log('✅ [Push] Subscription saved to database with ID:', response.data.subscription_id);
            } else {
                console.warn('⚠️ [Push] No subscription ID returned from backend');
            }

            console.log('✅ [Push] Subscription complete!');
            return true;
        } catch (error: any) {
            console.error('❌ [Push] Subscription failed:', error);

            // Detailed error logging
            if (error.name === 'NotAllowedError') {
                console.warn('⚠️ [Push] User denied notification permission');
                return false;
            } else if (error.name === 'AbortError') {
                console.error('❌ [Push] Subscription was aborted');
            } else if (error.name === 'NotSupportedError') {
                console.error('❌ [Push] Push notifications not supported');
            } else if (error.message?.includes('Service worker')) {
                console.error('❌ [Push] Service worker issue:', error.message);
            } else if (error.response) {
                console.error('❌ [Push] Backend error:', error.response.data);
            } else {
                console.error('❌ [Push] Unknown error:', error.message);
            }

            throw error;
        }
    },

    /**
     * Get all notifications for the current authenticated user
     */
    async getAll(): Promise<NotificationResponse> {
        const response = await api.get('/notifications');
        const data = response.data.data || response.data;

        // Defensive check for undefined data
        if (!data) {
            console.warn('No notification data received from API');
            return { notifications: [], unread_count: 0 };
        }

        // Update app icon badge with unread count
        updateAppBadge(data.unread_count || 0);

        return {
            notifications: data.notifications || [],
            unread_count: data.unread_count || 0
        };
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get('/notifications/unread-count');
        return response.data.data.unread_count;
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        await api.post(`/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await api.post('/notifications/mark-all-read');
        // Clear badge when all read
        clearAppBadge();
    },

    /**
     * Delete a single notification
     */
    async delete(notificationId: string): Promise<void> {
        await api.delete(`/notifications/${notificationId}`);
    },

    /**
     * Clear all notifications
     */
    async clearAll(): Promise<void> {
        await api.delete('/notifications');
        // Clear badge when all cleared
        clearAppBadge();
    },

    /**
     * Send a notification (admin/system use)
     */
    async send(
        userId: string,
        title: string,
        message: string,
        type: NotificationType,
        link?: Notification['link'],
        sendWhatsApp: boolean = false,
        context?: Record<string, any>
    ): Promise<void> {
        await api.post('/notifications/send', {
            user_id: userId,
            title,
            message,
            type,
            link,
            send_whatsapp: sendWhatsApp,
            context
        });
    },

    /**
     * Send bulk notification to a group of users (admin use)
     */
    async sendBulk(data: {
        title: string;
        message: string;
        target_group: 'all' | 'customers' | 'providers' | 'technicians' | 'tow_providers';
        type: NotificationType;
        link?: Notification['link'];
    }): Promise<void> {
        await api.post('/notifications/send-bulk', data);
    },

    /**
     * Search users by name or phone
     */
    async searchUsers(query: string): Promise<{ id: string; name: string; role: string; phone: string }[]> {
        const response = await api.get(`/admin/users/search?query=${encodeURIComponent(query)}`);
        return response.data.data;
    }
};
