import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Car, X, Check, Printer, Star, ToggleLeft, ToggleRight, Edit3, Trash2, Loader, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import { getImageUrl } from '../../../utils/helpers';
import { CarProviderService } from '../../../services/carprovider.service';
import { MobileListingCard } from './MobileListingCard';

interface Props {
    listings: any[];
    loading: boolean;
    apiPrefix: string;
    onRefresh: () => void;
    onEdit: (listing: any) => void;
    onDelete: (id: number) => void;
    onPrint: (listing: any) => void;
    onSponsor: (listing: any) => void;
    onUnsponsor: (id: number) => void;
    onToggleVisibility: (id: number) => void;
    setShowWizard: (show: boolean) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    stats: any; // Passed for the "remaining listings" check
    onOptimisticUpdate?: (id: number, data: any) => void;
    userRole: string;
}

// Helper to safely extract all rates
const getRates = (listing: any) => {
    let daily = 0;
    let weekly = 0;
    let monthly = 0;

    if (listing.listing_type?.toLowerCase() === 'rent') {
        daily = Number(listing.daily_rate || 0);
        weekly = Number(listing.weekly_rate || 0);
        monthly = Number(listing.monthly_rate || 0);

        // Check rental_terms
        const terms = listing.rental_terms;
        if (terms && typeof terms === 'object' && !Array.isArray(terms)) {
            if (terms.daily_rate !== undefined) daily = Number(terms.daily_rate);
            if (terms.weekly_rate !== undefined) weekly = Number(terms.weekly_rate);
            if (terms.monthly_rate !== undefined) monthly = Number(terms.monthly_rate);
        }
    }

    return { daily, weekly, monthly };
};

export const MyCarListingsList: React.FC<Props> = ({
    listings,
    loading,
    apiPrefix,
    onRefresh,
    onEdit,
    onDelete,
    onPrint,
    onSponsor,
    onUnsponsor,
    onToggleVisibility,
    setShowWizard,
    showToast,
    stats,
    onOptimisticUpdate,
    userRole
}) => {
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'rent'>('all');

    // Quick Edit State
    const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
    const [tempPrice, setTempPrice] = useState(''); // For Sale
    const [tempRates, setTempRates] = useState({ daily: '', weekly: '', monthly: '' }); // For Rent
    const [savingPrice, setSavingPrice] = useState(false);

    // Filter Logic
    const filteredListings = useMemo(() => {
        return listings.filter(listing => {
            const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                listing.model?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                    ? !listing.is_hidden
                    : listing.is_hidden;

            const matchesType = typeFilter === 'all'
                ? true
                : typeFilter === 'rent'
                    ? listing.listing_type?.toLowerCase() === 'rent'
                    : listing.listing_type?.toLowerCase() !== 'rent';

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [listings, searchTerm, statusFilter, typeFilter]);

    // Quick Edit Handlers
    const startPriceEdit = (listing: any) => {
        console.log('Starting price edit for:', listing.id);
        setEditingPriceId(listing.id);
        const isRent = listing.listing_type?.toLowerCase() === 'rent';

        if (isRent) {
            const rates = getRates(listing);
            setTempRates({
                daily: rates?.daily ? rates.daily.toString() : '',
                weekly: rates?.weekly ? rates.weekly.toString() : '',
                monthly: rates?.monthly ? rates.monthly.toString() : ''
            });
        } else {
            setTempPrice(listing.price?.toString() || '');
        }
    };

    const cancelPriceEdit = () => {
        setEditingPriceId(null);
        setTempPrice('');
        setTempRates({ daily: '', weekly: '', monthly: '' });
    };

    const savePriceEdit = async (listingId: number) => {
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return;

        const isRent = listing.listing_type?.toLowerCase() === 'rent';

        setSavingPrice(true);
        try {
            const updateData: any = {};

            if (isRent) {
                const daily = Number(tempRates.daily);
                const weekly = Number(tempRates.weekly);
                const monthly = Number(tempRates.monthly);

                if (!isNaN(daily)) updateData.daily_rate = daily;
                if (!isNaN(weekly)) updateData.weekly_rate = weekly;
                if (!isNaN(monthly)) updateData.monthly_rate = monthly;
            } else {
                const newPrice = Number(tempPrice);
                if (isNaN(newPrice) || newPrice < 0) {
                    showToast('السعر غير صالح', 'error');
                    setSavingPrice(false);
                    return;
                }
                updateData.price = newPrice;
            }

            console.log('Saving price edit:', { apiPrefix, listingId, updateData });
            await CarProviderService.quickEditUserListing(apiPrefix, listingId, updateData);

            if (onOptimisticUpdate) {
                onOptimisticUpdate(listingId, updateData);
            } else {
                onRefresh();
            }

            showToast('تم تحديث السعر بنجاح', 'success');
            setEditingPriceId(null);
        } catch (error) {
            console.error('Update failed:', error);
            showToast('فشل تحديث السعر', 'error');
        } finally {
            setSavingPrice(false);
        }
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header Actions & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إعلاناتي</h2>
                    <p className="text-slate-500 text-sm">إدارة وعرض السيارات الخاصة بك</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Type Tabs */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
                        {(['all', 'sale', 'rent'] as const)
                            .filter(type => userRole === 'car_provider' || type !== 'rent')
                            .map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all ${typeFilter === type
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    {type === 'all' ? 'الكل' : type === 'sale' ? 'للبيع' : 'للإيجار'}
                                </button>
                            ))}
                    </div>

                    <button
                        onClick={() => {
                            if (stats && stats.remaining_listings <= 0) {
                                showToast('لقد وصلت للحد الأقصى من الإعلانات المسموحة', 'error');
                                return;
                            }
                            setShowWizard(true);
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">إضافة سيارة</span>
                    </button>
                </div>
            </div>

            {/* Search and Status Filter */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 sticky top-0 z-10">
                <div className="flex-1 relative group">
                    <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث عن سيارة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute top-1/2 -translate-y-1/2 left-3 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <Filter className="w-5 h-5 text-slate-400 hidden md:block shrink-0" />
                    {(['all', 'active', 'hidden'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${statusFilter === filter
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                } `}
                        >
                            {filter === 'all' ? 'الكل' : filter === 'active' ? 'نشط' : 'مخفي'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {filteredListings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center"
                    >
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-6">
                            <Car className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد نتائج</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm">لم يتم العثور على سيارات تطابق معايير البحث.</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="mt-6 px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                            >
                                مسح جميع الفلاتر
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowWizard(true)}
                                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                                إضافة إعلان جديد
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-visible border border-slate-100 dark:border-slate-700">
                            <table className="w-full">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-5 text-right text-xs font-extra-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">السيارة</th>
                                        <th className="px-6 py-5 text-right text-xs font-extra-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {typeFilter === 'rent' ? 'أسعار الإيجار' : 'السعر'}
                                        </th>
                                        <th className="px-6 py-5 text-right text-xs font-extra-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">المشاهدات</th>
                                        <th className="px-6 py-5 text-right text-xs font-extra-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                        <th className="px-6 py-5 text-right text-xs font-extra-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <AnimatePresence initial={false}>
                                        {filteredListings.map((listing, index) => (
                                            <motion.tr
                                                key={listing.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                                            >
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 relative shadow-sm group-hover:shadow-md transition-shadow">
                                                            <img
                                                                src={getImageUrl(listing.photos?.[0]) || '/placeholder-car.jpg'}
                                                                alt={listing.title}
                                                                loading="lazy"
                                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white text-base mb-1">{listing.title}</div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                {listing.year && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{listing.year}</span>}
                                                                <span>•</span>
                                                                <span>{typeof listing.mileage === 'number' ? listing.mileage.toLocaleString() : listing.mileage} كم</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle text-slate-900 dark:text-white font-bold">
                                                    {editingPriceId === listing.id ? (
                                                        listing.listing_type?.toLowerCase() === 'rent' ? (
                                                            <div className="flex flex-col gap-2 min-w-[140px] bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 z-50 relative">
                                                                <input
                                                                    type="number"
                                                                    placeholder="يومي"
                                                                    value={tempRates.daily}
                                                                    onChange={(e) => setTempRates({ ...tempRates, daily: e.target.value })}
                                                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="أسبوعي"
                                                                        value={tempRates.weekly}
                                                                        onChange={(e) => setTempRates({ ...tempRates, weekly: e.target.value })}
                                                                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        placeholder="شهري"
                                                                        value={tempRates.monthly}
                                                                        onChange={(e) => setTempRates({ ...tempRates, monthly: e.target.value })}
                                                                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end gap-1 mt-1">
                                                                    <button
                                                                        onClick={() => savePriceEdit(listing.id)}
                                                                        disabled={savingPrice}
                                                                        className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelPriceEdit}
                                                                        disabled={savingPrice}
                                                                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 z-50 relative">
                                                                <input
                                                                    type="number"
                                                                    value={tempPrice}
                                                                    onChange={(e) => setTempPrice(e.target.value)}
                                                                    className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => savePriceEdit(listing.id)}
                                                                    disabled={savingPrice}
                                                                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={cancelPriceEdit}
                                                                    disabled={savingPrice}
                                                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="flex items-start gap-2 group/price cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors -ml-2" onClick={(e) => { e.stopPropagation(); startPriceEdit(listing); }}>
                                                            {listing.listing_type?.toLowerCase() === 'rent' ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="font-black text-blue-600 text-base">{getRates(listing)?.daily?.toLocaleString() || 0} <span className="text-xs font-medium text-slate-400">$ / يوم</span></div>
                                                                    <div className="flex gap-3 text-xs text-slate-500">
                                                                        <span>{getRates(listing)?.weekly?.toLocaleString() || 0} <span className="text-[10px]">أسبوعي</span></span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span>{getRates(listing)?.monthly?.toLocaleString() || 0} <span className="text-[10px]">شهري</span></span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="font-black text-slate-800 dark:text-slate-200 text-lg">{Number(listing.price).toLocaleString()} <span className="text-xs font-bold text-slate-400">$</span></span>
                                                            )}
                                                            <Edit3 className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover/price:opacity-100 transition-all translate-x-1 group-hover/price:translate-x-0 mt-1.5" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full w-fit">
                                                        <Icon name="Eye" className="w-4 h-4 text-blue-500" />
                                                        <span className="font-bold font-mono text-sm">{listing.views_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${listing.is_hidden
                                                        ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                        : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                        } `}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${listing.is_hidden ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></span>
                                                        {listing.is_hidden ? 'مخفي' : 'نشط'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 duration-300">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onPrint(listing); }}
                                                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-500 rounded-xl transition-all shadow-sm hover:shadow-slate-500/30"
                                                            title="طباعة"
                                                        >
                                                            <Printer className="w-4.5 h-4.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (listing.is_sponsored) {
                                                                    onUnsponsor(listing.id);
                                                                } else {
                                                                    onSponsor(listing);
                                                                }
                                                            }}
                                                            className={`p-2 rounded-xl transition-all shadow-sm hover:shadow-amber-500/30 ${listing.is_sponsored
                                                                ? 'text-amber-500 bg-amber-50 hover:bg-red-500 hover:text-white'
                                                                : 'text-slate-400 hover:text-white hover:bg-amber-500'
                                                                }`}
                                                            title={listing.is_sponsored ? 'إلغاء الرعاية' : 'تميز الإعلان'}
                                                        >
                                                            {listing.is_sponsored ? <Star className="w-4.5 h-4.5 fill-current" /> : <Star className="w-4.5 h-4.5" />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(listing.id); }}
                                                            className={`p-2 rounded-xl transition-all shadow-sm hover:shadow-md ${listing.is_hidden
                                                                ? 'text-teal-500 hover:text-white hover:bg-teal-500'
                                                                : 'text-amber-500 hover:text-white hover:bg-amber-500'
                                                                } `}
                                                            title={listing.is_hidden ? 'إظهار' : 'إخفاء'}
                                                        >
                                                            {listing.is_hidden ? <ToggleLeft className="w-4.5 h-4.5" /> : <ToggleRight className="w-4.5 h-4.5" />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEdit(listing); }}
                                                            className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-sm hover:shadow-blue-500/30"
                                                            title="تعديل"
                                                        >
                                                            <Edit3 className="w-4.5 h-4.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDelete(listing.id); }}
                                                            className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm hover:shadow-red-500/30"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4.5 h-4.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Grid */}
                        <div className="md:hidden grid grid-cols-1 gap-4">
                            <AnimatePresence>
                                {filteredListings.map((listing) => (
                                    <MobileListingCard
                                        key={listing.id}
                                        listing={listing}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onPrint={onPrint}
                                        onSponsor={onSponsor}
                                        onUnsponsor={onUnsponsor}
                                        onToggleVisibility={onToggleVisibility}
                                        onQuickPriceEdit={startPriceEdit}
                                        isEditing={editingPriceId === listing.id}
                                        tempPrice={tempPrice}
                                        tempRates={tempRates}
                                        setTempPrice={setTempPrice}
                                        setTempRates={setTempRates}
                                        onSavePrice={savePriceEdit}
                                        onCancelPrice={cancelPriceEdit}
                                        savingPrice={savingPrice}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
