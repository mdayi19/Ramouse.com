import { api } from '../lib/api';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    timestamp: number;
    showLoginButton?: boolean;
}

export interface ChatResponse {
    response: string;
    session_id: string;
    remaining: number;
    headers?: any; // Response headers for rate limiting
}

const SESSION_KEY = 'chat_session_id';

export const ChatService = {
    getSessionId: () => localStorage.getItem(SESSION_KEY),

    setSessionId: (id: string) => localStorage.setItem(SESSION_KEY, id),

    clearSession: () => localStorage.removeItem(SESSION_KEY),

    sendMessage: async (message: string, lat?: number, lng?: number): Promise<ChatResponse> => {
        const sessionId = localStorage.getItem(SESSION_KEY);

        const payload = {
            message,
            session_id: sessionId,
            latitude: lat,
            longitude: lng
        };

        const response = await api.post('/chatbot/send', payload);

        if (response.data.session_id) {
            localStorage.setItem(SESSION_KEY, response.data.session_id);
        }

        // Return full response object including headers
        return {
            ...response.data,
            headers: response.headers
        };
    },

    getHistory: () => {
        // Optional: Local history management if not fully relying on backend for display
        const history = localStorage.getItem('chat_local_history');
        return history ? JSON.parse(history) : [];
    },

    saveLocalMessage: (msg: ChatMessage) => {
        const history = ChatService.getHistory();
        history.push(msg);
        // Limit to last 50
        if (history.length > 50) history.shift();
        localStorage.setItem('chat_local_history', JSON.stringify(history));
    }
};
