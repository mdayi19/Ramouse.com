import React from 'react';
import { cn } from '../../../lib/utils';

export const ListingSkeleton = ({ viewMode }: { viewMode: 'grid' | 'list' }) => {
    return (
        <div className={cn(
            "bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 h-full",
            viewMode === 'list' ? 'flex flex-col sm:flex-row h-auto sm:h-48' : 'flex flex-col'
        )}>
            {/* Image Skeleton */}
            <div className={cn(
                "bg-slate-200 dark:bg-slate-700 animate-pulse",
                viewMode === 'list' ? 'w-full sm:w-64 h-48 sm:h-full flex-shrink-0' : 'aspect-[16/10] w-full'
            )} />

            {/* Content Skeleton */}
            <div className="flex-1 p-4 space-y-3">
                <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>

                <div className="grid grid-cols-3 gap-2 py-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse" />
                    ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
};
