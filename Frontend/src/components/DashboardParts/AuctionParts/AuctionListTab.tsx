import React, { useState, useEffect } from 'react';
import { Auction } from '../../../types';
import { Button } from '../../ui/Button';
import { Badge, BadgeProps } from '../../ui/Badge';
import Icon from '../../Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionUpdates } from '../../../hooks/useAuctionUpdates';

interface AuctionListTabProps {
    auctions: Auction[];
    loading: boolean;
    auctionFilter: string;
    onFilterChange: (filter: string) => void;
    onRefresh: () => void;
    onStart: (id: string) => void;
    onEnd: (id: string) => void;
    onDelete: (id: string) => void;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onAnnounce?: (id: string, message: string, type: string) => void;
    onExtend?: (id: string, minutes: number) => void;
    onCancel?: (id: string, reason: string) => void;
}

type StatusConfig = {
    variant: BadgeProps['variant'];
    label: string;
    icon: string;
    className?: string; // Additional classes for bg/text if variant isn't enough
};

const auctionStatusMap: Record<string, StatusConfig> = {
    'scheduled': { variant: 'info', label: 'مجدول', icon: 'Calendar' },
    'live': { variant: 'destructive', label: 'مباشر', icon: 'Radio', className: 'animate-pulse' },
    'extended': { variant: 'warning', label: 'ممدد', icon: 'Clock' },
    'paused': { variant: 'secondary', label: 'متوقف', icon: 'Pause', className: 'bg-yellow-500 text-white' },
    'ended': { variant: 'secondary', label: 'انتهى', icon: 'Square' },
    'completed': { variant: 'success', label: 'مكتمل', icon: 'CheckCircle' },
    'cancelled': { variant: 'outline', label: 'ملغي', icon: 'XCircle' },
};

const getAuctionStatusBadge = (status: string) => {
    const config = auctionStatusMap[status] || { variant: 'secondary' as const, label: status, icon: 'HelpCircle' };
    return (
        <Badge variant={config.variant} className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-md bg-opacity-90 ${config.className || ''}`}>
            <Icon name={config.icon as any} className="w-3 h-3" />
            {config.label}
        </Badge>
    );
};

const formatDate = (dateString: string) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

export const AuctionListTab: React.FC<AuctionListTabProps> = ({
    auctions: initialAuctions,
    loading,
    auctionFilter,
    onFilterChange,
    onRefresh,
    onStart,
    onEnd,
    onDelete,
    onPause,
    onResume,
    onAnnounce,
    onExtend,
    onCancel,
}) => {
    const [displayAuctions, setDisplayAuctions] = useState<Auction[]>(initialAuctions);

    // Sync with props when they change (e.g. parent refresh or filter change)
    useEffect(() => {
        setDisplayAuctions(initialAuctions);
    }, [initialAuctions]);

    // Real-time updates
    const auctionIds = React.useMemo(() => displayAuctions.map(a => a.id), [displayAuctions]);

    useAuctionUpdates(auctionIds, (auctionId, updates) => {
        setDisplayAuctions(prev => prev.map(auction =>
            auction.id === auctionId
                ? { ...auction, ...updates }
                : auction
        ));
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Icon name="Filter" className="w-5 h-5" />
                    </div>
                    <span className="font-bold">تصفية النتائج:</span>
                </div>
                <div className="flex gap-3 flex-1">
                    <select
                        value={auctionFilter}
                        onChange={e => onFilterChange(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer outline-none hover:bg-white dark:hover:bg-gray-800"
                    >
                        <option value="">جميع المزادات</option>
                        <option value="active">نشطة (Active)</option>
                        <option value="scheduled">مجدولة (Scheduled)</option>
                        <option value="live">مباشرة (Live)</option>
                        <option value="ended">انتهت (Ended)</option>
                        <option value="completed">مكتملة (Completed)</option>
                    </select>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onRefresh}
                        className="!w-12 !h-12 !rounded-xl"
                        title="تحديث"
                    >
                        <Icon name="RefreshCw" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Results Count */}
            {!loading && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        تم العثور على <span className="font-black text-gray-900 dark:text-white mx-1">{displayAuctions.length}</span> مزاد
                    </div>
                </div>
            )}

            {/* Auctions Grid */}
            <motion.div
                layout
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                <AnimatePresence mode='popLayout'>
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-50">
                            <Icon name="Loader" className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
                        </div>
                    ) : displayAuctions.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-400 bg-white dark:bg-darkcard rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <Icon name="Hammer" className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-xl font-bold text-gray-600 dark:text-gray-300">لا توجد مزادات حالياً</p>
                            <p className="text-sm mt-2 opacity-75">جرب تغيير معايير التصفية أعلاه</p>
                        </div>
                    ) : (
                        displayAuctions.map(auction => (
                            <motion.div
                                layout
                                key={auction.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white dark:bg-darkcard rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                            >
                                {/* Image & Overlay */}
                                <div className="relative h-56 overflow-hidden bg-gray-100">
                                    <img
                                        src={auction.car?.media?.images?.[0] || '/placeholder-car.jpg'}
                                        alt={auction.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-80" />

                                    {/* Floating Badges */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                                        {getAuctionStatusBadge(auction.status)}
                                    </div>

                                    {/* Live Info */}
                                    {auction.status === 'live' && (
                                        <div className="absolute top-4 left-4">
                                            <div className="bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                                                <span className="w-2 h-2 bg-white rounded-full" />
                                                مباشر الآن
                                            </div>
                                        </div>
                                    )}

                                    {/* Winner Badge (for completed auctions) */}
                                    {(auction.status === 'completed' || auction.status === 'ended') && auction.winner_name && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                            <motion.div
                                                initial={{ scale: 0, rotate: -10 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-4 border-white/20"
                                            >
                                                <Icon name="Trophy" className="w-6 h-6" />
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold opacity-90">الفائز</p>
                                                    <p className="font-black text-lg leading-none">{auction.winner_name}</p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Bottom Info (Over Image) */}
                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                        <div className="flex items-center gap-2 mb-1 opacity-90 text-xs font-medium">
                                            <Icon name="Calendar" className="w-3.5 h-3.5" />
                                            <span>
                                                {auction.status === 'scheduled' ? 'يبدأ في:' : 'تاريخ الانتهاء:'} {formatDate(auction.status === 'scheduled' ? auction.scheduled_start : auction.scheduled_end)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-blue-200 transition-colors">
                                            {auction.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-5 flex-1 flex flex-col gap-5">
                                    {/* Winner Info Banner (for completed auctions without image overlay) */}
                                    {(auction.status === 'completed' || auction.status === 'ended') && auction.winner_name && (
                                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Icon name="Trophy" className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400 font-bold uppercase">الفائز بالمزاد</p>
                                                    <p className="font-black text-yellow-900 dark:text-yellow-200 text-sm truncate">{auction.winner_name}</p>
                                                </div>
                                                <Icon name="CheckCircle" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`rounded-2xl p-3 text-center transition-colors ${(auction.status === 'completed' || auction.status === 'ended') && auction.winner_name
                                            ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-300 dark:border-emerald-700'
                                            : 'bg-blue-50 dark:bg-blue-900/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20'
                                            }`}>
                                            <p className={`text-[10px] font-bold uppercase mb-1 ${(auction.status === 'completed' || auction.status === 'ended') && auction.winner_name
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : 'text-blue-600 dark:text-blue-400'
                                                }`}>
                                                {(auction.status === 'completed' || auction.status === 'ended') && auction.winner_name
                                                    ? '💰 سعر البيع النهائي'
                                                    : auction.current_bid ? 'السعر الحالي' : 'سعر البداية'
                                                }
                                            </p>
                                            <motion.p
                                                key={auction.current_bid} // Animation Key
                                                initial={{ scale: 1.1 }}
                                                animate={{ scale: 1 }}
                                                className={`font-black text-xl font-mono tracking-tight ${(auction.status === 'completed' || auction.status === 'ended') && auction.winner_name
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-blue-800 dark:text-blue-300'
                                                    }`}
                                            >
                                                ${(auction.current_bid || auction.starting_bid || 0).toLocaleString()}
                                            </motion.p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 text-center border border-gray-100 dark:border-gray-700">
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">المزايدات</p>
                                            <p className="font-black text-gray-800 dark:text-white text-xl flex items-center justify-center gap-1.5">
                                                <Icon name="Hash" className="w-4 h-4 text-gray-400" />
                                                {auction.bid_count || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-100 dark:border-gray-800 mt-auto" />

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {auction.status === 'scheduled' ? (
                                            <>
                                                <Button
                                                    variant="success"
                                                    onClick={() => onStart(auction.id)}
                                                    className="flex-1 font-bold shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
                                                >
                                                    <Icon name="Play" className="w-4 h-4 ml-1.5 fill-current" />
                                                    بدء المزاد
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const reason = prompt('سبب الإلغاء:');
                                                        if (reason) onCancel?.(auction.id, reason);
                                                    }}
                                                    className="w-11 h-11 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                                    title="إلغاء"
                                                >
                                                    <Icon name="XCircle" className="w-5 h-5" />
                                                </Button>
                                            </>
                                        ) : auction.status === 'paused' ? (
                                            <Button
                                                variant="success"
                                                onClick={() => onResume?.(auction.id)}
                                                className="flex-1 font-bold shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
                                            >
                                                <Icon name="Play" className="w-4 h-4 ml-1.5" />
                                                استئناف
                                            </Button>
                                        ) : (auction.status === 'live' || auction.status === 'extended') ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const msg = prompt('رسالة الإعلان:');
                                                        if (msg) onAnnounce?.(auction.id, msg, 'info');
                                                    }}
                                                    className="w-11 h-11 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                                                    title="إعلان"
                                                >
                                                    <Icon name="Megaphone" className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const mins = prompt('عدد الدقائق للتمديد:', '5');
                                                        if (mins) onExtend?.(auction.id, parseInt(mins));
                                                    }}
                                                    className="w-11 h-11 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl"
                                                    title="تمديد"
                                                >
                                                    <Icon name="Clock" className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const reason = prompt('سبب الإلغاء:');
                                                        if (reason) onCancel?.(auction.id, reason);
                                                    }}
                                                    className="w-11 h-11 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                                    title="إلغاء"
                                                >
                                                    <Icon name="XCircle" className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    variant="warning"
                                                    onClick={() => onPause?.(auction.id)}
                                                    className="flex-1 font-bold"
                                                    title="إيقاف مؤقت"
                                                >
                                                    <Icon name="Pause" className="w-4 h-4 ml-1.5" />
                                                    إيقاف
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => onEnd(auction.id)}
                                                    className="flex-1 font-bold shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                                                >
                                                    <Icon name="Square" className="w-4 h-4 ml-1.5 fill-current" />
                                                    إنهاء
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex-1 py-2.5 text-center text-sm font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-not-allowed">
                                                {auction.status === 'completed' ? 'تم البيع' : 'المزاد مغلق'}
                                            </div>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(auction.id)}
                                            className="w-11 h-11 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                            title="حذف"
                                        >
                                            <Icon name="Trash2" className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AuctionListTab;
