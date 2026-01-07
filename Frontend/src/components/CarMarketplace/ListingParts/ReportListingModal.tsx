import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details: string) => Promise<void>;
    t: any;
}

const ReportListingModal: React.FC<ReportListingModalProps> = ({ isOpen, onClose, onSubmit, t }) => {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const reasons = [
        'محتوى غير لائق', // Inappropriate content
        'معلومات مغلوطة', // Incorrect information
        'احتيال أو نصب', // Fraud/Scam
        'مكرر', // Duplicate
        'أخرى', // Other
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;

        setIsSubmitting(true);
        try {
            await onSubmit(reason, details);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setReason('');
                setDetails('');
            }, 2000);
        } catch (error) {
            console.error('Report failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تم الإرسال</h3>
                            <p className="text-gray-500 dark:text-gray-400">شكراً لك، سنقوم بمراجعة البلاغ.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t.ui.report || 'إبلاغ عن مخالفة'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        سبب الإبلاغ
                                    </label>
                                    <div className="space-y-2">
                                        {reasons.map((r) => (
                                            <label key={r} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="reason"
                                                    value={r}
                                                    checked={reason === r}
                                                    onChange={(e) => setReason(e.target.value)}
                                                    className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">{r}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        تفاصيل إضافية (اختياري)
                                    </label>
                                    <textarea
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="اشرح المشكلة..."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={!reason || isSubmitting}
                                        className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportListingModal;
