import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatMessage as IChatMessage } from '../../services/ChatService';

interface ChatMessageListProps {
    /** Array of messages to display */
    messages: IChatMessage[];
    /** Whether the AI is currently thinking/typing */
    isLoading: boolean;
    /** Current AI status message */
    aiStatus: string;
    /** Callback when login button is clicked */
    onLoginClick?: () => void;
    /** Callback when a suggestion is clicked */
    onSuggestionClick?: (suggestion: string) => void;
}

/**
 * ChatMessageList Component
 * Displays a scrollable list of chat messages with auto-scroll behavior
 * Includes loading indicator when AI is responding
 * 
 * @example
 * ```tsx
 * <ChatMessageList
 *   messages={messages}
 *   isLoading={isLoading}
 *   aiStatus="جاري التفكير..."
 *   onLoginClick={handleLogin}
 *   onSuggestionClick={handleSuggestion}
 * />
 * ```
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    isLoading,
    aiStatus,
    onLoginClick,
    onSuggestionClick
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    /**
     * Auto-scroll to bottom when new messages arrive
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div
            className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-black/20 scroll-smooth custom-scrollbar"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="محادثة راموسة AI"
        >
            <div className="flex flex-col gap-2">
                {/* Message list */}
                {messages.map((msg, idx) => (
                    <ChatMessageComponent
                        key={`${msg.timestamp}-${idx}`}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                        showLoginButton={msg.showLoginButton}
                        onLoginClick={onLoginClick}
                        onSuggestionClick={onSuggestionClick}
                    />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div
                        className="flex justify-start w-full"
                        role="status"
                        aria-label="جاري الكتابة"
                    >
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm">
                            <div className="flex items-center gap-2">
                                {/* Animated dots */}
                                <div className="flex gap-1">
                                    <span
                                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: '0ms' }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: '150ms' }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: '300ms' }}
                                        aria-hidden="true"
                                    />
                                </div>

                                {/* Status text */}
                                {aiStatus && (
                                    <span className="text-xs text-slate-600 dark:text-slate-400 mr-1">
                                        {aiStatus}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} aria-hidden="true" />
            </div>
        </div>
    );
};
