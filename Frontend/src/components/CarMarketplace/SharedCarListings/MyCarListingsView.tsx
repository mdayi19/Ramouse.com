import React, { useState, useEffect } from 'react';
import { Car, TrendingUp, Eye, Star } from 'lucide-react';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarListingWizard } from '../CarListingWizard';
import { AnimatePresence } from 'framer-motion';

interface MyCarListingsViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    userRole: 'customer' | 'technician' | 'tow_truck';
    userPhone?: string;
}

interface Stats {
    total_listings: number;
    active_listings: number;
    sponsored_listings: number;
    total_views: number;
    this_month_listings: number;
    wallet_balance: number;
    listing_limit: number;
    remaining_listings: number;
}

interface Listing {
    id: number;
    title: string;
    price: number;
    listing_type: string;
    views_count: number;
    is_available: boolean;
    is_sponsored: boolean;
    sponsored_until: string | null;
    created_at: string;
    photos: string[];
}

export const MyCarListingsView: React.FC<MyCarListingsViewProps> = ({ showToast, userRole, userPhone = '' }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'listings' | 'analytics'>('listings');
    const [showWizard, setShowWizard] = useState(false);

    // Determine API prefix based on user role
    const apiPrefix = userRole === 'customer' ? '/customer'
        : userRole === 'technician' ? '/technician'
            : userRole === 'tow_truck' ? '/tow-truck'
                : '/customer';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch stats
            const statsData = await CarProviderService.getUserListingStats(apiPrefix);
            setStats(statsData.stats);

            // Fetch listings
            const listingsData = await CarProviderService.getUserListings(apiPrefix);
            setListings(listingsData.listings);
        } catch (error: any) {
            showToast(error.message || 'فشل في تحميل البيانات', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        إدارة سياراتي للبيع
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        يمكنك إنشاء حتى {stats?.listing_limit || 3} إعلانات بيع سيارات
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الإعلانات</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_listings || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">الإعلانات النشطة</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.active_listings || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المشاهدات</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_views || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">المتبقية</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats?.remaining_listings || 0}/{stats?.listing_limit || 3}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {(stats?.remaining_listings || 0) > 0 && (
                    <button
                        onClick={() => setShowWizard(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Car className="w-5 h-5" />
                        إضافة إعلان جديد
                    </button>
                )}
                {(stats?.remaining_listings || 0) === 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
                        ⚠️ لقد وصلت إلى الحد الأقصى من الإعلانات ({stats?.listing_limit}). قم بحذف إعلان موجود لإضافة إعلان جديد.
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'listings'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                    >
                        إعلاناتي ({listings?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'analytics'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                    >
                        الإحصائيات
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'listings' && (
                <div className="space-y-4">
                    {!listings || listings.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                لا توجد إعلانات بعد
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                ابدأ بإضافة أول إعلان بيع سيارة الآن
                            </p>
                            <button
                                onClick={() => setShowWizard(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <Car className="w-5 h-5" />
                                إضافة إعلان
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">الصورة</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">العنوان</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">السعر</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">المشاهدات</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">الحالة</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">الرعاية</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {listings.map(listing => (
                                            <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    {listing.photos && listing.photos.length > 0 ? (
                                                        <img
                                                            src={listing.photos[0]}
                                                            alt={listing.title}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                            <Car className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900 dark:text-white">{listing.title}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(listing.created_at).toLocaleDateString('ar-SY')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                                    ${listing.price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        {listing.views_count}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {listing.is_available ?
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            نشط
                                                        </span> :
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                                                            غير نشط
                                                        </span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    {listing.is_sponsored ?
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            <Star className="w-3 h-3 mr-1" />
                                                            ممول
                                                        </span> :
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        الإحصائيات التفصيلية
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        ستتوفر الإحصائيات التفصيلية قريباً
                    </p>
                </div>
            )}

            {/* Listing Wizard Modal */}
            <AnimatePresence>
                {showWizard && (
                    <CarListingWizard
                        onComplete={() => {
                            setShowWizard(false);
                            loadData(); // Reload listings after creation
                            showToast('تم إضافة الإعلان بنجاح', 'success');
                        }}
                        onCancel={() => setShowWizard(false)}
                        showToast={showToast}
                        userPhone={userPhone}
                        onlySale={true}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
