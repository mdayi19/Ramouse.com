import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import ENV from './env';
import { secureStorage } from '@/utils/secureStorage';
import { apiClient } from '@/api/client';

// @ts-ignore
window.Pusher = Pusher;

const createEcho = async () => {
    const token = await secureStorage.getItem('authToken');

    return new Echo({
        broadcaster: 'reverb',
        key: ENV.reverbAppKey,
        wsHost: ENV.reverbHost,
        wsPort: ENV.reverbPort,
        wssPort: ENV.reverbPort, // Usually 443 for wss, but using env for flexibility
        forceTLS: ENV.reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${ENV.apiUrl}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                Accept: 'application/json',
            },
        },
        // We can override the authorizer to use our axios instance if needed
        authorizer: (channel: any, options: any) => {
            return {
                authorize: (socketId: string, callback: Function) => {
                    apiClient.post('/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    })
                        .then(response => {
                            callback(false, response.data);
                        })
                        .catch(error => {
                            callback(true, error);
                        });
                }
            };
        },
    });
};

export default createEcho;
