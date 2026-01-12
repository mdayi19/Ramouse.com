import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Edit3, Check, X, Car, Eye, Plus, Search, Filter, ToggleLeft, ToggleRight, BarChart3, ChevronDown, ChevronUp, Trash2, Printer, Download, Loader } from 'lucide-react';
import { CarProvider, Settings } from '../../../types';
import PrintableSaleCar from './PrintableSaleCar';
import PrintableRentCar from './PrintableRentCar';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarListingWizard } from '../CarListingWizard';
import { AnalyticsCard } from './AnalyticsCard';
import ProviderDashboardService from '../../../services/providerDashboard.service';

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

interface ListingsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    userPhone: string;
    provider: CarProvider;
    settings: Settings;
}

interface Listing {
    id: number;
    title: string;
    model: string;
    year: number;
    mileage: number;
    photos: string[];
    is_hidden: boolean;
    listing_type: 'sale' | 'rent';
    price?: number;
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
    rental_terms?: {
        daily_rate?: number;
        weekly_rate?: number;
        monthly_rate?: number;
    };
    views_count: number;
}

export const ListingsView: React.FC<ListingsViewProps> = ({ showToast, userPhone, provider, settings }) => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);

    // Quick Edit
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
    const [tempPrice, setTempPrice] = useState(''); // For Sale
    const [tempRates, setTempRates] = useState({ daily: '', weekly: '', monthly: '' }); // For Rent
    const [savingPrice, setSavingPrice] = useState(false);

    // Print State
    const [printListing, setPrintListing] = useState<Listing | null>(null);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isReadyForPrint, setIsReadyForPrint] = useState(false);
    const printableRef = useRef<HTMLDivElement>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'rent'>('all');

    // Analytics States
    const [expandedAnalytics, setExpandedAnalytics] = useState<Set<number>>(new Set());
    const [analyticsData, setAnalyticsData] = useState<Record<number, any>>({});

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

    const startPriceEdit = (listing: any) => {
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
                // Determine what changed or send all
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

            await CarProviderService.quickEditListing(listingId, updateData);

            // Optimistic Update
            setListings(prev => prev.map(l => {
                if (l.id !== listingId) return l;

                const updated = { ...l, ...updateData };

                // Ensure rental_terms is synced if it exists
                if (isRent && l.rental_terms && typeof l.rental_terms === 'object' && !Array.isArray(l.rental_terms)) {
                    updated.rental_terms = {
                        ...l.rental_terms,
                        ...(updateData.daily_rate !== undefined && { daily_rate: updateData.daily_rate }),
                        ...(updateData.weekly_rate !== undefined && { weekly_rate: updateData.weekly_rate }),
                        ...(updateData.monthly_rate !== undefined && { monthly_rate: updateData.monthly_rate })
                    };
                }

                return updated;
            }));

            showToast('تم تحديث السعر بنجاح', 'success');
            setEditingPriceId(null);
        } catch (error) {
            console.error('Update failed:', error);
            showToast('فشل تحديث السعر', 'error');
        } finally {
            setSavingPrice(false);
        }
    };

    const handlePrintClick = (listing: Listing) => {
        setPrintListing(listing);
        setIsReadyForPrint(false);
        setShowPrintPreview(true);
    };

    const handleConfirmPrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        if (!printableRef.current || !isReadyForPrint || !printListing) return;

        setIsGeneratingPdf(true);
        showToast('جارٍ إنشاء ملف PDF...', 'info');

        try {
            // @ts-ignore
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default;

            if (!html2pdf) throw new Error("html2pdf library not found");

            const element = printableRef.current;
            const opt = {
                margin: 0,
                filename: `listing-${printListing.id}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(element).save();
            setIsGeneratingPdf(false);
            showToast('تم تحميل الملف بنجاح', 'success');
        } catch (err) {
            console.error("PDF generation failed:", err);
            showToast('فشل إنشاء ملف PDF.', 'error');
            setIsGeneratingPdf(false);
        }
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

            const matchesType = typeFilter === 'all'
                ? true
                : typeFilter === 'rent'
                    ? listing.listing_type?.toLowerCase() === 'rent'
                    : listing.listing_type?.toLowerCase() !== 'rent';

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [listings, searchTerm, statusFilter, typeFilter]);

    const toggleAnalytics = async (listingId: number) => {
        const newExpanded = new Set(expandedAnalytics);

        if (newExpanded.has(listingId)) {
            newExpanded.delete(listingId);
        } else {
            newExpanded.add(listingId);
            // Load analytics if not already loaded
            if (!analyticsData[listingId]) {
                try {
                    const data = await ProviderDashboardService.getListingAnalytics(listingId);
                    setAnalyticsData(prev => ({ ...prev, [listingId]: data }));
                } catch (error) {
                    showToast('فشل تحميل الإحصائيات', 'error');
                }
            }
        }
        setExpandedAnalytics(newExpanded);
    };

    // Stats Calculation
    const stats = useMemo(() => {
        return {
            total: listings.length,
            active: listings.filter(l => !l.is_hidden).length,
            views: listings.reduce((acc, l) => acc + (l.views_count || 0), 0),
            sale: listings.filter(l => l.listing_type !== 'rent').length,
            rent: listings.filter(l => l.listing_type === 'rent').length
        };
    }, [listings]);

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
            className="space-y-8"
        >
            {/* Header & Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Title & Main Actions */}
                <div className="lg:col-span-3 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">سياراتي</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">إدارة ومتابعة أداء سياراتك المعروضة</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Enhanced Type Tabs */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center">
                            {(['all', 'sale', 'rent'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${typeFilter === type
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    {typeFilter === type && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm z-0"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">
                                        {type === 'all' ? 'الكل' : type === 'sale' ? 'للبيع' : 'للإيجار'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setEditingListing(null);
                                setShowWizard(true);
                            }}
                            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 font-bold shadow-xl shadow-blue-600/20 ring-4 ring-blue-600/10"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">إضافة سيارة</span>
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">إجمالي السيارات</span>
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Car className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.total}</div>
                        <div className="text-xs text-slate-400 font-medium">سيارة مضافة</div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">السيارات النشطة</span>
                            <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Check className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.active}</div>
                        <div className="text-xs text-slate-400 font-medium">معروضة حالياً</div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">إجمالي المشاهدات</span>
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Eye className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.views.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 font-medium">مشاهدة للسيارات</div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">توزيع العروض</span>
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2 mb-1">
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.sale}</span>
                                <span className="text-[10px] text-slate-400 font-bold">بيع</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mb-1"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.rent}</span>
                                <span className="text-[10px] text-slate-400 font-bold">إيجار</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-slate-800/80 supports-[backdrop-filter]:bg-white/60">
                <div className="flex-1 relative group">
                    <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث عن سيارة (الاسم، الموديل)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:shadow-md"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute top-1/2 -translate-y-1/2 left-3 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
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
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${statusFilter === filter
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50'
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
                        <p className="text-slate-500 max-w-xs mx-auto text-sm">لم يتم العثور على سيارات تطابق معايير البحث الخاصة بك. حاول تغيير الفلاتر.</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="mt-6 px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                            >
                                مسح جميع الفلاتر
                            </button>
                        ) : null}
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700">
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
                                        <th className="px-6 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <AnimatePresence initial={false}>
                                        {filteredListings.map((listing, index) => (
                                            <React.Fragment key={listing.id}>
                                                <motion.tr
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
                                                                    src={listing.photos?.[0] || '/placeholder-car.jpg'}
                                                                    alt={listing.title}
                                                                    loading="lazy"
                                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white text-base mb-1">{listing.title}</div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{listing.year}</span>
                                                                    <span>•</span>
                                                                    <span>{listing.mileage?.toLocaleString()} كم</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle text-slate-900 dark:text-white font-bold">
                                                        {editingPriceId === listing.id ? (
                                                            listing.listing_type?.toLowerCase() === 'rent' ? (
                                                                <div className="flex flex-col gap-2 min-w-[140px] bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 z-10 relative">
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
                                                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800">
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
                                                            <div className="flex items-start gap-2 group/price cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors -ml-2" onClick={() => startPriceEdit(listing)}>
                                                                {listing.listing_type?.toLowerCase() === 'rent' ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="font-black text-blue-600 text-base">{getRates(listing)?.daily?.toLocaleString() || 0} <span className="text-xs font-medium text-slate-400">ل.س / يوم</span></div>
                                                                        <div className="flex gap-3 text-xs text-slate-500">
                                                                            <span>{getRates(listing)?.weekly?.toLocaleString() || 0} <span className="text-[10px]">أسبوعي</span></span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span>{getRates(listing)?.monthly?.toLocaleString() || 0} <span className="text-[10px]">شهري</span></span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-black text-slate-800 dark:text-slate-200 text-lg">{Number(listing.price).toLocaleString()} <span className="text-xs font-bold text-slate-400">ل.س</span></span>
                                                                )}
                                                                <Edit3 className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover/price:opacity-100 transition-all translate-x-1 group-hover/price:translate-x-0 mt-1.5" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full w-fit">
                                                            <Icon name="Eye" className="w-4 h-4 text-blue-500" />
                                                            <span className="font-bold font-mono text-sm">{listing.views_count}</span>
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
                                                                onClick={(e) => { e.stopPropagation(); handlePrintClick(listing); }}
                                                                className="p-2 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/30"
                                                                title="طباعة / PDF"
                                                            >
                                                                <Printer className="w-4.5 h-4.5" />
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(listing.id); }}
                                                                className={`p-2 rounded-xl transition-all shadow-sm hover:shadow-md ${listing.is_hidden
                                                                    ? 'text-teal-500 hover:text-white hover:bg-teal-500'
                                                                    : 'text-amber-500 hover:text-white hover:bg-amber-500'
                                                                    } `}
                                                                title={listing.is_hidden ? 'إظهار' : 'إخفاء'}
                                                            >
                                                                {listing.is_hidden ? <ToggleLeft className="w-4.5 h-4.5" /> : <ToggleRight className="w-4.5 h-4.5" />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEditListing(listing); }}
                                                                className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-sm hover:shadow-blue-500/30"
                                                                title="تعديل"
                                                            >
                                                                <Edit3 className="w-4.5 h-4.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteListing(listing.id); }}
                                                                className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm hover:shadow-red-500/30"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="w-4.5 h-4.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <button
                                                            onClick={() => toggleAnalytics(listing.id)}
                                                            className={`p-2 rounded-xl transition-all ${expandedAnalytics.has(listing.id)
                                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                }`}
                                                            title="عرض الإحصائيات"
                                                        >
                                                            {expandedAnalytics.has(listing.id) ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                                {/* Analytics Row */}
                                                <AnimatePresence>
                                                    {
                                                        expandedAnalytics.has(listing.id) && (
                                                            <motion.tr
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="bg-slate-50/50 dark:bg-slate-900/50"
                                                            >
                                                                <td colSpan={6} className="px-6 py-6">
                                                                    {analyticsData[listing.id] ? (
                                                                        <AnalyticsCard
                                                                            analytics={{
                                                                                listingId: listing.id,
                                                                                views: analyticsData[listing.id].total_views || 0,
                                                                                favorites: analyticsData[listing.id].favorites_count || 0,
                                                                                contacts: (analyticsData[listing.id].event_counts?.contact_phone || 0) + (analyticsData[listing.id].event_counts?.contact_whatsapp || 0),
                                                                                shares: analyticsData[listing.id].event_counts?.share || 0,
                                                                                viewsTrend: 0,
                                                                                conversionRate: analyticsData[listing.id].total_views > 0
                                                                                    ? (((analyticsData[listing.id].event_counts?.contact_phone || 0) + (analyticsData[listing.id].event_counts?.contact_whatsapp || 0)) / analyticsData[listing.id].total_views) * 100
                                                                                    : 0
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center py-4">
                                                                            <Icon name="Loader" className="w-6 h-6 animate-spin text-primary" />
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </motion.tr>
                                                        )
                                                    }
                                                </AnimatePresence>
                                            </React.Fragment>
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
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border border-slate-100 dark:border-slate-700"
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-inner">
                                                <img
                                                    src={listing.photos?.[0] || '/placeholder-car.jpg'}
                                                    alt={listing.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-1 right-1">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm backdrop-blur-md ${listing.is_hidden
                                                        ? 'bg-slate-900/60 text-white'
                                                        : 'bg-green-500/80 text-white'
                                                        } `}>
                                                        {listing.is_hidden ? 'مخفي' : 'نشط'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-base leading-tight mb-1">{listing.title}</h3>
                                                    <p className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 w-fit px-2 py-0.5 rounded-md mb-2">{listing.year} • {listing.mileage?.toLocaleString()} كم</p>
                                                </div>

                                                <div className="flex items-end justify-between w-full">
                                                    {editingPriceId === listing.id ? (
                                                        listing.listing_type?.toLowerCase() === 'rent' ? (
                                                            <div className="w-full relative z-10 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800">
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="يومي"
                                                                        value={tempRates.daily}
                                                                        onChange={(e) => setTempRates({ ...tempRates, daily: e.target.value })}
                                                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        autoFocus
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <input
                                                                            type="number"
                                                                            placeholder="أسبوعي"
                                                                            value={tempRates.weekly}
                                                                            onChange={(e) => setTempRates({ ...tempRates, weekly: e.target.value })}
                                                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            placeholder="شهري"
                                                                            value={tempRates.monthly}
                                                                            onChange={(e) => setTempRates({ ...tempRates, monthly: e.target.value })}
                                                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 mt-3">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); savePriceEdit(listing.id); }}
                                                                        disabled={savingPrice}
                                                                        className="flex-1 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-50"
                                                                    >
                                                                        {savingPrice ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); cancelPriceEdit(); }}
                                                                        disabled={savingPrice}
                                                                        className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg flex items-center justify-center active:bg-red-200 transition-colors disabled:opacity-50"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 w-full relative z-10">
                                                                <input
                                                                    type="number"
                                                                    value={tempPrice}
                                                                    onChange={(e) => setTempPrice(e.target.value)}
                                                                    className="flex-1 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-lg"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); savePriceEdit(listing.id); }}
                                                                    className="p-2.5 bg-green-500 text-white rounded-xl shadow-md active:scale-95 transition-transform"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); cancelPriceEdit(); }}
                                                                    className="p-2.5 bg-red-100 text-red-600 rounded-xl active:bg-red-200 transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div
                                                            className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                                                            onClick={(e) => { e.stopPropagation(); startPriceEdit(listing); }}
                                                        >
                                                            {listing.listing_type?.toLowerCase() === 'rent' ? (
                                                                <>
                                                                    <span className="font-black text-blue-600 text-lg leading-none">{getRates(listing)?.daily?.toLocaleString() || 0} <span className="text-xs font-bold text-slate-400">ل.س/يوم</span></span>
                                                                    <div className="flex gap-2 text-[10px] text-slate-400 font-medium mt-1">
                                                                        <span>{getRates(listing)?.weekly?.toLocaleString() || 0} أسبوعي</span>
                                                                        <span>•</span>
                                                                        <span>{getRates(listing)?.monthly?.toLocaleString() || 0} شهري</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="font-black text-slate-900 dark:text-white text-lg leading-none">{Number(listing.price).toLocaleString()} <span className="text-xs font-bold text-slate-400">ل.س</span></span>
                                                                    <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium mt-0.5">
                                                                        <Edit3 className="w-3 h-3" />
                                                                        تعديل السعر
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                                        <Icon name="Eye" className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{listing.views_count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={() => handlePrintClick(listing)}
                                                className="col-span-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all"
                                            >
                                                <Printer className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">طباعة</span>
                                            </button>
                                            <button
                                                onClick={() => handleToggleVisibility(listing.id)}
                                                className={`col-span-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl active:scale-95 transition-all ${listing.is_hidden
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-50 text-slate-600'
                                                    }`}
                                            >
                                                {listing.is_hidden ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                                                <span className="text-[10px] font-bold">{listing.is_hidden ? 'نشر' : 'إخفاء'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleEditListing(listing)}
                                                className="col-span-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">تعديل</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteListing(listing.id)}
                                                className="col-span-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">حذف</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div >
                )}
            </AnimatePresence >

            {/* Print Preview Modal */}
            <AnimatePresence>
                {showPrintPreview && printListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center z-[100] p-4 print:p-0 print:bg-white"
                        onClick={() => setShowPrintPreview(false)}
                    >
                        {/* Print Styles */}
                        <style>{`
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 0;
                            }
                            html, body {
                                height: auto !important;
                                width: 210mm !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                overflow: visible !important;
                            }
                            body * {
                                visibility: hidden;
                            }
                            .printable-area, .printable-area * {
                                visibility: visible;
                            }
                            .printable-area {
                                position: absolute;
                                top: 0;
                                left: 0 !important;
                                width: 210mm !important;
                                min-height: 297mm !important;
                                height: auto !important;
                                margin: 0;
                                padding: 0;
                                background: white;
                                z-index: 99999;
                            }
                            .printable-area > div {
                                transform: none !important;
                                width: 100% !important;
                            }
                            .print-hidden {
                                display: none !important;
                            }
                        }
                    `}</style>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[210mm] flex flex-col gap-0 max-h-full"
                        >

                            <div className="w-full bg-white dark:bg-slate-800 p-4 rounded-t-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4 print-hidden z-50 border-b border-gray-100 dark:border-gray-700">
                                <div className="text-center sm:text-right">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                        {printListing.listing_type === 'rent' ? 'معاينة العرض (إيجار)' : 'معاينة العرض (بيع)'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        جاهز للطباعة بحجم A4
                                    </p>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto justify-center bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl">
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isGeneratingPdf || !isReadyForPrint}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {isGeneratingPdf ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>
                                    <button
                                        onClick={handleConfirmPrint}
                                        disabled={!isReadyForPrint}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>طباعة</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPrintPreview(false)}
                                    className="absolute top-2 right-2 sm:static w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="printable-area w-full flex-grow overflow-y-auto bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm p-4 sm:p-8 rounded-b-2xl shadow-inner custom-scrollbar flex justify-center sticky-scrollbar">
                                <div className="relative shadow-2xl bg-white transition-all duration-300 origin-top
                                transform
                                scale-[0.45] mb-[-120%] 
                                xs:scale-[0.55] xs:mb-[-100%]
                                sm:scale-[0.7] sm:mb-[-60%]
                                md:scale-[0.85] md:mb-[-30%]
                                lg:scale-100 lg:mb-0
                                w-[210mm] h-[297mm] flex-shrink-0
                                "
                                >
                                    {printListing.listing_type === 'rent' ? (
                                        <PrintableRentCar
                                            ref={printableRef}
                                            listing={printListing}
                                            provider={provider}
                                            settings={settings}
                                            onReady={() => setIsReadyForPrint(true)}
                                        />
                                    ) : (
                                        <PrintableSaleCar
                                            ref={printableRef}
                                            listing={printListing}
                                            provider={provider}
                                            settings={settings}
                                            onReady={() => setIsReadyForPrint(true)}
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wizard Modal */}
            {
                showWizard && (
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
                )
            }
        </motion.div >
    );
};
