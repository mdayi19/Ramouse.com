import React from 'react';
import { motion } from 'framer-motion';
import { Car, Wrench, Truck, ShoppingBag, LogIn, Gift, Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
    onActionSelect: (text: string) => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

/**
 * ChatWelcome Component
 * Natural language interface - users type or click suggestions
 * AI automatically extracts filters from natural language
 */
export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
    onActionSelect,
    isAuthenticated = false,
    onLoginClick
}) => {
    // Natural language quick search suggestions
    const quickSearches = [
        {
            icon: <Car className="w-5 h-5 text-blue-500" />,
            label: 'شراء سيارة',
            examples: [
                'بدي تويوتا كامري بدمشق',
                'هيونداي مستعملة بحلب',
                'كيا أوتوماتيك بحمص',
                'سيارات اقتصادية'
            ]
        },
        {
            icon: <Car className="w-5 h-5 text-indigo-500" />,
            label: 'إيجار سيارة',
            examples: [
                'بدي سيارة للإيجار بحلب',
                'إيجار SUV شهري',
                'سيارة صغيرة للتأجير'
            ]
        },
        {
            icon: <Wrench className="w-5 h-5 text-orange-500" />,
            label: 'فني صيانة',
            examples: [
                'بدي ميكانيكي بدمشق',
                'فني كهرباء قريب مني',
                'ورشة BMW بحمص',
                'معلم صيانة تويوتا'
            ]
        },
        {
            icon: <Truck className="w-5 h-5 text-red-500" />,
            label: 'ونش/سطحة',
            examples: [
                'بدي ونش قريب مني هلق',
                'سطحة طوارئ بدمشق',
                'ونش بحلب'
            ]
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center p-6 h-full font-sans">
            {/* Bot Avatar */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mb-6 shadow-sm relative"
            >
                <img
                    src="/RamouseAI.svg"
                    alt="Ramouse AI"
                    className="w-12 h-12"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900"></div>
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center"
            >
                مرحباً بك في راموسة! 👋
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 dark:text-slate-400 text-sm text-center mb-1 max-w-[280px]"
            >
                مرحباً فيك! أنا مساعدك الذكي 👋للبحث عن السيارات والخدمات
            </motion.p>

            {/* AI Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1.5 mb-6 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800"
            >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    مدعوم بالذكاء الاصطناعي
                </span>
            </motion.div>

            {/* Guest Login Banner */}
            {!isAuthenticated && onLoginClick && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="w-full mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                            ✨ لديك 5 رسائل مجانية يومياً كتجربة
                        </p>
                    </div>
                    <button
                        onClick={onLoginClick}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        سجّل دخول للرسائل غير المحدودة 🚀
                    </button>
                </motion.div>
            )}

            {/* Quick Search Categories */}
            <div className="w-full space-y-3">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center mb-2"
                >
                    جرّب البحث عن:
                </motion.p>

                {quickSearches.map((category, catIndex) => (
                    <motion.div
                        key={catIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (catIndex * 0.1) }}
                        className="space-y-2"
                    >
                        {/* Category Header */}
                        <div className="flex items-center gap-2 px-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                {category.icon}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {category.label}
                            </span>
                        </div>

                        {/* Example Queries */}
                        <div className="flex flex-wrap gap-2 px-2">
                            {category.examples.map((example, exIndex) => (
                                <motion.button
                                    key={exIndex}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + (catIndex * 0.1) + (exIndex * 0.05) }}
                                    onClick={() => onActionSelect(example)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm transition-all transform hover:scale-105"
                                >
                                    {example}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AI Help Text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-full mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            >
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                    💡 <span className="font-semibold">نصيحة:</span> اكتب ما تريد بشكل طبيعي!
                    <br />
                    مثال: "بدي تويوتا كامري 2023 بدمشق بأقل من 20 مليون ليرة"
                </p>
            </motion.div>
        </div>
    );
};
