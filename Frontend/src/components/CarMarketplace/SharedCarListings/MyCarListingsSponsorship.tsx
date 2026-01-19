import React, { useMemo } from 'react';
import { Star, Wallet, CreditCard, Clock, AlertTriangle, ArrowRight, Zap, Target, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../../utils/helpers';
import Icon from '../../Icon';
import { Listing } from './types';

interface Props {
    listings: Listing[];
    walletBalance: number;
    loading: boolean;
    onUnsponsor: (id: number) => void;
    onAddFunds?: () => void;
    apiPrefix: string;
    onNavigateToTab?: (tab: 'listings' | 'analytics' | 'sponsorship') => void;
}

export const MyCarListingsSponsorship: React.FC<Props> = ({ listings, walletBalance, loading, onUnsponsor, onAddFunds, onNavigateToTab }) => {

    const sponsoredListings = useMemo(() => listings.filter(l => l.is_sponsored), [listings]);

    // Calculate days remaining (mock logic if sponsored_until is missing, or real if present)
    const getDaysRemaining = (sponsoredUntil: string | undefined) => {
        if (!sponsoredUntil) return 7; // Default mock
        const end = new Date(sponsoredUntil);
        const now = new Date();
        const diffTime = Math.abs(end.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getProgress = (sponsoredUntil: string | undefined) => {
        // Mock progress for demo purposes if no start date is tracked
        // Ideally we'd need started_at and sponsored_until
        return Math.floor(Math.random() * 80) + 10;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Wallet & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-lg opacity-90">رصيد الحملات</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                            <motion.span
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="text-5xl font-black tracking-tight"
                            >
                                {walletBalance.toLocaleString()}
                            </motion.span>
                            <span className="text-xl font-bold opacity-80">$</span>
                        </div>
                        <p className="text-white/70 text-sm mb-6 font-medium">الرصيد المتاح للترويج لإعلاناتك</p>

                        <button
                            onClick={onAddFunds}
                            className="px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 shadow-sm"
                        >
                            <CreditCard className="w-4 h-4" />
                            شحن الرصيد
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                        <div className="absolute right-10 top-10 transform rotate-12"><Star className="w-24 h-24" /></div>
                        <div className="absolute left-10 bottom-10 transform -rotate-12"><Target className="w-32 h-32" /></div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        لماذا تميز إعلاناتك؟
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800 group">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Target className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">استهداف دقيق</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">يظهر إعلانك في أعلى نتائج البحث دائماً للفئة المستهدفة مما يضاعف فرص البيع.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800 group">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Icon name="Eye" className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">مشاهدات مضاعفة</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">زيادة مشاهدات إعلانك بنسبة تصل إلى 500% وتفاعل أكبر من المشترين.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Sponsorships */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        الإعلانات الممولة حالياً
                        <span className="text-xs py-1 px-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 font-medium">
                            {sponsoredListings.length} نشط
                        </span>
                    </h3>
                </div>

                {sponsoredListings.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                            <Star className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا توجد إعلانات ممولة حالياً</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                            ابدأ بتمييز إعلاناتك الآن للوصول إلى عدد أكبر من المشترين وزيادة فرص البيع بسرعة.
                        </p>

                        {onNavigateToTab && (
                            <button
                                onClick={() => onNavigateToTab('listings')}
                                className="px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-xl font-bold transition-transform active:scale-95 flex items-center gap-2 mx-auto shadow-lg shadow-primary/20"
                            >
                                تصفح إعلاناتي وتمويلها
                                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sponsoredListings.map(listing => {
                            const daysLeft = getDaysRemaining(listing.sponsored_until);
                            const progress = getProgress(listing.sponsored_until);
                            const isExpiringSoon = daysLeft <= 2;

                            return (
                                <motion.div
                                    key={listing.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all"
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isExpiringSoon
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {isExpiringSoon ? 'ينتهي قريباً' : 'نشط'}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 relative z-10 mb-4">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                                            <img
                                                src={getImageUrl(listing.photos?.[0]) || '/placeholder-car.jpg'}
                                                alt={listing.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white truncate mb-1 text-sm">{listing.model} {listing.year}</h4>
                                            <div className="text-xs text-slate-500 mb-2 truncate">{listing.title}</div>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                                                <Eye className="w-3 h-3" />
                                                {listing.views_count} مشاهدة
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-slate-500">الوقت المتبقي</span>
                                            <span className={isExpiringSoon ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>
                                                {daysLeft} أيام
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isExpiringSoon ? 'bg-red-500' : 'bg-primary'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onUnsponsor(listing.id)}
                                        className="mt-3 w-full py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                                    >
                                        <AlertTriangle className="w-3 h-3" />
                                        إلغاء الرعاية
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
