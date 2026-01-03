import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import { useRealtime } from '../../../hooks/useRealtime';

interface ActivityItem {
    id: string;
    type: 'bid' | 'auction_start' | 'auction_end' | 'car_approved' | 'status_change';
    message: string;
    timestamp: Date;
    auctionId?: string;
    amount?: number;
    details?: any;
}

/**
 * Format timestamp as relative time in Arabic
 */
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 5) return 'الآن';
    if (diffSecs < 60) return `منذ ${diffSecs} ثانية`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    return `منذ ${Math.floor(diffHours / 24)} يوم`;
};

const AuctionActivityLog: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const { echo } = useRealtime();
    const listRef = useRef<HTMLDivElement>(null);

    // Initialize with system check message
    useEffect(() => {
        setActivities([
            { id: '1', type: 'status_change', message: 'تم تنشيط نظام المراقبة', timestamp: new Date(Date.now() - 1000 * 60 * 5) }
        ]);
    }, []);

    const addActivity = (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
        const newActivity: ActivityItem = {
            ...activity,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50
    };

    useEffect(() => {
        const channel = echo.private('admin.dashboard');

        channel.listen('.bid.placed', (e: any) => {
            addActivity({
                type: 'bid',
                message: `مزايدة جديدة بقيمة $${e.auction?.currentBid?.toLocaleString()} على المزاد #${e.auction?.id}`,
                auctionId: e.auction?.id,
                amount: e.auction?.currentBid,
                details: e
            });
        });

        channel.listen('.auction.started', (e: any) => {
            addActivity({
                type: 'auction_start',
                message: `المزاد "${e.auction?.title}" أصبح مباشر الآن 🔴`,
                auctionId: e.auction?.id,
                details: e
            });
        });

        channel.listen('.auction.ended', (e: any) => {
            addActivity({
                type: 'auction_end',
                message: `انتهى المزاد "${e.auction?.title}". الفائز: ${e.auction?.winnerName || 'لا يوجد'}`,
                auctionId: e.auction?.id,
                details: e
            });
        });

        channel.listen('.car.approved', (e: any) => {
            addActivity({
                type: 'car_approved',
                message: `تمت الموافقة على السيارة "${e.car?.title}"`,
                details: e
            });
        });

        return () => {
            channel.stopListening('.bid.placed');
            channel.stopListening('.auction.started');
            channel.stopListening('.auction.ended');
            channel.stopListening('.car.approved');
        };
    }, [echo]);

    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'bid': return { name: 'DollarSign', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' };
            case 'auction_start': return { name: 'Zap', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
            case 'auction_end': return { name: 'Flag', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
            case 'car_approved': return { name: 'CheckCircle', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' };
            default: return { name: 'Activity', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' };
        }
    };

    return (
        <div className="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <Icon name="Activity" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">النشاط المباشر</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">أحداث النظام في الوقت الفعلي</p>
                    </div>
                </div>
                <div className="flex gap-1" title="متصل مباشرة">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4" ref={listRef} style={{ maxHeight: '400px' }}>
                <AnimatePresence initial={false}>
                    {activities.map((item) => {
                        const style = getIcon(item.type);
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="flex gap-4 items-start group"
                            >
                                <div className={`relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                                    <Icon name={style.name as any} className="w-5 h-5" />
                                    {/* Connector Line */}
                                    <div className="absolute top-10 bottom-0 left-1/2 -ml-px w-px bg-gray-100 dark:bg-gray-800 h-full -mb-4 last:hidden" />
                                </div>
                                <div className="flex-1 pt-1 pb-4 border-b border-gray-50 dark:border-gray-800/50 group-last:border-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-snug">
                                        {item.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                            {formatTimeAgo(item.timestamp)}
                                        </span>
                                        {item.auctionId && (
                                            <span className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer">
                                                #{item.auctionId}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {activities.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <Icon name="Inbox" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm opacity-70">لا يوجد نشاط حديث</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctionActivityLog;

