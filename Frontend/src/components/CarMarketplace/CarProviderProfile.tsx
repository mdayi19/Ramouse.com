import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Phone, Mail, Star, Car, CheckCircle, Award,
    Clock, Eye, Heart, ChevronLeft, ChevronRight, MessageCircle, Shield
} from 'lucide-react';
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing } from '../../services/carprovider.service';

interface ProviderProfile {
    id: number;
    phone: string;
    business_name: string;
    business_name_ar?: string;
    address?: string;
    city?: string;
    description?: string;
    is_verified: boolean;
    is_trusted: boolean;
    trust_score: number;
    total_listings: number;
    active_listings: number;
    total_views: number;
    member_since: string;
    logo_url?: string;
    cover_photo?: string;
    working_hours?: string;
    email?: string;
    website?: string;
}

const CarProviderProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [provider, setProvider] = useState<ProviderProfile | null>(null);
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'listings' | 'about'>('listings');

    useEffect(() => {
        loadProviderData();
    }, [id]);

    const loadProviderData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [providerData, listingsData] = await Promise.all([
                CarProviderService.getPublicProfile(parseInt(id)),
                CarProviderService.getProviderListings(parseInt(id))
            ]);

            setProvider(providerData);
            setListings(listingsData.data || listingsData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load provider profile');
        } finally {
            setLoading(false);
        }
    };

    const handleContact = (type: 'phone' | 'email' | 'whatsapp') => {
        if (!provider) return;

        if (type === 'phone' && provider.phone) {
            window.location.href = `tel:${provider.phone}`;
        } else if (type === 'email' && provider.email) {
            window.location.href = `mailto:${provider.email}`;
        } else if (type === 'whatsapp' && provider.phone) {
            window.open(`https://wa.me/${provider.phone.replace(/[^0-9]/g, '')}`, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading provider...</p>
                </div>
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Provider Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This provider may not exist.'}</p>
                    <button
                        onClick={() => navigate('/car-marketplace')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back
                    </button>
                </div>
            </div>

            {/* Cover Photo */}
            <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
                {provider.cover_photo ? (
                    <img
                        src={provider.cover_photo}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Car className="w-24 h-24 text-white/30" />
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Provider Info Card */}
                <div className="relative -mt-16 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                                    {provider.logo_url ? (
                                        <img
                                            src={provider.logo_url}
                                            alt={provider.business_name}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    ) : (
                                        provider.business_name.charAt(0)
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap mb-2">
                                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                                {provider.business_name}
                                            </h1>
                                            {provider.is_verified && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Verified
                                                </span>
                                            )}
                                            {provider.is_trusted && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm font-medium">
                                                    <Award className="w-4 h-4" />
                                                    Trusted
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            {provider.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {provider.city}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                Member since {new Date(provider.member_since).getFullYear()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Car className="w-4 h-4" />
                                                {provider.active_listings} Active Listings
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {provider.total_views.toLocaleString()} Total Views
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contact Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleContact('phone')}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call
                                        </button>
                                        <button
                                            onClick={() => handleContact('whatsapp')}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {provider.total_listings}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Listings</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {provider.active_listings}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Active Now</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {provider.total_views.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {provider.trust_score}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Trust Score</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="flex gap-4 px-6">
                            <button
                                onClick={() => setActiveTab('listings')}
                                className={`py-4 px-4 border-b-2 font-medium transition-colors ${activeTab === 'listings'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Listings ({listings.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`py-4 px-4 border-b-2 font-medium transition-colors ${activeTab === 'about'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                About
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Listings Tab */}
                        {activeTab === 'listings' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.length === 0 ? (
                                    <div className="col-span-full text-center py-12">
                                        <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">No active listings</p>
                                    </div>
                                ) : (
                                    listings.map((listing) => (
                                        <div
                                            key={listing.id}
                                            onClick={() => navigate(`/car-listings/${listing.slug}`)}
                                            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
                                        >
                                            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                                                <img
                                                    src={(listing.photos && listing.photos.length > 0)
                                                        ? listing.photos[0]
                                                        : (listing.images && listing.images.length > 0)
                                                            ? listing.images[0]
                                                            : '/placeholder-car.jpg'}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {listing.is_sponsored && (
                                                    <span className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded">
                                                        Sponsored
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                                    {listing.title}
                                                </h3>
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        ${listing.price.toLocaleString()}
                                                    </span>
                                                    {listing.listing_type === 'rent' && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">/ day</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                                    <span>{listing.year}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        {listing.views_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* About Tab */}
                        {activeTab === 'about' && (
                            <div className="space-y-6">
                                {provider.description && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                            About Us
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                            {provider.description}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                        Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        {provider.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                                <a
                                                    href={`tel:${provider.phone}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {provider.phone}
                                                </a>
                                            </div>
                                        )}
                                        {provider.email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                                <a
                                                    href={`mailto:${provider.email}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {provider.email}
                                                </a>
                                            </div>
                                        )}
                                        {provider.address && (
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {provider.address}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {provider.working_hours && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                            Working Hours
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">{provider.working_hours}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarProviderProfile;
