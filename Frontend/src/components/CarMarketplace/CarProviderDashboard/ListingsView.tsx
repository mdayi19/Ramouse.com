import React, { useState, useEffect } from 'react';
import { Car, Edit, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import Icon from '../../Icon';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarListingWizard } from '../CarListingWizard';

interface ListingsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    userPhone: string;
}

export const ListingsView: React.FC<ListingsViewProps> = ({ showToast, userPhone }) => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        setLoading(true);
        try {
            const listingsRes = await CarProviderService.getMyListings();
            setListings(listingsRes.listings || []);
        } catch (error) {
            showToast('فشل تحميل القوائم', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (listingId: number) => {
        try {
            await CarProviderService.toggleListingVisibility(listingId);
            showToast('تم تحديث حالة الإعلان', 'success');
            loadListings();
        } catch (error) {
            showToast('فشل تحديث الإعلان', 'error');
        }
    };

    const handleDeleteListing = async (listingId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان?')) return;

        try {
            await CarProviderService.deleteListing(listingId);
            showToast('تم حذف الإعلان', 'success');
            loadListings();
        } catch (error) {
            showToast('فشل حذف الإعلان', 'error');
        }
    };

    const handleEditListing = (listing: any) => {
        setEditingListing(listing);
        setShowWizard(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">سياراتي</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">إدارة قائمة السيارات المعروضة للبيع</p>
                </div>
                <button
                    onClick={() => setShowWizard(true)}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    إضافة سيارة
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">السيارة</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">السعر</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">المشاهدات</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">الحالة</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {listings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        لا توجد سيارات مضافة حتى الآن
                                    </td>
                                </tr>
                            ) : (
                                listings.map(listing => (
                                    <tr key={listing.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={listing.photos[0] || '/placeholder-car.jpg'}
                                                    alt={listing.title}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{listing.title}</div>
                                                    <div className="text-sm text-slate-500">{listing.year} • {listing.mileage} كم</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">
                                            {listing.price.toLocaleString()} ل.س
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {listing.views_count}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${listing.is_hidden
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {listing.is_hidden ? 'مخفي' : 'نشط'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleVisibility(listing.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                    title={listing.is_hidden ? 'إظهار' : 'إخفاء'}
                                                >
                                                    {listing.is_hidden ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleEditListing(listing)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteListing(listing.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Wizard Modal */}
            {showWizard && (
                <CarListingWizard
                    onComplete={() => {
                        setShowWizard(false);
                        setEditingListing(null);
                        loadListings();
                    }}
                    onCancel={() => {
                        setShowWizard(false);
                        setEditingListing(null);
                    }}
                    showToast={showToast}
                    userPhone={userPhone}
                    editingListing={editingListing}
                />
            )}
        </div>
    );
};
