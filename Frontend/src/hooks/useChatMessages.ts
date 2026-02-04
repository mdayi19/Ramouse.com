import { useState, useCallback } from 'react';
import { ChatMessage } from '../services/ChatService';

/**
 * Custom hook for managing chat messages state
 * Provides methods to add, update, and clear messages
 */
export const useChatMessages = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    /**
     * Add a new message to the chat
     */
    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    /**
     * Update the content of the last message (useful for streaming)
     */
    const updateLastMessage = useCallback((content: string) => {
        setMessages(prev => {
            if (prev.length === 0) return prev;

            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content
            };
            return newMessages;
        });
    }, []);

    /**
     * Add a placeholder message and return a function to update it
     * Useful for streaming responses
     */
    const addPlaceholderMessage = useCallback((role: 'user' | 'model') => {
        const placeholder: ChatMessage = {
            role,
            content: '',
            timestamp: Date.now()
        };

        addMessage(placeholder);

        return {
            update: (content: string) => updateLastMessage(content),
            complete: () => { } // Placeholder is already in state
        };
    }, [addMessage, updateLastMessage]);

    /**
     * Clear all messages
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    /**
     * Get message count
     */
    const messageCount = messages.length;

    /**
     * Check if there are any messages
     */
    const hasMessages = messageCount > 0;

    return {
        messages,
        addMessage,
        updateLastMessage,
        addPlaceholderMessage,
        clearMessages,
        messageCount,
        hasMessages
    };
};
