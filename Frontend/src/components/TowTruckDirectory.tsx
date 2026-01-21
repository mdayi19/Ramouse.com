
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TowTruck } from '../types';
import { DEFAULT_TOW_TRUCK_TYPES, SYRIAN_CITIES } from '../constants';
import { DirectoryService } from '../services/directory.service';
import { getImageUrl } from '../utils/helpers';
import EmptyState from './EmptyState';
import Icon from './Icon';
import Rating from './Rating';
import Pagination from './Pagination';
import DirectoryCardSkeleton from './DirectoryCardSkeleton';
import SEO from './SEO';

interface TowTruckDirectoryProps {
    onBack: () => void;
    onViewProfile: (towTruckId: string) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

const ITEMS_PER_PAGE = 8;

const TowTruckCard: React.FC<{ truck: TowTruck; distance: number | null, onViewProfile: (id: string) => void; }> = ({ truck, distance, onViewProfile }) => {
    return (
        <div
            className="bg-white dark:bg-darkcard rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-primary/30 flex flex-col cursor-pointer group"
            role="button"
            aria-label={`View profile for ${truck.name}`}
            tabIndex={0}
            onClick={() => onViewProfile(truck.id)}
            onKeyPress={(e) => e.key === 'Enter' && onViewProfile(truck.id)}
        >
            <div className="h-24 bg-slate-200 dark:bg-slate-800 relative">
                {(truck.gallery?.[0]?.data || truck.gallery?.[0]?.path) &&
                    <img src={getImageUrl(truck.gallery[0].data || (truck.gallery[0].path ? (truck.gallery[0].path.startsWith('storage') ? truck.gallery[0].path : `storage/${truck.gallery[0].path}`) : '') || '')} alt="Tow Truck" className="w-full h-full object-cover" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                {distance !== null && (
                    <div className="absolute top-2 left-2 bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg border-2 border-white dark:border-slate-800">
                        <span>📍</span>
                        {distance.toFixed(1)} كم
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow relative -mt-12">
                <div className="flex items-end gap-4">
                    <div className="relative flex-shrink-0">
                        {truck.profilePhoto ? (
                            <img
                                className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-darkcard shadow-md"
                                src={getImageUrl(truck.profilePhoto.startsWith('storage') || truck.profilePhoto.startsWith('/storage') || truck.profilePhoto.startsWith('http') || truck.profilePhoto.startsWith('data') ? truck.profilePhoto : `storage/${truck.profilePhoto}`)}
                                alt={truck.name}
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-4 ring-white dark:ring-darkcard shadow-md">
                                <Icon name="User" className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                            </div>
                        )}
                        {truck.isVerified && (
                            <div className="absolute -bottom-1 -right-1 flex items-center justify-center bg-white dark:bg-darkcard rounded-full shadow-sm" title="خدمة موثوقة">
                                <span className="text-lg">✅</span>
                            </div>
                        )}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 truncate">{truck.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <Icon name="Truck" className="w-4 h-4 text-primary" />
                    <span className="font-medium">{truck.vehicleType}</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{truck.city}</span>
                </div>
                {truck.averageRating && (
                    <div className="flex items-center gap-2 mt-2">
                        <Rating rating={truck.averageRating} size="sm" readOnly />
                        <span className="text-xs text-slate-500 font-bold">{truck.averageRating.toFixed(1)}</span>
                    </div>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 flex-grow h-10 overflow-hidden text-ellipsis line-clamp-2">
                    {truck.description}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="w-full bg-primary/10 text-primary dark:bg-primary-900/50 dark:text-primary-300 text-center font-black py-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-2">
                        <span>تفاصيل ونش</span>
                        <span className="text-lg">🏗️</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const TowTruckDirectory: React.FC<TowTruckDirectoryProps> = ({
    onBack,
    onViewProfile,
    showToast
}) => {
    // State for API data
    const [allTowTrucks, setAllTowTrucks] = useState<TowTruck[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Filter and UI states
    const [cityFilter, setCityFilter] = useState('الكل');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('الكل');
    const [searchTerm, setSearchTerm] = useState('');
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [sortBy, setSortBy] = useState<'default' | 'distance'>('default');
    const [isLocating, setIsLocating] = useState(false);
    const [distances, setDistances] = useState<Map<string, number>>(new Map());
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(false);

    const topRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch tow trucks from API on mount
    useEffect(() => {
        const fetchTowTrucks = async () => {
            try {
                setIsLoadingData(true);
                const response = await DirectoryService.getTowTrucks();
                setAllTowTrucks(response.data || []);
            } catch (error) {
                console.error('Failed to fetch tow trucks:', error);
                showToast('فشل تحميل السطحات. يرجى المحاولة مرة أخرى.', 'error');
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchTowTrucks();
    }, [showToast]);

    // Use constant cities list
    const availableCities = ['الكل', ...SYRIAN_CITIES];

    const handleFindNearest = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { latitude, longitude };
                setUserLocation(newLocation);

                const newDistances = new Map<string, number>();
                allTowTrucks.forEach(truck => {
                    if (truck.location) {
                        const dist = getDistance(newLocation.latitude, newLocation.longitude, truck.location.latitude, truck.location.longitude);
                        newDistances.set(truck.id, dist);
                    }
                });
                setDistances(newDistances);
                setSortBy('distance');
                setIsLocating(false);
                showToast('تم ترتيب السطحات حسب الأقرب لموقعك.', 'success');
                setActiveFilters(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                let errorMessage = 'لا يمكن الوصول إلى موقعك. يرجى التحقق من أذونات المتصفح.';
                showToast(errorMessage, 'error');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    const clearDistanceSort = () => {
        setSortBy('default');
        setUserLocation(null);
        setDistances(new Map());
        showToast('تم إلغاء الترتيب حسب القرب.', 'info');
    };

    const toggleFilters = () => setActiveFilters(!activeFilters);

    const filteredAndSortedTowTrucks = useMemo(() => {
        let trucks = allTowTrucks.filter(truck => {
            const isVisible = truck.isVerified && truck.isActive;
            const cityMatch = cityFilter === 'الكل' || truck.city === cityFilter;
            const vehicleTypeMatch = vehicleTypeFilter === 'الكل' || truck.vehicleType === vehicleTypeFilter;
            const searchTermLower = searchTerm.trim().toLowerCase();
            const searchMatch = searchTermLower === '' ||
                truck.name.toLowerCase().includes(searchTermLower) ||
                truck.vehicleType.toLowerCase().includes(searchTermLower) ||
                truck.city.toLowerCase().includes(searchTermLower) ||
                (truck.serviceArea && truck.serviceArea.toLowerCase().includes(searchTermLower)) ||

                (truck.description && truck.description.toLowerCase().includes(searchTermLower));

            return isVisible && cityMatch && vehicleTypeMatch && searchMatch;
        });

        if (sortBy === 'distance' && userLocation) {
            trucks = trucks.filter(t => t.location);
            trucks.sort((a, b) => {
                const distA = distances.get(a.id) ?? Infinity;
                const distB = distances.get(b.id) ?? Infinity;
                return distA - distB;
            });
        } else {
            trucks.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }

        return trucks;
    }, [allTowTrucks, cityFilter, vehicleTypeFilter, searchTerm, sortBy, userLocation, distances]);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [cityFilter, vehicleTypeFilter, searchTerm, sortBy]);

    // Scroll to top on page change
    useEffect(() => {
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const totalPages = Math.ceil(filteredAndSortedTowTrucks.length / ITEMS_PER_PAGE);

    const paginatedTowTrucks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedTowTrucks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedTowTrucks, currentPage]);

    const NearestButton: React.FC = () => (
        <>
            {sortBy === 'distance' ? (
                <button
                    onClick={clearDistanceSort}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 rounded-2xl text-base font-black shadow-md active:scale-95 transition-transform"
                >
                    <span className="text-xl">✖️</span>
                    <span>إلغاء الترتيب</span>
                </button>
            ) : (
                <button
                    onClick={handleFindNearest}
                    disabled={isLocating}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl text-base font-black shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-50"
                >
                    {isLocating ? (
                        <Icon name="Loader" className="animate-spin w-6 h-6" />
                    ) : (
                        <span className="text-2xl animate-pulse">📍</span>
                    )}
                    <span>الترتيب حسب الأقرب</span>
                </button>
            )}
        </>
    );

    const FiltersContent = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المدينة</label>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-base">
                    {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع المركبة</label>
                <select value={vehicleTypeFilter} onChange={e => setVehicleTypeFilter(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-base">
                    <option value="الكل">كل الأنواع</option>
                    {DEFAULT_TOW_TRUCK_TYPES.map(spec => <option key={spec.id} value={spec.name}>{spec.name}</option>)}
                </select>
            </div>
        </>
    );

    const areFiltersActive = cityFilter !== 'الكل' || vehicleTypeFilter !== 'الكل';

    // Show loading state with skeleton
    if (isLoadingData) {
        return (
            <div className="p-3 sm:p-6 w-full animate-fade-in min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm pt-3 pb-4 -mx-3 px-3 border-b border-slate-200 dark:border-slate-700 mb-4 md:hidden">
                    <div className="flex items-center justify-between">
                        <button onClick={onBack} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 active:scale-95"><Icon name="ArrowRight" className="w-5 h-5" /></button>
                        <h3 className="text-xl font-bold text-primary dark:text-primary-400">دليل السطحات</h3>
                        <div className="w-12"></div>
                    </div>
                </div>

                <div className="hidden md:flex justify-between items-center mb-8">
                    <div><h1 className="text-3xl font-bold text-primary dark:text-primary-400">دليل السطحات</h1><p className="text-md text-slate-500 dark:text-slate-400 mt-1">ابحث عن سطحة (ونش) في منطقتك وتواصل معها مباشرة.</p></div>
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><span>العودة</span><Icon name="ArrowLeft" /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, idx) => (
                        <DirectoryCardSkeleton key={idx} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 w-full animate-fade-in min-h-screen bg-slate-50 dark:bg-slate-900" ref={topRef}>
            {/* SEO Metadata */}
            <SEO
                title={`دليل السطحات - ${allTowTrucks.length > 0 ? allTowTrucks.length + ' ونش متاح' : 'أقرب ونش'} | راموسة`}
                description="خدمات سحب وإنقاذ السيارات على مدار 24 ساعة في سوريا. اعثر على أقرب سطحة أو ونش لموقعك الحالي بسرعة."
                canonical="/tow-trucks"
            />

            <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm pt-3 pb-4 -mx-3 px-3 border-b border-slate-200 dark:border-slate-700 mb-4 md:hidden">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 active:scale-95 transition-all text-xl"><span className="text-xl">🔙</span></button>
                    <h3 className="text-xl font-black text-primary dark:text-primary-400">🚚 دليل السطحات</h3>
                    <button onClick={toggleFilters} className="relative flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 active:scale-95 transition-all">
                        <span className="text-xl">🔍</span>
                        {areFiltersActive && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-primary ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>}
                    </button>
                </div>
            </div>

            <div className="hidden md:flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black text-primary dark:text-primary-400 flex items-center gap-3">
                        <span className="text-5xl">🚚</span>
                        دليل السطحات
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">ابحث عن سطحة (ونش) في منطقتك وتواصل معها مباشرة.</p>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-base font-bold p-4 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span>العودة 🏠</span></button>
            </div>

            {/* Mobile Controls - Sticky */}
            <div className="sticky top-20 z-20 md:hidden mb-4 space-y-3">
                <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🔍</span>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="ابحث..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pr-12 pl-4 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary text-base font-bold"
                        style={{ fontSize: '16px' }} // Prevents zoom on iOS
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <Icon name="XCircle" className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <NearestButton />
            </div>

            {/* Desktop Filters and Search Bar */}
            <div className="hidden md:block sticky top-20 z-10 bg-slate-50/80 dark:bg-darkbg/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative md:col-span-2 lg:col-span-2">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🔍</span>
                        <input
                            type="text"
                            placeholder="ابحث بالاسم، النوع، المدينة..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pr-12 pl-10 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <Icon name="XCircle" className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <FiltersContent />
                    <div className="flex items-center gap-2">
                        <div className="w-full">
                            <NearestButton />
                        </div>
                    </div>
                </div>
            </div>

            {sortBy === 'distance' && (
                <div className="mb-6 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-6 py-3 rounded-2xl text-base font-bold shadow-sm">
                    <span className="text-xl mr-2">📍</span>
                    <span>يتم عرض السطحات الأقرب إليك</span>
                    <button onClick={clearDistanceSort} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 mr-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-1 transition-colors">
                        <Icon name="X" className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-6 px-2">
                <div className="text-sm font-black text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="text-xl">🚚</span>
                    <span className="font-extrabold text-lg">{filteredAndSortedTowTrucks.length}</span> سطحات متاحة
                </div>
            </div>

            {filteredAndSortedTowTrucks.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {paginatedTowTrucks.map(truck => <TowTruckCard key={truck.id} truck={truck} distance={distances.get(truck.id) ?? null} onViewProfile={onViewProfile} />)}
                    </div>
                    {totalPages > 1 && (<div className="mt-8 pb-8 md:pb-0"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSortedTowTrucks.length} itemsPerPage={ITEMS_PER_PAGE} /></div>)}
                </>
            ) : (
                <EmptyState
                    icon={<span className="text-6xl mb-4 block">🚚💨</span>}
                    title="لا يوجد نتائج"
                    message="لم يتم العثور على سطحات تطابق معايير البحث الحالية."
                    action={
                        <button
                            onClick={() => { setCityFilter('الكل'); setVehicleTypeFilter('الكل'); setSearchTerm(''); clearDistanceSort(); }}
                            className="bg-primary text-white px-8 py-4 rounded-2xl font-black mt-6 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                        >
                            <span>🔄</span>
                            مسح جميع الفلاتر
                        </button>
                    }
                />
            )}

            {activeFilters && createPortal(
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden" onClick={toggleFilters}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-[2.5rem] p-8 pb-safe animate-modal-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center mb-8 relative">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                            <button onClick={toggleFilters} className="absolute top-0 left-0 p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Icon name="X" className="w-6 h-6" /></button>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 text-center mb-8 flex items-center justify-center gap-2">
                            <span>🔍</span>
                            الفلاتر
                        </h4>
                        <div className="space-y-6"><FiltersContent /></div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
