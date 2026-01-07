import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { CarListing } from '../../../services/carprovider.service';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Fuel, Gauge, Settings } from 'lucide-react';

interface SimilarListingsProps {
    currentListingId: number;
    categoryId?: number;
    brandId?: number | string;
    t: any;
}

const SimilarListings: React.FC<SimilarListingsProps> = ({
    currentListingId,
    categoryId,
    brandId,
    t
}) => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                // Construct query params
                const params = new URLSearchParams();
                if (categoryId) params.append('category_id', categoryId.toString());
                // limit to 4 similar items
                params.append('limit', '4');

                // You might need to add a specialized endpoint or just interpret this filtering on the main endpoint
                // For now, assuming standard listing endpoint supports filtering
                const response = await api.get(`/car-marketplace?${params.toString()}`);

                // Filter out current listing and take top 4
                const similar = (response.data.data || [])
                    .filter((item: CarListing) => item.id !== currentListingId)
                    .slice(0, 4);

                setListings(similar);
            } catch (err) {
                console.error('Failed to fetch similar listings', err);
            } finally {
                setLoading(false);
            }
        };

        if (categoryId) {
            fetchSimilar();
        } else {
            setLoading(false);
        }
    }, [currentListingId, categoryId]);

    if (!loading && listings.length === 0) return null;

    const safePrice = (price: number) => {
        try {
            return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
        } catch {
            return `${price} SYP`;
        }
    };

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                سيارات مشابهة قد تعجبك
            </h2>

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
                                navigate(`/car-marketplace/${item.slug}`);
                                window.scrollTo(0, 0);
                            }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700 group"
                        >
                            <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <img
                                    src={item.photos?.[0] || item.images?.[0] || '/placeholder-car.jpg'}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
                                    {safePrice(item.price)}
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
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
                                    <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                        <Settings className="w-3 h-3" />
                                        {item.transmission}
                                    </span>
                                </div>

                                <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                    <MapPin className="w-3 h-3 ml-1" />
                                    {item.location || 'غير محدد'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SimilarListings;
