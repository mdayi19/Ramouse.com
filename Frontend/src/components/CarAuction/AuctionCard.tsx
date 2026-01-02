
import React, { useState } from 'react';
import { Auction } from '../../types';
import { useAuctionCountdown } from '../../hooks/useAuction';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AuctionStatusBadge } from './AuctionStatusBadge';
import Icon from '../Icon';
import { motion } from 'framer-motion';
import { useAuctionConnection } from '../../hooks/useAuctionConnection';

interface AuctionCardProps {
    auction: Auction;
    onView: (auction: Auction) => void;
    onRemind?: (auction: Auction) => void;
    onToggleWatchlist?: (auction: Auction) => void;
    isInWatchlist?: boolean;
    showReminder?: boolean;
    /** Show connection status indicator */
    showConnectionStatus?: boolean;
    /** Compact mode for smaller screens */
    compact?: boolean;
}

const AuctionCardComponent: React.FC<AuctionCardProps> = ({
    auction,
    onView,
    onRemind,
    onToggleWatchlist,
    isInWatchlist = false,
    showReminder = true,
    showConnectionStatus = false,
    compact = false,
}) => {
    const { formatted, isExpired, timeRemaining } = useAuctionCountdown(
        auction.is_live ? (auction.actual_end || auction.scheduled_end) : auction.scheduled_start
    );
    const { status: connectionStatus } = useAuctionConnection();
    const [imageLoaded, setImageLoaded] = useState(false);

    const primaryImage = auction.car?.media?.images?.[0] || '/placeholder-car.jpg';
    const currentPrice = auction.current_bid || auction.starting_bid;

    // Extract additional car details
    const carDetails = {
        mileage: auction.car?.mileage,
        transmission: auction.car?.transmission,
        fuelType: auction.car?.fuel_type,
        bodyType: auction.car?.body_type,
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="group relative bg-white dark:bg-darkcard rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col h-full"
        >
            {/* Image Section */}
            <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-80" />

                {/* Progressive Image Loading */}
                {!imageLoaded && (
                    <div className="absolute inset-0 animate-pulse bg-slate-300 dark:bg-slate-700" />
                )}
                <img
                    src={primaryImage}
                    alt={auction.title}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                        setImageLoaded(true);
                    }}
                />

                {/* Watchlist Button */}
                {onToggleWatchlist && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(auction);
                        }}
                        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-lg"
                        title={isInWatchlist ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                        <Icon
                            name="Heart"
                            className={`w-5 h-5 transition-all ${isInWatchlist
                                ? 'text-red-500 fill-red-500'
                                : 'text-white'
                                }`}
                        />
                    </motion.button>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <AuctionStatusBadge
                        status={auction.status}
                        isLive={auction.is_live}
                    />

                    {auction.car?.buy_now_price && (
                        <Badge variant="warning" className="bg-amber-500 text-white border-0 shadow-lg font-bold text-[10px] w-fit">
                            شراء فوري
                        </Badge>
                    )}

                    {auction.car?.reserve_price && auction.car.reserve_price > 0 && (
                        (auction.current_bid || 0) >= auction.car.reserve_price ? (
                            <Badge variant="success" className="bg-emerald-600 text-white border-0 shadow-lg font-bold text-[10px] w-fit">
                                تم الوصول للحد الأدنى
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="bg-red-500/80 backdrop-blur-md text-white border-0 shadow-lg font-bold text-[10px] w-fit">
                                لم يصل للحد الأدنى
                            </Badge>
                        )
                    )}
                </div>

                {/* Timer Overlay */}
                {(auction.is_live || auction.status === 'scheduled') && !isExpired && (
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                        <div className={`flex items-center justify-between backdrop-blur-md border rounded-xl p-2.5 shadow-lg transition-all duration-300 ${timeRemaining < 300 // < 5 minutes
                            ? 'bg-red-500/20 border-red-500/30 animate-countdown-critical'
                            : timeRemaining < 3600 // < 1 hour
                                ? 'bg-amber-500/20 border-amber-500/30 animate-countdown-urgent'
                                : 'bg-white/10 border-white/10'
                            }`}>
                            <div className="flex items-center gap-2 text-white/90">
                                <Icon
                                    name={auction.is_live ? 'Flame' : 'Calendar'}
                                    className={`w-4 h-4 ${auction.is_live
                                        ? timeRemaining < 300
                                            ? 'text-red-400'
                                            : 'text-red-400 animate-pulse'
                                        : 'text-blue-200'
                                        }`}
                                />
                                <span className="text-xs font-semibold">
                                    {auction.is_live ? 'ينتهي خلال' : 'يبدأ خلال'}
                                </span>
                            </div>
                            <span className={`font-mono font-bold text-sm bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-sm tracking-wider ${timeRemaining < 300
                                ? 'text-red-300'
                                : timeRemaining < 3600
                                    ? 'text-amber-300'
                                    : 'text-white'
                                }`}>
                                {formatted}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
                        {auction.title}
                    </h3>

                    {auction.car && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-100">
                                {auction.car.brand}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-100">
                                {auction.car.model}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-100">
                                {auction.car.year}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-4">
                    {/* Connection Status (if enabled and not connected) */}
                    {showConnectionStatus && connectionStatus !== 'connected' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <Icon name="WifiOff" className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                {connectionStatus === 'reconnecting' ? 'إعادة الاتصال...' : 'غير متصل'}
                            </span>
                        </div>
                    )}
                    {/* Pricing Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                    {auction.current_bid ? 'أعلى مزايدة' : 'يبدأ من'}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <motion.span
                                        key={currentPrice}
                                        initial={{ scale: 1.2 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-700 transition-colors"
                                    >
                                        ${currentPrice?.toLocaleString()}
                                    </motion.span>
                                </div>
                            </div>

                            {auction.bid_count > 0 && (
                                <div className="text-center px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">مزايدات</p>
                                    <div className="flex items-center gap-1 text-blue-600 font-bold">
                                        <Icon name="Hammer" className="w-3 h-3" />
                                        <span className="text-sm">{auction.bid_count}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant={auction.is_live ? 'danger' : 'outline'}
                            onClick={() => onView(auction)}
                            className={`flex-1 rounded-xl py-5 text-sm font-bold shadow-sm transition-all
                                ${auction.is_live
                                    ? 'bg-red-600 hover:bg-red-700 text-white border-0 shadow-red-200'
                                    : 'border-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'}`}
                            leftIcon={<Icon name={auction.is_live ? 'Flame' : 'Eye'} className="w-4 h-4" />}
                        >
                            {auction.is_live ? 'زايد الآن' : 'التفاصيل'}
                        </Button>

                        {showReminder && auction.status === 'scheduled' && !auction.has_reminder && onRemind && (
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onRemind(auction)}
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 border border-slate-100 dark:border-slate-700 transition-all"
                                title="ذكرني"
                            >
                                <Icon name="Bell" className="w-5 h-5" />
                            </motion.button>
                        )}

                        {auction.has_reminder && (
                            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800" title="تم تعيين تذكير">
                                <Icon name="CheckCircle" className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Memoize component to prevent unnecessary re-renders
export const AuctionCard = React.memo(AuctionCardComponent, (prevProps, nextProps) => {
    // Custom comparison - only re-render if these specific fields change
    return (
        prevProps.auction.id === nextProps.auction.id &&
        prevProps.auction.current_bid === nextProps.auction.current_bid &&
        prevProps.auction.bid_count === nextProps.auction.bid_count &&
        prevProps.auction.status === nextProps.auction.status &&
        prevProps.auction.is_live === nextProps.auction.is_live &&
        prevProps.auction.has_reminder === nextProps.auction.has_reminder &&
        prevProps.isInWatchlist === nextProps.isInWatchlist &&
        prevProps.showReminder === nextProps.showReminder
    );
});

export default AuctionCard;
