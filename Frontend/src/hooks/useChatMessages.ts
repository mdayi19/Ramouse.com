import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../services/ChatService';

/**
 * Custom hook for managing chat messages with localStorage persistence
 * Messages persist across page refreshes and navigation
 */

const STORAGE_KEY = 'ramouse_chat_messages';
const MAX_STORED_MESSAGES = 50; // Prevent localStorage bloat

export const useChatMessages = () => {
    // Initialize from localStorage if available
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate structure
                if (Array.isArray(parsed) && parsed.every((m: any) => m.role && m.content && m.timestamp)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
        return [];
    });

    // Save to localStorage whenever messages change
    useEffect(() => {
        try {
            // Keep only last N messages to avoid quota issues
            const toStore = messages.slice(-MAX_STORED_MESSAGES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch (error: any) {
            console.error('Failed to save chat history:', error);
            // If quota exceeded, try clearing old messages
            if (error.name === 'QuotaExceededError') {
                const reduced = messages.slice(-20);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
                } catch (e) {
                    console.error('Failed to save even after reduction:', e);
                }
            }
        }
    }, [messages]);

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
     * Clear all messages and remove from localStorage
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear chat history from storage:', error);
        }
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
