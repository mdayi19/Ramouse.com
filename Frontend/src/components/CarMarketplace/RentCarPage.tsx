import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CarProviderService, CarListing, MarketplaceFilters as FilterType } from '../../services/carprovider.service';
import { Car, Grid, List, Search, SlidersHorizontal, ArrowLeft, ArrowRight, X, Calendar, ShieldCheck, Armchair, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarListingCard } from './MarketplaceParts/CarListingCard';
import { RentListingCard } from './MarketplaceParts/RentListingCard';
import { RentFilters } from './MarketplaceParts/RentFilters';
import { ListingSkeleton } from './MarketplaceParts/ListingSkeleton';
import { ErrorState } from './MarketplaceParts/ErrorState';
import Icon from '../Icon';
import SEO from '../SEO';
import SponsoredListings from './ListingParts/SponsoredListings';
import { api } from '../../lib/api';
import { generateCollectionPageSchema, generateCarRentalsDataset } from '../../utils/structuredData';
import SeoSchema from '../SeoSchema';


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
    const [facetCounts, setFacetCounts] = useState<{
        originCounts: Record<string | number, number>;
        brandCounts: Record<string | number, number>;
        modelCounts: Record<string, number>;
        cityCounts: Record<string, number>;
    }>({ originCounts: {}, brandCounts: {}, modelCounts: {}, cityCounts: {} });
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

    useEffect(() => {
        loadData();
        fetchSponsoredPool();
    }, []);

    const loadData = async () => {
        try {
            const [categoriesRes, countsRes] = await Promise.all([
                CarProviderService.getCategories(),
                CarProviderService.getListingCounts('rent')
            ]);
            setCategories(categoriesRes.categories || []);
            setFacetCounts(countsRes);
        } catch (error) {
            console.error('Failed to load filter data:', error);
        }
    };

    const fetchSponsoredPool = async () => {
        try {
            const params = {
                is_sponsored: 1,
                limit: 20,
                listing_type: 'rent'
            };
            const response = await api.get('/car-listings', { params });
            // Shuffle client-side
            const responseData = response.data;
            const rawListings = responseData.listings?.data || responseData.data || [];
            // Strictly filter for is_sponsored
            const allSponsored = rawListings
                .filter((item: any) => item.is_sponsored && item.listing_type === 'rent')
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
                // Search Logic
                response = await CarProviderService.searchListings(searchQuery);
                const results = response.results || {};

                let data = results.data || [];
                data = data.filter((item: CarListing) => item.listing_type === 'rent');

                // Apply City Filter to Search Results too
                if (filters.city) {
                    data = data.filter((item: CarListing) => item.city === filters.city);
                }

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
                // Browsing Logic
                // Prepare API filters
                const apiFilters: any = { ...filters };
                const cityFilter = apiFilters.city;

                // If city filter is active, fetch ALL to filter client-side
                if (cityFilter) {
                    delete apiFilters.city;
                    apiFilters.limit = 1000;
                    apiFilters.per_page = 1000; // Try both standard params
                    apiFilters.page = 1;
                }

                response = await CarProviderService.getRentCars(apiFilters);

                let data = response.listings?.data || [];
                const meta = response.listings;

                // Client-side cleaning/filtering
                if (cityFilter) {
                    data = data.filter((item: CarListing) => item.city === cityFilter);
                }

                if (isReset) {
                    setListings(data);
                } else {
                    // Start of workaround:
                    // If city filter is active, we fetched EVERYTHING in page 1 request.
                    // So 'loading more' shouldn't append duplicates if we are just paging logically.
                    // But technically setFilters increments page.
                    // If we have cityFilter, we treat it as single-page mode.
                    if (!cityFilter) {
                        setListings(prev => [...prev, ...data]);
                    }
                }

                setPagination({
                    current_page: meta?.current_page || 1,
                    // If city filter, force last_page 1 since we fetched all
                    last_page: cityFilter ? 1 : (meta?.last_page || 1),
                    total: cityFilter ? data.length : (meta?.total || 0)
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
            {/* SEO Metadata */}
            <Icon name="Search" className="hidden" /> {/* Force Icon import usage */}
            <SEO
                title={`تأجير سيارات في سوريا - ${pagination.total} سيارة متاحة | راموسة`}
                description={`أفضل عروض تأجير السيارات في سوريا. ${pagination.total} سيارة متاحة للإيجار اليومي والشهري. قارن الأسعار واحجز سيارتك الآن.`}
                canonical="/rent-car"
                schema={{
                    type: 'CollectionPage',
                    data: generateCollectionPageSchema(
                        `تأجير سيارات في سوريا - ${pagination.total} سيارة متاحة`,
                        `أفضل عروض تأجير السيارات في سوريا. ${pagination.total} سيارة متاحة للإيجار اليومي والشهري.`,
                        listings
                    )
                }}
            />

            {/* Dataset Schema for AI Authority */}
            <SeoSchema type="Dataset" data={generateCarRentalsDataset()} />

            {/* 1. Hero / Header Section for RENT */}
            <div className="relative bg-gradient-to-br from-teal-800 via-teal-900 to-slate-800 text-white py-12 md:py-16 overflow-hidden">
                {/* Animated Background Blobs - Teal Theme */}
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
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
                            <span className="px-4 py-2 rounded-full bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-sm font-bold backdrop-blur-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                إيجار يومي / أسبوعي / شهري
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight"
                        >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-white">
                                استأجر سيارتك المثالية
                            </span>
                            <br />
                            <span className="text-2xl md:text-3xl text-white/90 block mt-2">
                                لقضاء مشاويرك بكل راحة
                            </span>
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
                                    placeholder="ابحث عن سيارة للإيجار - ماركة، موديل..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full px-6 py-3.5 bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 placeholder-slate-400 text-base
                                             focus:ring-4 focus:ring-cyan-400/30 focus:bg-white border-0 outline-none transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5 
                                             flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Controls Bar (Rent Version) */}
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-lg">
                                {/* Result Count */}
                                <div className="flex items-center gap-2 px-3 text-white font-medium">
                                    <Car className="w-5 h-5 text-cyan-300" />
                                    <span>{pagination.total > 0 ? `${pagination.total} سيارة للإيجار` : 'جاري البحث...'}</span>
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
                                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-teal-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                                        >
                                            <Grid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-teal-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
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
            <div className="w-full px-0 md:px-8 py-6 -mt-8 relative z-20">
                {/* Top Sponsored Carousel */}
                {topSponsored.length > 0 && (
                    <div className="mb-8 px-4 md:px-0">
                        <SponsoredListings
                            t={(k: string) => k}
                            listingType="rent"
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
                            <RentFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                categories={categories}
                                onReset={handleResetFilters}
                                facetCounts={facetCounts}
                            />
                        </div>
                    </div>

                    {/* Listings Column */}
                    <div className="flex-1">

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
                                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'
                                    : 'flex flex-col gap-3 sm:gap-4'
                                }>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <ListingSkeleton key={i} viewMode={viewMode} />
                                    ))}
                                </div>
                            ) : listings.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-br from-teal-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-teal-200 dark:border-slate-700 shadow-sm"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="relative mb-6"
                                    >
                                        <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-2xl" />
                                        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-full border-4 border-teal-500/20 shadow-lg">
                                            <Search className="w-12 h-12 text-teal-600" />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">
                                        لا توجد سيارات متاحة للإيجار
                                    </h3>

                                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md text-center leading-relaxed">
                                        جرب تغيير المدينة أو الفلاتر للعثور على سيارة مناسبة للإيجار
                                    </p>

                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                setFilters({});
                                                setSearchQuery('');
                                            }}
                                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
                                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'
                                    : 'flex flex-col gap-3 sm:gap-4'
                                }>
                                    {listings.map((listing, index) => {
                                        if (index === listings.length - 1) {
                                            return (
                                                <div ref={lastListingElementRef} key={listing.id} className="w-full">
                                                    <RentListingCard
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
                                                <RentListingCard
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

                                        // Injection Logic: Inject after every 6 items
                                        if ((idx + 1) % 6 === 0) {
                                            const injectionIndex = Math.floor((idx + 1) / 6) - 1;
                                            const sponsoredItem = injectedSponsored[injectionIndex % injectedSponsored.length];

                                            if (sponsoredItem) {
                                                acc.push(
                                                    <div key={`sponsored-inject-${idx}`} className={viewMode === 'list' ? "w-full" : ""}>
                                                        <RentListingCard
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
                            className="fixed inset-0 w-full bg-white dark:bg-slate-800 shadow-2xl z-50 lg:hidden flex flex-col"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
                                <h3 className="font-bold text-lg">تصفية عروض الإيجار</h3>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <RentFilters
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    categories={categories}
                                    onReset={handleResetFilters}
                                    className="shadow-none border-0 p-0"
                                    facetCounts={facetCounts}
                                />
                            </div>

                            <div className="p-4 shrink-0 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                                >
                                    عرض {pagination.total} نتيجة
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
