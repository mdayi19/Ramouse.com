import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon';
import { Auction } from '../../types';
import { getMyAuctions, getWatchlist } from '../../services/auction.service';
import AuctionCard from '../CarAuction/AuctionCard';
import { useNavigate } from 'react-router-dom';

interface UserAuctionsViewProps {
    userPhone: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type TabType = 'registered' | 'watchlist';

export const UserAuctionsView: React.FC<UserAuctionsViewProps> = ({ userPhone, showToast }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('registered');
    const [loading, setLoading] = useState(false);

    // Data states
    const [registeredAuctions, setRegisteredAuctions] = useState<any[]>([]);
    const [watchlistAuctions, setWatchlistAuctions] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [registeredRes, watchlistRes] = await Promise.all([
                getMyAuctions({ per_page: 50 }),
                getWatchlist()
            ]);

            // registeredRes is paginated (data field or filtering logic needed depending on backend response format)
            // check if registeredRes.data exists (pagination)
            const regData = registeredRes.data || registeredRes;
            setRegisteredAuctions(regData);

            setWatchlistAuctions(watchlistRes);

        } catch (error) {
            console.error(error);
            showToast('فشل تحميل البيانات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderList = (items: any[], type: 'registered' | 'watchlist') => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            );
        }

        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Icon name={type === 'registered' ? 'Gavel' : 'Heart'} className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                        {type === 'registered' ? 'لم تشارك في أي مزاد بعد' : 'قائمة المفضلة فارغة'}
                    </p>
                    <button
                        onClick={() => navigate('/auctions')} // Assuming /auctions is public list
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                    >
                        تصفح المزادات
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item: any, index: number) => {
                    // Item wraps auction. structure: item.auction
                    const auction = item.auction;
                    if (!auction) return null;

                    return (
                        <motion.div
                            key={auction.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AuctionCard
                                auction={auction}
                                onView={() => navigate(`/auctions/${auction.id}`)}
                            />
                            {type === 'registered' && (
                                <div className="mt-2 text-xs text-center text-slate-500 bg-slate-100 dark:bg-slate-800 py-1 rounded-lg">
                                    تاريخ التسجيل: {new Date(item.created_at).toLocaleDateString('ar-SA')}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">مزاداتي</h1>
                    <p className="text-slate-500 dark:text-slate-400">إدارة المزادات والمفضلة</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('registered')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'registered'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    المزادات المسجلة
                </button>
                <button
                    onClick={() => setActiveTab('watchlist')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'watchlist'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    المفضلة
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'registered' ? renderList(registeredAuctions, 'registered') : renderList(watchlistAuctions, 'watchlist')}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
