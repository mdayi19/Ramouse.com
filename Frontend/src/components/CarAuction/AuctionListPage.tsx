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
import Icon from '../Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { AuctionConnectionStatus } from './AuctionConnectionStatus';
import { AuctionErrorBoundary } from './AuctionErrorBoundary';
import confetti from 'canvas-confetti';

interface AuctionListPageProps {
    onSelectAuction: (auction: Auction) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

type FilterTab = 'all' | 'upcoming' | 'live' | 'ended' | 'watchlist';

export const AuctionListPage: React.FC<AuctionListPageProps> = ({
    onSelectAuction,
    showToast,
}) => {
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewAuctionBadge, setShowNewAuctionBadge] = useState(false);

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

    // Listen for new auctions
    useAuctionListUpdates((newAuction: Auction) => {
        setAuctions(prev => {
            // Prevent duplicates
            if (prev.find(a => a.id === newAuction.id)) return prev;

            // Filter based on active tab
            if (activeTab === 'live' && !['live', 'extended'].includes(newAuction.status)) return prev;
            if (activeTab === 'upcoming' && newAuction.status !== 'scheduled') return prev;
            if (activeTab === 'ended' && !['ended', 'completed'].includes(newAuction.status)) return prev;

            // Notify user about new live auctions
            if (newAuction.is_live) {
                showToast?.(`🔴 مزاد جديد مباشر: ${newAuction.title}`, 'info');
                setShowNewAuctionBadge(true);
                setTimeout(() => setShowNewAuctionBadge(false), 5000);

                // Confetti for new live auction
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: ['#EF4444', '#F97316', '#FBBF24']
                });
            }

            return [newAuction, ...prev];
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
                <div className="relative overflow-hidden bg-slate-900 pb-20 pt-16 lg:pb-28 lg:pt-24">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 z-0 opacity-20">
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                    </div>

                    {/* Gradient Blobs */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl translate-y-1/4"></div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-2xl"
                        >
                            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-6">
                                مزادات السيارات <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">الفاخرة</span>
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-slate-300 mb-10">
                                اكتشف وشارك في مزادات حصرية لأندر السيارات، واستمتع بتجربة شراء فريدة وآمنة.
                            </p>

                            {/* Search Bar - Floating Glass */}
                            <div className="relative max-w-xl mx-auto">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform skew-y-1 shadow-2xl"></div>
                                <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-2 flex items-center shadow-inner">
                                    <Icon name="Search" className="ml-4 w-6 h-6 text-slate-400" />
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
                    {/* Glass Tabs */}
                    <div className="flex justify-center mb-10 overflow-x-auto pb-4 hide-scrollbar">
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-700 inline-flex gap-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
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

                    {/* Content Grid */}
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                                    {searchQuery ? 'لم نجد أي سيارة تطابق بحثك. جرب كلمات مفتاحية أخرى.' : 'لا توجد مزادات متاحة في هذا القسم حالياً.'}
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
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                >
                                    {filteredAuctions.map(auction => (
                                        <AuctionCard
                                            key={auction.id}
                                            auction={auction}
                                            onView={onSelectAuction}
                                            onRemind={handleRemind}
                                            onToggleWatchlist={handleToggleWatchlist}
                                            isInWatchlist={isInWatchlist(auction.id)}
                                        />
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

export default AuctionListPage;
