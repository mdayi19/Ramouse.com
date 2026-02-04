import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, LogIn, Copy, Share2, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResultCards } from './ResultCards';
import { api } from '../../lib/api';

interface ChatMessageProps {
    role: 'user' | 'model';
    content: string;
    timestamp?: number;
    showLoginButton?: boolean;
    onLoginClick?: () => void;
    onSuggestionClick?: (suggestion: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp, showLoginButton, onLoginClick, onSuggestionClick }) => {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

    // Try to parse content as JSON (structured results from backend)
    let structuredResults = null;
    try {
        const parsed = JSON.parse(content);
        if (parsed.type && Array.isArray(parsed.items)) {
            structuredResults = parsed;
        }
    } catch {
        // Not JSON, treat as markdown text
    }

    // Action Handlers
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                text: content,
                title: 'محادثة راموسة AI'
            }).catch(() => {
                // Fallback to copy if share fails
                handleCopy();
            });
        } else {
            handleCopy();
        }
    };

    const handleFeedback = async (isPositive: boolean) => {
        const previousFeedback = feedbackGiven;
        setFeedbackGiven(isPositive ? 'up' : 'down');

        // Get session ID from ChatService
        const sessionId = localStorage.getItem('chat_session_id');

        try {
            await api.post('/chatbot/feedback', {
                session_id: sessionId,
                timestamp: timestamp,
                is_positive: isPositive
            });
            console.log('Feedback sent successfully');
        } catch (error) {
            console.error('Failed to send feedback:', error);
            // Revert feedback state on error
            setFeedbackGiven(previousFeedback);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>

                {/* Avatar */}
                <div className={`
                    w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs shadow-sm
                    ${isUser ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-purple-600'}
                `}>
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`
                    p-3 px-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden relative
                    ${isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }
                `}>
                    {/* Content - Render ResultCards or Markdown */}
                    {structuredResults ? (
                        <ResultCards results={structuredResults} onSuggestionClick={onSuggestionClick} />
                    ) : (
                        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'} prose-p:my-1 prose-ul:my-1 prose-headings:my-2`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}

                    {/* Action Buttons (AI messages only) */}
                    {!isUser && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                                title="نسخ"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span className="text-green-500">تم النسخ</span>
                                    </>
                                ) : (
                                    <Copy className="w-3 h-3" />
                                )}
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                                title="مشاركة"
                            >
                                <Share2 className="w-3 h-3" />
                            </button>
                            <div className="flex-1"></div>
                            <button
                                onClick={() => handleFeedback(true)}
                                className={`p-1.5 rounded transition-colors ${feedbackGiven === 'up'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                title="مفيد"
                            >
                                <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => handleFeedback(false)}
                                className={`p-1.5 rounded transition-colors ${feedbackGiven === 'down'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                title="غير مفيد"
                            >
                                <ThumbsDown className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Login Button */}
                    {showLoginButton && onLoginClick && (
                        <motion.button
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={onLoginClick}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            <LogIn className="w-4 h-4" />
                            تسجيل الدخول الآن
                        </motion.button>
                    )}

                    {/* Time */}
                    <div className={`text-[9px] mt-1 opacity-70 ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
