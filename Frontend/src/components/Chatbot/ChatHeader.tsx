import React from 'react';
import { X, Trash2, Plus } from 'lucide-react';

interface ChatHeaderProps {
    /** Whether to show the clear button */
    showClearButton: boolean;
    /** Callback when clear button is clicked */
    onClear: () => void;
    /** Callback when close button is clicked */
    onClose: () => void;
    /** Whether this is mobile view */
    isMobile?: boolean;
}

/**
 * ChatHeader Component
 * Displays the chatbot header with branding, status, and action buttons
 * 
 * @example
 * ```tsx
 * <ChatHeader
 *   showClearButton={hasMessages}
 *   onClear={handleClear}
 *   onClose={onClose}
 * />
 * ```
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
    showClearButton,
    onClear,
    onClose,
    isMobile = false
}) => {
    return (
        <>
            {/* Mobile Close Button */}
            {isMobile && (
                <div className="md:hidden absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-900/10 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-900/20 dark:hover:bg-white/20 transition-colors"
                        aria-label="إغلاق المحادثة"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Header Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                {/* Branding & Status */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner relative">
                        🤖
                        <span
                            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"
                            aria-label="متصل"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                            راموسة AI
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
                                aria-hidden="true"
                            />
                            متصل الآن
                        </p>
                    </div>
                </div>

                {/* Action Buttons (Desktop only) */}
                <div className="hidden md:flex items-center gap-1">
                    {showClearButton && (
                        <>
                            <button
                                onClick={onClear}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
                                title="محادثة جديدة"
                                aria-label="بدء محادثة جديدة"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                محادثة جديدة
                            </button>
                            <button
                                onClick={onClear}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                                title="مسح المحادثة (Ctrl+K)"
                                aria-label="مسح المحادثة"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        title="إغلاق (Esc)"
                        aria-label="إغلاق المحادثة"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </>
    );
};
