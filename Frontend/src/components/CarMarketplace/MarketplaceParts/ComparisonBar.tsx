import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparison } from '../../../hooks/useComparison';
import { X, GitCompare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ComparisonBar: React.FC = () => {
    const { items, removeItem, clearAll } = useComparison();
    const navigate = useNavigate();

    if (items.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4"
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <GitCompare className="w-5 h-5 text-primary" />
                            <span className="font-bold text-slate-900 dark:text-white">
                                مقارنة السيارات ({items.length}/4)
                            </span>
                        </div>
                        <button
                            onClick={clearAll}
                            className="text-sm text-slate-500 hover:text-red-500 transition-colors"
                        >
                            مسح الكل
                        </button>
                    </div>

                    <div className="flex gap-3 mb-3">
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 relative group"
                            >
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <img
                                    src={item.photos?.[0] || item.images?.[0] || '/placeholder-car.jpg'}
                                    alt={item.title}
                                    className="w-full h-16 object-cover rounded-lg mb-2"
                                />
                                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                    {item.title}
                                </p>
                                <p className="text-xs text-primary font-bold">
                                    {new Intl.NumberFormat('ar-SY', {
                                        style: 'currency',
                                        currency: 'SYP',
                                        maximumFractionDigits: 0
                                    }).format(item.price || item.daily_rate || 0)}
                                </p>
                            </motion.div>
                        ))}

                        {/* Empty slots */}
                        {Array.from({ length: 4 - items.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="flex-1 bg-slate-100 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 text-xs"
                            >
                                أضف سيارة
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/car-listings/compare')}
                        disabled={items.length < 2}
                        className="w-full py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        قارن الآن
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ComparisonBar;
