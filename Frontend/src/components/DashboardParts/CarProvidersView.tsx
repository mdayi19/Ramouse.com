import React, { useState, useEffect } from 'react';
import {
    Search, RefreshCw, CheckCircle, XCircle, Shield, Star,
    Eye, Trash2, MapPin, Globe, Facebook, Instagram,
    Phone, Mail, Image as ImageIcon, ExternalLink, X
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';

interface CarProvider {
    id: string; // phone
    phone: string;
    business_name: string;
    business_type: string;
    city: string;
    address: string;
    business_license?: string;
    description?: string;

    // Status
    is_verified: boolean;
    is_active: boolean;
    is_trusted: boolean;

    // Stats
    total_listings: number;
    created_at: string;
    wallet_balance: number;

    // Media & Location
    profile_photo?: string;
    gallery?: string[];
    socials?: {
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
        website?: string;
    };
    latitude?: number;
    longitude?: number;

    // Relations
    user?: {
        email?: string;
    };
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarProvidersView: React.FC<Props> = ({ showToast }) => {
    const [providers, setProviders] = useState<CarProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedProvider, setSelectedProvider] = useState<CarProvider | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'location'>('info');

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

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        try {
            await action();
            showToast(successMsg, 'success');
            loadProviders();
            // Update selected provider logic if needed, but reloading list is safer
            if (selectedProvider) {
                // Ideally verified/updated provider needs to be re-fetched or we close modal. 
                // For simplicity, we close modal or just let list reload.
                // let's keep modal open but update local state if possible or just close it?
                // Closing modal is safest to avoid stale state.
                setSelectedProvider(null);
            }
        } catch (error) {
            showToast('Action failed', 'error');
        }
    };

    const toggleVerification = (provider: CarProvider) => {
        handleAction(
            () => AdminService.verifyCarProvider(provider.id, !provider.is_verified),
            provider.is_verified ? 'Provider unverified' : 'Provider verified'
        );
    };

    const toggleTrustedStratus = (provider: CarProvider) => {
        handleAction(
            () => AdminService.toggleTrustedCarProvider(provider.id, !provider.is_trusted),
            !provider.is_trusted ? 'Provider marked as trusted' : 'Provider removed from trusted'
        );
    };

    const toggleActiveStatus = (provider: CarProvider) => {
        handleAction(
            () => AdminService.updateCarProviderStatus(provider.id, !provider.is_active),
            !provider.is_active ? 'Provider activated' : 'Provider deactivated'
        );
    };

    const handleDelete = (provider: CarProvider) => {
        if (!window.confirm('Are you sure you want to delete this provider? This action cannot be undone.')) return;
        handleAction(
            () => AdminService.deleteCarProvider(provider.id),
            'Provider deleted successfully'
        );
    };

    const filteredProviders = Array.isArray(providers) ? providers.filter(p =>
        (p.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone || '').includes(searchQuery) ||
        (p.city || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    // --- Render Helpers ---

    const StatusBadge = ({ active, label, color }: { active: boolean, label: string, color: string }) => {
        if (!active) return null;
        const colorClasses = {
            green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses]}`}>
                {label}
            </span>
        );
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Car Providers</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage car provider accounts and verifications</p>
                </div>
                <button
                    onClick={loadProviders}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors self-start sm:self-auto"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{providers.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Providers</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{providers.filter(p => p.is_active).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-2xl font-bold text-orange-500">{providers.filter(p => !p.is_verified).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending Verification</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{providers.filter(p => p.is_trusted).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Trusted</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Business</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stats</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredProviders.map((provider) => (
                                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {provider.profile_photo ? (
                                                <img src={provider.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                                    <span className="text-lg font-bold">{provider.business_name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{provider.business_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{provider.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white">{provider.business_type}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{provider.city}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            <StatusBadge active={provider.is_active} label="Active" color="green" />
                                            <StatusBadge active={!provider.is_active} label="Inactive" color="red" />
                                            <StatusBadge active={provider.is_verified} label="Verified" color="blue" />
                                            <StatusBadge active={provider.is_trusted} label="Trusted" color="purple" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white font-medium">{provider.total_listings} Listings</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Registered {new Date(provider.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedProvider(provider)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(provider)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Provider"
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
                {filteredProviders.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No providers found matching your search.
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedProvider && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {selectedProvider.business_name}
                                    {selectedProvider.is_trusted && <Shield className="w-5 h-5 text-purple-600 fill-purple-600" />}
                                    {selectedProvider.is_verified && <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-600 text-white" />}
                                </h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                    <span>{selectedProvider.business_type}</span>
                                    <span>•</span>
                                    <span>{selectedProvider.city}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedProvider(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                            {(['info', 'media', 'location'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">

                            {/* INFO TAB */}
                            {activeTab === 'info' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">Contact Info</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                    <span dir="ltr">{selectedProvider.phone}</span>
                                                </div>
                                                {selectedProvider.user?.email && (
                                                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                        <Mail className="w-5 h-5 text-gray-400" />
                                                        <span>{selectedProvider.user.email}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                    <MapPin className="w-5 h-5 text-gray-400" />
                                                    <span>{selectedProvider.address}, {selectedProvider.city}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">Socials</h4>
                                            <div className="space-y-3">
                                                {selectedProvider.socials?.facebook && (
                                                    <a href={selectedProvider.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline">
                                                        <Facebook className="w-5 h-5" />
                                                        <span>Facebook</span>
                                                    </a>
                                                )}
                                                {selectedProvider.socials?.instagram && (
                                                    <a href={selectedProvider.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-pink-600 hover:underline">
                                                        <Instagram className="w-5 h-5" />
                                                        <span>Instagram</span>
                                                    </a>
                                                )}
                                                {selectedProvider.socials?.website && (
                                                    <a href={selectedProvider.socials.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:underline">
                                                        <Globe className="w-5 h-5" />
                                                        <span>Website</span>
                                                    </a>
                                                )}
                                                {!selectedProvider.socials?.facebook && !selectedProvider.socials?.instagram && !selectedProvider.socials?.website && (
                                                    <p className="text-gray-400 italic">No social links provided.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedProvider.description && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About</h4>
                                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedProvider.description}</p>
                                        </div>
                                    )}

                                    {selectedProvider.business_license && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Business License</h4>
                                            <p className="text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 inline-block">
                                                {selectedProvider.business_license}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MEDIA TAB */}
                            {activeTab === 'media' && (
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5" /> Profile Photo
                                        </h4>
                                        {selectedProvider.profile_photo ? (
                                            <div className="w-32 h-32 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                                                <img src={selectedProvider.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic">No profile photo uploaded.</p>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5" /> Gallery
                                        </h4>
                                        {selectedProvider.gallery && selectedProvider.gallery.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {selectedProvider.gallery.map((img, idx) => (
                                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                                                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic">No gallery images uploaded.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* LOCATION TAB */}
                            {activeTab === 'location' && (
                                <div className="space-y-4">
                                    {selectedProvider.latitude && selectedProvider.longitude ? (
                                        <div className="space-y-4">
                                            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Coordinates</p>
                                                    <p className="text-sm text-gray-500 font-mono mt-1">
                                                        {selectedProvider.latitude}, {selectedProvider.longitude}
                                                    </p>
                                                </div>
                                                <a
                                                    href={`https://www.google.com/maps?q=${selectedProvider.latitude},${selectedProvider.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    Open in Google Maps
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                                                Map Preview (Integration requires API Key)
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                            <p>No location coordinates provided.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-wrap gap-3 justify-end sticky bottom-0">

                            <button
                                onClick={() => toggleVerification(selectedProvider)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedProvider.is_verified
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {selectedProvider.is_verified ? 'Revoke Verification' : 'Verify Provider'}
                            </button>

                            <button
                                onClick={() => toggleTrustedStratus(selectedProvider)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedProvider.is_trusted
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                {selectedProvider.is_trusted ? 'Remove Trusted' : 'Mark Trusted'}
                            </button>

                            <button
                                onClick={() => toggleActiveStatus(selectedProvider)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedProvider.is_active
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                    }`}
                            >
                                {selectedProvider.is_active ? (
                                    <>
                                        <XCircle className="w-4 h-4" /> Deactivate
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" /> Activate
                                    </>
                                )}
                            </button>

                            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"></div>

                            <button
                                onClick={() => handleDelete(selectedProvider)}
                                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarProvidersView;
