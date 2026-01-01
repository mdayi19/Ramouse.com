import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Icon from '../Icon';
import { InternationalLicenseRequest } from '../../types';
import {
    Step,
    getStatusConfig,
    DocumentPreview,
    VisualStepper,
    formatCurrency,
    formatDate,
    DOCUMENT_TYPES
} from './InternationalLicenseComponents';
import { api } from '../../lib/api';

interface InternationalLicenseRequestModalProps {
    request: InternationalLicenseRequest;
    onClose: () => void;
    onStatusUpdate?: (id: number, status: string, note?: string, rejectedDocs?: string[]) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    steps: Step[];
    isReadOnly?: boolean;
    onReuploadSuccess?: () => void;
    isAdmin?: boolean;
}

type TabType = 'info' | 'documents';

const InternationalLicenseRequestModal: React.FC<InternationalLicenseRequestModalProps> = ({
    request,
    onClose,
    onStatusUpdate,
    showToast,
    steps,
    isReadOnly = false,
    onReuploadSuccess
}) => {
    // State
    const [activeTab, setActiveTab] = useState<TabType>(
        request.status === 'rejected' ? 'documents' : 'info'
    );
    const [isUploading, setIsUploading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Re-upload states
    const [newPaymentProof, setNewPaymentProof] = useState<File | null>(null);
    const [newDocuments, setNewDocuments] = useState<Record<string, File>>({});

    // Memoized values
    const statusConfig = useMemo(() => getStatusConfig(request.status), [request.status]);

    // Check if payment is rejected
    // Check if payment is rejected (robust check)
    const isPaymentRejected = useMemo(() =>
        request.rejection_type === 'payment' ||
        (!request.rejection_type && request.rejected_documents?.includes('proof_of_payment')),
        [request.rejection_type, request.rejected_documents]
    );



    // Get rejected document keys (excluding payment)
    const rejectedDocKeys = useMemo(() =>
        request.rejected_documents || [],
        [request.rejected_documents]
    );

    // Fetch payment methods
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const response = await api.get('/admin/settings');
                if (response.data?.paymentMethods) {
                    const allMethods = response.data.paymentMethods.filter((m: any) => m.isActive !== false);
                    const allowedMethods = response.data.limitSettings?.international_license_settings?.allowed_payment_methods;

                    if (allowedMethods && Array.isArray(allowedMethods) && allowedMethods.length > 0) {
                        setPaymentMethods(allMethods.filter((m: any) => allowedMethods.includes(m.id)));
                    } else {
                        setPaymentMethods(allMethods);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch payment methods:', error);
            }
        };
        if (isPaymentRejected) {
            fetchPaymentMethods();
        }
    }, [isPaymentRejected]);

    // Documents list
    const documents = useMemo(() => [
        { key: 'personal_photo', label: 'الصورة الشخصية', icon: 'User', url: request.personal_photo },
        { key: 'id_document', label: 'وثيقة الهوية (أمامي)', icon: 'CreditCard', url: request.id_document },
        { key: 'id_document_back', label: 'وثيقة الهوية (خلفي)', icon: 'CreditCard', url: request.id_document_back },
        { key: 'passport_document', label: 'جواز السفر', icon: 'Book', url: request.passport_document },
        { key: 'driving_license_front', label: 'رخصة القيادة (أمامي)', icon: 'FileText', url: request.driving_license_front },
        { key: 'driving_license_back', label: 'رخصة القيادة (خلفي)', icon: 'FileText', url: request.driving_license_back },
        { key: 'proof_of_payment', label: 'إثبات الدفع', icon: 'DollarSign', url: request.proof_of_payment },
    ], [request]);

    // Handle file selection
    const handleFileSelect = useCallback((docKey: string, file: File | null) => {
        if (docKey === 'proof_of_payment') {
            setNewPaymentProof(file);
        } else {
            setNewDocuments(prev => {
                if (file) {
                    return { ...prev, [docKey]: file };
                } else {
                    const { [docKey]: _, ...rest } = prev;
                    return rest;
                }
            });
        }
    }, []);

    // Handle re-upload submit
    const handleReuploadSubmit = useCallback(async () => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            let url = '';

            if (isPaymentRejected && newPaymentProof) {
                formData.append('proof_of_payment', newPaymentProof);
                url = `/international-license/requests/${request.id}/reupload-payment`;
            } else if (Object.keys(newDocuments).length > 0) {
                Object.entries(newDocuments).forEach(([key, file]) => {
                    formData.append(key, file);
                });
                url = `/international-license/requests/${request.id}/reupload-documents`;
            }

            if (!url) return;

            await api.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast('تم إعادة رفع الملفات بنجاح', 'success');
            onReuploadSuccess?.();
        } catch (error) {
            console.error('Failed to reupload:', error);
            showToast('فشل في إعادة رفع الملفات', 'error');
        } finally {
            setIsUploading(false);
        }
    }, [request.id, newPaymentProof, newDocuments, showToast, onReuploadSuccess, isPaymentRejected]);

    // Check if can submit re-upload
    const canSubmitReupload = useMemo(() => {
        if (isPaymentRejected) return !!newPaymentProof;
        if (rejectedDocKeys.length > 0) {
            // Must re-upload ALL rejected documents
            return rejectedDocKeys.every(key => !!newDocuments[key]);
        }
        return false;
    }, [isPaymentRejected, newPaymentProof, rejectedDocKeys, newDocuments]);

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] 
                    overflow-hidden shadow-2xl flex flex-col">

                    {/* Header */}
                    <div className={`bg-gradient-to-r ${statusConfig.bgGradient} p-6 text-white`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Icon name="FileText" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">طلب #{request.order_number}</h2>
                                    <p className="text-white/80 text-sm">{request.full_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 
                            rounded-full text-sm">
                            <Icon name={statusConfig.icon} size={14} />
                            <span>{statusConfig.label}</span>
                        </div>
                    </div>

                    {/* Progress Stepper */}
                    {request.status !== 'rejected' && (
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <VisualStepper status={request.status} steps={steps} />
                        </div>
                    )}

                    {/* Rejection Alert */}
                    {request.status === 'rejected' && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg 
                                    flex items-center justify-center text-red-500 flex-shrink-0">
                                    <Icon name="AlertTriangle" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-red-700 dark:text-red-300">
                                        {isPaymentRejected ? 'تم رفض إثبات الدفع' : 'تم رفض بعض المستندات'}
                                    </h4>
                                    {request.rejection_reason && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            {request.rejection_reason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    {request.status !== 'rejected' && (
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            {[
                                { id: 'info', label: 'المعلومات', icon: 'User' },
                                { id: 'documents', label: 'المستندات', icon: 'FileText' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                                        flex items-center justify-center gap-2 ${activeTab === tab.id
                                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon name={tab.icon} size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'info' ? (
                            <div className="space-y-4">
                                {/* Personal Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">الاسم الكامل</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {request.full_name}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">رقم الهاتف</div>
                                        <div className="font-semibold text-slate-900 dark:text-white" dir="ltr">
                                            {request.phone}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">الجنسية</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {request.nationality === 'syrian' ? 'سوري' : 'غير سوري'}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">السعر</div>
                                        <div className="font-bold text-primary text-lg">
                                            {formatCurrency(request.price)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">تاريخ الطلب</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {formatDate(request.created_at)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-xs text-slate-500 mb-1">آخر تحديث</div>
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {formatDate(request.updated_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Note */}
                                {request.admin_note && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl 
                                        border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-start gap-3">
                                            <Icon name="MessageSquare" size={18} className="text-amber-600 mt-0.5" />
                                            <div>
                                                <div className="text-xs text-amber-600 mb-1">ملاحظة الإدارة</div>
                                                <div className="text-amber-800 dark:text-amber-200">
                                                    {request.admin_note}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Documents Tab */
                            <div className="space-y-6">
                                {/* Rejection Alert - Enhanced */}
                                {isPaymentRejected && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg 
                                                flex items-center justify-center text-red-500 flex-shrink-0">
                                                <Icon name="AlertTriangle" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-700 dark:text-red-300">
                                                    مطلوب إعادة رفع إثبات الدفع
                                                </h4>
                                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                                    {request.rejection_reason || 'يرجى رفع صورة واضحة لإيصال الدفع الجديد'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Methods (for rejected payment) - Enhanced */}
                                {isPaymentRejected && isReadOnly && paymentMethods.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Icon name="CreditCard" size={18} className="text-primary" />
                                            طرق الدفع المتاحة
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {paymentMethods.map((method) => (
                                                <div key={method.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 
                                                    rounded-xl border border-slate-200 dark:border-slate-700
                                                    hover:border-primary/50 transition-colors group relative">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {method.name}
                                                            </div>
                                                            <div className="text-sm text-slate-500 mt-1 font-mono selection:bg-primary/20">
                                                                {method.details}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(method.details);
                                                                showToast('تم نسخ التفاصيل', 'success');
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-600 
                                                                rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="نسخ"
                                                        >
                                                            <Icon name="Copy" size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Document Grid */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Icon name="FileText" size={18} className="text-primary" />
                                        {isPaymentRejected ? 'إثبات الدفع' : 'المستندات'}
                                    </h4>

                                    <div className={`grid grid-cols-1 ${isPaymentRejected ? '' : 'md:grid-cols-2'} gap-4`}>
                                        {documents
                                            .filter(doc => {
                                                if (isPaymentRejected) return doc.key === 'proof_of_payment';
                                                if (request.status === 'rejected' && rejectedDocKeys.length > 0) {
                                                    return rejectedDocKeys.includes(doc.key);
                                                }
                                                return true;
                                            })
                                            .map((doc) => {
                                                const isRejected = (request.rejection_type === 'documents' && request.rejected_documents?.includes(doc.key)) ||
                                                    (!request.rejection_type && request.rejected_documents?.includes(doc.key)) ||
                                                    (doc.key === 'proof_of_payment' && isPaymentRejected);

                                                const newFile = doc.key === 'proof_of_payment'
                                                    ? newPaymentProof
                                                    : newDocuments[doc.key];

                                                return (
                                                    <div
                                                        key={doc.key}
                                                        className={`relative rounded-xl overflow-hidden border-2 
                                                        transition-all ${isRejected
                                                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                            }`}
                                                    >
                                                        {/* Header */}
                                                        <div className={`p-3 border-b ${isRejected
                                                            ? 'border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/20'
                                                            : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                                                            } flex items-center justify-between`}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon name={doc.icon} size={16}
                                                                    className={isRejected ? 'text-red-500' : 'text-slate-500'} />
                                                                <span className={`text-sm font-bold ${isRejected
                                                                    ? 'text-red-700 dark:text-red-300'
                                                                    : 'text-slate-700 dark:text-slate-300'
                                                                    }`}>
                                                                    {doc.label}
                                                                </span>
                                                            </div>
                                                            {isRejected && (
                                                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 
                                                                bg-red-500 text-white rounded-full font-bold">
                                                                    <Icon name="XCircle" size={10} />
                                                                    مرفوض
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Existing File Preview */}
                                                        {doc.url && !newFile && (
                                                            <div className="p-3">
                                                                <DocumentPreview
                                                                    url={doc.url}
                                                                    type={doc.label}
                                                                    onPreview={setPreviewImage}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Re-upload Zone */}
                                                        {isRejected && isReadOnly && (
                                                            <div className="p-3 pt-0">
                                                                {!newFile ? (
                                                                    <div className="mt-3">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleFileSelect(doc.key, e.target.files?.[0] || null)}
                                                                            className="hidden"
                                                                            id={`reupload-${doc.key}`}
                                                                        />
                                                                        <label
                                                                            htmlFor={`reupload-${doc.key}`}
                                                                            className="flex flex-col items-center justify-center gap-2 p-6 
                                                                            border-2 border-dashed border-primary/30 rounded-xl
                                                                            bg-primary/5 hover:bg-primary/10 hover:border-primary/50
                                                                            cursor-pointer transition-all group/upload"
                                                                        >
                                                                            <div className="w-10 h-10 rounded-full bg-primary/10 
                                                                            flex items-center justify-center text-primary 
                                                                            group-hover/upload:scale-110 transition-transform">
                                                                                <Icon name="UploadCloud" size={20} />
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <span className="block text-sm font-semibold text-primary">
                                                                                    اضغط لرفع ملف جديد
                                                                                </span>
                                                                                <span className="text-xs text-slate-500 mt-1">
                                                                                    JPG, PNG (Max 5MB)
                                                                                </span>
                                                                            </div>
                                                                        </label>
                                                                    </div>
                                                                ) : (
                                                                    /* New File Preview */
                                                                    <div className="mt-3 relative group/preview">
                                                                        <div className="relative rounded-lg overflow-hidden border border-emerald-500/30">
                                                                            <img
                                                                                src={URL.createObjectURL(newFile)}
                                                                                alt="New Payment"
                                                                                className="w-full h-32 object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 
                                                                            transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                                                <button
                                                                                    onClick={() => handleFileSelect(doc.key, null)}
                                                                                    className="p-2 bg-red-500 text-white rounded-full 
                                                                                    hover:bg-red-600 transition-transform hover:scale-110"
                                                                                >
                                                                                    <Icon name="Trash2" size={18} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-2 text-emerald-600 dark:text-emerald-400">
                                                                            <Icon name="CheckCircle" size={14} />
                                                                            <span className="text-xs font-semibold">تم اختيار الملف بنجاح</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 
                                text-slate-700 dark:text-slate-300 rounded-xl font-medium 
                                hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            إغلاق
                        </button>

                        {/* Re-upload submit button */}
                        {isReadOnly && request.status === 'rejected' && canSubmitReupload && (
                            <button
                                onClick={handleReuploadSubmit}
                                disabled={isUploading}
                                className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark 
                                    text-white rounded-xl font-medium transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Icon name="Loader2" size={18} className="animate-spin" />
                                        <span>جاري الرفع...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Upload" size={18} />
                                        <span>إرسال الملفات</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview Lightbox */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 
                            rounded-lg text-white transition-colors"
                    >
                        <Icon name="X" size={24} />
                    </button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default InternationalLicenseRequestModal;