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

    if (loading || similarAuctions.length === 0) return null;

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
                    <div key={auction.id} className="min-w-[280px] md:min-w-[320px] snap-center">
                        <div className="h-full" onClick={() => navigate(`/auctions/${auction.id}`)}>
                            <AuctionCard
                                auction={auction}
                                onView={() => navigate(`/auctions/${auction.id}`)}
                                compact={true}
                                showReminder={false}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
