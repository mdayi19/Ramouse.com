import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { CarListing } from '../../../services/carprovider.service';

interface PriceCardProps {
    listing: CarListing;
    className?: string;
}

const PriceCard: React.FC<PriceCardProps> = ({ listing, className }) => {
    const formatPrice = (price: number): string => {
        try {
            return new Intl.NumberFormat('ar-SY', {
                style: 'currency',
                currency: 'SYP',
                maximumFractionDigits: 0
            }).format(price);
        } catch (e) {
            return `${price.toLocaleString('ar-SY')} ل.س`;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
                'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
                'dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20',
                'rounded-2xl p-5 sm:p-6 border border-blue-100 dark:border-blue-800/30',
                'shadow-lg hover:shadow-xl transition-shadow',
                className
            )}
        >
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                        السعر
                    </p>
                    <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                        <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className={cn(
                                'text-3xl sm:text-4xl md:text-5xl font-bold',
                                'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600',
                                'dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400',
                                'bg-clip-text text-transparent'
                            )}
                        >
                            {formatPrice(listing.price)}
                        </motion.span>
                        {listing.listing_type === 'rent' && (
                            <span className="text-slate-600 dark:text-slate-400 text-base sm:text-lg font-medium">
                                / يوم
                            </span>
                        )}
                    </div>

                    {listing.is_negotiable && (
                        <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={cn(
                                'inline-flex items-center gap-1.5 mt-3 px-3 py-1.5',
                                'glass-effect',
                                'text-green-700 dark:text-green-400',
                                'rounded-full text-sm font-bold shadow-sm'
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            قابل للتفاوض
                        </motion.span>
                    )}
                </div>

                {/* Optional: Add comparison or calculator buttons here */}
            </div>

            {/* Rental Rates Summary (if rent) */}
            {listing.listing_type === 'rent' && (listing.weekly_rate || listing.monthly_rate) && (
                <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-800/30">
                    <div className="flex gap-3 flex-wrap text-sm">
                        {listing.weekly_rate && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 dark:text-slate-400">أسبوعي:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('ar-SY').format(listing.weekly_rate)} ل.س
                                </span>
                            </div>
                        )}
                        {listing.monthly_rate && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 dark:text-slate-400">شهري:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('ar-SY').format(listing.monthly_rate)} ل.س
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default PriceCard;
