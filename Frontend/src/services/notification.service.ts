import { api } from '../lib/api';
import { Notification, NotificationType } from '../types';

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
        console.log('🔵 Starting push subscription...');
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            console.log('✅ Service Worker ready');

            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            // console.log('🔑 Key:', vapidKey); // Don't log full key in prod usually, but for debug:

            if (!vapidKey) {
                console.error('VITE_VAPID_PUBLIC_KEY not found');
                // TEMP DEBUG: Alert user
                alert('SYSTEM ERROR: VAPID Key is missing! The frontend needs to be rebuilt.');
                return false;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            console.log('✅ Push Subscription successful:', subscription);

            // Send to backend
            // usage of toJSON() ensures we get the keys
            await api.post('/notifications/subscribe', subscription.toJSON());

            return true;
        } catch (error: any) {
            console.error('❌ Failed to subscribe to push:', error);
            if (error.name === 'NotAllowedError') {
                console.warn('User denied notifications.');
            } else {
                // TEMP DEBUG: Alert for other errors
                alert(`Push Subscription Error: ${error.message}`);
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
