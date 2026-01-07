import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, Eye, Heart, TrendingUp, Plus, Wallet,
    ClipboardList, ChevronLeft, ArrowRight
} from 'lucide-react';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';

interface OverviewViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ provider, showToast }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [recentListings, setRecentListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, listingsRes] = await Promise.all([
                CarProviderService.getProviderStats(),
                CarProviderService.getMyListings()
            ]);
            setStats(statsRes.stats);
            // Get first 5 recent listings
            setRecentListings((listingsRes.listings || []).slice(0, 5));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header section with Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">نظرة عامة</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">مرحباً {provider.name}، إليك ملخص نشاطك</p>
                </div>
                <button
                    onClick={() => navigate('/car-provider-dashboard/listings')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة سيارة جديدة</span>
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="إجمالي السيارات"
                    value={stats?.total_listings || 0}
                    icon={Car}
                    color="blue"
                />
                <StatsCard
                    title="إجمالي المشاهدات"
                    value={stats?.total_views || 0}
                    icon={Eye}
                    color="green"
                />
                <StatsCard
                    title="إجمالي الإعجابات"
                    value={stats?.total_favorites || 0}
                    icon={Heart}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (Recent Listings) - Takes up 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Car className="w-5 h-5 text-blue-500" />
                                أحدث السيارات المضافة
                            </h3>
                            <button
                                onClick={() => navigate('/car-provider-dashboard/listings')}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                عرض الكل
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentListings.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400">لا توجد سيارات مضافة حديثاً</p>
                                </div>
                            ) : (
                                recentListings.map(listing => (
                                    <div
                                        key={listing.id}
                                        className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/50"
                                    >
                                        <div className="h-16 w-24 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                                            <img
                                                src={listing.photos?.[0] || '/placeholder-car.jpg'}
                                                alt={listing.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="mr-4 flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span>{listing.year}</span>
                                                <span>•</span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {Number(listing.price).toLocaleString()} ل.س
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${listing.is_hidden
                                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {listing.is_hidden ? 'مخفي' : 'نشط'}
                                            </span>
                                            <span className="flex items-center text-xs text-slate-400 gap-1">
                                                <Eye className="w-3 h-3" />
                                                {listing.views_count}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (Wallet & Actions) - Takes up 1/3 width */}
                <div className="space-y-6">
                    {/* Wallet Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                                    المحفظة
                                </span>
                            </div>

                            <div className="mb-6">
                                <p className="text-blue-100 text-sm mb-1">الرصيد الحالي</p>
                                <h3 className="text-3xl font-bold">
                                    {provider.wallet_balance?.toLocaleString() || 0}
                                    <span className="text-lg font-normal opacity-80 mr-2">ل.س</span>
                                </h3>
                            </div>

                            <button
                                onClick={() => navigate('/car-provider-dashboard/wallet')}
                                className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                شحن المحفظة
                            </button>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-opacity-70">
                            وصول سريع
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/car-provider-dashboard/orders')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg group-hover:scale-110 transition-transform">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">طلباتي</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => navigate('/car-provider-dashboard/store')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">متجري</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsCard: React.FC<{
    title: string;
    value: number;
    icon: any;
    color: 'blue' | 'green' | 'red';
}> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/20'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    {title}
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {value.toLocaleString()}
                </div>
            </div>
            <div className={`p-4 rounded-2xl ${colors[color]}`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
    );
};
