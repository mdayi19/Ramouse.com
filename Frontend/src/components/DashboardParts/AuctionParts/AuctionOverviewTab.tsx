import React from 'react';
import { AuctionStats } from '../../../types';
import Icon from '../../Icon';
import { motion } from 'framer-motion';

interface AuctionOverviewTabProps {
    stats: AuctionStats | null;
}

export const AuctionOverviewTab: React.FC<AuctionOverviewTabProps> = ({ stats }) => {
    const statCards = [
        {
            title: 'إجمالي السيارات',
            value: stats?.total_cars || 0,
            icon: 'Car',
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'بانتظار الموافقة',
            value: stats?.pending_approval || 0,
            icon: 'Clock',
            gradient: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
        },
        {
            title: 'مزادات مجدولة',
            value: stats?.scheduled_auctions || 0,
            icon: 'Calendar',
            gradient: 'from-indigo-500 to-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            text: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            title: 'مزادات مباشرة',
            value: stats?.live_auctions || 0,
            icon: 'Radio',
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            text: 'text-rose-600 dark:text-rose-400',
            pulse: true
        },
        {
            title: 'مزادات انتهت',
            value: stats?.ended_auctions || 0,
            icon: 'Square',
            gradient: 'from-slate-500 to-slate-600',
            bg: 'bg-slate-50 dark:bg-slate-900/20',
            text: 'text-slate-600 dark:text-slate-400',
        },
        {
            title: 'مزادات مكتملة',
            value: stats?.completed_auctions || 0,
            icon: 'CheckCircle',
            gradient: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            title: 'إجمالي المزايدات',
            value: stats?.total_bids || 0,
            icon: 'Hammer',
            gradient: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400',
        },
        {
            title: 'إجمالي العمولات',
            value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
            icon: 'DollarSign',
            gradient: 'from-teal-500 to-teal-600',
            bg: 'bg-teal-50 dark:bg-teal-900/20',
            text: 'text-teal-600 dark:text-teal-400',
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
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {statCards.map((stat, index) => (
                <motion.div
                    key={index}
                    variants={item}
                    className="relative bg-white dark:bg-darkcard rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 group overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-bl-[100px] transition-opacity group-hover:opacity-10`} />

                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.text} group-hover:scale-110 transition-transform duration-300 relative`}>
                            <Icon name={stat.icon as any} className="w-6 h-6" />
                            {stat.pulse && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">
                            <motion.span
                                key={stat.value}
                                initial={{ scale: 1.2, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="inline-block"
                            >
                                {stat.value}
                            </motion.span>
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {stat.title}
                        </p>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default AuctionOverviewTab;
