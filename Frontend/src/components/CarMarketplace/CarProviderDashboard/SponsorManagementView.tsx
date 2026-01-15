import React, { useState, useEffect } from 'react';
import { Star, Calendar, DollarSign, TrendingUp, Clock, RefreshCw, Zap } from 'lucide-react';
import SponsorListingModal from './SponsorListingModal';

interface SponsorshipHistory {
    id: number;
    car_listing_id: number;
    listing_title: string;
    sponsored_from: string;
    sponsored_until: string;
    price: number;
    duration_days: number;
    status: 'active' | 'expired' | 'cancelled';
    refund_amount?: number;
}

interface SponsorSettings {
    dailyPrice: number;
    weeklyPrice: number;
    monthlyPrice: number;
    maxDuration: number;
    minDuration: number;
    enabled: boolean;
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    provider: any;
}

const SponsorManagementView: React.FC<Props> = ({ showToast, provider }) => {
    const [loading, setLoading] = useState(true);
    const [sponsorships, setSponsorships] = useState<SponsorshipHistory[]>([]);
    const [settings, setSettings] = useState<SponsorSettings | null>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [selectedListing, setSelectedListing] = useState<any | null>(null);
    const [showSponsorModal, setShowSponsorModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadSponsorships(),
                loadSettings(),
                loadListings()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadSponsorships = async () => {
        try {
            const response = await fetch('/api/car-provider/sponsorships', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setSponsorships(data.data || []);
        } catch (error) {
            console.error('Failed to load sponsorships:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/car-provider/listings/sponsor-price?days=1', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            if (data.breakdown) {
                setSettings({
                    dailyPrice: data.breakdown.daily,
                    weeklyPrice: data.breakdown.weekly,
                    monthlyPrice: data.breakdown.monthly,
                    maxDuration: 90,
                    minDuration: 1,
                    enabled: true
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadListings = async () => {
        try {
            const response = await fetch('/api/car-provider/listings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setListings(data.data || data || []);
        } catch (error) {
            console.error('Failed to load listings:', error);
        }
    };

    const handleUnsponsor = async (listingId: number) => {
        if (!confirm('هل تريد إلغاء رعاية هذا الإعلان؟ سيتم استرجاع المبلغ المتبقي.')) return;

        try {
            const response = await fetch(`/api/car-provider/listings/${listingId}/unsponsor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                showToast(`تم إلغاء الرعاية. استرجاع: ${data.refund_amount} ريال`, 'success');
                loadData();
            } else {
                showToast(data.error || 'فشل إلغاء الرعاية', 'error');
            }
        } catch (error) {
            showToast('حدث خطأ', 'error');
        }
    };

    const activeSponsorships = sponsorships.filter(s => s.status === 'active');
    const totalSpent = sponsorships.reduce((sum, s) => sum + Number(s.price || 0), 0);
    const totalRefunded = sponsorships.reduce((sum, s) => sum + Number(s.refund_amount || 0), 0);
    const walletBalance = Number(provider?.wallet_balance || 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                        إدارة الإعلانات الممولة
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        روّج لإعلاناتك واحصل على المزيد من المشاهدات
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-100 text-sm">الإعلانات النشطة</span>
                        <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div className="text-3xl font-bold">{activeSponsorships.length}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm">إجمالي الإنفاق</span>
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold">{totalSpent.toFixed(2)} ر.س</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100 text-sm">المسترجع</span>
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold">{totalRefunded.toFixed(2)} ر.س</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm">رصيد المحفظة</span>
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold">{walletBalance.toFixed(2)} ر.س</div>
                </div>
            </div>

            {/* Pricing Info */}
            {settings && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        أسعار الرعاية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">يومي</div>
                            <div className="text-2xl font-bold text-yellow-600">{settings.dailyPrice} ر.س</div>
                            <div className="text-xs text-gray-500 mt-1">لكل يوم</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">أسبوعي</div>
                            <div className="text-2xl font-bold text-blue-600">{settings.weeklyPrice} ر.س</div>
                            <div className="text-xs text-gray-500 mt-1">لكل أسبوع (وفر {Math.round((1 - settings.weeklyPrice / (settings.dailyPrice * 7)) * 100)}%)</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">شهري</div>
                            <div className="text-2xl font-bold text-purple-600">{settings.monthlyPrice} ر.س</div>
                            <div className="text-xs text-gray-500 mt-1">لكل شهر (وفر {Math.round((1 - settings.monthlyPrice / (settings.dailyPrice * 30)) * 100)}%)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Sponsorships */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">الإعلانات الممولة النشطة</h3>
                {activeSponsorships.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>لا توجد إعلانات ممولة حالياً</p>
                        <p className="text-sm mt-2">ابدأ برعاية إعلاناتك للحصول على المزيد من المشاهدات</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeSponsorships.map(sponsorship => (
                            <div key={sponsorship.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg mb-2">{sponsorship.listing_title}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">من:</span>
                                                <div className="font-medium">{new Date(sponsorship.sponsored_from).toLocaleDateString('ar-SA')}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">حتى:</span>
                                                <div className="font-medium">{new Date(sponsorship.sponsored_until).toLocaleDateString('ar-SA')}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">المدة:</span>
                                                <div className="font-medium">{sponsorship.duration_days} يوم</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">المبلغ:</span>
                                                <div className="font-medium text-blue-600">{sponsorship.price} ر.س</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnsponsor(sponsorship.car_listing_id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-4"
                                    >
                                        إلغاء الرعاية
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Available Listings to Sponsor */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">إعلانات متاحة للرعاية</h3>
                {listings.filter(l => !l.is_sponsored).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>جميع إعلاناتك ممولة حالياً!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {listings.filter(l => !l.is_sponsored).map(listing => (
                            <div key={listing.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
                                <h4 className="font-bold mb-2 line-clamp-1">{listing.title}</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {listing.brand} {listing.model} - {listing.year}
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedListing(listing);
                                        setShowSponsorModal(true);
                                    }}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-bold flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4 fill-current" />
                                    رعاية الإعلان
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">سجل الرعايات</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإعلان</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sponsorships.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm">{item.listing_title}</td>
                                    <td className="px-6 py-4 text-sm">{item.duration_days} يوم</td>
                                    <td className="px-6 py-4 text-sm font-medium">{item.price} ر.س</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-800' :
                                            item.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {item.status === 'active' ? 'نشط' : item.status === 'expired' ? 'منتهي' : 'ملغي'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{new Date(item.sponsored_from).toLocaleDateString('ar-SA')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sponsor Modal */}
            {showSponsorModal && selectedListing && (
                <SponsorListingModal
                    listing={selectedListing}
                    walletBalance={walletBalance}
                    onClose={() => {
                        setShowSponsorModal(false);
                        setSelectedListing(null);
                    }}
                    onSuccess={() => {
                        loadData();
                        setShowSponsorModal(false);
                        setSelectedListing(null);
                    }}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default SponsorManagementView;
