import React from 'react';

export const StoreOrderSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-darkcard p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 animate-pulse">
            <div className="flex items-start gap-4 flex-grow">
                {/* Image skeleton */}
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl flex-shrink-0"></div>
                <div className="space-y-2 flex-grow">
                    {/* ID and Date */}
                    <div className="flex items-center gap-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    </div>
                    {/* Product Name */}
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    {/* Status and quantity */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                </div>
            </div>
            {/* Price and actions */}
            <div className="flex flex-row md:flex-col justify-between items-end border-t md:border-t-0 border-slate-100 dark:border-slate-700 pt-4 md:pt-0">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                <div className="flex gap-2 mt-1">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};
