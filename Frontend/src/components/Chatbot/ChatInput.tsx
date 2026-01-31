import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isListening, setIsListening] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    const handleSend = () => {
        if (!message.trim() || isLoading) return;
        onSend(message);
        setMessage('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleVoice = () => {
        // Simple Web Speech API Implementation (Placeholder logic for now)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-SA';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            if (!isListening) {
                setIsListening(true);
                recognition.start();
                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setMessage(prev => prev + ' ' + transcript);
                    setIsListening(false);
                };
                recognition.onerror = () => setIsListening(false);
                recognition.onend = () => setIsListening(false);
            } else {
                // Stop logic handled by onend usually, but can force stop
                setIsListening(false);
            }
        } else {
            alert('المتصفح لا يدعم البحث الصوتي');
        }
    };

    return (
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className={`
                flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-2 transition-all border
                ${isListening ? 'ring-2 ring-red-400 border-red-400' : 'border-transparent focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900'}
            `}>

                <button
                    onClick={toggleVoice}
                    className={`
                        p-2 rounded-full transition-colors flex-shrink-0
                        ${isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600'
                        }
                    `}
                    title="تسجيل صوتي"
                >
                    {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>

                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "جاري الاستماع..." : "اكتب رسالتك..."}
                    rows={1}
                    className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    style={{ direction: 'rtl' }}
                />

                <AnimatePresence mode='wait'>
                    {message.trim() ? (
                        <motion.button
                            key="send"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={handleSend}
                            disabled={isLoading}
                            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 rtl:-rotate-180" />
                            )}
                        </motion.button>
                    ) : null}
                </AnimatePresence>
            </div>

            <div className="px-2 mt-1 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">يدعم العربية</span>
                {isLoading && <span className="text-[10px] text-blue-500 animate-pulse font-medium">جاري الكتابة...</span>}
            </div>
        </div>
    );
};
