import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, DollarSign, Calendar, Star, Eye, Settings, TrendingUp, History, Save, Zap, Users, Award } from 'lucide-react';
import { adminAPI } from '../../lib/api';

interface CarListing {
    id: number;
    title: string;
    price: number;
    provider_name: string;
    is_sponsored: boolean;
    sponsored_until: string | null;
    views_count: number;
    created_at: string;
}

interface SponsorSettings {
    dailyPrice: number;
    weeklyPrice: number;
    monthlyPrice: number;
    maxDuration: number;
    minDuration: number;
    enabled: boolean;
}

interface RevenueData {
    totalRevenue: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    activeSponsorships: number;
}

interface SponsorshipHistory {
    id: number;
    car_listing_id: number;
    listing_title: string;
    sponsored_by_name: string;
    sponsored_from: string;
    sponsored_until: string;
    price: number;
    duration_days: number;
    status: string;
    is_admin_sponsored: boolean;
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarListingsSponsorView: React.FC<Props> = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState<'listings' | 'settings' | 'analytics' | 'history'>('analytics');
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sponsorDays, setSponsorDays] = useState<{ [key: number]: number }>({});

    // Settings state
    const [settings, setSettings] = useState<SponsorSettings>({
        dailyPrice: 10,
        weeklyPrice: 60,
        monthlyPrice: 200,
        maxDuration: 90,
        minDuration: 1,
        enabled: true
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // Analytics state
    const [revenue, setRevenue] = useState<RevenueData>({
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        activeSponsorships: 0
    });

    // History state
    const [history, setHistory] = useState<SponsorshipHistory[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([
            loadListings(),
            loadSettings(),
            loadRevenue(),
            loadHistory()
        ]);
    };

    const loadListings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/car-listings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setListings(data.data || data);
        } catch (error) {
            showToast('فشل تحميل الإعلانات', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await adminAPI.getSponsorSettings();
            if (response.data.data) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadRevenue = async () => {
        try {
            const response = await adminAPI.getSponsorshipRevenue();
            if (response.data.data) {
                setRevenue(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load revenue:', error);
        }
    };

    const loadHistory = async () => {
        try {
            const response = await adminAPI.getAllSponsorships();
            if (response.data.data) {
                setHistory(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            await adminAPI.updateSponsorSettings(settings);
            showToast('تم حفظ الإعدادات بنجاح', 'success');
        } catch (error) {
            showToast('فشل حفظ الإعدادات', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSponsorListing = async (listingId: number) => {
        const days = sponsorDays[listingId] || 7;
        if (!confirm(`هل تريد رعاية هذا الإعلان لمدة ${days} يوم؟`)) return;

        try {
            await adminAPI.adminSponsorListing(listingId, days);
            showToast('تم رعاية الإعلان بنجاح', 'success');
            loadListings();
            loadRevenue();
            loadHistory();
        } catch (error) {
            showToast('فشل رعاية الإعلان', 'error');
        }
    };

    const filteredListings = listings.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.provider_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeSponsorships = history.filter(h => h.status === 'active');
    const expiredSponsorships = history.filter(h => h.status === 'expired');
    const cancelledSponsorships = history.filter(h => h.status === 'cancelled');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الإعلانات الممولة</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة ومراقبة الإعلانات المرعاة والإيرادات</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 p-2">
                    {[
                        { id: 'analytics', label: 'الإحصائيات', icon: TrendingUp },
                        { id: 'listings', label: 'الإعلانات', icon: Star },
                        { id: 'settings', label: 'الإعدادات', icon: Settings },
                        { id: 'history', label: 'السجل', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-all ${activeTab === tab.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            {/* Revenue Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-blue-100 font-medium">إجمالي الإيرادات</span>
                                        <DollarSign className="w-6 h-6 text-blue-200" />
                                    </div>
                                    <div className="text-4xl font-bold mb-2">{revenue.totalRevenue.toLocaleString()}</div>
                                    <div className="text-blue-100 text-sm">$</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-green-100 font-medium">إيرادات الشهر</span>
                                        <Calendar className="w-6 h-6 text-green-200" />
                                    </div>
                                    <div className="text-4xl font-bold mb-2">{revenue.monthlyRevenue.toLocaleString()}</div>
                                    <div className="text-green-100 text-sm">$</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-purple-100 font-medium">إيرادات الأسبوع</span>
                                        <TrendingUp className="w-6 h-6 text-purple-200" />
                                    </div>
                                    <div className="text-4xl font-bold mb-2">{revenue.weeklyRevenue.toLocaleString()}</div>
                                    <div className="text-purple-100 text-sm">$</div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-orange-100 font-medium">الرعايات النشطة</span>
                                        <Star className="w-6 h-6 text-orange-200 fill-current" />
                                    </div>
                                    <div className="text-4xl font-bold mb-2">{revenue.activeSponsorships}</div>
                                    <div className="text-orange-100 text-sm">إعلان نشط</div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeSponsorships.length}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">رعايات نشطة</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                            <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{expiredSponsorships.length}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">رعايات منتهية</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{cancelledSponsorships.length}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">رعايات ملغاة</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Listings Tab */}
                    {activeTab === 'listings' && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="البحث عن إعلان..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Listings Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإعلان</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المزود</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المشاهدات</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحالة</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {filteredListings.map(listing => (
                                            <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{listing.title}</div>
                                                    <div className="text-sm text-gray-500">{listing.price.toLocaleString()} $</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{listing.provider_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Eye className="w-4 h-4" />
                                                        {listing.views_count}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {listing.is_sponsored ? (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            ممول حتى {new Date(listing.sponsored_until!).toLocaleDateString('ar-SA')}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                            غير ممول
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {!listing.is_sponsored && (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="90"
                                                                value={sponsorDays[listing.id] || 7}
                                                                onChange={(e) => setSponsorDays({ ...sponsorDays, [listing.id]: parseInt(e.target.value) })}
                                                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            />
                                                            <button
                                                                onClick={() => handleSponsorListing(listing.id)}
                                                                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium flex items-center gap-2"
                                                            >
                                                                <Star className="w-4 h-4 fill-current" />
                                                                رعاية
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="max-w-2xl space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 dark:text-blue-300">إعدادات التسعير</h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">حدد أسعار الرعاية للإعلانات</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        السعر اليومي ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.dailyPrice}
                                        onChange={(e) => setSettings({ ...settings, dailyPrice: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        السعر الأسبوعي ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.weeklyPrice}
                                        onChange={(e) => setSettings({ ...settings, weeklyPrice: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        توفير: {Math.round((1 - settings.weeklyPrice / (settings.dailyPrice * 7)) * 100)}%
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        السعر الشهري ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.monthlyPrice}
                                        onChange={(e) => setSettings({ ...settings, monthlyPrice: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        توفير: {Math.round((1 - settings.monthlyPrice / (settings.dailyPrice * 30)) * 100)}%
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الحد الأدنى (أيام)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.minDuration}
                                            onChange={(e) => setSettings({ ...settings, minDuration: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الحد الأقصى (أيام)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.maxDuration}
                                            onChange={(e) => setSettings({ ...settings, maxDuration: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <input
                                        type="checkbox"
                                        checked={settings.enabled}
                                        onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        تفعيل نظام الرعاية
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                            </button>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800 dark:text-green-300">نشط: {activeSponsorships.length}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-300">منتهي: {expiredSponsorships.length}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-red-800 dark:text-red-300">ملغي: {cancelledSponsorships.length}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإعلان</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المزود</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المدة</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المبلغ</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحالة</th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">التاريخ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {history.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{item.listing_title}</div>
                                                    {item.is_admin_sponsored && (
                                                        <span className="text-xs text-blue-600 dark:text-blue-400">رعاية إدارية</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.sponsored_by_name}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.duration_days} يوم</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.price} $</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        item.status === 'expired' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {item.status === 'active' ? 'نشط' : item.status === 'expired' ? 'منتهي' : 'ملغي'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {new Date(item.sponsored_from).toLocaleDateString('ar-SA')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CarListingsSponsorView;
