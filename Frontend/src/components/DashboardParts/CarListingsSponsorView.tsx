import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, DollarSign, Calendar, Star, Eye, Settings, TrendingUp, History, Save } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'listings' | 'settings' | 'analytics' | 'history'>('listings');
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
        loadListings();
        loadSettings();
        loadRevenue();
        loadHistory();
    }, []);

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
            showToast('Failed to load listings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/admin/sponsor/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            if (data.settings) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadRevenue = async () => {
        try {
            const response = await fetch('/api/admin/sponsor/revenue', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setRevenue(data);
        } catch (error) {
            console.error('Failed to load revenue:', error);
        }
    };

    const loadHistory = async () => {
        try {
            const response = await fetch('/api/admin/sponsor/sponsorships', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setHistory(data.data || []);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            await fetch('/api/admin/sponsor/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            showToast('Settings saved successfully', 'success');
        } catch (error) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const sponsorListing = async (listingId: number) => {
        const duration_days = sponsorDays[listingId] || 7;
        try {
            await fetch(`/api/admin/car-listings/${listingId}/sponsor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ duration_days })
            });
            showToast(`Listing sponsored for ${duration_days} days (FREE)`, 'success');
            loadListings();
            loadRevenue();
        } catch (error) {
            showToast('Failed to sponsor listing', 'error');
        }
    };

    const filteredListings = listings.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.provider_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sponsoredListings = listings.filter(l => l.is_sponsored);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sponsor Management</h2>
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'listings', label: 'Listings', icon: Star },
                        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                        { id: 'settings', label: 'Settings', icon: Settings },
                        { id: 'history', label: 'History', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-100 text-sm">Total Revenue</span>
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className="text-3xl font-bold">{revenue.totalRevenue.toLocaleString()} ر.س</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-100 text-sm">Monthly Revenue</span>
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="text-3xl font-bold">{revenue.monthlyRevenue.toLocaleString()} ر.س</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-100 text-sm">Weekly Revenue</span>
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="text-3xl font-bold">{revenue.weeklyRevenue.toLocaleString()} ر.س</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-orange-100 text-sm">Active Sponsorships</span>
                            <Star className="w-5 h-5" />
                        </div>
                        <div className="text-3xl font-bold">{revenue.activeSponsorships}</div>
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Daily Price (ر.س)</label>
                            <input
                                type="number"
                                value={settings.dailyPrice}
                                onChange={(e) => setSettings({ ...settings, dailyPrice: Number(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Weekly Price (ر.س)</label>
                            <input
                                type="number"
                                value={settings.weeklyPrice}
                                onChange={(e) => setSettings({ ...settings, weeklyPrice: Number(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Monthly Price (ر.س)</label>
                            <input
                                type="number"
                                value={settings.monthlyPrice}
                                onChange={(e) => setSettings({ ...settings, monthlyPrice: Number(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Duration (days)</label>
                            <input
                                type="number"
                                value={settings.maxDuration}
                                onChange={(e) => setSettings({ ...settings, maxDuration: Number(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            className="w-5 h-5"
                        />
                        <label className="text-sm font-medium">Enable Sponsorships</label>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={savingSettings}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {history.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm">{item.listing_title}</td>
                                    <td className="px-6 py-4 text-sm">{item.sponsored_by_name}</td>
                                    <td className="px-6 py-4 text-sm">{item.duration_days} days</td>
                                    <td className="px-6 py-4 text-sm font-medium">{item.price} ر.س</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-800' :
                                                item.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.is_admin_sponsored && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Admin
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Star className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Listings</p>
                                    <p className="text-2xl font-bold">{listings.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Star className="w-6 h-6 text-green-600 fill-current" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Sponsored</p>
                                    <p className="text-2xl font-bold">{sponsoredListings.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <Eye className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                                    <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.views_count, 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search listings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                        </div>
                        <button
                            onClick={loadListings}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Listings Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredListings.map(listing => (
                                    <tr key={listing.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{listing.title}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{listing.provider_name}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{listing.price.toLocaleString()} ر.س</td>
                                        <td className="px-6 py-4 text-sm">{listing.views_count}</td>
                                        <td className="px-6 py-4">
                                            {listing.is_sponsored ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        Sponsored
                                                    </span>
                                                    {listing.sponsored_until && (
                                                        <span className="text-xs text-gray-500">
                                                            Until {new Date(listing.sponsored_until).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Not Sponsored
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!listing.is_sponsored && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="365"
                                                        value={sponsorDays[listing.id] || 7}
                                                        onChange={(e) => setSponsorDays({ ...sponsorDays, [listing.id]: Number(e.target.value) })}
                                                        className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm"
                                                        placeholder="Days"
                                                    />
                                                    <button
                                                        onClick={() => sponsorListing(listing.id)}
                                                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-medium"
                                                    >
                                                        Sponsor (FREE)
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default CarListingsSponsorView;
