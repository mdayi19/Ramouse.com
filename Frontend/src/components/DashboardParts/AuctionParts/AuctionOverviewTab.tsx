import React from 'react';
import { AuctionStats } from '../../../types';
import Icon from '../../Icon';
import { motion } from 'framer-motion';
import AuctionActivityLog from './AuctionActivityLog';
import AuctionCharts from './AuctionCharts';
import LiveAuctionControl from './LiveAuctionControl';
import AuctionSmartInsights from './AuctionSmartInsights';

interface AuctionOverviewTabProps {
    stats: AuctionStats | null;
}

export const AuctionOverviewTab: React.FC<AuctionOverviewTabProps> = ({ stats }) => {
    // 1. Core Stats
    const statCards = [
        {
            title: 'Total Cars',
            value: stats?.total_cars || 0,
            icon: 'Car',
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Pending',
            value: stats?.pending_approval || 0,
            icon: 'Clock',
            gradient: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
        },
        {
            title: 'Live Now',
            value: stats?.live_auctions || 0,
            icon: 'Radio',
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            text: 'text-rose-600 dark:text-rose-400',
            pulse: true
        },
        {
            title: 'Revenue',
            value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
            icon: 'DollarSign',
            gradient: 'from-teal-500 to-teal-600',
            bg: 'bg-teal-50 dark:bg-teal-900/20',
            text: 'text-teal-600 dark:text-teal-400',
            isCurrency: true
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Top Row: Core Stats + Live Control */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Stats Grid */}
                <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            className="relative bg-white dark:bg-darkcard rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-800 group overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-bl-[80px]`} />

                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.text}`}>
                                    <Icon name={stat.icon as any} className="w-5 h-5" />
                                </div>
                                {stat.pulse && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {stat.value}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {stat.title}
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    {/* Charts embedded in the main stats area for tablet/mobile */}
                    <div className="col-span-2 md:col-span-4 mt-2">
                        <AuctionCharts />
                    </div>
                </div>

                {/* Right Column: Live Control & Insights */}
                <div className="space-y-6">
                    <LiveAuctionControl />
                    <AuctionSmartInsights />
                </div>
            </div>

            {/* Bottom Row: Activity Log */}
            <div className="grid grid-cols-1 gap-6">
                <AuctionActivityLog />
            </div>
        </motion.div>
    );
};

export default AuctionOverviewTab;
