import React from 'react';
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

    // Extract rental requirements for rent listings
    const getRentalRequirements = () => {
        if (listing.listing_type !== 'rent') return null;

        const terms = listing.rental_terms;
        const isObject = typeof terms === 'object' && !Array.isArray(terms);
        const structuredTerms = isObject ? (terms as any) : {};

        return {
            securityDeposit: structuredTerms.security_deposit,
            minRenterAge: structuredTerms.min_renter_age,
            minLicenseAge: structuredTerms.min_license_age
        };
    };

    const rentalReqs = getRentalRequirements();

    const formatPrice = (price: number | undefined): string => {
        if (price === undefined) return '';
        try {
            return new Intl.NumberFormat('en-US').format(price) + ' $';
        } catch (e) {
            return `${price.toLocaleString('en-US')} $`;
        }
    };

    return (
        <div
            className={cn(
                'bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700',
                className
            )}
        >
            {/* Main Price - Only for sale listings */}
            {listing.listing_type !== 'rent' && (
                <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex flex-col">
                            <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">السعر</span>
                            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                                {displayPrice ? formatPrice(displayPrice) : formatPrice(0)}
                            </span>
                        </div>
                        {listing.is_negotiable && (
                            <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                قابل للتفاوض
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rental Rates - Enhanced Colorful Grid */}
            {listing.listing_type === 'rent' && (rates.dailyRate || rates.weeklyRate || rates.monthlyRate) ? (
                <div className="space-y-3">
                    {/* Pricing Table */}
                    <div className="grid grid-cols-3 gap-2.5">
                        {rates.dailyRate && (
                            <div className="group text-center p-3 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-teal-200 dark:border-teal-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">يومي</div>
                                <div className="text-base font-bold text-teal-900 dark:text-teal-200">{formatPrice(rates.dailyRate)}</div>
                            </div>
                        )}
                        {rates.weeklyRate && (
                            <div className="group text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">أسبوعي</div>
                                <div className="text-base font-bold text-blue-900 dark:text-blue-200">{formatPrice(rates.weeklyRate)}</div>
                            </div>
                        )}
                        {rates.monthlyRate && (
                            <div className="group text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide">شهري</div>
                                <div className="text-base font-bold text-purple-900 dark:text-purple-200">{formatPrice(rates.monthlyRate)}</div>
                            </div>
                        )}
                    </div>

                    {/* Rental Requirements - Enhanced Grid */}
                    {rentalReqs && (rentalReqs.securityDeposit || rentalReqs.minRenterAge || rentalReqs.minLicenseAge) && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider">متطلبات الإيجار</h4>
                            <div className="grid grid-cols-3 gap-2.5">
                                {rentalReqs.securityDeposit && (
                                    <div className="group text-center p-2.5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border-2 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                        <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 mb-1 uppercase tracking-wide">التأمين</div>
                                        <div className="text-sm font-bold text-orange-900 dark:text-orange-200">{formatPrice(rentalReqs.securityDeposit)}</div>
                                    </div>
                                )}
                                {rentalReqs.minRenterAge && (
                                    <div className="group text-center p-2.5 bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/30 dark:to-lime-900/30 rounded-lg border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                        <div className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide">الحد الأدنى</div>
                                        <div className="text-sm font-bold text-green-900 dark:text-green-200">{rentalReqs.minRenterAge} سنة</div>
                                    </div>
                                )}
                                {rentalReqs.minLicenseAge && (
                                    <div className="group text-center p-2.5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg border-2 border-amber-200 dark:border-amber-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                        <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wide">عمر الرخصة</div>
                                        <div className="text-sm font-bold text-amber-900 dark:text-amber-200">{rentalReqs.minLicenseAge} سنة</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : listing.listing_type !== 'rent' ? null : null}
        </div>
    );
};

export default PriceCard;

