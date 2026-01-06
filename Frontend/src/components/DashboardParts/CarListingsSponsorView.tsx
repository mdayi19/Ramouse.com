import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, DollarSign, Calendar, Star, Eye } from 'lucide-react';

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

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarListingsSponsorView: React.FC<Props> = ({ showToast }) => {
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sponsorDays, setSponsorDays] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/car-listings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
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

    const sponsorListing = async (listingId: number) => {
        const days = sponsorDays[listingId] || 7;
        try {
            await fetch(`/api/admin/car-listings/${listingId}/sponsor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ days })
            });
            showToast(`Listing sponsored for ${days} days`, 'success');
            loadListings();
        } catch (error) {
            showToast('Failed to sponsor listing', 'error');
        }
    };

    const unsponsorListing = async (listingId: number) => {
        try {
            await fetch(`/api/admin/car-listings/${listingId}/sponsor`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            showToast('Sponsorship removed', 'success');
            loadListings();
        } catch (error) {
            showToast('Failed to remove sponsorship', 'error');
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsored Listings</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage featured car listings</p>
                </div>
                <button
                    onClick={loadListings}
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
                    placeholder="Search by title or provider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600">{listings.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Listings</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-600">{sponsoredListings.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sponsored</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600">
                        {listings.length - sponsoredListings.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Regular</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Listing
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Provider
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Views
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
                            {filteredListings.map((listing) => (
                                <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {listing.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {listing.provider_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        ${listing.price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                            <Eye className="w-4 h-4" />
                                            {listing.views_count}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {listing.is_sponsored ? (
                                            <div className="space-y-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded text-xs font-medium">
                                                    <Star className="w-3 h-3" />
                                                    Sponsored
                                                </span>
                                                {listing.sponsored_until && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Until {new Date(listing.sponsored_until).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Regular</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {listing.is_sponsored ? (
                                            <button
                                                onClick={() => unsponsorListing(listing.id)}
                                                className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="90"
                                                    value={sponsorDays[listing.id] || 7}
                                                    onChange={(e) => setSponsorDays({
                                                        ...sponsorDays,
                                                        [listing.id]: parseInt(e.target.value)
                                                    })}
                                                    className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                                                    placeholder="Days"
                                                />
                                                <button
                                                    onClick={() => sponsorListing(listing.id)}
                                                    className="px-3 py-1 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded text-sm font-medium transition-colors"
                                                >
                                                    Sponsor
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredListings.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No listings found
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarListingsSponsorView;
