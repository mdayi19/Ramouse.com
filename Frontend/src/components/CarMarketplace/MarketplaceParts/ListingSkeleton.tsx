import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface ListingSkeletonProps {
    count?: number;
    viewMode?: 'grid' | 'list';
}

const ShimmerEffect = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
);

const SkeletonCard = ({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) => {
    if (viewMode === 'list') {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row h-auto sm:h-48">
                {/* Image */}
                <div className="w-full sm:w-64 h-48 sm:h-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                    <ShimmerEffect />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 relative overflow-hidden">
                            <ShimmerEffect />
                        </div>
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 relative overflow-hidden">
                            <ShimmerEffect />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 relative overflow-hidden">
                            <ShimmerEffect />
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 relative overflow-hidden">
                            <ShimmerEffect />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 relative overflow-hidden">
                            <ShimmerEffect />
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 relative overflow-hidden">
                            <ShimmerEffect />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view skeleton
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            {/* Image */}
            <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                <ShimmerEffect />
            </div>

            {/* Content */}
            <div className="p-4 pb-2 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 relative overflow-hidden">
                        <ShimmerEffect />
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 relative overflow-hidden">
                        <ShimmerEffect />
                    </div>
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-4/5 relative overflow-hidden">
                    <ShimmerEffect />
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24 relative overflow-hidden">
                    <ShimmerEffect />
                </div>
            </div>

            {/* Specs Grid */}
            <div className="px-4 py-3 border-y border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 mt-auto">
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-2 rounded bg-white dark:bg-slate-700 relative overflow-hidden">
                            <div className="h-4 w-4 bg-slate-200 dark:bg-slate-600 rounded mb-1" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-12" />
                            <ShimmerEffect />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 flex items-center justify-between text-xs">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 relative overflow-hidden">
                    <ShimmerEffect />
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 relative overflow-hidden">
                    <ShimmerEffect />
                </div>
            </div>
        </div>
    );
};

export const ListingSkeleton: React.FC<ListingSkeletonProps> = ({ count = 6, viewMode = 'grid' }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <SkeletonCard viewMode={viewMode} />
                </motion.div>
            ))}
        </>
    );
};

export default ListingSkeleton;
