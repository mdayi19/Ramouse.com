import { useState, useCallback, useMemo } from 'react';
import { Notification, ToastMessage, NotificationType } from '../types';
import { useTelegram } from './useTelegram';
import { AdminService } from '../services/admin.service';

export const useNotifications = (userPhone: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const newToast: ToastMessage = { id: Date.now() + Math.random(), message, type };
        setToastMessages(prev => [...prev, newToast]);
    }, []);

    const { sendTelegramNotification } = useTelegram(showToast);

    const addNotificationForUser = useCallback((recipientPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context: Record<string, any> = {}) => {
        // Only show toast for immediate feedback if it's for the current user
        // The actual notification will come from the server via WebSocket
        if (recipientPhone === userPhone) {
            showToast(String(notification.title), 'info');
        }
    }, [userPhone, showToast]);

    const sendMessage = useCallback(async (type: 'verification' | 'notification', to: string, message: string): Promise<{ success: boolean; error?: string }> => {
        try {
            await AdminService.testWhatsapp(to, message);
            return { success: true };
        } catch (error) {
            console.error('Failed to send WhatsApp message:', error);
            return { success: false, error: 'Failed to send message' };
        }
    }, []);

    return {
        notifications, setNotifications,
        toastMessages, setToastMessages,
        unreadCount,
        showToast,
        addNotificationForUser,
        sendMessage,
        sendTelegramNotification
    };
};
