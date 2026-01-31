import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessageProps {
    role: 'user' | 'model';
    content: string;
    timestamp?: number;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
    const isUser = role === 'user';

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
                    {/* Content */}
                    <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'} prose-p:my-1 prose-ul:my-1 prose-headings:my-2`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>

                    {/* Time */}
                    <div className={`text-[9px] mt-1 opacity-70 ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
