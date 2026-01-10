import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CarProviderService, CarListing, MarketplaceFilters as FilterType } from '../../services/carprovider.service';
import { Car, Grid, List, Search, SlidersHorizontal, ArrowLeft, ArrowRight, X, Calendar, ShieldCheck, Armchair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarListingCard } from './MarketplaceParts/CarListingCard';
import { RentListingCard } from './MarketplaceParts/RentListingCard';
import { RentFilters } from './MarketplaceParts/RentFilters';
import { ListingSkeleton } from './MarketplaceParts/ListingSkeleton';
import { ErrorState } from './MarketplaceParts/ErrorState';
import Icon from '../Icon';

interface RentCarPageProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

export const RentCarPage: React.FC<RentCarPageProps> = ({
    showToast,
    isAuthenticated,
    onLoginClick
}) => {
    // State
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    // Initialize with rent type
    const [filters, setFilters] = useState<FilterType>({ listing_type: 'rent', page: 1 });
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Infinite Scroll Ref
    const observer = useRef<IntersectionObserver | null>(null);
    const lastListingElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && pagination.current_page < pagination.last_page) {
                setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, pagination.current_page, pagination.last_page]);

    // Initial Load
    useEffect(() => {
        loadCategories();
    }, []);

    // Load listings when filters change
    useEffect(() => {
        const isPageOne = filters.page === 1;
        loadListings(isPageOne);

        if (isPageOne) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [filters]);

    const loadCategories = async () => {
        try {
            const response = await CarProviderService.getCategories();
            setCategories(response.categories || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const loadListings = async (isReset: boolean) => {
        if (isReset) {
            setLoading(true);
            setError(null);
        } else {
            setLoadingMore(true);
        }

        try {
            let response;
            if (searchQuery.trim()) {
                // Search might need 'rent' param if API supports mixed search, but usually search is global
                // We'll trust the search functionality or filter by type if possible after search
                response = await CarProviderService.searchListings(searchQuery);
                const results = response.results || {};

                // Filter client-side for rent if API doesn't support scoped search yet (Assumption)
                // Ideally API should accept type param for search.
                let data = results.data || [];
                data = data.filter((item: CarListing) => item.listing_type === 'rent');

                if (isReset) {
                    setListings(data);
                } else {
                    setListings(prev => [...prev, ...data]);
                }

                setPagination({
                    current_page: 1,
                    last_page: 1,
                    total: data.length
                });
            } else {
                response = await CarProviderService.getRentCars(filters);

                const data = response.listings?.data || [];
                const meta = response.listings;

                if (isReset) {
                    setListings(data);
                } else {
                    setListings(prev => [...prev, ...data]);
                }

                setPagination({
                    current_page: meta?.current_page || 1,
                    last_page: meta?.last_page || 1,
                    total: meta?.total || 0
                });
            }

        } catch (err) {
            console.error('Failed to load listings:', err);
            const errorMessage = err instanceof Error ? err.message : 'فشل تحميل سيارات الإيجار';
            setError(errorMessage);
            if (!isReset) {
                showToast('فشل تحميل المزيد من السيارات', 'error');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleResetFilters = () => {
        setFilters({ listing_type: 'rent', page: 1 });
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            {/* 1. Hero / Header Section for RENT */}
            <div className="relative bg-[#0f172a] text-white py-14 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="w-full px-2 md:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                إيجار يومي / أسبوعي / شهري
                            </span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
                        >
                            استأجر سيارتك المثالية
                            <span className="text-teal-400 block mt-2 text-3xl md:text-4xl">لقضاء مشاويرك بكل راحة</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative max-w-xl"
                        >
                            <input
                                type="text"
                                placeholder="ابحث عن سيارة للإيجار..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full px-6 py-4 pr-12 rounded-2xl bg-white text-slate-900 shadow-xl focus:ring-4 focus:ring-teal-500/20 border-0 outline-none text-lg transition-all"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute left-2 top-2 bottom-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>

                    {/* Features Badges */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-4 max-w-sm justify-end hidden md:flex"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center flex-1">
                            <ShieldCheck className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                            <span className="block text-sm font-bold">تأمين شامل</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center flex-1">
                            <Armchair className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                            <span className="block text-sm font-bold">رفاهية عالية</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="w-full px-2 md:px-8 py-8 -mt-8 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar (Desktop) */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24">
                            <RentFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                categories={categories}
                                onReset={handleResetFilters}
                            />
                        </div>
                    </div>

                    {/* Listings Column */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Car className="w-6 h-6 text-teal-600" />
                                {pagination.total > 0 ? `${pagination.total} سيارة للإيجار` : 'جاري البحث...'}
                            </h2>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowMobileFilters(true)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-700 dark:text-slate-200"
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span>تصفية</span>
                                </button>

                                <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                                            ? 'bg-teal-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    >
                                        <Grid className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                            ? 'bg-teal-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="min-h-[400px]">
                            {error && !loading ? (
                                <ErrorState
                                    title="فشل تحميل عروض الإيجار"
                                    message={error}
                                    onRetry={() => loadListings(true)}
                                    onGoHome={() => window.location.href = '/'}
                                />
                            ) : loading && !loadingMore ? (
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                                }>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <ListingSkeleton key={i} viewMode={viewMode} />
                                    ))}
                                </div>
                            ) : listings.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
                                >
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-4">
                                        <Calendar className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        لا توجد عروض إيجار مطابقة
                                    </h3>
                                    <p className="text-slate-500 text-center max-w-sm mb-6">
                                        لم نتمكن من العثور على سيارات للإيجار تطابق معاييرك. جرب توسيع نطاق السعر أو تغيير سنة الصنع.
                                    </p>
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                                    >
                                        عرض كل العروض
                                    </button>
                                </motion.div>
                            ) : (
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                                }>
                                    {listings.map((listing, index) => {
                                        if (index === listings.length - 1) {
                                            return (
                                                <div ref={lastListingElementRef} key={listing.id}>
                                                    <RentListingCard
                                                        listing={listing}
                                                        viewMode={viewMode}
                                                        showToast={showToast}
                                                    />
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <RentListingCard
                                                    key={listing.id}
                                                    listing={listing}
                                                    viewMode={viewMode}
                                                    showToast={showToast}
                                                />
                                            );
                                        }
                                    })}

                                    {loadingMore && [1, 2, 3].map((i) => (
                                        <ListingSkeleton key={`more-${i}`} viewMode={viewMode} />
                                    ))}
                                </div>
                            )}

                            {/* End of results indicator */}
                            {!loading && !loadingMore && pagination.current_page >= pagination.last_page && listings.length > 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    وصلت لنهاية العروض
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filters Drawer Overlay */}
            <AnimatePresence>
                {showMobileFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileFilters(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-slate-800 shadow-2xl z-50 lg:hidden overflow-y-auto"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
                                <h3 className="font-bold text-lg">تصفية عروض الإيجار</h3>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-4">
                                <RentFilters
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    categories={categories}
                                    onReset={handleResetFilters}
                                    className="shadow-none border-0 p-0"
                                />
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full mt-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                                >
                                    عرض {pagination.total} عرض
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
