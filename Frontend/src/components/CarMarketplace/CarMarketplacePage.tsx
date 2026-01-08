import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarProviderService, CarListing, MarketplaceFilters as FilterType } from '../../services/carprovider.service';
import { Car, Grid, List, Search, SlidersHorizontal, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarListingCard } from './MarketplaceParts/CarListingCard';
import { MarketplaceFilters } from './MarketplaceParts/MarketplaceFilters';
import { ListingSkeleton } from './MarketplaceParts/ListingSkeleton';
import Icon from '../Icon';

interface CarMarketplacePageProps {
    listingType?: 'sale' | 'rent';
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

export const CarMarketplacePage: React.FC<CarMarketplacePageProps> = ({
    listingType = 'sale',
    showToast,
    isAuthenticated,
    onLoginClick
}) => {
    // State
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<FilterType>({ listing_type: listingType });
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Initial Load
    useEffect(() => {
        loadCategories();
    }, []);

    // Load listings when filters change
    useEffect(() => {
        loadListings();
        // Scroll to top on filter change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [filters, pagination.current_page]);

    const loadCategories = async () => {
        try {
            const response = await CarProviderService.getCategories();
            setCategories(response.categories || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const loadListings = async () => {
        setLoading(true);
        try {
            // Merge search query into filters if needed, or handle separately
            const currentFilters = { ...filters };
            if (searchQuery) {
                // If API supports search param in filter object
                // or we use a separate search endpoint. 
                // The original code used a separate 'searchListings' method for search.
                // We should ideally unify this. For now, let's keep the logic consistent.
            }

            const response = listingType === 'rent'
                ? await CarProviderService.getRentCars(filters)
                : await CarProviderService.getMarketplace(filters);

            setListings(response.listings?.data || []);
            setPagination({
                current_page: response.listings?.current_page || 1,
                last_page: response.listings?.last_page || 1,
                total: response.listings?.total || 0
            });
        } catch (error) {
            console.error('Failed to load listings:', error);
            showToast('فشل تحميل السيارات', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            // Reset to normal load if empty
            if (loading) return;
            loadListings();
            return;
        }

        setLoading(true);
        try {
            const response = await CarProviderService.searchListings(searchQuery);
            setListings(response.results?.data || []);
            // Update pagination if search returns structure, otherwise reset
            setPagination({
                current_page: 1,
                last_page: 1,
                total: response.results?.total || (response.results?.data || []).length
            });
        } catch (error) {
            showToast('فشل البحث', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset page on filter change
    };

    const handleResetFilters = () => {
        setFilters({ listing_type: listingType });
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            {/* 1. Hero / Header Section */}
            <div className="relative bg-[#0f172a] text-white py-16 overflow-hidden">
                {/* Abstract Background Globs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium">
                                {listingType === 'rent' ? 'متاح للإيجار' : 'سوق السيارات'}
                            </span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
                        >
                            {listingType === 'rent'
                                ? 'استأجر سيارة أحلامك بكل سهولة'
                                : 'اكتشف أفضل السيارات المستعملة والجديدة'
                            }
                        </motion.h1>

                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative max-w-xl"
                        >
                            <input
                                type="text"
                                placeholder="ابحث عن ماركة، موديل، أو كلمة مفتاحية..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full px-6 py-4 pr-12 rounded-2xl bg-white text-slate-900 shadow-xl focus:ring-4 focus:ring-blue-500/20 border-0 outline-none text-lg transition-all"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute left-2 top-2 bottom-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-8 -mt-8 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar (Desktop) */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24">
                            <MarketplaceFilters
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
                                <Car className="w-6 h-6 text-primary" />
                                {pagination.total > 0 ? `${pagination.total} سيارة متاحة` : 'جاري البحث...'}
                            </h2>

                            <div className="flex items-center gap-3">
                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setShowMobileFilters(true)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-700 dark:text-slate-200"
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span>تصفية</span>
                                </button>

                                {/* View Toggle */}
                                <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    >
                                        <Grid className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="min-h-[400px]">
                            {loading ? (
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
                                        <Search className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        لا توجد سيارات مطابقة
                                    </h3>
                                    <p className="text-slate-500 text-center max-w-sm mb-6">
                                        لم نتمكن من العثور على سيارات تطابق معايير البحث الخاصة بك. جرب تغيير الفلاتر أو كلمة البحث.
                                    </p>
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                                    >
                                        إزالة الفلاتر
                                    </button>
                                </motion.div>
                            ) : (
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                                }>
                                    <AnimatePresence mode='popLayout'>
                                        {listings.map((listing) => (
                                            <CarListingCard
                                                key={listing.id}
                                                listing={listing}
                                                viewMode={viewMode}
                                                showToast={showToast}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && pagination.last_page > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-12">
                                    <button
                                        onClick={() => handleFilterChange('page', Math.max(1, pagination.current_page - 1))}
                                        disabled={pagination.current_page === 1}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                            // Smart logic to show window around current page could go here
                                            // For now simple 1..5 or 1..last_page
                                            let p = i + 1;
                                            if (pagination.last_page > 5 && pagination.current_page > 3) {
                                                p = pagination.current_page - 2 + i;
                                                if (p > pagination.last_page) return null;
                                            }

                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => handleFilterChange('page', p)}
                                                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${p === pagination.current_page
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handleFilterChange('page', Math.min(pagination.last_page, pagination.current_page + 1))}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>
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
                                <h3 className="font-bold text-lg">تصفية النتائج</h3>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-4">
                                <MarketplaceFilters
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    categories={categories}
                                    onReset={handleResetFilters}
                                    className="shadow-none border-0 p-0"
                                />
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    عرض {pagination.total} سيارة
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
