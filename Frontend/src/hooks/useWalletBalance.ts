import { useState, useEffect } from 'react';
import { useRealtime } from './useRealtime';

/**
 * Real-time wallet balance with WebSocket updates
 */
export const useWalletBalance = (userId?: string | number, initialBalance: number = 0) => {
    const { echo } = useRealtime();
    const [balance, setBalance] = useState<number>(initialBalance);
    const [holds, setHolds] = useState<number>(0);

    // Update state when initialBalance changes (e.g. loaded from API)
    useEffect(() => {
        setBalance(initialBalance);
    }, [initialBalance]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!userId) return;

        console.log(`💰 Subscribing to wallet updates for user ${userId}`);

        echo.private(`user.${userId}.wallet`)
            .listen('.balance.updated', (event: any) => {
                console.log('💸 Wallet balance updated:', event);
                setBalance(event.balance);
                setHolds(event.holds || 0);
            });

        return () => {
            echo.leave(`user.${userId}.wallet`);
        };
    }, [userId, echo]);

    return {
        balance,
        holds,
        available: balance - holds,
    };
};
