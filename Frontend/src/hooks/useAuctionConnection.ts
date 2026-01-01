import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from './useRealtime';

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface ConnectionMetrics {
    latency: number; // in milliseconds
    packetsLost: number;
    reconnectAttempts: number;
    lastConnectedAt: Date | null;
    lastDisconnectedAt: Date | null;
}

interface UseAuctionConnectionReturn {
    status: ConnectionStatus;
    quality: ConnectionQuality;
    isOnline: boolean;
    metrics: ConnectionMetrics;
    retryConnection: () => void;
}

/**
 * Hook to monitor WebSocket connection health for auction real-time features
 * Provides connection status, quality metrics, and reconnection capabilities
 */
export const useAuctionConnection = (): UseAuctionConnectionReturn => {
    const { echo } = useRealtime();
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [quality, setQuality] = useState<ConnectionQuality>('good');
    const [metrics, setMetrics] = useState<ConnectionMetrics>({
        latency: 0,
        packetsLost: 0,
        reconnectAttempts: 0,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
    });

    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const pingIntervalRef = useRef<NodeJS.Timeout>();
    const lastPingRef = useRef<number>(Date.now());

    // Calculate connection quality based on latency
    const calculateQuality = useCallback((latency: number): ConnectionQuality => {
        if (!navigator.onLine) return 'offline';
        if (latency < 100) return 'excellent';
        if (latency < 300) return 'good';
        if (latency < 800) return 'fair';
        return 'poor';
    }, []);

    // Ping the server to measure latency
    const measureLatency = useCallback(async () => {
        const startTime = Date.now();
        try {
            // Use a lightweight endpoint to measure latency
            const response = await fetch('/api/ping', {
                method: 'HEAD',
                cache: 'no-cache'
            });

            if (response.ok) {
                const latency = Date.now() - startTime;
                setMetrics(prev => ({ ...prev, latency }));
                setQuality(calculateQuality(latency));
                return latency;
            }
        } catch (error) {
            console.warn('Latency measurement failed:', error);
            setQuality('poor');
        }
        return 1000; // Return high latency on error
    }, [calculateQuality]);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            console.log('📡 Network connection restored');
            setStatus('reconnecting');
            setMetrics(prev => ({
                ...prev,
                lastConnectedAt: new Date()
            }));
        };

        const handleOffline = () => {
            console.log('📡 Network connection lost');
            setStatus('disconnected');
            setQuality('offline');
            setMetrics(prev => ({
                ...prev,
                lastDisconnectedAt: new Date()
            }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor Echo connection status
    useEffect(() => {
        if (!echo) return;

        // Check if we have access to the underlying Pusher connector
        const connector = (echo as any).connector;

        if (connector && connector.pusher) {
            const pusher = connector.pusher;

            const handleConnected = () => {
                console.log('✅ WebSocket connected');
                setStatus('connected');
                setMetrics(prev => ({
                    ...prev,
                    lastConnectedAt: new Date(),
                    reconnectAttempts: 0
                }));
                measureLatency();
            };

            const handleConnecting = () => {
                console.log('🔄 WebSocket connecting...');
                setStatus('connecting');
            };

            const handleDisconnected = () => {
                console.log('❌ WebSocket disconnected');
                setStatus('disconnected');
                setMetrics(prev => ({
                    ...prev,
                    lastDisconnectedAt: new Date()
                }));
            };

            const handleUnavailable = () => {
                console.log('⚠️ WebSocket unavailable');
                setStatus('error');
            };

            const handleFailed = () => {
                console.log('💥 WebSocket connection failed');
                setStatus('error');
                setMetrics(prev => ({
                    ...prev,
                    reconnectAttempts: prev.reconnectAttempts + 1
                }));
            };

            // Bind to Pusher connection events
            pusher.connection.bind('connected', handleConnected);
            pusher.connection.bind('connecting', handleConnecting);
            pusher.connection.bind('disconnected', handleDisconnected);
            pusher.connection.bind('unavailable', handleUnavailable);
            pusher.connection.bind('failed', handleFailed);

            // Set initial status
            const state = pusher.connection.state;
            if (state === 'connected') setStatus('connected');
            else if (state === 'connecting') setStatus('connecting');
            else if (state === 'disconnected') setStatus('disconnected');
            else setStatus('error');

            return () => {
                pusher.connection.unbind('connected', handleConnected);
                pusher.connection.unbind('connecting', handleConnecting);
                pusher.connection.unbind('disconnected', handleDisconnected);
                pusher.connection.unbind('unavailable', handleUnavailable);
                pusher.connection.unbind('failed', handleFailed);
            };
        }
    }, [echo, measureLatency]);

    // Periodic latency monitoring when connected
    useEffect(() => {
        if (status === 'connected') {
            // Measure latency every 10 seconds
            pingIntervalRef.current = setInterval(() => {
                measureLatency();
            }, 10000);

            return () => {
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
            };
        }
    }, [status, measureLatency]);

    // Retry connection manually
    const retryConnection = useCallback(() => {
        console.log('🔄 Manually retrying connection...');
        setStatus('reconnecting');
        setMetrics(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
        }));

        // Trigger reconnection through Echo
        const connector = (echo as any)?.connector;
        if (connector && connector.pusher) {
            connector.pusher.connect();
        }
    }, [echo]);

    return {
        status,
        quality,
        isOnline: navigator.onLine && status !== 'disconnected',
        metrics,
        retryConnection,
    };
};
