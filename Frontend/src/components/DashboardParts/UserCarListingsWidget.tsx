import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Icon from '../Icon';
import { getStorageUrl } from '../../config/api';
import { CarProviderService } from '../../services/carprovider.service';

interface UserCarListingsWidgetProps {
    userId: string;
    userRole: 'customer' | 'technician' | 'tow_truck';
    onNavigate?: (view: any) => void;
}

const UserCarListingsWidget: React.FC<UserCarListingsWidgetProps> = ({ userId, userRole, onNavigate }) => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Determine API prefix based on user role
    const apiPrefix = userRole === 'customer'
        ? '/customer'
        : userRole === 'technician'
            ? '/technician'
            : '/tow-truck';

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await CarProviderService.getUserListings(apiPrefix, {});
                const userListings = Array.isArray(response.listings) ? response.listings : [];

                // Sort by created_at descending
                userListings.sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                });

                setListings(userListings.slice(0, 3)); // Show latest 3
            } catch (error) {
                console.error('Error loading user car listings:', error);
                setListings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [apiPrefix]);

    const handleNavigateToListings = () => {
        if (onNavigate) {
            onNavigate('myCarListings');
        }
    };

    if (loading) {
        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-xl">🚙</span>
                        </div>
                        إعلانات سياراتي
                    </h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 h-28 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-xl">🚙</span>
                        </div>
                        إعلانات سياراتي
                    </h3>
                    <button
                        onClick={handleNavigateToListings}
                        className="text-sm font-bold text-primary hover:text-primary-700 transition-colors flex items-center gap-1 group"
                    >
                        <span>+ إضافة إعلان</span>
                        <Icon name="ArrowLeft" className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center group hover:border-primary transition-all cursor-pointer" onClick={handleNavigateToListings}>
                    {/* Decorative gradient orb */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-sky-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                            <span className="text-5xl">🚗</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2">لا توجد إعلانات بعد</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-4 max-w-xs mx-auto">
                            أضف إعلان سيارتك للبيع أو الإيجار واحصل على أفضل العروض
                        </p>
                        <div className="inline-flex items-center gap-2 bg-primary hover:bg-primary-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-primary/30 transition-all group-hover:scale-105">
                            <Icon name="Plus" className="w-4 h-4" />
                            <span>أضف إعلان جديد</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-xl">🚙</span>
                    </div>
                    إعلانات سياراتي
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {listings.length}
                    </span>
                </h3>
                <button
                    onClick={handleNavigateToListings}
                    className="text-sm font-bold text-primary hover:text-primary-700 transition-colors flex items-center gap-1 group"
                >
                    <span>عرض الكل</span>
                    <Icon name="ArrowLeft" className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                </button>
            </div>

            <div className="space-y-3">
                {listings.map((listing, index) => (
                    <Card
                        key={listing.id}
                        className="p-4 shadow-sm hover:shadow-xl border-slate-100 dark:border-slate-700 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group relative overflow-hidden"
                        onClick={handleNavigateToListings}
                        style={{
                            animationDelay: `${index * 100}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards'
                        }}
                    >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-sky-500/0 group-hover:from-blue-500/5 group-hover:to-sky-500/5 transition-all duration-300 pointer-events-none"></div>

                        <div className="flex gap-4 relative z-10">
                            {/* Image */}
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                                {listing.images && listing.images.length > 0 ? (
                                    <img
                                        src={getStorageUrl(listing.images[0])}
                                        alt={listing.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Icon name="Car" className="w-12 h-12" />
                                    </div>
                                )}

                                {/* Status badge on image */}
                                <div className="absolute top-2 right-2">
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md shadow-lg ${listing.is_active
                                            ? 'bg-green-500/90 text-white'
                                            : 'bg-slate-500/90 text-white'
                                        }`}>
                                        {listing.is_active ? '✓ نشط' : '○ غير نشط'}
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-black text-base text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">
                                        {listing.title}
                                    </h4>
                                    <Badge
                                        variant={listing.listing_type === 'sale' ? 'default' : 'secondary'}
                                        className="text-xs shrink-0 shadow-sm font-bold"
                                    >
                                        {listing.listing_type === 'sale' ? '💰 للبيع' : '📅 للإيجار'}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Icon name="CircleDot" className="w-3 h-3 text-blue-500" />
                                        <span className="font-bold">{listing.brand?.name_ar || listing.brand?.name}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{listing.model}</span>
                                    <span>•</span>
                                    <span className="font-mono">{listing.year}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black text-primary">
                                            {listing.listing_type === 'sale'
                                                ? Number(listing.price || 0).toLocaleString()
                                                : Number(listing.daily_rate || 0).toLocaleString()
                                            }
                                        </span>
                                        <span className="text-xs font-bold text-slate-500">
                                            {listing.listing_type === 'sale' ? 'ر.س' : 'ر.س/يوم'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Icon name="Eye" className="w-3.5 h-3.5" />
                                            <span className="font-bold">{listing.views || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary">
                                            <Icon name="ArrowLeft" className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add new listing button */}
            <button
                onClick={handleNavigateToListings}
                className="mt-4 w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-center gap-2 font-bold text-slate-600 dark:text-slate-400 hover:text-primary"
            >
                <Icon name="Plus" className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>إضافة إعلان جديد</span>
            </button>
        </div>
    );
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

export default UserCarListingsWidget;
