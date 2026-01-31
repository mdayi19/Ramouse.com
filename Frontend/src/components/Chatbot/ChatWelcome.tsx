import React from 'react';
import { motion } from 'framer-motion';
import { Car, Wrench, Truck, ShoppingBag, Search } from 'lucide-react';

interface ChatWelcomeProps {
    onActionSelect: (text: string) => void;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ onActionSelect }) => {
    const actions = [
        { icon: <Car className="w-5 h-5 text-blue-500" />, label: 'شراء سيارة', query: 'أريد شراء سيارة' },
        { icon: <Car className="w-5 h-5 text-indigo-500" />, label: 'استئجار سيارة', query: 'أريد استئجار سيارة' },
        { icon: <Wrench className="w-5 h-5 text-orange-500" />, label: 'فني صيانة', query: 'أبحث عن ميكانيكي قريب' },
        { icon: <Truck className="w-5 h-5 text-red-500" />, label: 'سطحة', query: 'أحتاج سطحة طوارئ' },
        { icon: <ShoppingBag className="w-5 h-5 text-green-500" />, label: 'قطع غيار', query: 'أبحث عن قطع غيار' },
    ];

    return (
        <div className="flex flex-col items-center justify-center p-6 h-full font-sans">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mb-6 shadow-sm relative"
            >
                <div className="text-4xl filter drop-shadow-sm">🤖</div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900"></div>
            </motion.div>

            <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center"
            >
                مرحباً بك في راموسة! 👋
            </motion.h2>

            <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 text-sm text-center mb-8 max-w-[240px]"
            >
                أنا مساعدك الذكي. كيف يمكنني خدمتك اليوم؟
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {actions.map((action, index) => (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (index * 0.1) }}
                        onClick={() => onActionSelect(action.query)}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all text-right group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {action.icon}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {action.label}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
