import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuctions } from '../../hooks/useAuction';
import { AuctionCard } from './AuctionCard';
import { Button } from '../ui/Button';
import Icon from '../Icon';
import { useNavigate } from 'react-router-dom';

interface SimilarAuctionsCarouselProps {
    currentAuctionId?: string;
}

/**
 * Skeleton placeholder for loading state
 */
const AuctionCardSkeleton: React.FC = () => (
    <div className="min-w-[280px] md:min-w-[320px] bg-white dark:bg-darkcard rounded-[2rem] overflow-hidden animate-pulse">
        {/* Image skeleton */}
        <div className="h-60 bg-slate-200 dark:bg-slate-700" />
        {/* Content skeleton */}
        <div className="p-5 space-y-4">
            <div className="space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4" />
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                    <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-md" />
                </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
    </div>
);

export const SimilarAuctionsCarousel: React.FC<SimilarAuctionsCarouselProps> = ({ currentAuctionId }) => {
    const { auctions, loading } = useAuctions('live'); // Fetch live auctions first
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Filter out current auction and limit to 10
    const similarAuctions = auctions
        .filter(a => a.id !== currentAuctionId)
        .slice(0, 10);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Show skeleton during loading
    if (loading) {
        return (
            <div className="py-8 md:py-12 relative">
                <div className="flex items-center justify-between mb-6 px-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icon name="Flame" className="w-6 h-6 text-red-500" />
                        مزادات قد تعجبك
                    </h3>
                    <div className="flex gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/5" />
                        <div className="w-10 h-10 rounded-full bg-white/5" />
                    </div>
                </div>
                <div className="flex gap-4 overflow-hidden px-4">
                    {[1, 2, 3, 4].map(i => (
                        <AuctionCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Hide if no similar auctions
    if (similarAuctions.length === 0) return null;

    return (
        <div className="py-8 md:py-12 relative">
            <div className="flex items-center justify-between mb-6 px-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Icon name="Flame" className="w-6 h-6 text-red-500" />
                    مزادات قد تعجبك
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('left')}
                        className="bg-white/5 hover:bg-white/10 text-white rounded-full"
                    >
                        <Icon name="ChevronRight" className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('right')}
                        className="bg-white/5 hover:bg-white/10 text-white rounded-full"
                    >
                        <Icon name="ChevronLeft" className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-8 px-4 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {similarAuctions.map(auction => (
                    <motion.div
                        key={auction.id}
                        className="min-w-[280px] md:min-w-[320px] snap-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="h-full cursor-pointer" onClick={() => navigate(`/auctions/${auction.id}`)}>
                            <AuctionCard
                                auction={auction}
                                onView={() => navigate(`/auctions/${auction.id}`)}
                                compact={true}
                                showReminder={false}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

