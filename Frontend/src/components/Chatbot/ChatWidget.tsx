import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWelcome } from './ChatWelcome';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ClearChatDialog } from './ClearChatDialog';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { ChatService, ChatMessage as IChatMessage } from '../../services/ChatService';
import { chatStreamService } from '../../services/chat-stream.service';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { chatConfig } from '../../config/chat.config';

/**
 * ChatWidget Component
 * Main chatbot interface with streaming support, voice input, and accessibility features
 * 
 * @example
 * ```tsx
 * <ChatWidget
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   isAuthenticated={user !== null}
 *   onLoginClick={handleLogin}
 * />
 * ```
 */

interface ChatWidgetProps {
    /** Whether the chatbot is visible */
    isOpen: boolean;
    /** Callback when chatbot is closed */
    onClose: () => void;
    /** Whether the user is authenticated */
    isAuthenticated: boolean;
    /** Callback when login button is clicked */
    onLoginClick: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, isAuthenticated, onLoginClick }) => {
    // State management
    const { messages, addMessage, updateLastMessage, clearMessages, hasMessages } = useChatMessages();
    const [isLoading, setIsLoading] = useState(false);

    // Trial message counter state
    const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
    const [dailyLimit, setDailyLimit] = useState<number>(5);
    const [isTrial, setIsTrial] = useState<boolean>(false);
    const [aiStatus, setAiStatus] = useState<string>('');
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

    // Keyboard shortcuts hook
    useKeyboardShortcuts({
        enabled: isOpen,
        onEscape: onClose,
        onClearChat: hasMessages ? () => setShowClearDialog(true) : undefined
    });

    // Fetch User Location when Chat Opens
    React.useEffect(() => {
        if (isOpen && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Location access denied:', error.message);
                },
                { timeout: 10000, maximumAge: 300000 } // Cache for 5 mins
            );
        }
    }, [isOpen]);

    /**
     * Handle sending a new message
     * Supports both streaming and non-streaming modes based on configuration
     */
    const handleSend = async (text: string) => {
        // Validate message length
        if (text.length > chatConfig.MAX_MESSAGE_LENGTH) {
            const errorMsg: IChatMessage = {
                role: 'model',
                content: `الرسالة طويلة جداً. الحد الأقصى هو ${chatConfig.MAX_MESSAGE_LENGTH} حرف.`,
                timestamp: Date.now()
            };
            addMessage(errorMsg);
            return;
        }

        // Add user message
        const userMsg: IChatMessage = { role: 'user', content: text, timestamp: Date.now() };
        addMessage(userMsg);
        setIsLoading(true);
        setAiStatus('جارٍ التفكير...');

        try {
            // Get location if available
            const lat = userLocation?.lat;
            const lng = userLocation?.lng;

            if (chatConfig.STREAMING_ENABLED) {
                // --- STREAMING MODE ---
                let streamedContent = '';
                const sessionId = ChatService.getSessionId();

                // Add a placeholder message for the AI response
                const aiMsgPlaceholder: IChatMessage = {
                    role: 'model',
                    content: '',
                    timestamp: Date.now()
                };
                addMessage(aiMsgPlaceholder);

                await chatStreamService.streamMessage(
                    text,
                    sessionId || '',
                    // onChunk
                    (chunk: string) => {
                        streamedContent += chunk;
                        updateLastMessage(streamedContent);
                    },
                    // onStatus
                    (status: string) => {
                        setAiStatus(status);
                    },
                    // onComplete
                    (returnedSessionId: string) => {
                        setIsLoading(false);
                        setAiStatus('');
                        ChatService.setSessionId(returnedSessionId);
                    },
                    // onError
                    (error: string) => {
                        setIsLoading(false);
                        setAiStatus('');
                        updateLastMessage(error);
                    },
                    lat,
                    lng
                );
            } else {
                // --- NON-STREAMING MODE (original) ---
                // Update status after 1 second to show database search
                const statusTimer = window.setTimeout(() => {
                    setAiStatus('جارٍ البحث في قاعدة البيانات...');
                }, 1000);

                const response = await ChatService.sendMessage(text, lat, lng);
                clearTimeout(statusTimer);

                const botMsg: IChatMessage = {
                    role: 'model',
                    content: response.response,
                    timestamp: Date.now()
                };
                addMessage(botMsg);
            }
        } catch (error: any) {
            console.error(error);
            let errorText = 'عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.';
            let showLoginButton = false;

            if (error.response?.data?.message) {
                errorText = error.response.data.message;
            }

            if (error.response?.status === 429 || error.response?.data?.error === 'Daily limit reached.') {
                errorText = error.response?.data?.message || 'لقد وصلت للحد المجاني (5 رسائل يومياً). سجّل دخول للمتابعة! 🚀';
                showLoginButton = true;
            } else if (error.response?.status === 401) {
                errorText = 'يرجى تسجيل الدخول للمتابعة.';
                showLoginButton = true;
            }

            const errorMsg: IChatMessage = {
                role: 'model',
                content: errorText,
                timestamp: Date.now(),
                showLoginButton
            };
            addMessage(errorMsg);
        } finally {
            if (!chatConfig.STREAMING_ENABLED) {
                setIsLoading(false);
                setAiStatus('');
            }
        }
    };

    /**
     * Show clear confirmation dialog
     */
    const handleClear = () => {
        setShowClearDialog(true);
    };

    /**
     * Confirm and clear all messages
     */
    const confirmClear = () => {
        clearMessages();
        ChatService.clearSession();
        setShowClearDialog(false);
    };

    /**
     * Handle error boundary reset
     */
    const handleErrorReset = () => {
        clearMessages();
        setIsLoading(false);
        setAiStatus('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed z-[60] bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden font-sans
                        md:bottom-24 md:left-6 md:w-[400px] md:h-[600px] md:max-h-[80vh] md:rounded-3xl md:border md:border-slate-200 md:dark:border-slate-700
                        inset-0 w-full h-[100dvh] md:h-auto md:inset-auto"
                >
                    <ChatErrorBoundary onReset={handleErrorReset}>
                        {/* Header */}
                        <ChatHeader
                            showClearButton={hasMessages}
                            onClear={handleClear}
                            onClose={onClose}
                            isMobile={true}
                        />

                        {/* Content Body */}
                        {!hasMessages ? (
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-black/20">
                                <ChatWelcome
                                    onActionSelect={handleSend}
                                    isAuthenticated={isAuthenticated}
                                    onLoginClick={onLoginClick}
                                />
                            </div>
                        ) : (
                            <ChatMessageList
                                messages={messages}
                                isLoading={isLoading}
                                aiStatus={aiStatus}
                                onLoginClick={onLoginClick}
                                onSuggestionClick={handleSend}
                            />
                        )}

                        {/* Input */}
                        <ChatInput onSend={handleSend} isLoading={isLoading} />

                        {/* Clear Confirmation Dialog */}
                        <ClearChatDialog
                            isOpen={showClearDialog}
                            onConfirm={confirmClear}
                            onCancel={() => setShowClearDialog(false)}
                        />
                    </ChatErrorBoundary>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
