import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';

interface Props {
    listing: any;
    walletBalance: number;
    onClose: () => void;
    onSuccess: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SponsorListingModal: React.FC<Props> = ({ listing, walletBalance, onClose, onSuccess, showToast }) => {
    const [duration, setDuration] = useState(7);
    const [price, setPrice] = useState(0);
    const [tier, setTier] = useState('daily');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        calculatePrice();
    }, [duration]);

    const calculatePrice = async () => {
        setCalculating(true);
        try {
            const response = await fetch(`/api/car-provider/listings/sponsor-price?days=${duration}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setPrice(data.price);
            setTier(data.tier);
        } catch (error) {
            showToast('فشل حساب السعر', 'error');
        } finally {
            setCalculating(false);
        }
    };

    const handleSponsor = async () => {
        if (walletBalance < price) {
            showToast('رصيد المحفظة غير كافٍ', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/car-provider/listings/${listing.id}/sponsor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ duration_days: duration })
            });

            const data = await response.json();

            if (data.success) {
                showToast('تم تفعيل الرعاية بنجاح', 'success');
                onSuccess();
                onClose();
            } else {
                showToast(data.error || 'فشل تفعيل الرعاية', 'error');
            }
        } catch (error) {
            showToast('حدث خطأ أثناء تفعيل الرعاية', 'error');
        } finally {
            setLoading(false);
        }
    };

    const presets = [
        { days: 7, label: 'أسبوع' },
        { days: 30, label: 'شهر' },
        { days: 90, label: '3 أشهر' }
    ];

    return (
        <Modal title="رعاية الإعلان" onClose={onClose}>
            <div className="space-y-6">
                {/* Listing Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        سيظهر إعلانك في أول نتائج البحث مع شارة "إعلان ممول"
                    </p>
                </div>

                {/* Duration Selector */}
                <div>
                    <label className="block text-sm font-medium mb-2">المدة</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {presets.map(preset => (
                            <button
                                key={preset.days}
                                onClick={() => setDuration(preset.days)}
                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${duration === preset.days
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm">أو أدخل عدد الأيام:</label>
                        <input
                            type="number"
                            min="1"
                            max="90"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                            className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                        />
                    </div>
                </div>

                {/* Price Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">المدة:</span>
                        <span className="font-bold">{duration} يوم</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">الفئة:</span>
                        <span className="font-medium">
                            {tier === 'monthly' && 'شهري (خصم 33%)'}
                            {tier === 'weekly' && 'أسبوعي (خصم 14%)'}
                            {tier === 'daily' && 'يومي'}
                        </span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold">السعر:</span>
                            <span className="font-bold text-primary">
                                {calculating ? '...' : `${price} $`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Balance Check */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>الرصيد الحالي:</span>
                        <span className="font-medium">{walletBalance} $</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>الرصيد بعد الخصم:</span>
                        <span className={`font-medium ${walletBalance - price < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {walletBalance - price} $
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSponsor}
                        disabled={loading || walletBalance < price || calculating}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'جاري التفعيل...' : walletBalance < price ? 'رصيد غير كافٍ' : 'تأكيد الدفع'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SponsorListingModal;
