import React, { useState, useEffect, useCallback } from 'react';
import { Auction, AuctionCar, AuctionStats } from '../../types';
import * as auctionService from '../../services/auction.service';
import AuctionCarModal from '../CarAuction/AuctionCarModal';
import AuctionScheduleModal from '../CarAuction/AuctionScheduleModal';
import { ViewHeader } from './Shared';
import { AuctionOverviewTab, AuctionCarsTab, AuctionListTab } from './AuctionParts';
import { useAdminDashboardUpdates } from '../../hooks/useAuctionUpdates';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import Icon from '../Icon';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'overview' | 'cars' | 'auctions' | 'pending';

interface AuctionManagementViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AuctionManagementView: React.FC<AuctionManagementViewProps> = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [stats, setStats] = useState<AuctionStats | null>(null);
    const [cars, setCars] = useState<AuctionCar[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [carFilter, setCarFilter] = useState<string>('');
    const [auctionFilter, setAuctionFilter] = useState<string>('active');

    // Modal states
    const [showCarModal, setShowCarModal] = useState(false);
    const [showAuctionModal, setShowAuctionModal] = useState(false);
    const [selectedCar, setSelectedCar] = useState<AuctionCar | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

    // Fetch data
    const fetchStats = useCallback(async () => {
        try {
            const data = await auctionService.getAuctionStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    const fetchCars = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const status = activeTab === 'pending' ? 'pending_approval' : (carFilter || undefined);
            const response = await auctionService.getAuctionCars({ status });
            setCars(response.data || []);
        } catch (err) {
            showToast('فشل تحميل السيارات', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [carFilter, activeTab, showToast]);

    const fetchAuctions = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await auctionService.getAdminAuctions({ status: auctionFilter || undefined });
            setAuctions(response.data || []);
        } catch (err) {
            showToast('فشل تحميل المزادات', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [auctionFilter, showToast]);

    useEffect(() => {
        fetchStats();
        if (activeTab === 'cars' || activeTab === 'pending') fetchCars();
        if (activeTab === 'auctions') fetchAuctions();
    }, [activeTab, carFilter, auctionFilter, fetchStats, fetchCars, fetchAuctions]);

    // Real-time updates
    useAdminDashboardUpdates({
        onStatsUpdate: (newStats: AuctionStats) => {
            setStats(newStats);
        },
        onCarUpdate: () => {
            if (activeTab === 'cars' || activeTab === 'pending') {
                fetchCars(true);
            }
            // Always refresh stats as they might depend on cars
            fetchStats();
        },
        onAuctionCreated: () => {
            if (activeTab === 'auctions') {
                fetchAuctions(true);
            }
            fetchStats();
        },
        onAuctionUpdate: (auctionUpdate) => {
            // Update existing auction in the list
            setAuctions(prev => prev.map(auction =>
                auction.id === auctionUpdate.id
                    ? { ...auction, ...auctionUpdate }
                    : auction
            ));
            // Refresh stats on status changes
            if (auctionUpdate.status) {
                fetchStats();
            }
        },
    });

    // Actions
    const handleStartAuction = async (id: string) => {
        try {
            await auctionService.startAuction(id);
            showToast('تم بدء المزاد بنجاح', 'success');
            fetchAuctions();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل بدء المزاد', 'error');
        }
    };

    const handleEndAuction = async (id: string) => {
        if (!confirm('هل أنت متأكد من إنهاء هذا المزاد؟')) return;
        try {
            await auctionService.endAuction(id);
            showToast('تم إنهاء المزاد بنجاح', 'success');
            fetchAuctions();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل إنهاء المزاد', 'error');
        }
    };

    const handlePauseAuction = async (id: string) => {
        const reason = prompt('سبب الإيقاف (اختياري):');
        try {
            await auctionService.pauseAuction(id, reason || undefined);
            showToast('تم إيقاف المزاد مؤقتاً', 'success');
            fetchAuctions();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل إيقاف المزاد', 'error');
        }
    };

    const handleResumeAuction = async (id: string) => {
        const additionalMinutes = prompt('دقائق إضافية (اختياري):');
        try {
            await auctionService.resumeAuction(id, additionalMinutes ? parseInt(additionalMinutes) : undefined);
            showToast('تم استئناف المزاد', 'success');
            fetchAuctions();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل استئناف المزاد', 'error');
        }
    };

    const handleAnnounceAuction = async (id: string, message: string, type: string) => {
        try {
            await auctionService.announceAuction(id, message, type as any);
            showToast('تم إرسال الإعلان', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل إرسال الإعلان', 'error');
        }
    };

    const handleExtendAuction = async (id: string, minutes: number) => {
        try {
            await auctionService.extendAuction(id, minutes);
            showToast(`تم تمديد المزاد ${minutes} دقيقة`, 'success');
            fetchAuctions();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل تمديد المزاد', 'error');
        }
    };

    const handleCancelAuction = async (id: string, reason: string) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا المزاد؟')) return;
        try {
            await auctionService.cancelAuction(id, reason);
            showToast('تم إلغاء المزاد', 'success');
            fetchAuctions();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل إلغاء المزاد', 'error');
        }
    };

    const handleApproveCar = async (id: string) => {
        try {
            await auctionService.approveAuctionCar(id);
            showToast('تمت الموافقة على السيارة', 'success');
            fetchCars();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل الموافقة', 'error');
        }
    };

    const handleRejectCar = async (id: string) => {
        const reason = prompt('سبب الرفض:');
        if (!reason) return;
        try {
            await auctionService.rejectAuctionCar(id, reason);
            showToast('تم رفض السيارة', 'success');
            fetchCars();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل الرفض', 'error');
        }
    };

    const handleDeleteCar = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه السيارة؟')) return;
        try {
            await auctionService.deleteAuctionCar(id);
            showToast('تم حذف السيارة', 'success');
            fetchCars();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل الحذف', 'error');
        }
    };

    const handleDeleteAuction = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المزاد؟')) return;
        try {
            await auctionService.deleteAuction(id);
            showToast('تم حذف المزاد', 'success');
            fetchAuctions();
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل الحذف', 'error');
        }
    };

    const handleEditCar = (car: AuctionCar) => {
        setSelectedCar(car);
        setShowCarModal(true);
    };

    const handleScheduleCar = (car: AuctionCar) => {
        setSelectedCar(car);
        setShowAuctionModal(true);
    };

    const tabs = [
        { id: 'overview' as TabType, label: 'نظرة عامة', icon: 'TrendingUp' },
        { id: 'cars' as TabType, label: 'السيارات', icon: 'Car' },
        { id: 'auctions' as TabType, label: 'المزادات', icon: 'Hammer' },
        { id: 'pending' as TabType, label: 'بانتظار الموافقة', icon: 'Clock', badge: stats?.pending_approval },
    ];

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <ViewHeader
                title="إدارة المزادات"
                subtitle="لوحة التحكم الخاصة بإدارة السيارات والمزادات المباشرة"
                actions={
                    <Button
                        variant="primary"
                        onClick={() => { setSelectedCar(null); setShowCarModal(true); }}
                        className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        <Icon name="Plus" className="w-5 h-5 ml-2" />
                        <span className="font-bold">إضافة سيارة</span>
                    </Button>
                }
            />

            {/* Custom Tabs */}
            <div className="bg-white dark:bg-darkcard rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-800 inline-flex gap-1 relative z-0">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold transition-all duration-300 outline-none
                                ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon name={tab.icon as any} className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className={`
                                    min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center text-[10px] rounded-full
                                    ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-red-500 text-white'
                                    }
                                `}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'overview' && (
                            <AuctionOverviewTab stats={stats} />
                        )}

                        {(activeTab === 'cars' || activeTab === 'pending') && (
                            <AuctionCarsTab
                                cars={cars}
                                loading={loading}
                                carFilter={activeTab === 'pending' ? 'pending_approval' : carFilter}
                                onFilterChange={setCarFilter}
                                onRefresh={fetchCars}
                                onEdit={handleEditCar}
                                onSchedule={handleScheduleCar}
                                onApprove={handleApproveCar}
                                onReject={handleRejectCar}
                                onDelete={handleDeleteCar}
                            />
                        )}

                        {activeTab === 'auctions' && (
                            <AuctionListTab
                                auctions={auctions}
                                loading={loading}
                                auctionFilter={auctionFilter}
                                onFilterChange={setAuctionFilter}
                                onRefresh={fetchAuctions}
                                onStart={handleStartAuction}
                                onEnd={handleEndAuction}
                                onDelete={handleDeleteAuction}
                                onPause={handlePauseAuction}
                                onResume={handleResumeAuction}
                                onAnnounce={handleAnnounceAuction}
                                onExtend={handleExtendAuction}
                                onCancel={handleCancelAuction}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modals */}
            {showCarModal && (
                <AuctionCarModal
                    isOpen={showCarModal}
                    onClose={() => { setShowCarModal(false); setSelectedCar(null); }}
                    onSuccess={() => { fetchCars(); fetchStats(); }}
                    initialData={selectedCar}
                    showToast={showToast}
                />
            )}

            {showAuctionModal && (
                <AuctionScheduleModal
                    isOpen={showAuctionModal}
                    onClose={() => { setShowAuctionModal(false); setSelectedCar(null); setSelectedAuction(null); }}
                    onSuccess={() => { fetchAuctions(); fetchStats(); }}
                    car={selectedCar || undefined}
                    initialData={selectedAuction}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default AuctionManagementView;
