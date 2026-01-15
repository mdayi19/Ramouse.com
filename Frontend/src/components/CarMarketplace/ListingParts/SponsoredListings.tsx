import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { CarListing } from '../../../services/carprovider.service';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Fuel, Gauge, Settings, Star, TrendingUp } from 'lucide-react';

interface SponsoredListingsProps {
    currentListingId: number;
    t: any;
}

const SponsoredListings: React.FC<SponsoredListingsProps> = ({
    currentListingId,
    t
}) => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSponsored = async () => {
            try {
                // Fetch listings using the main endpoint but filter for sponsored items
                // Ideally this should be a dedicated endpoint like /car-listings/featured or /car-listings?is_sponsored=1
                const params = new URLSearchParams();

                // We'll fetch more than needed to shuffle them, or rely on backend randomization if available
                params.append('limit', '10');
                params.append('sort_by', 'random'); // If backend supports random sort

                const response = await api.get('/car-listings', { params: { per_page: 20 } }); // Fetch a batch

                // Filter specifically for sponsored items and exclude current one
                let sponsored = (response.data.data || [])
                    .filter((item: CarListing) => item.is_sponsored === true && item.id !== currentListingId);

                // If we don't have enough sponsored items from the main feed, we might need a specific endpoint
                // But for now, let's assume the main feed prioritizes sponsored items so they'll be in the first batch

                // Shuffle array to show different ads
                sponsored = sponsored.sort(() => 0.5 - Math.random());

                // Take top 4
                setListings(sponsored.slice(0, 4));
            } catch (err) {
                console.error('Failed to fetch sponsored listings', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsored();
    }, [currentListingId]);

    if (!loading && listings.length === 0) return null;

    const safePrice = (price: number) => {
        try {
            return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
        } catch {
            return `${price} SYP`;
        }
    };

    return (
        <div className="mt-12 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl p-6 border border-yellow-100 dark:border-yellow-900/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-sm">
                    <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        إعلانات مميزة
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        سيارات مختارة بعناية قد تهمك
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
                            <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {listings.map(item => (
                        <div
                            key={item.id}
                            onClick={() => {
                                navigate(`/car-listings/${item.slug}`);
                                window.scrollTo(0, 0);
                            }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-yellow-200 dark:border-yellow-900/50 group transform hover:-translate-y-1"
                        >
                            <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <img
                                    src={item.photos?.[0] || item.images?.[0] || '/placeholder-car.jpg'}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    مميز
                                </div>
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md backdrop-blur-sm font-bold">
                                    {safePrice(item.price)}
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                                    {item.title}
                                </h3>

                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                        <Calendar className="w-3 h-3" />
                                        {item.year}
                                    </span>
                                    <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                        <Gauge className="w-3 h-3" />
                                        {item.mileage.toLocaleString()}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                        <MapPin className="w-3 h-3 ml-1" />
                                        <span className="truncate max-w-[100px]">{item.location || item.city || 'غير محدد'}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                                        التفاصيل
                                        <TrendingUp className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SponsoredListings;
