import React, { useState, useEffect } from 'react';
import { Car, Eye, Heart, TrendingUp, Edit, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import Icon from '../Icon';
import { CarProviderService } from '../../services/carprovider.service';
import { CarListingWizard } from './CarListingWizard';
import { View } from '../../types';

import { CarProvider } from '../../types';

interface CarProviderDashboardProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onNavigate: (view: View, params?: any) => void;
    carProvider: CarProvider | null;
    userPhone: string;
}

export const CarProviderDashboard: React.FC<CarProviderDashboardProps> = ({
    showToast,
    onNavigate,
    carProvider,
    userPhone
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'analytics'>('overview');
    const [stats, setStats] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsRes, listingsRes] = await Promise.all([
                CarProviderService.getProviderStats(),
                CarProviderService.getMyListings()
            ]);
            setStats(statsRes.stats);
            setListings(listingsRes.listings || []);
        } catch (error) {
            showToast('فشل تحميل لوحة التحكم', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (listingId: number) => {
        try {
            await CarProviderService.toggleListingVisibility(listingId);
            showToast('تم تحديث حالة الإعلان', 'success');
            loadDashboard();
        } catch (error) {
            showToast('فشل تحديث الإعلان', 'error');
        }
    };

    const handleDeleteListing = async (listingId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان?')) return;

        try {
            await CarProviderService.deleteListing(listingId);
            showToast('تم حذف الإعلان', 'success');
            loadDashboard();
        } catch (error) {
            showToast('فشل حذف الإعلان', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <Car className="w-8 h-8 text-primary" />
                                لوحة تحكم معرض السيارات
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                إدارة سياراتك بسهولة
                            </p>
                        </div>

                        <button
                            onClick={() => setShowWizard(true)}
                            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 font-bold"
                        >
                            <Plus className="w-5 h-5" />
                            إضافة سيارة جديدة
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6">
                        {[
                            { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
                            { id: 'listings', label: 'سياراتي', icon: Car },
                            { id: 'analytics', label: 'التحليلات', icon: Eye }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {activeTab === 'overview' && (
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
                )}

                {activeTab === 'listings' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                            السيارة
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                            السعر
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                            المشاهدات
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                            الحالة
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                            الإجراءات
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {listings.map(listing => (
                                        <tr key={listing.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={listing.photos[0] || '/placeholder-car.jpg'}
                                                        alt={listing.title}
                                                        className="w-16 h-16 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {listing.title}
                                                        </div>
                                                        <div className="text-sm text-slate-500">
                                                            {listing.year} • {listing.mileage} كم
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">
                                                {listing.price.toLocaleString()} ل.س
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {listing.views_count}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${listing.is_hidden
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {listing.is_hidden ? 'مخفي' : 'نشط'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleVisibility(listing.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                        title={listing.is_hidden ? 'إظهار' : 'إخفاء'}
                                                    >
                                                        {listing.is_hidden ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => {/* Edit logic */ }}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                        title="تعديل"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteListing(listing.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            تحليلات متقدمة
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            قريباً: تحليلات تفصيلية للمشاهدات والإعجابات
                        </p>
                    </div>
                )}
            </div>

            {/* Wizard Modal */}
            {showWizard && (
                <CarListingWizard
                    onComplete={() => {
                        setShowWizard(false);
                        loadDashboard();
                    }}
                    onCancel={() => setShowWizard(false)}
                    showToast={showToast}
                    userPhone={userPhone}
                />
            )}
        </div>
    );
};

// Stats Card Component
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {title}
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {value.toLocaleString()}
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${colors[color]}`}>
                    <Icon className="w-8 h-8" />
                </div>
            </div>
        </div>
    );
};
