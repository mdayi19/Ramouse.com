import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface FilterSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
    icon?: React.ElementType;
    isOpen: boolean;
    onToggle: (id: string) => void;
    activeCount?: number;
    onClear?: (id: string) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
    id,
    title,
    children,
    icon: Icon,
    isOpen,
    onToggle,
    activeCount = 0,
    onClear
}) => {
    return (
        <div
            className="border-b border-slate-200 dark:border-slate-700 py-4 last:border-0"
            role="group"
            aria-labelledby={`filter-section-${id}`}
        >
            <button
                onClick={() => onToggle(id)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle(id);
                    }
                }}
                className="flex items-center justify-between w-full text-left mb-2 group"
                aria-expanded={isOpen}
                aria-controls={`filter-content-${id}`}
                id={`filter-section-${id}`}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary/80" />}
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {title}
                    </span>
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary rounded-full">
                            {activeCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeCount > 0 && onClear && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear(id);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onClear(id);
                                }
                            }}
                            tabIndex={0}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                            title="مسح هذا القسم"
                            aria-label="مسح هذا القسم"
                        >
                            <X className="w-3.5 h-3.5 text-slate-400 hover:text-primary" />
                        </div>
                    )}
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                        id={`filter-content-${id}`}
                        role="region"
                        aria-labelledby={`filter-section-${id}`}
                    >
                        <div className="pt-2 pb-1 space-y-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
