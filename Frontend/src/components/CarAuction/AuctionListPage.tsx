import React, { useState, useEffect } from 'react';
import { useAuctions } from '../../hooks/useAuction';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useAuctionUpdates, useAuctionListUpdates } from '../../hooks/useAuctionUpdates';
import { useAuctionConnection } from '../../hooks/useAuctionConnection';
import { Auction } from '../../types';
import AuctionCard from './AuctionCard';
import { AuctionCardSkeleton } from './AuctionSkeleton';
import * as auctionService from '../../services/auction.service';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import Icon from '../Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { AuctionConnectionStatus } from './AuctionConnectionStatus';
import { AuctionErrorBoundary } from './AuctionErrorBoundary';
import confetti from 'canvas-confetti';
import { AuctionStatusBadge } from './AuctionStatusBadge';

interface AuctionListPageProps {
    onSelectAuction: (auction: Auction) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

type FilterTab = 'all' | 'upcoming' | 'live' | 'ended' | 'watchlist';
type ViewMode = 'grid' | 'list';

export const AuctionListPage: React.FC<AuctionListPageProps> = ({
    onSelectAuction,
    showToast,
}) => {
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewAuctionBadge, setShowNewAuctionBadge] = useState(false);

    // Advanced Filters State (Placeholder for now)
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);

    // Connection monitoring
    const { isOnline } = useAuctionConnection();

    const statusMap: Record<FilterTab, 'upcoming' | 'live' | 'ended' | undefined> = {
        all: undefined,
        upcoming: 'upcoming',
        live: 'live',
        ended: 'ended',
        watchlist: undefined,
    };

    const { auctions, setAuctions, loading, error, loadMore, hasMore, refresh, setStatus } = useAuctions(activeTab === 'watchlist' ? undefined : statusMap[activeTab]);
    const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();

    // Subscribe to real-time updates
    const auctionIds = React.useMemo(() => auctions.map(a => a.id), [auctions]);

    useAuctionUpdates(auctionIds, (auctionId, updates) => {
        setAuctions(prev => prev.map(auction =>
            auction.id === auctionId
                ? { ...auction, ...updates }
                : auction
        ));
    });

    // Listen for new auctions and status updates (live/ended) on public channel
    useAuctionListUpdates((auctionUpdate: Auction) => {
        setAuctions(prev => {
            // Check if this is an update to an existing auction
            const existingIndex = prev.findIndex(a => a.id === auctionUpdate.id);

            if (existingIndex !== -1) {
                // Update existing auction
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...auctionUpdate };

                // Notify user when auction goes live
                if (auctionUpdate.is_live && !prev[existingIndex].is_live) {
                    showToast?.(`🔴 مزاد مباشر الآن: ${updated[existingIndex].title}`, 'info');
                    confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { y: 0.6 },
                        colors: ['#EF4444', '#F97316', '#FBBF24']
                    });
                }

                return updated;
            }

            // This is a new auction - only add if it passes tab filter
            if (activeTab === 'live' && !['live', 'extended'].includes(auctionUpdate.status)) return prev;
            if (activeTab === 'upcoming' && auctionUpdate.status !== 'scheduled') return prev;
            if (activeTab === 'ended' && !['ended', 'completed'].includes(auctionUpdate.status)) return prev;

            // Notify user about new live auctions
            if (auctionUpdate.is_live) {
                showToast?.(`🔴 مزاد جديد مباشر: ${auctionUpdate.title}`, 'info');
                setShowNewAuctionBadge(true);
                setTimeout(() => setShowNewAuctionBadge(false), 5000);

                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: ['#EF4444', '#F97316', '#FBBF24']
                });
            }

            return [auctionUpdate, ...prev];
        });
    });

    const handleTabChange = (tab: FilterTab) => {
        setActiveTab(tab);
        setStatus(statusMap[tab]);
    };


    const handleRemind = async (auction: Auction) => {
        try {
            await auctionService.setAuctionReminder(auction.id, 30);
            showToast?.('سيتم تذكيرك قبل بدء المزاد بـ 30 دقيقة', 'success');
            refresh();
        } catch (err) {
            showToast?.('حدث خطأ أثناء تعيين التذكير', 'error');
        }
    };

    const handleToggleWatchlist = async (auction: Auction) => {
        const success = await toggleWatchlist(auction.id);
        if (success) {
            const message = isInWatchlist(auction.id)
                ? 'تمت إزالة المزاد من المفضلة'
                : 'تمت إضافة المزاد إلى المفضلة';
            showToast?.(message, 'success');
        } else {
            showToast?.('حدث خطأ أثناء تحديث المفضلة', 'error');
        }
    };

    const safeAuctions = Array.isArray(auctions) ? auctions : [];

    // Filter by watchlist if needed
    const watchlistFiltered = activeTab === 'watchlist'
        ? safeAuctions.filter(a => isInWatchlist(a.id))
        : safeAuctions;

    const filteredAuctions = searchQuery
        ? watchlistFiltered.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.car?.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.car?.model?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : watchlistFiltered;

    const tabs = [
        { id: 'all' as FilterTab, label: 'الكل', icon: 'Grid' },
        { id: 'live' as FilterTab, label: 'مباشر الآن', icon: 'Flame', badge: true },
        { id: 'upcoming' as FilterTab, label: 'قريباً', icon: 'Calendar' },
        { id: 'watchlist' as FilterTab, label: 'المفضلة', icon: 'Heart' },
        { id: 'ended' as FilterTab, label: 'المنتهية', icon: 'CheckCircle' },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <AuctionErrorBoundary>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                {/* Premium Hero Section */}
                <div className="relative overflow-hidden bg-slate-900 pb-24 pt-16 lg:pb-32 lg:pt-24">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 z-0 opacity-20">
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                    </div>

                    {/* Gradient Blobs */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl -translate-y-1/2 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl translate-y-1/4 animate-pulse-slow delay-1000"></div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-2xl"
                        >
                            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-6 drop-shadow-2xl">
                                مزادات السيارات <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">الفاخرة</span>
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-slate-300 mb-10">
                                اكتشف وشارك في مزادات حصرية لأندر السيارات، واستمتع بتجربة شراء فريدة وآمنة.
                            </p>

                            {/* Search Bar - Floating Glass */}
                            <div className="relative max-w-xl mx-auto flex gap-4">
                                <div className="flex-1 relative">
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform skew-y-1 shadow-2xl"></div>
                                    <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-2 flex items-center shadow-inner group focus-within:bg-white/10 transition-colors">
                                        <Icon name="Search" className="ml-4 w-6 h-6 text-slate-400 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="ابحث عن سيارة أحلامك..."
                                            className="w-full bg-transparent border-none text-white placeholder-slate-400 focus:ring-0 text-lg py-2"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                                            >
                                                <Icon name="X" className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`relative px-4 rounded-2xl backdrop-blur-md border border-white/10 transition-all shadow-xl hover:bg-white/20 text-white
                                    ${showFilters ? 'bg-white/20 ring-2 ring-primary/50' : 'bg-white/5'}
                                    `}
                                >
                                    <Icon name="Sliders" className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Connection Status - Top Right */}
                        <div className="absolute top-4 right-4">
                            <AuctionConnectionStatus
                                showDetails={false}
                                position="inline"
                                compact={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content with Negative Margin */}
                <div className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    {/* Glass Tabs & View Toggle */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
                        <div className="overflow-x-auto pb-4 md:pb-0 hide-scrollbar w-full md:w-auto">
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-700 inline-flex gap-1 w-full md:w-auto">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`relative flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center md:justify-start gap-2 ${activeTab === tab.id
                                            ? 'text-white shadow-lg'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 rounded-xl"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {tab.badge && (
                                                <span className="relative flex h-2 w-2">
                                                    {activeTab === tab.id && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTab === tab.id ? 'bg-white' : 'bg-red-500'}`}></span>
                                                </span>
                                            )}
                                            <Icon name={tab.icon as any} className={`w-4 h-4 ${!tab.badge ? 'opacity-90' : ''}`} />
                                            {tab.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/50 dark:border-slate-700 flex gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Icon name="LayoutGrid" className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Icon name="List" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Grid/List */}
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={viewMode === 'grid'
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                    : "space-y-4"
                                }
                            >
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <AuctionCardSkeleton key={i} />
                                ))}
                            </motion.div>
                        ) : filteredAuctions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <Icon name="Search" className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">لا توجد نتائج</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                    {searchQuery ? 'لم نجد أي سيارة تطابق بحثك. جرب كلمات مفتاحية أخرى.' : 'لا توجد مزادات متاحة حالياً.'}
                                </p>
                                {searchQuery && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchQuery('')}
                                        className="mt-6"
                                    >
                                        مسح البحث
                                    </Button>
                                )}
                            </motion.div>
                        ) : (
                            <>
                                <motion.div
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className={viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                        : "space-y-4"
                                    }
                                >
                                    {filteredAuctions.map(auction => (
                                        viewMode === 'grid' ? (
                                            <AuctionCard
                                                key={auction.id}
                                                auction={auction}
                                                onView={onSelectAuction}
                                                onRemind={handleRemind}
                                                onToggleWatchlist={handleToggleWatchlist}
                                                isInWatchlist={isInWatchlist(auction.id)}
                                            />
                                        ) : (
                                            <AuctionListItem
                                                key={auction.id}
                                                auction={auction}
                                                onView={onSelectAuction}
                                                onRemind={handleRemind}
                                                onToggleWatchlist={handleToggleWatchlist}
                                                isInWatchlist={isInWatchlist(auction.id)}
                                            />
                                        )
                                    ))}
                                </motion.div>

                                {hasMore && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-center mt-16"
                                    >
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={loadMore}
                                            isLoading={loading}
                                            className="min-w-[200px] rounded-xl border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <Icon name="ChevronDown" className="w-5 h-5 mr-2" />
                                            عرض المزيد
                                        </Button>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AuctionErrorBoundary>
    );
};

// Internal Subcomponent for List Item
const AuctionListItem: React.FC<{
    auction: Auction;
    onView: (a: Auction) => void;
    onRemind: (a: Auction) => void;
    onToggleWatchlist: (a: Auction) => void;
    isInWatchlist: boolean;
}> = ({ auction, onView, onRemind, onToggleWatchlist, isInWatchlist }) => {
    const isLive = auction.is_live;
    const currentPrice = auction.current_bid || auction.starting_bid;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="group bg-white dark:bg-darkcard rounded-2xl p-4 flex gap-6 items-center border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all"
        >
            {/* Image */}
            <div className="w-48 h-32 rounded-xl overflow-hidden relative shrink-0">
                <img
                    src={auction.car?.media?.images?.[0] || '/placeholder-car.jpg'}
                    alt={auction.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {isLive && (
                    <div className="absolute top-2 right-2 flex gap-1">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                            <Icon name="Flame" className="w-3 h-3" />
                            مباشر
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                            {auction.title}
                        </h3>
                        {auction.car && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {auction.car.year} • {auction.car.brand} {auction.car.model} • {auction.car.mileage?.toLocaleString()} كم
                            </p>
                        )}
                    </div>
                    <AuctionStatusBadge status={auction.status} isLive={isLive} />
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">
                                {isLive ? 'المزايدة الحالية' : 'السعر المبدئي'}
                            </p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                ${currentPrice?.toLocaleString()}
                            </p>
                        </div>
                        {auction.bid_count > 0 && (
                            <div className="hidden sm:block">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">عدد المزايدات</p>
                                <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                    <Icon name="Hammer" className="w-4 h-4 text-slate-400" />
                                    {auction.bid_count}
                                </div>
                            </div>
                        )}
                        {/* Timer would go here if we extracted countdown logic */}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(auction); }}
                                className={`rounded-full ${isInWatchlist ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500'}`}
                            >
                                <Icon name="Heart" className={`w-5 h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
                            </Button>
                        </div>
                        <Button
                            variant={isLive ? 'primary' : 'outline'}
                            onClick={() => onView(auction)}
                            className={`rounded-xl px-6 font-bold ${isLive ? 'shadow-lg shadow-primary/20' : ''}`}
                        >
                            {isLive ? 'زايد الآن' : 'التفاصيل'}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AuctionListPage;
