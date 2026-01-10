import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { CarListing } from '../../../services/carprovider.service';

interface PriceCardProps {
    listing: CarListing;
    className?: string;
}

const PriceCard: React.FC<PriceCardProps> = ({ listing, className }) => {
    // Helper to extract rates
    const getRates = () => {
        if (listing.listing_type !== 'rent') {
            return { price: listing.price };
        }

        const terms = listing.rental_terms;
        let dailyRate = listing.daily_rate;
        let weeklyRate = listing.weekly_rate;
        let monthlyRate = listing.monthly_rate;

        if (terms) {
            const isObject = typeof terms === 'object' && !Array.isArray(terms);
            const structuredTerms = isObject ? (terms as any) : {};

            if (isObject) {
                if (structuredTerms.daily_rate) dailyRate = structuredTerms.daily_rate;
                if (structuredTerms.weekly_rate) weeklyRate = structuredTerms.weekly_rate;
                if (structuredTerms.monthly_rate) monthlyRate = structuredTerms.monthly_rate;
            }
        }

        return {
            dailyRate: dailyRate || 0,
            weeklyRate: weeklyRate || 0,
            monthlyRate: monthlyRate || 0
        };
    };

    const rates = getRates();
    const displayPrice = listing.listing_type === 'rent' ? rates.dailyRate : rates.price;

    const formatPrice = (price: number | undefined): string => {
        if (price === undefined) return '';
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
                    {/* Price Label Removed */}
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
                            {displayPrice ? formatPrice(displayPrice) : (listing.listing_type === 'rent' ? 'اتصل للسعر' : formatPrice(0))}
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
            {listing.listing_type === 'rent' && (rates.weeklyRate || rates.monthlyRate) ? (
                <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-800/30">
                    <div className="flex gap-3 flex-wrap text-sm">
                        {rates.weeklyRate ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 dark:text-slate-400">أسبوعي:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('ar-SY').format(rates.weeklyRate)} ل.س
                                </span>
                            </div>
                        ) : null}
                        {rates.monthlyRate ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 dark:text-slate-400">شهري:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('ar-SY').format(rates.monthlyRate)} ل.س
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </motion.div>
    );
};

export default PriceCard;
