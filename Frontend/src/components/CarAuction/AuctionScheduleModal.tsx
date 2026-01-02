
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Auction, AuctionCar } from '../../types';
import * as auctionService from '../../services/auction.service';
import { Calendar, Clock, DollarSign, Tag, Check, AlertCircle, TrendingUp, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface AuctionScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    car?: AuctionCar | null;
    initialData?: Auction | null;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AuctionScheduleModal: React.FC<AuctionScheduleModalProps> = ({
    isOpen, onClose, onSuccess, car, initialData, showToast
}) => {
    const [loading, setLoading] = useState(false);

    // Default start time: tomorrow at 10 AM
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() + 1);
    defaultStart.setHours(10, 0, 0, 0);

    // Default end time: start + 48 hours
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultEnd.getHours() + 48);

    const [formData, setFormData] = useState({
        title: '',
        scheduled_start: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
        scheduled_end: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
        starting_bid: 0,
        minimum_bid: 0,
        bid_increment: 100,
        auction_car_id: '',
        auto_extend: true,
        extension_minutes: 5,
        max_extensions: 3,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                scheduled_start: initialData.scheduled_start ? format(new Date(initialData.scheduled_start), "yyyy-MM-dd'T'HH:mm") : '',
                scheduled_end: initialData.scheduled_end ? format(new Date(initialData.scheduled_end), "yyyy-MM-dd'T'HH:mm") : '',
                starting_bid: initialData.starting_bid || 0,
                minimum_bid: initialData.minimum_bid || 0,
                bid_increment: initialData.bid_increment || 100,
                auction_car_id: initialData.auction_car_id || '',
                auto_extend: initialData.auto_extend ?? true,
                extension_minutes: initialData.extension_minutes || 5,
                max_extensions: initialData.max_extensions || 3,
            });
        } else if (car) {
            setFormData({
                title: `مزاد: ${car.title}`,
                scheduled_start: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
                scheduled_end: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
                starting_bid: car.starting_price || 0,
                minimum_bid: car.reserve_price || car.starting_price || 0,
                bid_increment: 100,
                auction_car_id: car.id,
                auto_extend: true,
                extension_minutes: 5,
                max_extensions: 3,
            });
        }
    }, [initialData, car, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Ensure dates are sent as ISO strings with timezone info to preserve user's Damascus time intent
            // The backend should parse this and store as UTC
            const payload = {
                ...formData,
                scheduled_start: new Date(formData.scheduled_start).toISOString(),
                scheduled_end: new Date(formData.scheduled_end).toISOString(),
            };

            await auctionService.saveAuction(payload, initialData?.id);
            showToast('تم حفظ جدول المزاد بنجاح', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Save auction error:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstField = Object.keys(errors)[0];
                const firstError = errors[firstField][0];
                showToast(`خطأ في البيانات: ${firstError}`, 'error');
            } else {
                showToast(error.response?.data?.error || 'فشل حفظ المزاد', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = () => {
        if (!formData.scheduled_start || !formData.scheduled_end) return null;
        const start = new Date(formData.scheduled_start);
        const end = new Date(formData.scheduled_end);
        const diffMs = end.getTime() - start.getTime();

        if (diffMs <= 0) return 'غير صالح';

        const hours = Math.round(diffMs / (1000 * 60 * 60));
        if (hours < 24) return `${hours} ساعة`;
        return `${Math.round(hours / 24)} يوم`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'تعديل جدول المزاد' : 'جدولة مزاد جديد'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Car Preview */}
                {car && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-white/5 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-white shadow-md">
                            <img
                                src={car.media?.images?.[0] || '/placeholder-car.jpg'}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{car.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-300">{car.brand}</span>
                                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-300">{car.model}</span>
                                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-300">{car.year}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-0.5">سعر البداية</div>
                            <div className="text-lg font-black text-blue-600 dark:text-blue-400">${car.starting_price?.toLocaleString()}</div>
                        </div>
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                        <Tag className="w-4 h-4 inline mr-1.5 align-text-bottom text-gray-400" />
                        عنوان المزاد
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all font-medium bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                        placeholder="عنوان جذاب للمزاد..."
                    />
                </div>

                {/* Schedule */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 dark:bg-slate-800 px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            الجدولة الزمنية
                        </h3>
                        {calculateDuration() && (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                                المدة: {calculateDuration()}
                            </span>
                        )}
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">وقت البدء</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.scheduled_start}
                                    onChange={e => setFormData({ ...formData, scheduled_start: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">وقت الانتهاء</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.scheduled_end}
                                    onChange={e => setFormData({ ...formData, scheduled_end: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 px-5 py-3 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-bold text-gray-900 dark:text-white">إعدادات التسعير</h3>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">سعر الافتتاح</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-emerald-500 transition-colors">$</span>
                                <input
                                    type="number"
                                    required
                                    value={formData.starting_bid}
                                    onChange={e => setFormData({ ...formData, starting_bid: parseFloat(e.target.value) })}
                                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 dark:focus:ring-emerald-900/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">الحد الأدنى (Reserve)</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-emerald-500 transition-colors">$</span>
                                <input
                                    type="number"
                                    required
                                    value={formData.minimum_bid}
                                    onChange={e => setFormData({ ...formData, minimum_bid: parseFloat(e.target.value) })}
                                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 dark:focus:ring-emerald-900/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">أقل زيادة للمزايدة</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-emerald-500 transition-colors">$</span>
                                <input
                                    type="number"
                                    required
                                    value={formData.bid_increment}
                                    onChange={e => setFormData({ ...formData, bid_increment: parseFloat(e.target.value) })}
                                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 dark:focus:ring-emerald-900/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auto Extend Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-amber-50/50 dark:bg-amber-900/20 px-5 py-3 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">التمديد التلقائي</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">تمديد وقت المزاد عند المنافسة في الدقائق الأخيرة</p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.auto_extend}
                                onChange={e => setFormData({ ...formData, auto_extend: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>

                    <AnimatePresence>
                        {formData.auto_extend && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="overflow-hidden"
                            >
                                <div className="p-5 grid grid-cols-2 gap-5 border-t border-amber-100/50 dark:border-amber-900/20">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">مدة التمديد (دقائق)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                                            <input
                                                type="number"
                                                value={formData.extension_minutes}
                                                onChange={e => setFormData({ ...formData, extension_minutes: parseInt(e.target.value) })}
                                                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-50/50 dark:focus:ring-amber-900/50 transition-all font-bold text-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">أقصى عدد تمديدات</label>
                                        <input
                                            type="number"
                                            value={formData.max_extensions}
                                            onChange={e => setFormData({ ...formData, max_extensions: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-50/50 dark:focus:ring-amber-900/50 transition-all font-bold text-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'جارِ الحفظ...' : (
                            <>
                                <Check size={18} strokeWidth={3} />
                                {initialData ? 'حفظ التغييرات' : 'جدولة المزاد'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AuctionScheduleModal;
