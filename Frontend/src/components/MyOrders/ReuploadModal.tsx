import React, { useState } from 'react';
import { Order } from '../../types';
import Icon from '../Icon';
import ImageUpload from '../ImageUpload';
import Modal from '../Modal';

interface ReuploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    reuploadOrder: Order | null;
    onReupload: (files: File[]) => void;
    isReuploading: boolean;
}

const ReuploadModal: React.FC<ReuploadModalProps> = ({
    isOpen,
    onClose,
    reuploadOrder,
    onReupload,
    isReuploading
}) => {
    const [newPaymentReceipt, setNewPaymentReceipt] = useState<File[]>([]);

    if (!isOpen) return null;

    const handleReupload = () => {
        onReupload(newPaymentReceipt);
        // Reset state is handled by parent or useEffect if needed, 
        // but here we just pass the files. clearing files can be done here or in parent.
        // For now, let's clear them after successful call if parent doesn't close immediately? 
        // Actually parent closes it.
    };

    return (
        <Modal
            onClose={onClose}
            title="إعادة رفع إيصال الدفع"
        >
            <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <Icon name="AlertCircle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-red-800 dark:text-red-200 text-sm mb-1">سبب الرفض</h4>
                            <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">
                                {reuploadOrder?.rejectionReason}
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        الإيصال الجديد
                    </label>
                    <ImageUpload
                        files={newPaymentReceipt}
                        setFiles={setNewPaymentReceipt}
                        maxFiles={1}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleReupload}
                        disabled={isReuploading}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isReuploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري الرفع...
                            </>
                        ) : (
                            <>
                                <Icon name="Upload" className="w-5 h-5" />
                                إرسال للإدارة
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isReuploading}
                        className="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReuploadModal;
