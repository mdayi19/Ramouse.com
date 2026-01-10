import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, Shield, Star, Eye, Trash2 } from 'lucide-react';
import { AdminService } from '../../services/admin.service';

interface CarProvider {
    id: string;
    phone: string;
    business_name: string;
    business_type: string;
    city: string;
    is_verified: boolean;
    is_active: boolean;
    is_trusted: boolean;
    total_listings: number;
    created_at: string;
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarProvidersView: React.FC<Props> = ({ showToast }) => {
    const [providers, setProviders] = useState<CarProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/car-providers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setProviders(data.data || data.data?.data || data);
        } catch (error) {
            showToast('Failed to load providers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleVerification = async (providerId: string, currentStatus: boolean) => {
        try {
            await AdminService.verifyCarProvider(providerId, !currentStatus);
            showToast('Provider verification updated', 'success');
            loadProviders();
        } catch (error) {
            showToast('Failed to update verification', 'error');
        }
    };

    const toggleTrustedStatus = async (providerId: string, currentStatus: boolean) => {
        try {
            await AdminService.toggleTrustedCarProvider(providerId, !currentStatus);
            showToast('Trusted status updated', 'success');
            loadProviders();
        } catch (error) {
            showToast('Failed to update trusted status', 'error');
        }
    };

    const filteredProviders = Array.isArray(providers) ? providers.filter(p =>
        (p.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone || '').includes(searchQuery) ||
        (p.city || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Car Providers</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage car provider accounts</p>
                </div>
                <button
                    onClick={loadProviders}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, phone, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600">{providers.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Providers</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600">
                        {providers.filter(p => p.is_verified).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-600">
                        {providers.filter(p => p.is_trusted).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trusted</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-orange-600">
                        {providers.filter(p => !p.is_verified).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Provider
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Listings
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredProviders.map((provider) => (
                                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {provider.business_name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {provider.phone || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                                            {provider.business_type || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {provider.city || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {provider.total_listings || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {provider.is_verified && (
                                                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            )}
                                            {provider.is_trusted && (
                                                <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                    <Star className="w-3 h-3" />
                                                    Trusted
                                                </span>
                                            )}
                                            {!provider.is_active && (
                                                <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                                    <XCircle className="w-3 h-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleVerification(provider.id, provider.is_verified)}
                                                className={`p-2 rounded-lg transition-colors ${provider.is_verified
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                title="Toggle Verification"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleTrustedStatus(provider.id, provider.is_trusted)}
                                                className={`p-2 rounded-lg transition-colors ${provider.is_trusted
                                                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                title="Toggle Trusted"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProviders.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No providers found
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarProvidersView;
