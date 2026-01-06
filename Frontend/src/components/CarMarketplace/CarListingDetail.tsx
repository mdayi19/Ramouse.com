import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Car, MapPin, Calendar, Gauge, Fuel, Settings, Phone,
    Mail, Heart, Share2, ChevronLeft, ChevronRight, X,
    CheckCircle, Star, Eye, MessageCircle, ExternalLink
} from 'lucide-react';
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing } from '../../services/carprovider.service';

const CarListingDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [listing, setListing] = useState<CarListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);

    // Gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);

    useEffect(() => {
        loadListing();
    }, [slug]);

    const loadListing = async () => {
        if (!slug) return;

        try {
            setLoading(true);
            const data = await CarProviderService.getListingBySlug(slug);
            setListing(data);

            // Track view event
            if (data.id) {
                await CarProviderService.trackAnalytics(data.id, 'view');
            }

            // Check if favorited
            const favoriteStatus = await CarProviderService.checkFavorite(data.id);
            setIsFavorited(favoriteStatus);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load listing');
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteToggle = async () => {
        if (!listing) return;

        try {
            await CarProviderService.toggleFavorite(listing.id);
            setIsFavorited(!isFavorited);
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    const handleContact = async (type: 'phone' | 'email' | 'whatsapp') => {
        if (!listing) return;

        // Track contact event
        await CarProviderService.trackAnalytics(listing.id, 'contact_click');

        if (type === 'phone' && listing.provider?.phone) {
            window.location.href = `tel:${listing.provider.phone}`;
        } else if (type === 'email' && listing.provider?.email) {
            window.location.href = `mailto:${listing.provider.email}`;
        } else if (type === 'whatsapp' && listing.provider?.phone) {
            window.open(`https://wa.me/${listing.provider.phone.replace(/[^0-9]/g, '')}`, '_blank');
        }
    };

    const handleShare = async () => {
        if (!listing) return;

        await CarProviderService.trackAnalytics(listing.id, 'share');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.title,
                    text: listing.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const nextImage = () => {
        if (!listing?.images) return;
        setSelectedImageIndex((prev) => (prev + 1) % listing.images.length);
    };

    const prevImage = () => {
        if (!listing?.images) return;
        setSelectedImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading listing...</p>
                </div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Listing Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This listing may have been removed.'}</p>
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

    const images = listing.images && listing.images.length > 0
        ? listing.images
        : ['/placeholder-car.jpg'];

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                                <img
                                    src={images[selectedImageIndex]}
                                    alt={listing.title}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setShowGalleryModal(true)}
                                />

                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {listing.is_sponsored && (
                                        <span className="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">
                                            Sponsored
                                        </span>
                                    )}
                                    {listing.is_featured && (
                                        <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                                            Featured
                                        </span>
                                    )}
                                    {listing.listing_type === 'rent' && (
                                        <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                                            For Rent
                                        </span>
                                    )}
                                </div>

                                {/* Image Counter */}
                                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                                    {selectedImageIndex + 1} / {images.length}
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                                }`}
                                        >
                                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title & Price */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        {listing.title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        {listing.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {listing.location}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            {listing.views_count || 0} views
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(listing.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={handleFavoriteToggle}
                                        className={`p-3 rounded-lg transition-colors ${isFavorited
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                    ${listing.price.toLocaleString()}
                                </span>
                                {listing.listing_type === 'rent' && (
                                    <span className="text-gray-600 dark:text-gray-400">/ day</span>
                                )}
                            </div>

                            {listing.condition && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-900 dark:text-white font-medium capitalize">
                                        {listing.condition} Condition
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Specifications */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Specifications</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Year</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{listing.year}</p>
                                    </div>
                                </div>

                                {listing.mileage && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <Gauge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Mileage</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {listing.mileage.toLocaleString()} km
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {listing.brand && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <Car className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Brand</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{listing.brand.name}</p>
                                        </div>
                                    </div>
                                )}

                                {listing.category && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                            <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{listing.category.name_en}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                {listing.description}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Provider Card */}
                        {listing.provider && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                                        {listing.provider.business_name?.charAt(0) || 'P'}
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                        {listing.provider.business_name}
                                    </h3>
                                    {listing.provider.is_verified && (
                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-4 h-4" />
                                            Verified Provider
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleContact('phone')}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Call Now
                                    </button>

                                    <button
                                        onClick={() => handleContact('whatsapp')}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        WhatsApp
                                    </button>

                                    {listing.seller_type === 'provider' && (
                                        <button
                                            onClick={() => navigate(`/car-providers/${listing.provider?.id}`)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                            View Profile
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                                        Report inappropriate listing
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowGalleryModal(false)}
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="relative max-w-6xl w-full">
                        <img
                            src={images[selectedImageIndex]}
                            alt={listing.title}
                            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full">
                            {selectedImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarListingDetail;
