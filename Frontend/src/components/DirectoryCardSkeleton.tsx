import React from 'react';

/**
 * Skeleton loader for directory cards (technician/tow truck cards)
 * Matches the structure of TechnicianCard and TowTruckCard components
 */
export const DirectoryCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-darkcard rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col animate-pulse">
            {/* Cover Image Skeleton */}
            <div className="h-24 bg-slate-200 dark:bg-slate-700"></div>

            {/* Card Content */}
            <div className="p-4 flex flex-col flex-grow relative -mt-12">
                {/* Profile Photo Circle */}
                <div className="flex items-end gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-darkcard"></div>
                </div>

                {/* Name */}
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mt-3"></div>

                {/* Specialty and City */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8"></div>
                </div>

                {/* Description */}
                <div className="mt-3 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>

                {/* Button */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
                </div>
            </div>
        </div>
    );
};

export default DirectoryCardSkeleton;
