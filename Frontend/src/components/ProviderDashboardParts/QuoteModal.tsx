import React, { useState } from 'react';
import { Order, PartStatus, Settings, PartSizeCategory } from '../../types';
import Modal from '../Modal';
import MediaUpload from '../MediaUpload';
import VoiceRecorder from '../VoiceRecorder';
import Icon from '../Icon';

interface QuoteModalProps {
    order: Order;
    onClose: () => void;
    onSubmit: (orderNumber: string, quoteDetails: { price: number; partStatus: PartStatus; partSizeCategory: PartSizeCategory; notes?: string }, media: { images: File[], video: File | null, voiceNote: Blob | null }) => Promise<void>;
    settings: Settings;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ order, onClose, onSubmit, settings, showToast }) => {
    const [price, setPrice] = useState('');
    const [partStatus, setPartStatus] = useState<PartStatus>('new');
    const [partSizeCategory, setPartSizeCategory] = useState<PartSizeCategory>('');
    const technicianNote = 'هذا الطلب من فني يرجى اعطاء سعر مناسب';
    const [notes, setNotes] = useState(order.userType === 'technician' ? technicianNote : '');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [voiceNote, setVoiceNote] = useState<Blob | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!price || parseFloat(price) <= 0) {
            showToast('الرجاء إدخال سعر صحيح.', 'error');
            return;
        }
        if (!partSizeCategory) {
            showToast('الرجاء تحديد حجم القطعة للشحن.', 'error');
            return;
        }
        setIsSubmitting(true);
        const images = mediaFiles.filter(f => f.type.startsWith('image/'));
        const video = mediaFiles.find(f => f.type.startsWith('video/')) || null;
        try {
            await onSubmit(order.orderNumber, { price: parseFloat(price), partStatus, partSizeCategory, notes }, { images, video, voiceNote });
        } catch (error) {
            console.error(error);
            showToast('حدث خطأ أثناء إرسال العرض', 'error');
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={`تقديم عرض للطلب #${order.orderNumber.slice(-6)}`}
            onClose={onClose}
            size="xl"
            footer={null} // Custom footer inside form
        >
            <form id="quote-form" onSubmit={handleSubmit} className="space-y-6">

                {/* Price Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <span>💰</span>
                        سعر القطعة (شامل الضريبة)
                    </label>
                    <div className="relative mt-2">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-xl font-black text-green-600">$</span>
                        </div>
                        <input
                            type="number"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="block w-full pr-10 pl-4 py-4 text-2xl font-black text-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            required
                            min="1"
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Status Section */}
                <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <span>✨</span>
                        حالة القطعة
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setPartStatus('new')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${partStatus === 'new'
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md transform scale-[1.02]'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className="text-3xl">📦</span>
                            <div className="text-center">
                                <div className={`font-black ${partStatus === 'new' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>جديد</div>
                                <div className="text-[10px] text-slate-400 font-medium">غير مستخدمة من قبل</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPartStatus('used')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${partStatus === 'used'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md transform scale-[1.02]'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className="text-3xl">🛠️</span>
                            <div className="text-center">
                                <div className={`font-black ${partStatus === 'used' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>مستعمل</div>
                                <div className="text-[10px] text-slate-400 font-medium">تشليح / مجدد</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Size Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span>📏</span>
                            حجم القطعة (للشحن)
                        </label>
                        <button
                            type="button"
                            onClick={() => window.alert('دليل الشحن:\n\nXS: قطع صغيرة جداً (مثل: مسامير، فلاتر)\nS: قطع صغيرة (مثل: مرايا، اسطبات)\nM: قطع متوسطة (مثل: رديتر، دينمو)\nL: قطع كبيرة (مثل: صدام، رفرف)\nVL: قطع ضخمة (مثل: ماكينة، قير)')}
                            className="text-xs font-bold text-primary hover:text-primary-700 underline flex items-center gap-1"
                        >
                            <Icon name="Info" className="w-3 h-3" />
                            دليل الشحن
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { val: 'xs', title: 'XS', icon: '🤏', desc: 'صغير جداً' },
                            { val: 's', title: 'S', icon: '📦', desc: 'صغير' },
                            { val: 'm', title: 'M', icon: '🚙', desc: 'متوسط' },
                            { val: 'l', title: 'L', icon: '🚛', desc: 'كبير' },
                            { val: 'vl', title: 'VL', icon: '🏗️', desc: 'ضخم' },
                        ].map((size) => (
                            <button
                                key={size.val}
                                type="button"
                                onClick={() => setPartSizeCategory(size.val as PartSizeCategory)}
                                className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${partSizeCategory === size.val
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md transform scale-105 z-10'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span className="text-2xl">{size.icon}</span>
                                <span className={`text-xs font-black ${partSizeCategory === size.val ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{size.title}</span>
                            </button>
                        ))}
                    </div>
                    {partSizeCategory && (
                        <p className="text-xs text-center mt-2 text-slate-500 animate-fade-in">
                            تم اختيار: <span className="font-bold text-slate-800 dark:text-slate-200">
                                {{ 'xs': 'صغير جداً', 's': 'صغير', 'm': 'متوسط', 'l': 'كبير', 'vl': 'ضخم' }[partSizeCategory]}
                            </span>
                        </p>
                    )}
                </div>

                {/* Notes & Media Compact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span>📝</span> ملاحظات
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary text-sm"
                            placeholder="أي تفاصيل إضافية..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span>🎤</span> تسجيل صوتي
                        </label>
                        <div className="h-[88px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <VoiceRecorder voiceNote={voiceNote} setVoiceNote={setVoiceNote} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <span>📸</span> صور القطعة (اختياري)
                    </label>
                    <MediaUpload files={mediaFiles} setFiles={setMediaFiles} maxFiles={settings?.limitSettings?.maxImagesPerQuote || 5} />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="group-hover:scale-110 transition-transform">🚀</span>
                                <span>إرسال العرض الان</span>
                            </>
                        )}
                    </button>
                    <button type="button" onClick={onClose} className="w-full mt-3 text-slate-400 text-sm font-medium hover:text-slate-600 p-2">
                        إلغاء الأمر
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default QuoteModal;