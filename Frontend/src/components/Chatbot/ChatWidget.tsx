import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { ChatWelcome } from './ChatWelcome';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ChatService, ChatMessage as IChatMessage } from '../../services/ChatService';
import { chatStreamService } from '../../services/chat-stream.service';

// Enable/disable streaming (can be toggled based on user preference)
const USE_STREAMING = true;

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, isAuthenticated, onLoginClick }) => {
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (text: string) => {
        // Add User Message
        const userMsg: IChatMessage = { role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setAiStatus('جارٍ التفكير...');

        try {
            // Get Location if possible (optional)
            let lat, lng;
            // Simplified geolocation check could go here

            if (USE_STREAMING) {
                // --- STREAMING MODE ---
                let streamedContent = '';
                const sessionId = ChatService.getSessionId();

                // Add a placeholder message for the AI response
                const aiMsgPlaceholder: IChatMessage = {
                    role: 'model',
                    content: '',
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, aiMsgPlaceholder]);

                await chatStreamService.streamMessage(
                    text,
                    sessionId || '',
                    // onChunk
                    (chunk: string) => {
                        streamedContent += chunk;
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1] = {
                                ...newMessages[newMessages.length - 1],
                                content: streamedContent
                            };
                            return newMessages;
                        });
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
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1] = {
                                ...newMessages[newMessages.length - 1],
                                content: error
                            };
                            return newMessages;
                        });
                    },
                    lat,
                    lng
                );
            } else {
                // --- NON-STREAMING MODE (original) ---
                // Update status after 1 second to show database search
                const statusTimer = setTimeout(() => {
                    setAiStatus('جارٍ البحث في قاعدة البيانات...');
                }, 1000);

                const response = await ChatService.sendMessage(text, lat, lng);
                clearTimeout(statusTimer);

                const botMsg: IChatMessage = {
                    role: 'model',
                    content: response.response,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error: any) {
            console.error(error);
            let errorText = 'عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.';
            let showLoginButton = false;

            if (error.response?.data?.message) {
                errorText = error.response.data.message;
            }

            if (error.response?.status === 429 || error.response?.data?.error === 'Daily limit reached.') {
                errorText = 'لقد تجاوزت الحد اليومي كزائر (50 رسالة). يرجى تسجيل الدخول للحصول على حد أعلى!';
                showLoginButton = !isAuthenticated;
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
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            if (!USE_STREAMING) {
                setIsLoading(false);
                setAiStatus('');
            }
        }
    };

    const handleClear = () => {
        if (window.confirm('هل أنت متأكد من مسح المحادثة؟')) {
            setMessages([]);
            ChatService.clearSession();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed z-[49] bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden font-sans
                        md:bottom-24 md:right-4 md:w-[400px] md:h-[600px] md:max-h-[80vh] md:rounded-3xl md:border md:border-slate-200 md:dark:border-slate-700
                        bottom-0 right-0 left-0 top-0 w-full h-full rounded-none"
                >
                    {/* Mobile Close Button */}
                    <div className="md:hidden absolute top-4 right-4 z-50">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-900/10 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-slate-700 dark:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner relative">
                                🤖
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">راموسة AI</h3>
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    متصل الآن
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                                    title="مسح المحادثة"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-black/20 scroll-smooth custom-scrollbar">
                        {messages.length === 0 ? (
                            <ChatWelcome
                                onActionSelect={handleSend}
                                isAuthenticated={isAuthenticated}
                                onLoginClick={onLoginClick}
                            />
                        ) : (
                            <div className="flex flex-col gap-2">
                                {messages.map((msg, idx) => (
                                    <ChatMessage
                                        key={idx}
                                        role={msg.role}
                                        content={msg.content}
                                        timestamp={msg.timestamp}
                                        showLoginButton={msg.showLoginButton}
                                        onLoginClick={onLoginClick}
                                        onSuggestionClick={handleSend}
                                    />
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start w-full">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                </div>
                                                {aiStatus && (
                                                    <span className="text-xs text-slate-600 dark:text-slate-400 mr-1">{aiStatus}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <ChatInput onSend={handleSend} isLoading={isLoading} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
