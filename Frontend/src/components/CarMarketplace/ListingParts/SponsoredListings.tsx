import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { CarListing } from '../../../services/carprovider.service';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { CarListingCard } from '../MarketplaceParts/CarListingCard';
import { RentListingCard } from '../MarketplaceParts/RentListingCard';

interface SponsoredListingsProps {
    currentListingId?: number;
    t: any;
    listingType?: 'sale' | 'rent';
    listings?: CarListing[];
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

const SponsoredListings: React.FC<SponsoredListingsProps> = ({
    currentListingId,
    t,
    listingType,
    listings: providedListings,
    showToast,
    isAuthenticated,
    onLoginClick
}) => {
    const navigate = useNavigate();
    const [fetchedListings, setFetchListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(!providedListings);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Use provided listings or fetched ones
    const displayListings = providedListings || fetchedListings;

    // Create duplicated listings for infinite loop
    const infiniteListings = [...displayListings, ...displayListings];

    // Auto-Scroll Logic
    useEffect(() => {
        if (loading || isHovered || displayListings.length === 0) return;

        const interval = setInterval(() => {
            if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;

                // Calculate exact card width including gap dynamically
                const firstCard = container.firstElementChild as HTMLElement;
                const style = window.getComputedStyle(container);
                const gap = parseInt(style.gap || '0', 10);

                if (!firstCard) return;

                const cardWidth = firstCard.offsetWidth + gap;
                const singleSetWidth = cardWidth * displayListings.length;

                // Check if we need to snap back to the start
                // If we've scrolled past the first set, reset position instantly
                // We use a small threshold (10px) to ensure we don't snap prematurely due to rounding
                if (container.scrollLeft >= singleSetWidth) {
                    container.scrollLeft -= singleSetWidth;
                }

                // Scroll to the next card
                container.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
        }, 3000); // Scroll every 3 seconds

        return () => clearInterval(interval);
    }, [loading, isHovered, displayListings.length]);

    useEffect(() => {
        // If listings are provided, we don't need to fetch
        if (providedListings) {
            setLoading(false);
            return;
        }

        const fetchSponsored = async () => {
            try {
                setLoading(true);
                // Fetch listings explicitly asking for sponsored items
                const params: any = {
                    is_sponsored: 1,
                    limit: 15, // Increase limit for carousel
                };

                if (listingType) {
                    params.listing_type = listingType;
                }

                const response = await api.get('/car-listings', { params });

                // Fix: API returns listings inside 'listings' object
                const responseData = response.data;
                const rawListings = responseData.listings?.data || responseData.data || [];

                console.log('Sponsored Debug - Raw:', rawListings.length, rawListings);

                let sponsored = rawListings
                    .filter((item: CarListing) => {
                        const rawItem = item as any;
                        const isSponsored = rawItem.is_sponsored == true || rawItem.is_sponsored == 1 || rawItem.is_sponsored == '1';
                        // Add safety check for listing_type in case it's missing or mixed case
                        const itemType = item.listing_type ? item.listing_type.toLowerCase() : '';
                        const targetType = listingType ? listingType.toLowerCase() : '';
                        const typeMatch = !listingType || itemType === targetType;

                        return item.id !== currentListingId && isSponsored && typeMatch;
                    });

                console.log('Sponsored Debug - Filtered:', sponsored.length, sponsored);

                // Fallback client-side shuffle if backend doesn't support random sort effectively
                sponsored = sponsored.sort(() => 0.5 - Math.random());

                setFetchListings(sponsored);
            } catch (err) {
                console.error('Failed to fetch sponsored listings', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsored();
    }, [currentListingId, listingType, providedListings]);

    // if (!loading && displayListings.length === 0) return null;

    const renderCard = (item: CarListing) => {
        const isRent = item.listing_type === 'rent';
        const commonProps = {
            listing: item,
            viewMode: 'grid' as const,
            showToast,
            isAuthenticated,
            onLoginClick,
            isSponsoredInjection: true // Apply sponsored styling
        };

        if (listingType === 'rent' || isRent) {
            return <RentListingCard {...commonProps} />;
        }
        return <CarListingCard {...commonProps} />;
    };

    return (
        <div className="mt-6 sm:mt-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-yellow-100 dark:border-yellow-900/30 overflow-hidden relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/20 rotate-3 transform transition-transform hover:rotate-6">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {listingType === 'rent' ? 'سيارات للإيجار مميزة' : 'إعلانات مميزة'}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                            فرص حصرية لا تفوتها
                        </p>
                    </div>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {loading ? (
                    <div className="flex gap-4 sm:gap-6 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="min-w-[85vw] sm:min-w-[320px] bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse border border-gray-100 dark:border-gray-700">
                                <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-2 px-2 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {infiniteListings.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="snap-center w-[85vw] sm:w-[340px] flex-shrink-0"
                            >
                                {renderCard(item)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>


        </div>
    );
};

export default SponsoredListings;
