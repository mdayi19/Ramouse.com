import React from 'react';
import { DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface AuctionFormPricingProps {
    formData: any;
    updateFormData: (data: any) => void;
    mode?: 'admin' | 'user';
}

export const AuctionFormPricing: React.FC<AuctionFormPricingProps> = ({ formData, updateFormData, mode }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 border border-blue-100 dark:border-white/5">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-6 flex items-center gap-2 text-lg">
                    <DollarSign className="w-6 h-6" />
                    تــفــاصــيــل الــمــزاد
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">سعر البداية (Starting Bid) *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                value={formData.starting_price}
                                onChange={e => updateFormData({ ...formData, starting_price: parseFloat(e.target.value) })}
                                className="w-full pl-8 pr-4 py-4 text-xl font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">مقدار الزيادة (Bid Increment) *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                value={formData.bid_increment}
                                onChange={e => updateFormData({ ...formData, bid_increment: parseFloat(e.target.value) || 100 })}
                                className="w-full pl-8 pr-4 py-4 text-xl font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                                placeholder="100"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">الحد الأدنى للبيع (Reserve)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                value={formData.reserve_price || ''}
                                onChange={e => updateFormData({ ...formData, reserve_price: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                                placeholder="اختياري"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">لن تباع السيارة بأقل من هذا السعر</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">سعر الشراء الفوري (Buy Now)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                value={formData.buy_now_price || ''}
                                onChange={e => updateFormData({ ...formData, buy_now_price: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-green-500 focus:ring-4 focus:ring-green-50 dark:focus:ring-green-900/30 transition-all"
                                placeholder="اختياري"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">التأمين المطلوب للمشاركة</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input
                            type="number"
                            value={formData.deposit_amount}
                            onChange={e => updateFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all"
                            placeholder="500"
                        />
                    </div>
                </div>
            </div>

            {mode === 'admin' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.schedule_auction ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.schedule_auction ? 'translate-x-0' : '-translate-x-6'}`} />
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.schedule_auction}
                                onChange={e => updateFormData({ ...formData, schedule_auction: e.target.checked })}
                                className="hidden"
                            />
                            <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">جدولة المزاد الآن؟</span>
                        </label>
                    </div>

                    <AnimatePresence>
                        {formData.schedule_auction && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-5 mt-4">
                                    {/* Start Immediately Checkbox */}
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input
                                            type="checkbox"
                                            checked={formData.start_immediately}
                                            onChange={(e) => {
                                                const isImmediate = e.target.checked;
                                                const now = new Date();
                                                updateFormData({
                                                    ...formData,
                                                    start_immediately: isImmediate,
                                                    scheduled_start: isImmediate ? format(now, "yyyy-MM-dd'T'HH:mm") : formData.scheduled_start
                                                });
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-gray-700">بدء المزاد فوراً</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                                                يبدأ في <span className="text-gray-400 font-normal">(بتوقيت دمشق)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduled_start}
                                                onChange={e => updateFormData({ ...formData, scheduled_start: e.target.value })}
                                                disabled={formData.start_immediately}
                                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm dir-ltr ${formData.start_immediately ? 'bg-gray-100 text-gray-400' : ''}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                                                ينتهي في <span className="text-gray-400 font-normal">(بتوقيت دمشق)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduled_end}
                                                onChange={e => updateFormData({ ...formData, scheduled_end: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm dir-ltr"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
