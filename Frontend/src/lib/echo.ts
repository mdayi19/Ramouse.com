import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

// Echo configuration factory
function createEchoConfig() {
    const token = localStorage.getItem('authToken');
    console.log('🔄 Creating Echo config...');
    console.log('📱 Auth Token:', token ? `${token.substring(0, 20)}...` : 'NULL - NO TOKEN!');

    const isHttps = window.location.protocol === 'https:';
    const defaultHost = window.location.hostname;
    const defaultPort = isHttps ? 443 : 6001;

    // Use relative URL - Vite proxy forwards to backend in dev, production serves from same domain
    const authEndpoint = '/api/broadcasting/auth';

    return {
        broadcaster: 'reverb' as any,
        key: (import.meta as any).env.VITE_REVERB_APP_KEY || 'ramouse-app-key',
        wsHost: (import.meta as any).env.VITE_REVERB_HOST || defaultHost,
        wsPort: parseInt((import.meta as any).env.VITE_REVERB_PORT) || defaultPort,
        wssPort: parseInt((import.meta as any).env.VITE_REVERB_PORT) || defaultPort,
        forceTLS: (import.meta as any).env.VITE_REVERB_SCHEME === 'https' || isHttps,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: authEndpoint,
        auth: {
            headers: {
                Accept: 'application/json',
                get Authorization() {
                    const currentToken = localStorage.getItem('authToken');
                    return `Bearer ${currentToken || ''}`;
                },
            },
        },
    };
}

// Create Echo instance with connection debugging
function createEchoInstance(): Echo<any> {
    const config = createEchoConfig();

    console.log('📡 Echo Config:', {
        wsHost: config.wsHost,
        wsPort: config.wsPort,
        forceTLS: config.forceTLS,
        hasKey: !!config.key
    });

    const echo = new Echo(config);

    // Add connection debugging
    echo.connector.pusher.connection.bind('connected', () => {
        console.log('✅ Echo Connected Successfully');
    });

    echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('❌ Echo Disconnected');
    });

    echo.connector.pusher.connection.bind('error', (err: any) => {
        console.error('⚠️ Echo Connection Error:', err);
    });

    return echo;
}

/**
 * EchoManager - Singleton manager for Echo instance
 * Survives reconnection and notifies subscribers to resubscribe their channels
 */
class EchoManager {
    private _instance: Echo<any> | null = null;
    private _reconnectCallbacks: Set<() => void> = new Set();
    private _isReconnecting = false;

    /**
     * Get the current Echo instance (creates one if needed)
     */
    get instance(): Echo<any> {
        if (!this._instance) {
            this._instance = createEchoInstance();
            window.Echo = this._instance;
            console.log('✅ Laravel Echo initialized');
        }
        return this._instance;
    }

    /**
     * Get the Echo instance - same as instance getter
     * Provided for backwards compatibility
     */
    get echo(): Echo<any> {
        return this.instance;
    }

    /**
     * Reconnect Echo with new auth token (e.g., after login)
     * Notifies all subscribers to resubscribe their channels
     */
    reconnect(): void {
        if (this._isReconnecting) {
            console.log('⚠️ Already reconnecting, skipping...');
            return;
        }

        this._isReconnecting = true;
        console.log('🔄 Reconnecting Echo with updated auth token...');

        const token = localStorage.getItem('authToken');
        console.log('📱 Current Token:', token ? `${token.substring(0, 20)}...` : 'NULL');

        // Disconnect old instance
        if (this._instance) {
            console.log('🔌 Disconnecting old Echo instance...');
            try {
                this._instance.disconnect();
            } catch (e) {
                console.warn('Warning during disconnect:', e);
            }
        }

        // Create new instance
        console.log('🔌 Creating new Echo instance...');
        this._instance = createEchoInstance();
        window.Echo = this._instance;

        // Notify all subscribers to resubscribe their channels
        console.log(`📢 Notifying ${this._reconnectCallbacks.size} subscribers to resubscribe...`);
        this._reconnectCallbacks.forEach(callback => {
            try {
                callback();
            } catch (e) {
                console.error('Error in reconnect callback:', e);
            }
        });

        this._isReconnecting = false;
        console.log('✅ Echo reconnected successfully');
    }

    /**
     * Register a callback to be called when Echo reconnects
     * Returns an unsubscribe function
     */
    onReconnect(callback: () => void): () => void {
        this._reconnectCallbacks.add(callback);
        return () => {
            this._reconnectCallbacks.delete(callback);
        };
    }

    /**
     * Check if Echo is currently connected
     */
    isConnected(): boolean {
        if (!this._instance) return false;
        try {
            const state = this._instance.connector?.pusher?.connection?.state;
            return state === 'connected';
        } catch {
            return false;
        }
    }

    /**
     * Get the connection state
     */
    getConnectionState(): string {
        if (!this._instance) return 'uninitialized';
        try {
            return this._instance.connector?.pusher?.connection?.state || 'unknown';
        } catch {
            return 'error';
        }
    }
}

// Create singleton instance
export const echoManager = new EchoManager();

// Initialize Pusher on window for Echo
window.Pusher = Pusher;

// Initialize Echo immediately
echoManager.instance;

/**
 * Get the current Echo instance
 * Always use this instead of importing Echo directly to ensure you have the latest instance
 */
export const getEcho = (): Echo<any> => echoManager.instance;

/**
 * Reconnect Echo with updated auth (call after login/logout)
 */
export const reconnectEcho = (): void => echoManager.reconnect();

/**
 * Subscribe to reconnection events
 */
export const onEchoReconnect = (callback: () => void): (() => void) => {
    return echoManager.onReconnect(callback);
};

// Default export - the manager for advanced usage
// For simple usage, import { getEcho } from './echo'
export default echoManager;
