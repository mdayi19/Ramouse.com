import { useEffect, useRef, useCallback } from 'react';
import { getEcho, onEchoReconnect } from '../lib/echo';

/**
 * Custom hook for listening to real-time events
 * Uses getEcho() to always access the current instance, even after reconnection
 */
export const useRealtime = () => {
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
        }
    }, []);

    const listenToPrivateChannel = useCallback((channelName: string, eventName: string, callback: (data: any) => void) => {
        const echo = getEcho();
        const channel = echo.private(channelName);
        channel.listen(eventName, callback);

        // Only stop listening on cleanup - don't leave channel as other listeners may be active
        // The component should call leaveChannel explicitly when fully unmounting
        return () => {
            channel.stopListening(eventName);
        };
    }, []);

    const listenToChannel = useCallback((channelName: string, eventName: string, callback: (data: any) => void) => {
        const echo = getEcho();
        const channel = echo.channel(channelName);
        channel.listen(eventName, callback);

        // Only stop listening on cleanup - don't leave channel
        return () => {
            channel.stopListening(eventName);
        };
    }, []);

    const joinPresenceChannel = useCallback((channelName: string, callbacks: {
        here?: (users: any[]) => void;
        joining?: (user: any) => void;
        leaving?: (user: any) => void;
    }) => {
        const echo = getEcho();
        const channel = echo.join(channelName);

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
            echo.leave(channelName);
        };
    }, []);

    const leaveChannel = useCallback((channelName: string) => {
        getEcho().leave(channelName);
    }, []);

    // Return getEcho reference for components that need direct access
    // Using a getter so that components always get the CURRENT instance
    return {
        listenToPrivateChannel,
        listenToChannel,
        joinPresenceChannel,
        leaveChannel,
        get echo() { return getEcho(); }, // Getter ensures fresh instance on every access
        getEcho, // Provide the getter for live access
    };
};

/**
 * Hook to listen for new quotes on an order
 * Uses same pattern as useWalletBalance which works
 */
export const useOrderQuotes = (orderNumber: string, onQuoteReceived: (quote: any) => void) => {
    const { echo } = useRealtime();
    const callbackRef = useRef(onQuoteReceived);
    callbackRef.current = onQuoteReceived;

    useEffect(() => {
        if (!orderNumber) return;

        console.log(`🔔 Listening for quotes on order: ${orderNumber}`);

        echo.private(`orders.${orderNumber}`)
            .listen('.quote.received', (data: any) => {
                console.log('📨 New quote received:', data);
                callbackRef.current(data);
            });

        return () => {
            echo.leave(`orders.${orderNumber}`);
        };
    }, [orderNumber, echo]);
};

/**
 * Hook to listen for order status updates
 */
export const useOrderStatus = (orderNumber: string, onStatusUpdate: (data: any) => void) => {
    const { echo } = useRealtime();
    const callbackRef = useRef(onStatusUpdate);
    callbackRef.current = onStatusUpdate;

    useEffect(() => {
        if (!orderNumber) return;

        console.log(`🔔 Listening for status updates on order: ${orderNumber}`);

        echo.private(`orders.${orderNumber}`)
            .listen('.order.status_updated', (data: any) => {
                console.log('📊 Order status updated:', data);
                callbackRef.current(data);
            });

        return () => {
            echo.leave(`orders.${orderNumber}`);
        };
    }, [orderNumber, echo]);
};

/**
 * Hook to listen for user-specific notifications
 */
export const useUserNotifications = (userId: string | number, onNotification: (notification: any) => void) => {
    const { getEcho } = useRealtime();
    const callbackRef = useRef(onNotification);
    callbackRef.current = onNotification;

    useEffect(() => {
        if (!userId) return;

        console.log(`🔔 Listening for notifications for user ID: ${userId}`);
        const echo = getEcho();

        // Standard Laravel Notification Channel
        const channel = echo.private(`user.${userId}`);

        // Listen for Laravel's native Notification event
        channel.notification((data: any) => {
            console.log('🔔 New notification:', data);
            callbackRef.current(data);
        });

        // Also listen for our manual UserNotification event if still used
        channel.listen('.App\\Events\\UserNotification', (data: any) => {
            console.log('🔔 New UserNotification event:', data);
            callbackRef.current(data);
        });

        return () => {
            // channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
            echo.leave(`user.${userId}`);
        };
    }, [userId, getEcho]);
};

/**
 * Hook for providers to listen for new orders
 * Now uses a single private channel provider.{id}.orders instead of looping public categories
 */
export const useProviderOrders = (providerId: string | number, onNewOrder: (order: any) => void) => {
    const { echo } = useRealtime();
    const callbackRef = useRef(onNewOrder);
    callbackRef.current = onNewOrder;

    useEffect(() => {
        if (!providerId) return;

        const directChannelName = `provider.${providerId}.orders`;
        const globalChannelName = 'providers.updates';

        console.log(`🔔 Listening for orders on ${directChannelName} and ${globalChannelName}`);

        // Listen to Direct Orders
        const directChannel = echo.private(directChannelName);
        directChannel.listen('.order.created', (data: any) => {
            console.log('📦 New DIRECT order received:', data);
            callbackRef.current({ ...data, isDirect: true });
        });

        // Listen to Open Market Orders
        const globalChannel = echo.private(globalChannelName);
        globalChannel.listen('.order.created', (data: any) => {
            console.log('📦 New OPEN order received:', data);
            callbackRef.current({ ...data, isDirect: false });
        });

        return () => {
            echo.leave(directChannelName);
            echo.leave(globalChannelName);
        };
    }, [providerId, echo]);
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
    const usersChangedRef = useRef(onUsersChanged);
    const userJoinedRef = useRef(onUserJoined);
    const userLeftRef = useRef(onUserLeft);

    usersChangedRef.current = onUsersChanged;
    userJoinedRef.current = onUserJoined;
    userLeftRef.current = onUserLeft;

    useEffect(() => {
        console.log('🔔 Joining online users presence channel');

        const cleanup = joinPresenceChannel('online', {
            here: (users) => {
                console.log('👥 Users currently online:', users);
                usersChangedRef.current(users);
            },
            joining: (user) => {
                console.log('✅ User joined:', user);
                if (userJoinedRef.current) userJoinedRef.current(user);
            },
            leaving: (user) => {
                console.log('❌ User left:', user);
                if (userLeftRef.current) userLeftRef.current(user);
            },
        });

        return cleanup;
    }, [joinPresenceChannel]);
};

import { invalidateCache } from '../lib/apiCache';

/**
 * Hook for user wallet real-time updates
 * Includes immediate state updates alongside cache invalidation
 */
export const useWalletUpdates = (
    userId: string | number | undefined,
    onWalletUpdate: (data: any) => void,
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void
) => {
    const { getEcho } = useRealtime();
    const callbackRef = useRef(onWalletUpdate);
    const toastRef = useRef(showToast);
    callbackRef.current = onWalletUpdate;
    toastRef.current = showToast;

    useEffect(() => {
        if (!userId) return;

        console.log(`💰 useWalletUpdates: Subscribing to user.${userId} for wallet updates`);
        const echo = getEcho();

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
            callbackRef.current(e);
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
                    'AUCTION_REGISTRATION',
                    'info'
                ];

                if (walletTypes.includes(type)) {
                    handleUpdate(e, 'notification');
                    if (toastRef.current) {
                        const toastType = type.includes('REJECTED') ? 'error' :
                            type.includes('APPROVED') ? 'success' : 'info';
                        toastRef.current(message || 'تم تحديث بيانات المحفظة', toastType);
                    }
                }
            }
        };
        // Listen to standard notification event
        notificationChannel.notification(handleNotification);

        // Listen for Balance Updates (Dedicated Channel)
        // Note: We might merge this into the main user channel eventually, but keeping for now as per backend
        const walletChannel = echo.private(`user.${userId}.wallet`);
        const handleBalanceUpdate = (e: any) => {
            handleUpdate(e, 'balance_event');
        };
        walletChannel.listen('.balance.updated', handleBalanceUpdate);

        return () => {
            console.log(`💰 useWalletUpdates: Unsubscribing from user.${userId} and user.${userId}.wallet`);
            // Stop listening logic needs to match how we started listening (notification helper vs manual listen)
            echo.leave(`user.${userId}`);
            echo.leave(`user.${userId}.wallet`);
        };
    }, [userId, getEcho]);
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
    const { getEcho } = useRealtime();
    const depositRef = useRef(onDepositRequest);
    const withdrawalRef = useRef(onWithdrawalRequest);
    const processedRef = useRef(onProcessed);
    const toastRef = useRef(showToast);

    depositRef.current = onDepositRequest;
    withdrawalRef.current = onWithdrawalRequest;
    processedRef.current = onProcessed;
    toastRef.current = showToast;

    useEffect(() => {
        console.log('💰 useAdminWalletUpdates: Subscribing to admin.dashboard');
        const echo = getEcho();

        // Note: Backend might be moving to 'admin.orders' or 'admin.financial', but existing code uses 'admin.dashboard'
        // If we renamed channel in backend, update here.
        // Assuming we keep 'admin.dashboard' for wallet stuff for now as per Phase 3 plan (Admin split is later)
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
            depositRef.current(e);
            if (toastRef.current) {
                toastRef.current(`طلب إيداع جديد من ${e.data?.userName || 'مستخدم'}`, 'info');
                try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (_) { }
            }
        });

        channel.listen('.admin.USER_WITHDRAWAL_REQUEST', (e: any) => {
            console.log('💸 New Withdrawal Request:', e);
            invalidateAdminCache();
            withdrawalRef.current(e);
            if (toastRef.current) {
                toastRef.current(`طلب سحب جديد من ${e.data?.userName || 'مستخدم'}`, 'info');
                try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (_) { }
            }
        });

        channel.listen('.admin.user_deposit.processed', (e: any) => {
            console.log('💰 Deposit Processed:', e);
            invalidateAdminCache();
            processedRef.current(e);
        });

        channel.listen('.admin.user_withdrawal.processed', (e: any) => {
            console.log('💸 Withdrawal Processed:', e);
            invalidateAdminCache();
            processedRef.current(e);
        });

        channel.listen('.admin.user.balance_changed', (e: any) => {
            console.log('💰 User Balance Changed:', e);
            invalidateAdminCache();
            processedRef.current(e);
        });

        return () => {
            console.log('💰 useAdminWalletUpdates: Unsubscribing');
            channel.stopListening('.admin.USER_DEPOSIT_REQUEST');
            channel.stopListening('.admin.USER_WITHDRAWAL_REQUEST');
            channel.stopListening('.admin.user_deposit.processed');
            channel.stopListening('.admin.user_withdrawal.processed');
            channel.stopListening('.admin.user.balance_changed');
            echo.leave('admin.dashboard');
        };
    }, [getEcho]);
};
