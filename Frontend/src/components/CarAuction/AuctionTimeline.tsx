import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../Icon';
import { Auction, AuctionBid } from '../../types';

interface AuctionTimelineProps {
    auction: Auction;
    bids: AuctionBid[];
    className?: string;
}

type TimelineEvent = {
    id: string;
    type: 'bid' | 'start' | 'end' | 'extension' | 'reserve_met';
    date: Date;
    data?: any;
};

export const AuctionTimeline: React.FC<AuctionTimelineProps> = ({ auction, bids, className = '' }) => {

    // Merge and sort all events
    const events = useMemo(() => {
        const timelineEvents: TimelineEvent[] = [];

        // 1. Start Event
        if (auction.actual_start || auction.scheduled_start) {
            timelineEvents.push({
                id: 'start',
                type: 'start',
                date: new Date(auction.actual_start || auction.scheduled_start),
            });
        }

        // 2. Bid Events
        bids.forEach(bid => {
            timelineEvents.push({
                id: `bid-${bid.id}`,
                type: 'bid',
                date: new Date(bid.bid_time),
                data: bid
            });
        });

        // 3. Reserve Met Event (Find the first bid that met the reserve)
        if (auction.car?.reserve_price) {
            const firstMeetingBid = bids.slice().reverse().find(b => b.amount >= (auction.car?.reserve_price || 0));
            if (firstMeetingBid) {
                // Insert "Reserve Met" strictly after the bid that triggered it
                timelineEvents.push({
                    id: 'reserve',
                    type: 'reserve_met',
                    date: new Date(new Date(firstMeetingBid.bid_time).getTime() + 1000), // Add 1s offset to appear after
                    data: { amount: auction.car.reserve_price }
                });
            }
        }

        // 4. Extensions (We don't have exact timestamps for extensions in the basic model, 
        // usually we'd infer them or get them from backend logs. For now, we can show a summary if used)
        // SKIPPING specific extension timestamps for now unless we have data.

        // 5. End Event
        if (auction.has_ended && auction.actual_end) {
            timelineEvents.push({
                id: 'end',
                type: 'end',
                date: new Date(auction.actual_end),
            });
        }

        // Sort descending (newest first)
        return timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [auction, bids]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
                <h3 className="text-white font-bold flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        نشاط المزاد
                    </div>
                    <span className="text-xs text-slate-400 font-normal">
                        {events.length} حدث
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 relative">
                {/* Vertical Line */}
                <div className="absolute top-4 bottom-4 right-[27px] w-0.5 bg-white/5"></div>

                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[200px]">
                        <Icon name="Activity" className="w-10 h-10 mb-3 opacity-20" />
                        <p>لا توجد مزايدات حتى الآن</p>
                        <p className="text-xs opacity-60 mt-1">كن أول من يزايد!</p>
                    </div>
                ) : (
                    events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                opacity: { duration: 0.2 }
                            }}
                            className="relative flex gap-4 mr-1"
                        >
                            {/* Icon Node */}
                            <div className="relative z-10 flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-slate-900 
                                    ${event.type === 'bid' ? (index === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300') : ''}
                                    ${event.type === 'start' ? 'bg-blue-500 text-white' : ''}
                                    ${event.type === 'end' ? 'bg-red-500 text-white' : ''}
                                    ${event.type === 'reserve_met' ? 'bg-yellow-500 text-white' : ''}
                                `}>
                                    {event.type === 'bid' && (
                                        <span className="text-xs font-bold">
                                            {event.data.display_name ? event.data.display_name.charAt(0) : 'U'}
                                        </span>
                                    )}
                                    {event.type === 'start' && <Icon name="Play" className="w-4 h-4" />}
                                    {event.type === 'end' && <Icon name="Flag" className="w-4 h-4" />}
                                    {event.type === 'reserve_met' && <Icon name="Check" className="w-4 h-4" />}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                {event.type === 'bid' && (
                                    <div className={`rounded-xl p-3 border ${index === 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-white text-sm font-bold truncate">
                                                    {event.data.display_name || event.data.anonymized_name}
                                                </p>
                                                <p className="text-slate-500 text-[10px]">
                                                    {event.date.toLocaleTimeString('ar-SA')}
                                                </p>
                                            </div>
                                            <p className={`font-mono font-bold ${index === 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                ${event.data.amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {event.type === 'start' && (
                                    <div className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg inline-block border border-blue-500/20">
                                        بدأ المزاد
                                    </div>
                                )}

                                {event.type === 'end' && (
                                    <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg inline-block border border-red-500/20">
                                        انتهى المزاد
                                    </div>
                                )}

                                {event.type === 'reserve_met' && (
                                    <div className="text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-lg inline-block border border-yellow-500/20 font-bold">
                                        ✨ تم الوصول للحد الأدنى
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
