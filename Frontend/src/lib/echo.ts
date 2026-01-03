import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

function initializeEcho() {
    const token = localStorage.getItem('authToken');
    console.log('🔄 Initializing Echo...');
    console.log('📱 Auth Token:', token ? `${token.substring(0, 20)}...` : 'NULL - NO TOKEN!');

    const isHttps = window.location.protocol === 'https:';
    const defaultHost = window.location.hostname;
    // If HTTPS (Production), default to 443. If HTTP (Local), default to 6001 or 8080.
    const defaultPort = isHttps ? 443 : 6001;

    const config = {
        broadcaster: 'reverb' as any,
        key: (import.meta as any).env.VITE_REVERB_APP_KEY || 'ramouse-app-key',
        wsHost: (import.meta as any).env.VITE_REVERB_HOST || defaultHost,
        wsPort: parseInt((import.meta as any).env.VITE_REVERB_PORT) || defaultPort,
        wssPort: parseInt((import.meta as any).env.VITE_REVERB_PORT) || defaultPort,
        forceTLS: (import.meta as any).env.VITE_REVERB_SCHEME === 'https' || isHttps,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/api/broadcasting/auth',
        auth: {
            headers: {
                Accept: 'application/json',
                get Authorization() {
                    const currentToken = localStorage.getItem('authToken');
                    const authValue = `Bearer ${currentToken || ''}`;
                    // console.log('🔐 Broadcasting Auth Header:', currentToken ? `Bearer ${currentToken.substring(0, 20)}...` : 'Bearer (EMPTY)');
                    return authValue;
                },
            },
        },
    };

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

// Initialize Echo on module load
window.Pusher = Pusher;
window.Echo = initializeEcho();
console.log('✅ Laravel Echo initialized on module load');

// Function to reconnect Echo after login
export const reconnectEcho = () => {
    console.log('🔄 Reconnecting Echo with updated auth token...');
    const token = localStorage.getItem('authToken');
    console.log('📱 Current Token in localStorage:', token ? `${token.substring(0, 20)}...` : 'NULL - NO TOKEN FOUND!');

    if (window.Echo) {
        console.log('🔌 Disconnecting old Echo instance...');
        window.Echo.disconnect();
    }

    console.log('🔌 Creating new Echo instance...');
    window.Echo = initializeEcho();
    console.log('✅ Echo reconnected successfully');
};

export default window.Echo;
