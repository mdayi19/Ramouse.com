import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuctionBid } from '../../types';
import Icon from '../Icon';

interface BidderFeedProps {
    bids: AuctionBid[];
}

export const BidderFeed: React.FC<BidderFeedProps> = ({ bids }) => {
    const [displayBids, setDisplayBids] = useState<AuctionBid[]>([]);
    const lastBidIdRef = React.useRef<string | number | null>(null);

    useEffect(() => {
        if (bids.length > 0) {
            const latest = bids[0];
            if (latest.id !== lastBidIdRef.current) {
                lastBidIdRef.current = latest.id;
                setDisplayBids(prev => [latest, ...prev].slice(0, 3));
            }
        }
    }, [bids]);

    // Random cities for "flavor" (Simulated since backend doesn't provide location yet)
    const getCity = (id: string | number) => {
        const cities = ['الرياض', 'جدة', 'الدمام', 'دبي', 'الكويت', 'مكة'];
        // fast deterministic hash
        const index = String(id).charCodeAt(0) % cities.length;
        return cities[index];
    };

    return (
        <div className="absolute top-24 left-4 z-40 w-64 pointer-events-none space-y-2">
            <AnimatePresence>
                {displayBids.map((bid) => (
                    <motion.div
                        key={bid.id || bid.bid_time}
                        initial={{ opacity: 0, x: -50, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: -50, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700/50 shadow-xl flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Icon name="Hammer" className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">
                                ${bid.amount.toLocaleString()}
                            </p>
                            <p className="text-slate-400 text-xs flex items-center gap-1">
                                <span className="text-white/70">{bid.amount > 100000 ? '🔥' : '👤'} {bid.display_name}</span>
                                <span className="text-slate-600">•</span>
                                <span>من {getCity(bid.id || 0)}</span>
                            </p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
