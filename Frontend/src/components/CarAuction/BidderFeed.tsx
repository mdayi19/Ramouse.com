import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuctionBid } from '../../types';
import Icon from '../Icon';

interface BidderFeedProps {
    bids: AuctionBid[];
}

/**
 * Format a timestamp as relative time in Arabic
 */
const formatTimeAgo = (timestamp: string | undefined): string => {
    if (!timestamp) return 'الآن';

    const now = new Date();
    const bidTime = new Date(timestamp);
    const diffMs = now.getTime() - bidTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 5) return 'الآن';
    if (diffSecs < 60) return `منذ ${diffSecs} ثانية`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    return `منذ ${Math.floor(diffHours / 24)} يوم`;
};

export const BidderFeed: React.FC<BidderFeedProps> = ({ bids }) => {
    const [displayBids, setDisplayBids] = useState<AuctionBid[]>([]);
    const [latestBidId, setLatestBidId] = useState<string | number | null>(null);
    const lastBidIdRef = React.useRef<string | number | null>(null);

    useEffect(() => {
        if (bids.length > 0) {
            const latest = bids[0];
            if (latest.id !== lastBidIdRef.current) {
                lastBidIdRef.current = latest.id;
                setLatestBidId(latest.id);
                setDisplayBids(prev => [latest, ...prev].slice(0, 3));

                // Clear "latest" highlight after 3 seconds
                const timer = setTimeout(() => {
                    setLatestBidId(null);
                }, 3000);

                return () => clearTimeout(timer);
            }
        }
    }, [bids]);

    // Memoize display bids to prevent unnecessary re-renders
    const renderedBids = useMemo(() => displayBids, [displayBids]);

    if (renderedBids.length === 0) return null;

    return (
        <div className="absolute top-24 left-4 z-40 w-72 pointer-events-none space-y-2">
            <AnimatePresence mode="popLayout">
                {renderedBids.map((bid, index) => {
                    const isLatest = bid.id === latestBidId;
                    const isHighValue = bid.amount > 100000;

                    return (
                        <motion.div
                            key={bid.id || bid.bid_time}
                            layout
                            initial={{ opacity: 0, x: -50, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                            }}
                            exit={{ opacity: 0, x: -50, scale: 0.8 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                                delay: index * 0.05
                            }}
                            className={`
                                relative bg-slate-800/90 backdrop-blur-md rounded-xl p-3 
                                border shadow-xl flex items-center gap-3
                                ${isLatest
                                    ? 'border-emerald-500/50 ring-2 ring-emerald-500/30'
                                    : 'border-slate-700/50'
                                }
                            `}
                        >
                            {/* Pulsing ring effect for latest bid */}
                            {isLatest && (
                                <motion.div
                                    className="absolute -inset-0.5 rounded-xl bg-emerald-500/20"
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}

                            <div className={`
                                relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                                ${isHighValue
                                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }
                            `}>
                                <Icon name={isHighValue ? "Flame" : "Hammer"} className="w-5 h-5" />
                            </div>

                            <div className="relative z-10 flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-white font-bold text-base">
                                        ${bid.amount.toLocaleString()}
                                    </p>
                                    {isLatest && (
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                            جديد
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs mt-0.5">
                                    <span className="text-white/80 font-medium truncate">
                                        {isHighValue ? '🔥' : '👤'} {bid.display_name}
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-400 whitespace-nowrap">
                                        {formatTimeAgo(bid.bid_time)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
