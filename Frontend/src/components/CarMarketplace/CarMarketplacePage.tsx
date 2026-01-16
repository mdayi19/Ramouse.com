import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarProviderService, CarListing, MarketplaceFilters as FilterType } from '../../services/carprovider.service';
import { Car, Grid, List, Search, SlidersHorizontal, ArrowLeft, ArrowRight, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarListingCard } from './MarketplaceParts/CarListingCard';
import { MarketplaceFilters } from './MarketplaceParts/MarketplaceFilters';
import { RentFilters } from './MarketplaceParts/RentFilters';
import { ListingSkeleton } from './MarketplaceParts/ListingSkeleton';
import { ErrorState } from './MarketplaceParts/ErrorState';
import Icon from '../Icon';
import SponsoredListings from './ListingParts/SponsoredListings';
import { api } from '../../lib/api';

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [filters, setFilters] = useState<FilterType>({ listing_type: listingType, page: 1 });
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [models, setModels] = useState<Record<string, any[]>>({});
    const [facetCounts, setFacetCounts] = useState<{
        originCounts: Record<string | number, number>;
        brandCounts: Record<string | number, number>;
        modelCounts: Record<string, number>;
    }>({ originCounts: {}, brandCounts: {}, modelCounts: {} });

    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Sponsored Pool State
    const [sponsoredPool, setSponsoredPool] = useState<CarListing[]>([]);
    const [topSponsored, setTopSponsored] = useState<CarListing[]>([]);
    const [injectedSponsored, setInjectedSponsored] = useState<CarListing[]>([]);

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
        loadFilterData();
        fetchSponsoredPool();
    }, []);

    const loadFilterData = async () => {
        try {
            const [categoriesRes, brandsRes, countriesRes, countsRes] = await Promise.all([
                CarProviderService.getCategories(),
                CarProviderService.getBrands(),
                CarProviderService.getCountries(),
                CarProviderService.getListingCounts(listingType)
            ]);

            setCategories(categoriesRes.categories || []);
            setBrands(brandsRes.brands || []);
            // Use dynamically collected models if available, otherwise fallback to static
            setModels(countsRes.modelsByBrand && Object.keys(countsRes.modelsByBrand).length > 0
                ? countsRes.modelsByBrand
                : brandsRes.models || {});
            setCountries(countriesRes.countries || []);
            setFacetCounts(countsRes);

            console.log('DEBUG: Filter Data Loaded', {
                categories: categoriesRes.categories,
                brands: brandsRes.brands,
                counts: countsRes
            });
        } catch (error) {
            console.error('Failed to load filter data:', error);
        }
    };

    const fetchSponsoredPool = async () => {
        try {
            const params = {
                is_sponsored: 1,
                limit: 20, // Fetch enough for carousel + injections
                listing_type: listingType
            };
            const response = await api.get('/car-listings', { params });
            // Shuffle client-side since API random sort is unstable
            // Fix: API returns listings inside 'listings' object, not directly in 'data' usually
            const responseData = response.data;
            const rawListings = responseData.listings?.data || responseData.data || [];
            // Strictly filter for is_sponsored to avoid pollution
            const allSponsored = rawListings
                .filter((item: any) => item.is_sponsored && item.listing_type === 'sale')
                .sort(() => 0.5 - Math.random());

            // Split into Top Carousel (4) and Injection Pool (rest)
            setTopSponsored(allSponsored.slice(0, 4));
            setInjectedSponsored(allSponsored.slice(4));
            setSponsoredPool(allSponsored);
        } catch (err) {
            console.error('Failed to fetch sponsored pool', err);
        }
    };

    // Load listings when filters change
    useEffect(() => {
        const isPageOne = filters.page === 1;
        loadListings(isPageOne);

        if (isPageOne) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [filters]);



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
                response = await CarProviderService.searchListings(searchQuery);
                const results = response.results || {};

                // Search API might behave differently regarding pagination
                if (isReset) {
                    setListings(results.data || []);
                } else {
                    setListings(prev => [...prev, ...(results.data || [])]);
                }

                setPagination({
                    current_page: 1,
                    last_page: 1,
                    total: (results.data || []).length
                });
            } else {
                response = listingType === 'rent'
                    ? await CarProviderService.getRentCars(filters)
                    : await CarProviderService.getMarketplace(filters);

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
            const errorMessage = err instanceof Error ? err.message : 'فشل تحميل السيارات';
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
        setFilters({ listing_type: listingType, page: 1 });
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            {/* 1. Hero / Header Section */}
            <div className="relative bg-gradient-to-br from-primary via-primary-900 to-slate-800 text-white py-12 md:py-16 overflow-hidden">
                {/* Animated Background Blobs */}
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-secondary/30 to-transparent rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />

                {/* Noise texture overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                <div className="w-full px-4 md:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-3 mb-6"
                        >
                            <span className="px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-sm font-bold backdrop-blur-sm">
                                {listingType === 'rent' ? 'متاح للإيجار' : 'سوق السيارات'}
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight"
                        >
                            {listingType === 'rent'
                                ? 'استأجر سيارة أحلامك بكل سهولة'
                                : (
                                    <>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-secondary to-white">
                                            اكتشف أفضل السيارات
                                        </span>
                                        <br />
                                        <span className="text-2xl md:text-3xl text-white/90 block mt-2">
                                            المستعملة والجديدة
                                        </span>
                                    </>
                                )
                            }
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative max-w-2xl mx-auto"
                        >
                            {/* Glassmorphism Search Bar */}
                            <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-2 border border-white/20 shadow-2xl">
                                <input
                                    type="text"
                                    placeholder="ابحث عن ماركة، موديل، أو كلمة مفتاحية..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full px-6 py-4 bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 placeholder-slate-400 text-base focus:ring-4 focus:ring-secondary/30 focus:bg-white border-0 outline-none transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-800 text-white rounded-xl px-5 py-2.5 flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Controls Bar (Moved to Header) */}
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-lg">
                                {/* Result Count */}
                                <div className="flex items-center gap-2 px-3 text-white font-medium">
                                    <Car className="w-5 h-5 text-secondary" />
                                    <span>{pagination.total > 0 ? `${pagination.total} سيارة متاحة` : 'جاري البحث...'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Mobile Filter */}
                                    <button
                                        onClick={() => setShowMobileFilters(true)}
                                        className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 text-sm"
                                    >
                                        <SlidersHorizontal className="w-4 h-4" />
                                        <span>تصفية</span>
                                    </button>

                                    {/* View Toggles */}
                                    <div className="flex bg-black/20 rounded-xl p-1 gap-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-white/70 hover:text-white'}`}
                                        >
                                            <Grid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-white/70 hover:text-white'}`}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="w-full px-4 md:px-6 py-6 -mt-6 relative z-20">
                {/* Top Sponsored Carousel */}
                {topSponsored.length > 0 && (
                    <div className="mb-8">
                        <SponsoredListings
                            t={(k: string) => k}
                            listingType={listingType}
                            listings={topSponsored}
                            showToast={showToast}
                            isAuthenticated={isAuthenticated}
                            onLoginClick={onLoginClick}
                        />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar (Desktop) */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24">
                            {listingType === 'rent' ? (
                                <RentFilters
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    categories={categories}
                                    brands={brands}
                                    models={models}
                                    countries={countries}
                                    onReset={handleResetFilters}
                                    facetCounts={facetCounts}
                                />
                            ) : (
                                <MarketplaceFilters
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    categories={categories}
                                    brands={brands}
                                    models={models}
                                    countries={countries}
                                    onReset={handleResetFilters}
                                    facetCounts={facetCounts}
                                />
                            )}
                        </div>
                    </div>

                    {/* Listings Column */}
                    <div className="flex-1">

                        {/* Content Grid */}
                        <div className="min-h-[400px]">
                            {error && !loading ? (
                                <ErrorState
                                    title="فشل تحميل السيارات"
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
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="relative mb-6"
                                    >
                                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
                                        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-full border-4 border-primary/20 shadow-lg">
                                            <Search className="w-12 h-12 text-primary" />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2">
                                        لا توجد سيارات مطابقة للبحث
                                    </h3>

                                    <p className="text-slate-600 dark:text-slate-400 mb-5 max-w-md text-center leading-relaxed text-sm">
                                        جرب تغيير الفلاتر أو البحث بكلمات مختلفة للعثور على السيارة المثالية
                                    </p>

                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                setFilters({});
                                                setSearchQuery('');
                                            }}
                                            className="px-6 py-3 bg-primary hover:bg-primary-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            إعادة تعيين الفلاتر
                                        </button>
                                        <button
                                            onClick={() => window.location.href = '/'}
                                            className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-all"
                                        >
                                            العودة للرئيسية
                                        </button>
                                    </div>
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
                                                    <CarListingCard
                                                        listing={listing}
                                                        viewMode={viewMode}
                                                        showToast={showToast}
                                                        isAuthenticated={isAuthenticated}
                                                        onLoginClick={onLoginClick}
                                                    />
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <CarListingCard
                                                    key={listing.id}
                                                    listing={listing}
                                                    viewMode={viewMode}
                                                    showToast={showToast}
                                                    isAuthenticated={isAuthenticated}
                                                    onLoginClick={onLoginClick}
                                                />
                                            );
                                        }
                                    }).reduce((acc: any[], curr, idx) => {
                                        // Standard item
                                        acc.push(curr);

                                        // Injection Logic: Inject after every 6 items (index 5, 11, 17...)
                                        // Use modulo to cycle through injected listings state
                                        if ((idx + 1) % 6 === 0) {
                                            const injectionIndex = Math.floor((idx + 1) / 6) - 1;
                                            const sponsoredItem = injectedSponsored[injectionIndex % injectedSponsored.length];

                                            // Only inject if we have a valid sponsored item
                                            if (sponsoredItem) {
                                                acc.push(
                                                    <div key={`sponsored-inject-${idx}`} className="">
                                                        <CarListingCard
                                                            listing={sponsoredItem}
                                                            viewMode={viewMode}
                                                            showToast={showToast}
                                                            isAuthenticated={isAuthenticated}
                                                            onLoginClick={onLoginClick}
                                                            isSponsoredInjection={true}
                                                        />
                                                    </div>
                                                );
                                            }
                                        }
                                        return acc;
                                    }, [])}

                                    {loadingMore && [1, 2, 3].map((i) => (
                                        <ListingSkeleton key={`more-${i}`} viewMode={viewMode} />
                                    ))}
                                </div>
                            )}

                            {/* End of results indicator */}
                            {!loading && !loadingMore && pagination.current_page >= pagination.last_page && listings.length > 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    وصلت لنهاية النتائج
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
                                {listingType === 'rent' ? (
                                    <RentFilters
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        categories={categories}
                                        brands={brands}
                                        models={models}
                                        countries={countries}
                                        onReset={handleResetFilters}
                                        className="shadow-none border-0 p-0"
                                        facetCounts={facetCounts}
                                    />
                                ) : (
                                    <MarketplaceFilters
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        categories={categories}
                                        brands={brands}
                                        models={models}
                                        countries={countries}
                                        onReset={handleResetFilters}
                                        className="shadow-none border-0 p-0"
                                        facetCounts={facetCounts}
                                    />
                                )}
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
