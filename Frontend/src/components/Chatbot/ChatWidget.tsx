import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { ChatWelcome } from './ChatWelcome';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ChatService, ChatMessage as IChatMessage } from '../../services/ChatService';

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, isAuthenticated, onLoginClick }) => {
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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

        try {
            // Get Location if possible (optional)
            let lat, lng;
            // Simplified geolocation check could go here

            const response = await ChatService.sendMessage(text, lat, lng);

            const botMsg: IChatMessage = {
                role: 'model',
                content: response.response,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            console.error(error);
            let errorText = 'عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.';

            if (error.response?.status === 429) {
                errorText = 'عذراً، لقد تجاوزت الحد المسموح به من الرسائل اليوم. يرجى تسجيل الدخول للحصول على المزيد.';
                if (!isAuthenticated) {
                    errorText += ' [تسجيل الدخول]';
                }
            } else if (error.response?.status === 401) {
                errorText = 'يرجى تسجيل الدخول للمتابعة.';
            }

            const errorMsg: IChatMessage = {
                role: 'model',
                content: errorText,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
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
                    className="fixed bottom-24 right-4 z-[49] w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden font-sans"
                >
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
                        <div className="flex items-center gap-1">
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
                            <ChatWelcome onActionSelect={handleSend} />
                        ) : (
                            <div className="flex flex-col gap-2">
                                {messages.map((msg, idx) => (
                                    <ChatMessage key={idx} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start w-full">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
