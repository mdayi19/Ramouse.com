import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Calendar, Gauge, Plus, ToggleLeft, ToggleRight, Star, Edit3, Trash2, Printer } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import { CarProviderService } from '../../services/carprovider.service';

interface UserCarListingsWidgetProps {
    userId: string;
    userRole: 'customer' | 'technician' | 'tow_truck';
    onNavigate?: (view: any) => void;
}

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

const UserCarListingsWidget: React.FC<UserCarListingsWidgetProps> = ({ userId, userRole, onNavigate }) => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Determine API prefix based on user role
    const apiPrefix = userRole === 'customer'
        ? '/customer'
        : userRole === 'technician'
            ? '/technician'
            : '/tow-truck';

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await CarProviderService.getUserListings(apiPrefix, {});
                const userListings = Array.isArray(response.listings) ? response.listings : [];

                // Sort by created_at descending
                userListings.sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                });

                setListings(userListings.slice(0, 3)); // Show latest 3
            } catch (error) {
                console.error('Error loading user car listings:', error);
                setListings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [apiPrefix]);

    const handleNavigateToListings = () => {
        if (onNavigate) {
            onNavigate('myCarListings');
        }
    };

    if (loading) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">إعلاناتي</h2>
                        <p className="text-slate-500 text-xs sm:text-sm">إدارة وعرض السيارات الخاصة بك</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[160px] rounded-[20px]"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">إعلاناتي</h2>
                        <p className="text-slate-500 text-xs sm:text-sm">إدارة وعرض السيارات الخاصة بك</p>
                    </div>

                    <button
                        onClick={handleNavigateToListings}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 text-xs sm:text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">إضافة سيارة</span>
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[20px] p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-5xl">🚗</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد إعلانات</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        أضف إعلان سيارتك للبيع أو الإيجار
                    </p>
                    <button
                        onClick={handleNavigateToListings}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة إعلان جديد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">إعلاناتي</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">إدارة وعرض السيارات الخاصة بك</p>
                </div>

                <button
                    onClick={handleNavigateToListings}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 text-xs sm:text-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">إضافة سيارة</span>
                </button>
            </div>

            <div className="space-y-4">
                {listings.map((listing) => (
                    <motion.div
                        key={listing.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-white dark:bg-slate-800 rounded-[20px] p-3 shadow-md border ${listing.is_sponsored
                                ? 'border-amber-300 dark:border-amber-500/50 ring-1 ring-amber-100 dark:ring-amber-900/20'
                                : 'border-slate-100 dark:border-slate-700'
                            } relative overflow-hidden group`}
                    >
                        <div className="flex gap-3">
                            {/* Image Section */}
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
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-[15px] leading-tight flex-1 pl-2">
                                        {listing.title}
                                    </h3>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigateToListings();
                                        }}
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

                                {/* Price */}
                                <div className="mt-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="font-black text-blue-600 dark:text-blue-400 text-lg tracking-tight">
                                            {listing.listing_type === 'rent'
                                                ? <span className="flex items-baseline gap-1">{getRates(listing)?.daily?.toLocaleString() || 0} <span className="text-[10px] font-bold text-slate-400">$ / يوم</span></span>
                                                : <span className="flex items-baseline gap-1">{Number(listing.price || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400">$</span></span>
                                            }
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="font-bold">{listing.views_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-3 grid grid-cols-1 gap-2">
                            {/* Sponsor Button (Prominent) */}
                            {!listing.is_sponsored ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToListings();
                                    }}
                                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4 fill-white" />
                                    ميز إعلانك الآن
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToListings();
                                    }}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Star className="w-3.5 h-3.5 fill-current opacity-50" />
                                    إلغاء التمييز (نشط حتى {listing.sponsored_until ? new Date(listing.sponsored_until).toLocaleDateString() : '—'})
                                </button>
                            )}

                            {/* Secondary Actions Row */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToListings();
                                    }}
                                    className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    تعديل التفاصيل
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToListings();
                                    }}
                                    className="w-10 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                                    title="طباعة"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToListings();
                                    }}
                                    className="w-10 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
                                    title="حذف"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* View All Button */}
                <button
                    onClick={handleNavigateToListings}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                    عرض جميع الإعلانات ({listings.length})
                </button>
            </div>
        </div>
    );
};

export default UserCarListingsWidget;
