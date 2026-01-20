import React from 'react';
import { motion } from 'framer-motion';
import { Printer, Star, ToggleLeft, ToggleRight, Edit3, Trash2, Eye, Calendar, Gauge } from 'lucide-react';
import { getImageUrl } from '../../../utils/helpers';

// Helper to safely extract all rates
const getRates = (listing: any) => {
    let daily = 0;
    if (listing.listing_type?.toLowerCase() === 'rent') {
        daily = Number(listing.daily_rate || 0);
        const terms = listing.rental_terms;
        if (terms && typeof terms === 'object' && !Array.isArray(terms)) {
            if (terms.daily_rate !== undefined) daily = Number(terms.daily_rate);
        }
    }
    return { daily };
};

interface MobileListingCardProps {
    listing: any;
    onEdit: (listing: any) => void;
    onDelete: (id: number) => void;
    onPrint: (listing: any) => void;
    onSponsor: (listing: any) => void;
    onUnsponsor: (id: number) => void;
    onToggleVisibility: (id: number) => void;
    onQuickPriceEdit: (listing: any) => void;
    // Edit State Props
    isEditing: boolean;
    tempPrice: string;
    tempRates: { daily: string; weekly: string; monthly: string };
    setTempPrice: (val: string) => void;
    setTempRates: (val: any) => void;
    onSavePrice: (id: number) => void;
    onCancelPrice: () => void;
    savingPrice: boolean;
}

export const MobileListingCard: React.FC<MobileListingCardProps> = ({
    listing,
    onEdit,
    onDelete,
    onPrint,
    onSponsor,
    onUnsponsor,
    onToggleVisibility,
    onQuickPriceEdit,
    isEditing,
    tempPrice,
    tempRates,
    setTempPrice,
    setTempRates,
    onSavePrice,
    onCancelPrice,
    savingPrice
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white dark:bg-slate-800 rounded-[20px] p-3 shadow-md border ${listing.is_sponsored ? 'border-amber-300 dark:border-amber-500/50 ring-1 ring-amber-100 dark:ring-amber-900/20' : 'border-slate-100 dark:border-slate-700'
                } relative overflow-hidden group`}
        >
            <div className="flex gap-3">
                {/* Image Section (Keep as is or adjust) */}
                <div className="w-[100px] h-[100px] shrink-0 rounded-xl overflow-hidden relative bg-slate-100">
                    <img
                        src={getImageUrl(listing.photos?.[0]) || '/placeholder-car.jpg'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                    {listing.is_sponsored && (
                        <div className="absolute top-1 right-1 bg-amber-500/90 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold shadow-sm backdrop-blur-sm flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            متميز
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-[15px] leading-tight flex-1 pl-2">{listing.title}</h3>

                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(listing.id); }}
                            className={`p-1.5 rounded-lg active:scale-95 transition-all ${listing.is_hidden
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-emerald-50 text-emerald-600'
                                }`}
                        >
                            {listing.is_hidden ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1.5">
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{listing.year}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            <span>{typeof listing.mileage === 'number' ? listing.mileage.toLocaleString() : listing.mileage} كم</span>
                        </div>
                    </div>

                    {/* Price & Quick Edit */}
                    <div className="mt-2.5">
                        {isEditing ? (
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-blue-100 dark:border-blue-900/30" onClick={(e) => e.stopPropagation()}>
                                {listing.listing_type === 'rent' ? (
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            placeholder="يومي"
                                            value={tempRates.daily}
                                            onChange={(e) => setTempRates({ ...tempRates, daily: e.target.value })}
                                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="أسبوعي"
                                                value={tempRates.weekly}
                                                onChange={(e) => setTempRates({ ...tempRates, weekly: e.target.value })}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="شهري"
                                                value={tempRates.monthly}
                                                onChange={(e) => setTempRates({ ...tempRates, monthly: e.target.value })}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="number"
                                        value={tempPrice}
                                        onChange={(e) => setTempPrice(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                        autoFocus
                                    />
                                )}
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => onSavePrice(listing.id)}
                                        disabled={savingPrice}
                                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 shadow-sm"
                                    >
                                        حفظ
                                    </button>
                                    <button
                                        onClick={onCancelPrice}
                                        disabled={savingPrice}
                                        className="px-3 py-1.5 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="font-black text-blue-600 dark:text-blue-400 text-lg tracking-tight">
                                    {listing.listing_type === 'rent'
                                        ? <span className="flex items-baseline gap-1">{getRates(listing)?.daily?.toLocaleString() || 0} <span className="text-[10px] font-bold text-slate-400">$ / يوم</span></span>
                                        : <span className="flex items-baseline gap-1">{Number(listing.price || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400">$</span></span>
                                    }
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onQuickPriceEdit(listing); }}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    تعديل السعر
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 grid grid-cols-1 gap-2">
                {/* Sponsor Button (Prominent) */}
                {!listing.is_sponsored ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSponsor(listing); }}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Star className="w-4 h-4 fill-white" />
                        ميز إعلانك الآن
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUnsponsor(listing.id); }}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Star className="w-3.5 h-3.5 fill-current opacity-50" />
                        إلغاء التمييز (نشط حتى {listing.sponsored_until ? new Date(listing.sponsored_until).toLocaleDateString() : '—'})
                    </button>
                )}

                {/* Secondary Actions Row */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(listing); }}
                        className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        تعديل التفاصيل
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onPrint(listing); }}
                        className="w-10 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                        title="طباعة"
                    >
                        <Printer className="w-4 h-4" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(listing.id); }}
                        className="w-10 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
                        title="حذف"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
