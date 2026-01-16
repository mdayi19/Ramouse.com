
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Technician, TechnicianSpecialty } from '../types';
import EmptyState from './EmptyState';
import Icon from './Icon';
import Skeleton from './Skeleton';
import Rating from './Rating';
import Pagination from './Pagination';
import { DirectoryService } from '../services/directory.service';
import { DEFAULT_TECHNICIAN_SPECIALTIES, SYRIAN_CITIES } from '../constants';
import { BASE_URL } from '../lib/api';
import DirectoryCardSkeleton from './DirectoryCardSkeleton';

interface TechnicianDirectoryProps {
    allTechnicians: Technician[];
    onBack: () => void;
    onViewProfile: (technicianId: string) => void;
    technicianSpecialties: TechnicianSpecialty[];
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    navigationParams?: any;
    onNavigationConsumed?: () => void;
}

const ITEMS_PER_PAGE = 8;

export const TechnicianDirectory: React.FC<TechnicianDirectoryProps> = ({
    allTechnicians: initialTechnicians,
    onBack,
    onViewProfile,
    technicianSpecialties,
    showToast,
    navigationParams,
    onNavigationConsumed
}) => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [cityFilter, setCityFilter] = useState('الكل');
    const [specialtyFilter, setSpecialtyFilter] = useState('الكل');

    useEffect(() => {
        if (navigationParams?.specialty) {
            setSpecialtyFilter(navigationParams.specialty);
            onNavigationConsumed?.();
        }
    }, [navigationParams, onNavigationConsumed]);

    const [searchTerm, setSearchTerm] = useState('');
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [sortBy, setSortBy] = useState<'default' | 'distance' | 'rating'>('default');
    const [isLocating, setIsLocating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const topRef = useRef<HTMLDivElement>(null);

    // Use constant cities list
    const availableCities = ['الكل', ...SYRIAN_CITIES];

    const fetchTechnicians = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                city: cityFilter,
                specialty: specialtyFilter,
                search: searchTerm,
                sort: sortBy
            };

            if (sortBy === 'distance' && userLocation) {
                params.lat = userLocation.latitude;
                params.lng = userLocation.longitude;
            }

            const response = await DirectoryService.getTechnicians(params);
            setTechnicians(response.data);
        } catch (error) {
            console.error("Failed to fetch technicians", error);
            showToast('فشل تحميل قائمة الفنيين', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTechnicians();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [cityFilter, specialtyFilter, searchTerm, sortBy, userLocation]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [cityFilter, specialtyFilter, searchTerm, sortBy]);

    // Scroll to top when page changes
    useEffect(() => {
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const handleFindNearest = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                setSortBy('distance');
                setIsLocating(false);
                showToast('تم ترتيب الفنيين حسب الأقرب لموقعك.', 'success');
                setActiveFilters(false); // Close mobile filter sheet
            },
            (error) => {
                console.error("Geolocation error:", error);
                showToast('لا يمكن الوصول إلى موقعك. يرجى التحقق من أذونات المتصفح.', 'error');
                setIsLocating(false);
            }
        );
    };

    const clearDistanceSort = () => {
        setSortBy('default');
        setUserLocation(null);
    };

    const toggleFilters = () => {
        setActiveFilters(!activeFilters);
    };

    const totalPages = Math.ceil(technicians.length / ITEMS_PER_PAGE);

    const paginatedTechnicians = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return technicians.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [technicians, currentPage]);

    const handleCardTouchStart = (event: React.TouchEvent) => {
        const target = event.currentTarget as HTMLDivElement;
        target.dataset.touchStartY = `${event.targetTouches[0].clientY}`;
        target.dataset.touchStartTime = `${Date.now()}`;
    };

    const handleCardTouchEnd = (event: React.TouchEvent, techId: string) => {
        const target = event.currentTarget as HTMLDivElement;
        const startY = Number(target.dataset.touchStartY);
        const startTime = Number(target.dataset.touchStartTime);
        const endY = event.changedTouches[0].clientY;
        const endTime = Date.now();

        if (Math.abs(endY - startY) < 10 && (endTime - startTime < 300)) {
            onViewProfile(techId);
        }
    };

    const getMediaUrl = (path: string | undefined) => {
        if (!path) return undefined;
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
        if (path.startsWith('db:')) return undefined;

        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        if (cleanPath.startsWith('storage/')) {
            return `${BASE_URL}/${cleanPath}`;
        }
        return `${BASE_URL}/storage/${cleanPath}`;
    };

    const TechnicianCard: React.FC<{ tech: Technician }> = ({ tech }) => {
        const specialtyInfo = technicianSpecialties.find(s => s.name === tech.specialty);
        const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(undefined);
        const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(undefined);

        useEffect(() => {
            let isMounted = true;
            let profileUrlToRevoke: string | undefined;
            let coverUrlToRevoke: string | undefined;

            const resolveMedia = async () => {
                const db = (window as any).db;

                // 1. Resolve Profile Photo
                let resolvedProfile = undefined;
                if (tech.profilePhoto) {
                    if (tech.profilePhoto.startsWith('db:profilePhoto')) {
                        if (db) {
                            try {
                                const media = await db.getMedia('profileMedia', tech.id);
                                if (media?.profilePhoto) {
                                    resolvedProfile = URL.createObjectURL(media.profilePhoto);
                                    profileUrlToRevoke = resolvedProfile;
                                }
                            } catch (e) {
                                console.error("Failed to resolve profile photo", e);
                            }
                        }
                    } else {
                        resolvedProfile = getMediaUrl(tech.profilePhoto);
                    }
                }

                // 2. Resolve Cover Image (Gallery item 0)
                let resolvedCover = undefined;
                if (tech.gallery && tech.gallery.length > 0) {
                    const item = tech.gallery[0];
                    if (item.type === 'image') {
                        if (item.data && item.data.startsWith('db:gallery:')) {
                            if (db) {
                                try {
                                    const index = parseInt(item.data.split(':')[2]);
                                    const media = await db.getMedia('profileMedia', tech.id);
                                    if (media?.gallery && media.gallery[index]) {
                                        resolvedCover = URL.createObjectURL(media.gallery[index]);
                                        coverUrlToRevoke = resolvedCover;
                                    }
                                } catch (e) {
                                    console.error("Failed to resolve cover image", e);
                                }
                            }
                        } else {
                            // Handle API path or legacy url/data
                            const path = (item as any).path || (item as any).url || item.data;
                            resolvedCover = getMediaUrl(path);
                        }
                    }
                }

                if (isMounted) {
                    setProfilePhotoUrl(resolvedProfile);
                    setCoverImageUrl(resolvedCover);
                }
            };

            resolveMedia();

            return () => {
                isMounted = false;
                if (profileUrlToRevoke) URL.revokeObjectURL(profileUrlToRevoke);
                if (coverUrlToRevoke) URL.revokeObjectURL(coverUrlToRevoke);
            };
        }, [tech]);

        return (
            <div
                className="bg-white dark:bg-darkcard rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-200 dark:border-slate-700 flex flex-col cursor-pointer group"
                role="button"
                aria-label={`View profile for ${tech.name}`}
                tabIndex={0}
                onClick={() => onViewProfile(tech.id)}
                onTouchStart={handleCardTouchStart}
                onTouchEnd={(e) => handleCardTouchEnd(e, tech.id)}
                onKeyPress={(e) => e.key === 'Enter' && onViewProfile(tech.id)}
            >
                <div className="h-24 bg-slate-200 dark:bg-slate-800 relative">
                    {coverImageUrl &&
                        <img src={coverImageUrl} alt="Workshop" className="w-full h-full object-cover" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-4 flex flex-col flex-grow relative -mt-12">
                    <div className="flex items-end gap-4">
                        <div className="relative flex-shrink-0">
                            {profilePhotoUrl ? (
                                <img
                                    className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-darkcard"
                                    src={profilePhotoUrl}
                                    alt={tech.name}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                                    }}
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-4 ring-white dark:ring-darkcard">
                                    <Icon name="User" className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                </div>
                            )}
                            {tech.isVerified && (
                                <div className="absolute -bottom-1 -right-1 flex items-center justify-center bg-white dark:bg-darkcard rounded-full shadow-sm" title="فني موثوق">
                                    <span className="text-xl">✅</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 truncate">{tech.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {specialtyInfo?.icon && <Icon name={specialtyInfo.icon as any} className="w-4 h-4 text-primary" />}
                        <span className="font-medium">{tech.specialty}</span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span>{tech.city}</span>
                    </div>

                    {tech.distance !== undefined && (
                        <div className="flex items-center gap-2 mt-2 font-semibold text-sm text-blue-600 dark:text-blue-400">
                            <Icon name="Map" className="w-4 h-4" />
                            <span>يبعد {tech.distance} كم</span>
                        </div>
                    )}

                    {tech.averageRating && tech.averageRating > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <Rating rating={tech.averageRating} size="sm" readOnly />
                            <span className="text-xs text-slate-500 font-bold">{tech.averageRating.toFixed(1)}</span>
                        </div>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 flex-grow h-10 overflow-hidden text-ellipsis line-clamp-2">
                        {tech.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="w-full bg-primary/10 text-primary dark:bg-primary-900/50 dark:text-primary-300 text-center font-black py-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-2">
                            <span>ملف الفني</span>
                            <span className="text-lg">👤</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    };

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

    const FiltersContent = ({ showNearestButton = true }: { showNearestButton?: boolean }) => (
        <>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المدينة</label>
                <select
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-base"
                >
                    {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">التخصص</label>
                <select
                    value={specialtyFilter}
                    onChange={e => setSpecialtyFilter(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-base"
                >
                    <option value="الكل">كل التخصصات</option>
                    {technicianSpecialties.map(spec => <option key={spec.id} value={spec.name}>{spec.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الترتيب</label>
                <select
                    value={sortBy === 'distance' ? 'default' : sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-base"
                >
                    <option value="default">الافتراضي</option>
                    <option value="rating">الأعلى تقييماً</option>
                </select>
            </div>

            {showNearestButton && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <NearestButton />
                </div>
            )}
        </>
    );

    return (
        <div className="p-3 sm:p-6 w-full animate-fade-in min-h-screen bg-slate-50 dark:bg-slate-900" ref={topRef}>
            {/* Mobile Header with Sticky Back Button */}
            <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm pt-3 pb-4 -mx-3 px-3 border-b border-slate-200 dark:border-slate-700 mb-4 md:hidden">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 active:scale-95 transition-all text-xl"
                        aria-label="Back to home"
                    >
                        🔙
                    </button>

                    <div className="flex-1 text-center">
                        <h3 className="text-xl font-black text-primary dark:text-primary-400">👨‍🔧 دليل الفنيين</h3>
                    </div>

                    <button
                        onClick={toggleFilters}
                        className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
                        aria-label="Open filters"
                    >
                        <span className="text-xl">🔍</span>
                    </button>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-4xl font-black text-primary dark:text-primary-400 flex items-center gap-3">
                        <span className="text-5xl">👨‍🔧</span>
                        دليل الفنيين
                    </h3>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">ابحث عن سباك، كهربائي، أو ميكانيكي قريب منك بضغطة زر! 🚀</p>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-base font-bold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span>الرئيسية 🏠</span>
                </button>
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

            {/* Mobile Filters Panel (Bottom Sheet) */}
            {activeFilters && createPortal(
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden" onClick={toggleFilters}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-[2.5rem] p-8 max-h-[85vh] overflow-y-auto animate-modal-in pb-safe"
                        style={{ animationDuration: '0.3s' }}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="filter-panel-title"
                    >
                        <div className="flex items-center justify-center mb-8 relative">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                            <button onClick={toggleFilters} className="absolute top-0 left-0 p-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Close filters">
                                <Icon name="X" className="w-6 h-6" />
                            </button>
                        </div>
                        <h4 id="filter-panel-title" className="text-2xl font-black text-slate-900 dark:text-slate-100 text-center mb-8 flex items-center justify-center gap-2">
                            <span>🔍</span>
                            الفلاتر
                        </h4>
                        <div className="space-y-8"><FiltersContent showNearestButton={false} /></div>
                    </div>
                </div>,
                document.body
            )}

            {/* Desktop Filters and Search Bar */}
            <div className="hidden md:block sticky top-20 z-10 bg-slate-50/80 dark:bg-darkbg/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative md:col-span-2 lg:col-span-2">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🔍</span>
                        <input
                            type="text"
                            placeholder="ابحث بالاسم، التخصص، المدينة..."
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
                </div>
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, idx) => (
                        <DirectoryCardSkeleton key={idx} />
                    ))}
                </div>
            ) : technicians.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {paginatedTechnicians.map(tech => (
                            <TechnicianCard key={tech.id} tech={tech} />
                        ))}
                    </div>
                    {totalPages > 1 && (<div className="mt-8 pb-8 md:pb-0"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>)}
                </>
            ) : (
                <EmptyState
                    icon={<span className="text-6xl mb-4 block">😕</span>}
                    title="لا يوجد فنيون"
                    message={sortBy === 'distance' ? "لم يتم العثور على فنيين في الجوار. جرب توسيع نطاق البحث! 🌍" : "لم يتم العثور على فنيين يطابقون بحثك. حاول تغيير الفلاتر! 🔧"}
                    action={
                        <button
                            onClick={() => {
                                setCityFilter('الكل');
                                setSpecialtyFilter('الكل');
                                setSearchTerm('');
                                clearDistanceSort();
                            }}
                            className="bg-primary text-white px-8 py-4 rounded-2xl font-black mt-6 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                        >
                            <span>🔄</span>
                            مسح جميع الفلاتر
                        </button >
                    }
                />
            )}
        </div >
    );
};

export default TechnicianDirectory;
