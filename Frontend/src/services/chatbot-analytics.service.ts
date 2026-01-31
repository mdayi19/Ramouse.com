import { api } from '../lib/api';

export interface ChatbotAnalytics {
    overview: {
        total_messages: number;
        total_conversations: number;
        total_users: number;
        avg_response_time_ms: number;
        error_rate: number;
    };
    conversations: {
        avg_messages_per_conversation: number;
        daily_trend: Array<{ date: string; count: number }>;
    };
    performance: {
        by_hour: Array<{ hour: number; avg_time: number; count: number }>;
        p50_ms: number;
        p95_ms: number;
        p99_ms: number;
    };
    feedback: {
        total_feedback: number;
        positive_count: number;
        negative_count: number;
        sentiment_ratio: number;
        daily_trend: Array<{ date: string; positive: number; negative: number }>;
    };
    popular_queries: Array<{ query: string; count: number }>;
    hourly_distribution: Array<{ hour: number; count: number }>;
    user_engagement: {
        new_users: number;
        returning_users: number;
        guest_messages: number;
        authenticated_messages: number;
    };
    error_analysis: {
        total_errors: number;
        by_type: Record<string, { count: number; latest: string }>;
    };
}

export const ChatbotAnalyticsService = {
    getAnalytics: async (period: '7d' | '30d' | '90d' | 'all' = '7d'): Promise<ChatbotAnalytics> => {
        const response = await api.get(`/admin/chatbot/analytics?period=${period}`);
        return response.data;
    },

    exportCSV: async (period: '7d' | '30d' | '90d' | 'all' = '7d') => {
        const response = await api.get(`/admin/chatbot/analytics/export?period=${period}`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `chatbot-analytics-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
