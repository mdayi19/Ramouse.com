import React, { useState, useEffect, useMemo } from 'react';
import { Car, Edit, Trash2, ToggleLeft, ToggleRight, Plus, Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarListingWizard } from '../CarListingWizard';

interface ListingsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    userPhone: string;
}

export const ListingsView: React.FC<ListingsViewProps> = ({ showToast, userPhone }) => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        setLoading(true);
        try {
            const listingsRes = await CarProviderService.getMyListings();
            setListings(listingsRes.listings || []);
        } catch (error) {
            showToast('فشل تحميل القوائم', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (listingId: number) => {
        try {
            // Optimistic update
            setListings(prev => prev.map(l =>
                l.id === listingId ? { ...l, is_hidden: !l.is_hidden } : l
            ));

            await CarProviderService.toggleListingVisibility(listingId);
            showToast('تم تحديث حالة الإعلان', 'success');
        } catch (error) {
            // Revert on failure
            showToast('فشل تحديث الإعلان', 'error');
            loadListings();
        }
    };

    const handleDeleteListing = async (listingId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان?')) return;

        try {
            await CarProviderService.deleteListing(listingId);
            showToast('تم حذف الإعلان', 'success');
            setListings(prev => prev.filter(l => l.id !== listingId));
        } catch (error) {
            showToast('فشل حذف الإعلان', 'error');
        }
    };

    const handleEditListing = (listing: any) => {
        setEditingListing(listing);
        setShowWizard(true);
    };

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

            return matchesSearch && matchesStatus;
        });
    }, [listings, searchTerm, statusFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">سياراتي</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">إدارة قائمة السيارات المعروضة للبيع ({listings.length})</p>
                </div>
                <button
                    onClick={() => {
                        setEditingListing(null);
                        setShowWizard(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    إضافة سيارة
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="بحث عن سيارة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-5 h-5 text-slate-400 hidden md:block" />
                    {(['all', 'active', 'hidden'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === filter
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
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
                        className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700"
                    >
                        <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">لا توجد نتائج</h3>
                        <p>لم يتم العثور على سيارات تطابق بحثك</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="mt-4 text-blue-600 hover:underline"
                            >
                                مسح الفلاتر
                            </button>
                        ) : null}
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">السيارة</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">السعر</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">المشاهدات</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">الحالة</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <AnimatePresence>
                                        {filteredListings.map((listing, index) => (
                                            <motion.tr
                                                key={listing.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 relative">
                                                            <img
                                                                src={listing.photos?.[0] || '/placeholder-car.jpg'}
                                                                alt={listing.title}
                                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{listing.year} • {listing.mileage?.toLocaleString()} كم</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">
                                                    {Number(listing.price).toLocaleString()} <span className="text-xs font-normal text-slate-500">ل.س</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Icon name="Eye" className="w-4 h-4" />
                                                        {listing.views_count}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listing.is_hidden
                                                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}>
                                                        {listing.is_hidden ? 'مخفي' : 'نشط'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(listing.id); }}
                                                            className={`p-2 rounded-lg transition-colors ${listing.is_hidden
                                                                ? 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                            title={listing.is_hidden ? 'إظهار' : 'إخفاء'}
                                                        >
                                                            {listing.is_hidden ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditListing(listing); }}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteListing(listing.id); }}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
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
                                {filteredListings.map((listing, index) => (
                                    <motion.div
                                        key={listing.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-700"
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img
                                                    src={listing.photos?.[0] || '/placeholder-car.jpg'}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">{listing.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${listing.is_hidden
                                                        ? 'bg-slate-100 text-slate-600'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {listing.is_hidden ? 'مخفي' : 'نشط'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500">{listing.year} • {listing.mileage?.toLocaleString()} كم</p>
                                                <div className="mt-2 flex items-baseline justify-between">
                                                    <p className="font-bold text-blue-600">{Number(listing.price).toLocaleString()} <span className="text-xs text-slate-400">ل.س</span></p>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Icon name="Eye" className="w-3 h-3" /> {listing.views_count}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={() => handleToggleVisibility(listing.id)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${listing.is_hidden
                                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {listing.is_hidden ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                                {listing.is_hidden ? 'نشر' : 'إخفاء'}
                                            </button>
                                            <button
                                                onClick={() => handleEditListing(listing)}
                                                className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteListing(listing.id)}
                                                className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Wizard Modal */}
            {showWizard && (
                <CarListingWizard
                    onComplete={() => {
                        setShowWizard(false);
                        setEditingListing(null);
                        loadListings();
                        showToast(editingListing ? 'تم تحديث الإعلان بنجاح' : 'تم إضافة الإعلان بنجاح', 'success');
                    }}
                    onCancel={() => {
                        setShowWizard(false);
                        setEditingListing(null);
                    }}
                    showToast={showToast}
                    userPhone={userPhone}
                    editingListing={editingListing}
                />
            )}
        </motion.div>
    );
};
