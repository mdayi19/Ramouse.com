import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarProviderService, CarListing, MarketplaceFilters } from '../../services/carprovider.service';
import { Car, Filter, Grid, List, Search, Heart, Phone, MessageCircle, Eye } from 'lucide-react';
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
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<MarketplaceFilters>({ listing_type: listingType });
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    useEffect(() => {
        loadCategories();
        loadListings();
    }, [filters]);

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
        if (!searchQuery.trim()) return loadListings();

        setLoading(true);
        try {
            const response = await CarProviderService.searchListings(searchQuery);
            setListings(response.results?.data || []);
        } catch (error) {
            showToast('فشل البحث', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }).format(price);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Car className="w-8 h-8 text-primary" />
                        {listingType === 'rent' ? 'استئجار سيارة' : 'معرض السيارات'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        {pagination.total} سيارة متاحة
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search & View Toggle */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="ابحث عن سيارة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-3 rounded-xl transition-colors ${viewMode === 'grid'
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-3 rounded-xl transition-colors ${viewMode === 'list'
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:w-64 space-y-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                الفلاتر
                            </h3>

                            {/* Category Filter */}
                            {categories.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        الفئة
                                    </label>
                                    <select
                                        value={filters.category_id || ''}
                                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    >
                                        <option value="">الكل</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Price Range */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    السعر
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="من"
                                        value={filters.min_price || ''}
                                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    />
                                    <input
                                        type="number"
                                        placeholder="إلى"
                                        value={filters.max_price || ''}
                                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Year Range */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    السنة
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="من"
                                        value={filters.min_year || ''}
                                        onChange={(e) => handleFilterChange('min_year', e.target.value)}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    />
                                    <input
                                        type="number"
                                        placeholder="إلى"
                                        value={filters.max_year || ''}
                                        onChange={(e) => handleFilterChange('max_year', e.target.value)}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Condition */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    الحالة
                                </label>
                                <select
                                    value={filters.condition || ''}
                                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                >
                                    <option value="">الكل</option>
                                    <option value="new">جديدة</option>
                                    <option value="used">مستعملة</option>
                                    <option value="certified_pre_owned">مستعملة معتمدة</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setFilters({ listing_type: listingType })}
                                className="w-full py-2 text-sm text-primary hover:underline"
                            >
                                إعادة تعيين الفلاتر
                            </button>
                        </div>
                    </div>

                    {/* Listings Grid/List */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-20">
                                <Car className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    لا توجد سيارات
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    جرب تغيير الفلاتر أو البحث
                                </p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                : 'space-y-4'
                            }>
                                {listings.map(listing => (
                                    <CarListingCard
                                        key={listing.id}
                                        listing={listing}
                                        viewMode={viewMode}
                                        onView={() => window.location.href = `/car-marketplace/${listing.slug}`}
                                        showToast={showToast}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handleFilterChange('page', page)}
                                        className={`px-4 py-2 rounded-lg ${page === pagination.current_page
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Listing Card Component
const CarListingCard: React.FC<{
    listing: CarListing;
    viewMode: 'grid' | 'list';
    showToast: (msg: string, type: any) => void;
}> = ({ listing, viewMode, showToast }) => {
    const navigate = useNavigate();

    // ... helper logic ...

    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent bubbling if nested
        navigate(`/car-listings/${listing.slug}`);
    };
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <div
            onClick={handleView}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${viewMode === 'list' ? 'flex' : ''
                }`}
        >
            {/* Image */}
            <div className={viewMode === 'list' ? 'w-48' : 'aspect-video'}>
                <img
                    src={listing.photos[0] || '/placeholder-car.jpg'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                />
                {listing.is_sponsored && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        مميزة
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                    {listing.title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <span>{listing.year}</span>
                    <span>{listing.mileage.toLocaleString()} كم</span>
                    <span>{listing.transmission}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                        {formatPrice(listing.price)}
                    </span>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Eye className="w-4 h-4" />
                        {listing.views_count}
                    </div>
                </div>

                {listing.seller_type === 'provider' && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {listing.owner?.name || 'معرض'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
