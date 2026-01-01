import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../Icon';
import { AuctionBid } from '../../types';

interface BidHistoryCardProps {
    bid: AuctionBid;
    isCurrentUser?: boolean;
    isWinning?: boolean;
    index: number;
}

export const BidHistoryCard: React.FC<BidHistoryCardProps> = ({
    bid,
    isCurrentUser = false,
    isWinning = false,
    index,
}) => {
    const getTimeAgo = (timestamp: string) => {
        const now = new Date().getTime();
        const bidTime = new Date(timestamp).getTime();
        const diffInSeconds = Math.floor((now - bidTime) / 1000);

        if (diffInSeconds < 60) return `منذ ${diffInSeconds} ثانية`;
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    };

    const getBidderDisplay = (bidderName: string | undefined, isCurrentUser: boolean) => {
        if (isCurrentUser) return 'أنت';
        if (!bidderName) return 'مزايد مجهول';

        // Anonymize bidder name for privacy (show first letter + ***)
        const firstLetter = bidderName.charAt(0);
        return `${firstLetter}***`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className={`
                relative p-4 rounded-xl border transition-all duration-300
                ${isCurrentUser
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }
                ${isWinning
                    ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                    : ''
                }
                hover:shadow-md
            `}
        >
            {/* Winning Badge */}
            {isWinning && (
                <div className="absolute -top-2 -right-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1"
                    >
                        <Icon name="Crown" className="w-3 h-3" />
                        أعلى مزايدة
                    </motion.div>
                </div>
            )}

            <div className="flex items-center justify-between">
                {/* Bidder Info */}
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }
                    `}>
                        {isCurrentUser ? (
                            <Icon name="User" className="w-5 h-5" />
                        ) : (
                            getBidderDisplay(bid.bidder_name, false).charAt(0)
                        )}
                    </div>

                    {/* Name and Time */}
                    <div>
                        <p className={`font-bold text-sm ${isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {getBidderDisplay(bid.bidder_name, isCurrentUser)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Icon name="Clock" className="w-3 h-3" />
                            {getTimeAgo(bid.bid_time)}
                        </p>
                    </div>
                </div>

                {/* Bid Amount */}
                <div className="text-left">
                    <motion.p
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-xl font-black ${isWinning
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isCurrentUser
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-800 dark:text-white'
                            }`}
                    >
                        ${bid.amount.toLocaleString()}
                    </motion.p>
                </div>
            </div>
        </motion.div>
    );
};

export default BidHistoryCard;
