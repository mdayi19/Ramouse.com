import React from 'react';

export const AuctionCardSkeleton: React.FC = () => {
    return (
        <div className="bg-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-sm border border-white/10 animate-pulse">
            {/* Image Skeleton */}
            <div className="relative h-48 bg-slate-700/50" />

            {/* Content Skeleton */}
            <div className="p-5 space-y-4">
                {/* Title */}
                <div className="h-6 bg-slate-700/50 rounded w-3/4" />

                {/* Price */}
                <div className="h-8 bg-slate-700/50 rounded w-1/2" />

                {/* Info */}
                <div className="flex gap-2">
                    <div className="h-4 bg-slate-700/50 rounded w-20" />
                    <div className="h-4 bg-slate-700/50 rounded w-24" />
                </div>

                {/* Status  */}
                <div className="h-10 bg-slate-700/50 rounded w-full" />
            </div>
        </div>
    );
};

export const LiveAuctionRoomSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 rounded-3xl h-[500px] animate-pulse" />
                    </div>

                    {/* Bidding Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Timer */}
                        <div className="bg-slate-800/50 rounded-3xl h-32 animate-pulse" />

                        {/* Current Bid */}
                        <div className="bg-slate-800/50 rounded-3xl h-40 animate-pulse" />

                        {/* Actions */}
                        <div className="bg-slate-800/50 rounded-3xl h-64 animate-pulse" />
                    </div>

                    {/* Car Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 rounded-3xl h-64 animate-pulse" />
                    </div>

                    {/* Timeline */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800/50 rounded-3xl h-64 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};
