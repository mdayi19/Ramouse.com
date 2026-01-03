import { useEffect, useRef, useCallback } from 'react';
import Echo from '../lib/echo';

/**
 * Custom hook for listening to real-time events
 */
export const useRealtime = () => {
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current) {
            // Echo is globally initialized in lib/echo.ts, we just track hook usage here if needed
            isInitialized.current = true;
        }
    }, []);

    const listenToPrivateChannel = useCallback((channelName: string, eventName: string, callback: (data: any) => void) => {
        const channel = Echo.private(channelName);
        channel.listen(eventName, callback);

        return () => {
            channel.stopListening(eventName);
        };
    }, []);

    const listenToChannel = useCallback((channelName: string, eventName: string, callback: (data: any) => void) => {
        const channel = Echo.channel(channelName);
        channel.listen(eventName, callback);

        return () => {
            channel.stopListening(eventName);
        };
    }, []);

    const joinPresenceChannel = useCallback((channelName: string, callbacks: {
        here?: (users: any[]) => void;
        joining?: (user: any) => void;
        leaving?: (user: any) => void;
    }) => {
        const channel = Echo.join(channelName);

        if (callbacks.here) {
            channel.here(callbacks.here);
        }
        if (callbacks.joining) {
            channel.joining(callbacks.joining);
        }
        if (callbacks.leaving) {
            channel.leaving(callbacks.leaving);
        }

        return () => {
            Echo.leave(channelName);
        };
    }, []);

    const leaveChannel = useCallback((channelName: string) => {
        Echo.leave(channelName);
    }, []);

    return {
        listenToPrivateChannel,
        listenToChannel,
        joinPresenceChannel,
        leaveChannel,
        echo: Echo,
    };
};

/**
 * Hook to listen for new quotes on an order
 */
export const useOrderQuotes = (orderNumber: string, onQuoteReceived: (quote: any) => void) => {
    const { listenToPrivateChannel } = useRealtime();

    useEffect(() => {
        if (!orderNumber) return;

        console.log(`🔔 Listening for quotes on order: ${orderNumber}`);

        const cleanup = listenToPrivateChannel(
            `orders.${orderNumber}`,
            '.quote.received',
            (data) => {
                console.log('📨 New quote received:', data);
                onQuoteReceived(data);
            }
        );

        return cleanup;
    }, [orderNumber]);
};

/**
 * Hook to listen for order status updates
 */
export const useOrderStatus = (orderNumber: string, onStatusUpdate: (data: any) => void) => {
    const { listenToPrivateChannel } = useRealtime();

    useEffect(() => {
        if (!orderNumber) return;

        console.log(`🔔 Listening for status updates on order: ${orderNumber}`);

        const cleanup = listenToPrivateChannel(
            `orders.${orderNumber}`,
            '.order.status.updated',
            (data) => {
                console.log('📊 Order status updated:', data);
                onStatusUpdate(data);
            }
        );

        return cleanup;
    }, [orderNumber]);
};

/**
 * Hook to listen for user-specific notifications
 */
export const useUserNotifications = (userId: string | number, onNotification: (notification: any) => void) => {
    const { echo } = useRealtime();

    useEffect(() => {
        if (!userId) return;

        console.log(`🔔 Listening for notifications for user ID: ${userId}`);

        // Standard Laravel Notification Channel
        const channel = echo.private(`App.Models.User.${userId}`);

        channel.notification((data: any) => {
            console.log('🔔 New notification:', data);
            onNotification(data);
        });

        return () => {
            channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
        };
    }, [userId]);
};

/**
 * Hook for providers to listen for new orders in their categories
 */
export const useNewOrders = (categories: string[], onNewOrder: (order: any) => void) => {
    const { listenToChannel } = useRealtime();

    useEffect(() => {
        if (!categories || categories.length === 0) return;

        const cleanups: (() => void)[] = [];

        // Listen to each category channel
        categories.forEach(category => {
            console.log(`🔔 Listening for new orders in category: ${category}`);

            const cleanup = listenToChannel(
                `orders.category.${category}`,
                '.order.created',
                (data) => {
                    console.log('📦 New order in category:', data);
                    onNewOrder(data);
                }
            );

            cleanups.push(cleanup);
        });

        // Also listen to general orders channel
        const generalCleanup = listenToChannel(
            'orders',
            '.order.created',
            (data) => {
                console.log('📦 New order:', data);
                onNewOrder(data);
            }
        );
        cleanups.push(generalCleanup);

        return () => {
            cleanups.forEach(cleanup => cleanup());
        };
    }, [categories.join(',')]);
};

/**
 * Hook to monitor online users (presence channel)
 */
export const useOnlineUsers = (
    onUsersChanged: (users: any[]) => void,
    onUserJoined?: (user: any) => void,
    onUserLeft?: (user: any) => void
) => {
    const { joinPresenceChannel } = useRealtime();

    useEffect(() => {
        console.log('🔔 Joining online users presence channel');

        const cleanup = joinPresenceChannel('online', {
            here: (users) => {
                console.log('👥 Users currently online:', users);
                onUsersChanged(users);
            },
            joining: (user) => {
                console.log('✅ User joined:', user);
                if (onUserJoined) onUserJoined(user);
            },
            leaving: (user) => {
                console.log('❌ User left:', user);
                if (onUserLeft) onUserLeft(user);
            },
        });

        return cleanup;
    }, []);
};

import { invalidateCache } from '../lib/apiCache';

/**
 * Hook for user wallet real-time updates
 */
export const useWalletUpdates = (
    userId: string | number | undefined,
    onWalletUpdate: (data: any) => void,
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void
) => {
    const { echo } = useRealtime();

    useEffect(() => {
        if (!userId) return;

        console.log(`💰 useWalletUpdates: Subscribing to user.${userId} for wallet updates`);

        // Helper to invalidate cache and trigger update
        const handleUpdate = (e: any, source: string) => {
            console.log(`💰 Wallet update via ${source}! Invalidating cache...`, e);
            // Invalidate all wallet-related endpoints
            invalidateCache([
                '/wallet/balance',
                '/wallet/transactions',
                '/wallet/deposits',
                '/wallet/withdrawals'
            ]);
            onWalletUpdate(e);
        };

        // Listen for Notifications (Standard)
        const notificationChannel = echo.private(`user.${userId}`);
        const handleNotification = (e: any) => {
            console.log('💰 Wallet notification received:', e);

            if (e.notification) {
                const { type, message } = e.notification;
                const walletTypes = [
                    'DEPOSIT_APPROVED',
                    'DEPOSIT_REJECTED',
                    'WITHDRAWAL_APPROVED',
                    'WITHDRAWAL_REJECTED',
                    'WITHDRAWAL_PROCESSED_APPROVED',
                    'WITHDRAWAL_PROCESSED_REJECTED',
                    'FUNDS_DEPOSITED',
                    'WITHDRAWAL_REQUEST_CONFIRMATION',
                    'DEPOSIT_REQUEST_CONFIRMATION',
                    'AUCTION_REGISTRATION', // Added this to trigger update on registration
                    'info' // Allow generic info notifications (e.g. from test endpoint)
                ];

                if (walletTypes.includes(type)) {
                    handleUpdate(e, 'notification');
                    if (showToast) {
                        const toastType = type.includes('REJECTED') ? 'error' :
                            type.includes('APPROVED') ? 'success' : 'info';
                        showToast(message || 'تم تحديث بيانات المحفظة', toastType);
                    }
                }
            }
        };
        notificationChannel.listen('.user.notification', handleNotification);

        // Listen for Balance Updates (Dedicated Channel)
        const walletChannel = echo.private(`user.${userId}.wallet`);
        const handleBalanceUpdate = (e: any) => {
            handleUpdate(e, 'balance_event');
        };
        walletChannel.listen('.balance.updated', handleBalanceUpdate);

        return () => {
            console.log(`💰 useWalletUpdates: Unsubscribing from user.${userId} and user.${userId}.wallet`);
            notificationChannel.stopListening('.user.notification');
            walletChannel.stopListening('.balance.updated');
        };
    }, [userId, onWalletUpdate, showToast, echo]);
};

/**
 * Hook for admin wallet management real-time updates
 */
export const useAdminWalletUpdates = (
    onDepositRequest: (data: any) => void,
    onWithdrawalRequest: (data: any) => void,
    onProcessed: (data: any) => void,
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void
) => {
    const { echo } = useRealtime();

    useEffect(() => {
        console.log('💰 useAdminWalletUpdates: Subscribing to admin.dashboard');

        const channel = echo.private('admin.dashboard');

        // Helper to invalidate admin cache
        const invalidateAdminCache = () => {
            invalidateCache([
                '/admin/user-deposits',
                '/admin/user-withdrawals',
                '/admin/user-transactions',
                '/admin/withdrawals',
                '/admin/transactions'
            ]);
        };

        channel.listen('.admin.USER_DEPOSIT_REQUEST', (e: any) => {
            console.log('💰 New Deposit Request:', e);
            invalidateAdminCache();
            onDepositRequest(e);
            if (showToast) {
                showToast(`طلب إيداع جديد من ${e.data?.userName || 'مستخدم'}`, 'info');
                try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (_) { }
            }
        });

        channel.listen('.admin.USER_WITHDRAWAL_REQUEST', (e: any) => {
            console.log('💸 New Withdrawal Request:', e);
            invalidateAdminCache();
            onWithdrawalRequest(e);
            if (showToast) {
                showToast(`طلب سحب جديد من ${e.data?.userName || 'مستخدم'}`, 'info');
                try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (_) { }
            }
        });

        channel.listen('.admin.user_deposit.processed', (e: any) => {
            console.log('💰 Deposit Processed:', e);
            invalidateAdminCache();
            onProcessed(e);
        });

        channel.listen('.admin.user_withdrawal.processed', (e: any) => {
            console.log('💸 Withdrawal Processed:', e);
            invalidateAdminCache();
            onProcessed(e);
        });

        channel.listen('.admin.user.balance_changed', (e: any) => {
            console.log('💰 User Balance Changed:', e);
            invalidateAdminCache();
            onProcessed(e);
        });

        return () => {
            console.log('💰 useAdminWalletUpdates: Unsubscribing');
            channel.stopListening('.admin.USER_DEPOSIT_REQUEST');
            channel.stopListening('.admin.USER_WITHDRAWAL_REQUEST');
            channel.stopListening('.admin.user_deposit.processed');
            channel.stopListening('.admin.user_withdrawal.processed');
            channel.stopListening('.admin.user.balance_changed');
        };
    }, [onDepositRequest, onWithdrawalRequest, onProcessed, showToast, echo]);
};
