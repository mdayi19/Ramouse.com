import React from 'react';

export const ProductSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse h-full flex flex-col">
            <div className="w-full h-48 bg-slate-200 dark:bg-slate-700"></div>
            <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
            </div>
        </div>
    );
};
