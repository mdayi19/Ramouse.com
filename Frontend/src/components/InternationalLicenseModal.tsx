import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { api } from '../lib/api';
import { AuthService } from '../services/auth.service';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../lib/utils';

interface InternationalLicenseModalProps {
    onClose: () => void;
    onSuccess: (orderNumber: string) => void;
}

const InternationalLicenseModal: React.FC<InternationalLicenseModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stepToken, setStepToken] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isServiceActive, setIsServiceActive] = useState(true);

    // Step 1: Personal Info
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        nationality: 'syrian',
        birthdate: '',
        address: '',
        personal_photo: ''
    });

    // Step 2: Documents
    const [idDocument, setIdDocument] = useState<File | null>(null);
    const [idDocumentBack, setIdDocumentBack] = useState<File | null>(null);
    const [passportDocument, setPassportDocument] = useState<File | null>(null);
    const [drivingLicenseFront, setDrivingLicenseFront] = useState<File | null>(null);
    const [drivingLicenseBack, setDrivingLicenseBack] = useState<File | null>(null);
    const [personalPhoto, setPersonalPhoto] = useState<File | null>(null);

    // Step 3: Payment
    const [prices, setPrices] = useState({ syrian: 350, non_syrian: 650 });
    const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
    const [proofPath, setProofPath] = useState<string>('');
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Step 4: Review
    const [finalOrderNumber, setFinalOrderNumber] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch Settings first to check if active
                const settingsRes = await api.get('/admin/settings');
                const licenseSettings = settingsRes.data.limitSettings?.international_license_settings;

                if (licenseSettings?.is_active === false) {
                    setIsServiceActive(false);
                    return; // Stop initialization if disabled
                }

                if (settingsRes.data && Array.isArray(settingsRes.data.paymentMethods)) {
                    // Filter only active methods
                    const activeMethods = settingsRes.data.paymentMethods.filter((m: any) => m.isActive !== false);
                    const allowedMethods = licenseSettings?.allowed_payment_methods;

                    if (allowedMethods && Array.isArray(allowedMethods) && allowedMethods.length > 0) {
                        setPaymentMethods(activeMethods.filter((m: any) => allowedMethods.includes(m.id)));
                    } else {
                        setPaymentMethods(activeMethods);
                    }
                }

                const user = await AuthService.getProfile();
                setFormData(prev => ({
                    ...prev,
                    full_name: user.name || '',
                    phone: user.phone || '',
                }));

                const priceRes = await api.get('/international-license/pricing');
                setPrices({
                    syrian: priceRes.data.syrian_price,
                    non_syrian: priceRes.data.non_syrian_price
                });
            } catch (e) {
                console.error("Failed to load init data", e);
            }
        };
        init();
    }, []);

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/international-license/step1', formData);
            setStepToken(response.data.step_token);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل في إرسال المعلومات الشخصية');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File, type: string) => {
        if (!stepToken) return;
        const data = new FormData();
        data.append('file', file);
        data.append('step_token', stepToken);
        data.append('doc_type', type);

        await api.post('/international-license/upload-documents', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    };

    const handleStep2Submit = async () => {
        if (!idDocument || !idDocumentBack || !passportDocument || !drivingLicenseFront || !drivingLicenseBack || !personalPhoto) {
            setError('يرجى تحميل جميع المستندات المطلوبة');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await handleFileUpload(personalPhoto, 'personal_photo');
            await handleFileUpload(idDocument, 'id_document');
            await handleFileUpload(idDocumentBack, 'id_document_back');
            await handleFileUpload(passportDocument, 'passport_document');
            await handleFileUpload(drivingLicenseFront, 'driving_license_front');
            await handleFileUpload(drivingLicenseBack, 'driving_license_back');
            setStep(3);
        } catch (err: any) {
            setError('فشل في تحميل المستندات. يرجى المحاولة مرة أخرى');
        } finally {
            setLoading(false);
        }
    };

    const handleStep3Submit = async () => {
        if (!proofOfPayment || !stepToken) {
            setError('يرجى تحميل إثبات الدفع');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = new FormData();
            data.append('proof_of_payment', proofOfPayment);
            data.append('step_token', stepToken);

            console.log('Uploading payment proof:', {
                fileName: proofOfPayment.name,
                fileType: proofOfPayment.type,
                fileSize: proofOfPayment.size,
                stepToken: stepToken
            });

            const response = await api.post('/international-license/upload-payment-proof', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Payment proof upload response:', response.data);

            if (response.data.success) {
                setProofPath(response.data.url);
                setStep(4);
            } else {
                // Handle unsuccessful response
                const errorMsg = response.data.message || response.data.error || 'فشل في تحميل إثبات الدفع. يرجى المحاولة مرة أخرى';
                console.error('Payment proof upload failed:', errorMsg, response.data);
                setError(errorMsg);
            }
        } catch (err: any) {
            console.error('Payment proof upload error:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'فشل في تحميل إثبات الدفع. يرجى التحقق من الملف والمحاولة مرة أخرى';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (!stepToken) {
            setError('حدث خطأ في عملية التقديم. يرجى إعادة المحاولة من البداية');
            console.error('Final submit error: step_token is missing');
            return;
        }

        setLoading(true);
        setError('');
        try {
            console.log('Submitting final request with step_token:', stepToken);

            const response = await api.post('/international-license/final-submit', { step_token: stepToken });

            console.log('Final submit response:', response.data);

            if (response.data.success) {
                setFinalOrderNumber(response.data.order_number);
                setShowSuccess(true);
                setTimeout(() => {
                    onSuccess(response.data.order_number);
                }, 2000);
            } else {
                // Handle unsuccessful response
                const errorMsg = response.data.message || response.data.error || 'فشل في إرسال الطلب. يرجى المحاولة مرة أخرى';
                console.error('Final submit failed:', errorMsg, response.data);
                setError(errorMsg);
            }
        } catch (err: any) {
            console.error('Final submit error:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'فشل في إرسال الطلب. يرجى التحقق من الاتصال والمحاولة مرة أخرى';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const currentPrice = formData.nationality === 'syrian' ? prices.syrian : prices.non_syrian;

    // File Upload Component - Simple with image preview
    const FileUploadBox = ({
        file,
        onChange,
        icon,
        label,
        accept = "image/*,application/pdf"
    }: {
        file: File | null;
        onChange: (file: File | null) => void;
        icon: string;
        label: string;
        accept?: string;
    }) => {
        const [preview, setPreview] = useState<string>('');

        useEffect(() => {
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setPreview('');
            }

            return () => {
                if (preview) URL.revokeObjectURL(preview);
            };
        }, [file]);

        return (
            <div className={cn(
                "relative p-4 sm:p-6 border-2 border-dashed rounded-xl sm:rounded-2xl transition-all cursor-pointer",
                file
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
            )}>
                <input
                    type="file"
                    onChange={e => onChange(e.target.files?.[0] || null)}
                    accept={accept}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {file && preview ? (
                    // Show uploaded image
                    <div className="text-center pointer-events-none">
                        <div className="relative inline-block mb-3">
                            <img
                                src={preview}
                                alt={label}
                                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow-md mx-auto border-2 border-emerald-400"
                            />
                            <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <Icon name="Check" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold mb-1 text-emerald-700 dark:text-emerald-400">
                            {label}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate px-2 sm:px-4">
                            {file.name}
                        </p>
                    </div>
                ) : file ? (
                    // Show PDF or non-image file
                    <div className="text-center pointer-events-none">
                        <Icon
                            name="FileText"
                            className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-emerald-500"
                        />
                        <p className="text-xs sm:text-sm font-semibold mb-1 text-emerald-700 dark:text-emerald-400">
                            {label}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate px-2 sm:px-4">
                            {file.name}
                        </p>
                    </div>
                ) : (
                    // Empty state
                    <div className="text-center pointer-events-none">
                        <Icon
                            name={icon as any}
                            className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-slate-400"
                        />
                        <p className="text-xs sm:text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                            {label}
                        </p>
                        <p className="text-xs text-slate-500">انقر أو اسحب الملف هنا</p>
                    </div>
                )}

                {/* Delete button when file exists */}
                {file && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        className="absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all pointer-events-auto z-20 group"
                        title="حذف الملف"
                    >
                        <Icon name="X" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>
        );
    };

    // Step 0: Welcome & Info
    const renderStep0 = () => (
        <div className="space-y-4 sm:space-y-6">
            {/* Welcome Header */}
            <div className="text-center py-4 sm:py-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Icon name="FileText" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                    أهلاً وسهلاً
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto px-4">
                    مرحباً بك في خدمة استخراج رخصة القيادة الدولية
                </p>
            </div>

            {/* Required Documents */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3 mb-4">
                    <Icon name="FileText" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">
                            الأوراق المطلوبة:
                        </h4>
                        <ul className="space-y-2.5 text-sm sm:text-base">
                            {[
                                'صورة شهادة القيادة السورية (وجهين)',
                                'صورة شخصية',
                                'صورة الهوية (وجهين)',
                                'صورة صفحة الاسم في جواز السفر'
                            ].map((doc, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                    <Icon name="Check" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span>{doc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3 mb-4">
                    <Icon name="DollarSign" className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">
                            تكلفة رخصة القيادة الدولية:
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-white/60 dark:bg-black/20 p-3 sm:p-4 rounded-lg">
                                <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                                    السوريين (مع شهادة قيادة سورية)
                                </span>
                                <span className="text-lg sm:text-xl font-black text-primary dir-ltr">
                                    ${prices.syrian}
                                </span>
                            </div>
                            <div className="flex items-center justify-between bg-white/60 dark:bg-black/20 p-3 sm:p-4 rounded-lg">
                                <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                                    غير السوريين
                                </span>
                                <span className="text-lg sm:text-xl font-black text-primary dir-ltr">
                                    ${prices.non_syrian}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Icon name="Clock" className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                                مدة الإصدار
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                أسبوعين عمل كحد أقصى من تاريخ تقديم الطلب
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Icon name="Calendar" className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                                صلاحية الشهادة
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                عام كامل كحد أقصى أو حسب صلاحية الشهادة السورية
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border-r-4 border-primary">
                <div className="flex items-start gap-3">
                    <Icon name="Info" className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        للحصول على رخصة القيادة الدولية الرسمية والأصلية يمكنك متابعة عملية التقديم من خلال الخطوات التالية
                    </p>
                </div>
            </div>

            {/* Start Button */}
            <Button
                onClick={() => setStep(1)}
                className="w-full font-bold py-6 rounded-xl shadow-lg shadow-primary/25 text-sm sm:text-base"
                size="lg"
            >
                ابدأ الآن
                <Icon name="ArrowLeft" className="w-5 h-5 mr-0 ml-2" />
            </Button>
        </div>
    );

    const renderStep1 = () => (
        <form onSubmit={handleStep1Submit} className="space-y-4 sm:space-y-5">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
                <div className="flex items-start gap-3">
                    <Icon name="Info" className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        <p className="font-semibold mb-1">معلوماتك الشخصية</p>
                        <p className="text-xs leading-relaxed">يرجى ملء جميع الحقول بدقة. سيتم استخدام هذه المعلومات في إصدار رخصتك الدولية.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="bg-white dark:bg-slate-800"
                        placeholder="أدخل اسمك الكامل"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-white dark:bg-slate-800 dir-ltr text-right"
                        placeholder="05x xxx xxxx"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        الجنسية <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.nationality}
                        onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base",
                            "dark:text-slate-200 disabled:opacity-50 disabled:pointer-events-none"
                        )}
                    >
                        <option value="syrian">سوري</option>
                        <option value="non_syrian">غير سوري</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        تاريخ الميلاد
                    </label>
                    <Input
                        type="date"
                        value={formData.birthdate}
                        onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                        className="bg-white dark:bg-slate-800"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        العنوان
                    </label>
                    <Input
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="bg-white dark:bg-slate-800"
                        placeholder="أدخل عنوانك الكامل"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="px-6 py-4 h-auto"
                >
                    رجوع
                </Button>
                <Button
                    type="submit"
                    isLoading={loading}
                    className="flex-1 font-bold py-4 h-auto rounded-xl shadow-lg shadow-primary/25"
                >
                    التالي: المستندات
                    <Icon name="ArrowLeft" className="w-5 h-5 mr-0 ml-2" />
                </Button>
            </div>
        </form>
    );

    const renderStep2 = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                <div className="flex items-start gap-3">
                    <Icon name="Upload" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        <p className="font-semibold mb-1">تحميل المستندات المطلوبة</p>
                        <p className="text-xs leading-relaxed">يرجى تحميل صورة واضحة لجميع المستندات. الصيغ المدعومة: JPG, PNG, PDF</p>
                    </div>
                </div>
            </div>

            <FileUploadBox
                file={personalPhoto}
                onChange={setPersonalPhoto}
                icon="User"
                label="الصورة الشخصية"
                accept="image/*"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                <FileUploadBox
                    file={idDocument}
                    onChange={setIdDocument}
                    icon="FileText"
                    label="وجه الهوية (أمامي)"
                />
                <FileUploadBox
                    file={idDocumentBack}
                    onChange={setIdDocumentBack}
                    icon="FileText"
                    label="وجه الهوية (خلفي)"
                />
                <FileUploadBox
                    file={drivingLicenseFront}
                    onChange={setDrivingLicenseFront}
                    icon="CreditCard"
                    label="رخصة القيادة (أمامي)"
                />
                <FileUploadBox
                    file={drivingLicenseBack}
                    onChange={setDrivingLicenseBack}
                    icon="CreditCard"
                    label="رخصة القيادة (خلفي)"
                />
                <div className="sm:col-span-2">
                    <FileUploadBox
                        file={passportDocument}
                        onChange={setPassportDocument}
                        icon="Book"
                        label="جواز السفر"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="px-6 py-4 h-auto"
                >
                    رجوع
                </Button>
                <Button
                    onClick={handleStep2Submit}
                    disabled={!idDocument || !idDocumentBack || !passportDocument || !drivingLicenseFront || !drivingLicenseBack || !personalPhoto}
                    isLoading={loading}
                    className="flex-1 font-bold py-4 h-auto rounded-xl shadow-lg shadow-primary/25"
                >
                    التالي: الدفع
                    <Icon name="ArrowLeft" className="w-5 h-5 mr-0 ml-2" />
                </Button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-600">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="DollarSign" className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-base sm:text-lg">تفاصيل الدفع</h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">يرجى تحويل المبلغ الإجمالي للتحقق من طلبك</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-slate-300 dark:border-slate-600">
                    <div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">المبلغ الإجمالي</p>
                        <p className="text-xs text-slate-500 mt-0.5">({formData.nationality === 'syrian' ? 'سوري' : 'غير سوري'})</p>
                    </div>
                    <div className="text-left">
                        <p className="text-2xl sm:text-3xl font-black text-primary dir-ltr">${currentPrice}</p>
                    </div>
                </div>
            </div>

            {/* Payment Methods Section */}
            {paymentMethods.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Icon name="CreditCard" className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2 text-sm sm:text-base">طرق الدفع المتوفرة:</p>
                            <ul className="space-y-2 sm:space-y-3">
                                {paymentMethods.map((method: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-2.5 sm:p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                        {method.iconUrl && (
                                            <img src={method.iconUrl} alt={method.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded bg-white p-1 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold block text-slate-800 dark:text-slate-200 text-sm sm:text-base">{method.name}</span>
                                            <span className="text-xs opacity-80 whitespace-pre-wrap leading-relaxed block mt-1 break-words">{method.details}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-3 sm:p-4">
                <div className="flex gap-3">
                    <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                        بعد إتمام عملية التحويل، يرجى تحميل صورة إشعار التحويل في الأسفل ليتم تأكيد طلبك.
                    </p>
                </div>
            </div>

            <FileUploadBox
                file={proofOfPayment}
                onChange={setProofOfPayment}
                icon="CreditCard"
                label="إثبات الدفع"
            />

            <div className="flex gap-3 pt-2">
                <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="px-6 py-4 h-auto"
                >
                    رجوع
                </Button>
                <Button
                    onClick={handleStep3Submit}
                    disabled={!proofOfPayment}
                    isLoading={loading}
                    className="flex-1 font-bold py-4 h-auto rounded-xl shadow-lg shadow-primary/25"
                >
                    المراجعة والإرسال
                    <Icon name="ArrowLeft" className="w-5 h-5 mr-0 ml-2" />
                </Button>
            </div>
        </div>
    );

    const renderStep4 = () => {
        const documents = [
            { file: personalPhoto, label: 'الصورة الشخصية', icon: 'User' },
            { file: idDocument, label: 'وثيقة الهوية (أمامي)', icon: 'FileText' },
            { file: idDocumentBack, label: 'وثيقة الهوية (خلفي)', icon: 'FileText' },
            { file: drivingLicenseFront, label: 'رخصة القيادة (أمامي)', icon: 'CreditCard' },
            { file: drivingLicenseBack, label: 'رخصة القيادة (خلفي)', icon: 'CreditCard' },
            { file: passportDocument, label: 'جواز السفر', icon: 'Book' },
            { file: proofOfPayment, label: 'إثبات الدفع', icon: 'DollarSign' }
        ];

        // Component for each document preview
        const DocumentPreview = ({ doc }: { doc: typeof documents[0] }) => {
            const [preview, setPreview] = useState<string>('');

            useEffect(() => {
                if (doc.file && doc.file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPreview(reader.result as string);
                    };
                    reader.readAsDataURL(doc.file);
                }
            }, [doc.file]);

            return (
                <div className="relative">
                    {preview ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800">
                            <img
                                src={preview}
                                alt={doc.label}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <Icon name="Check" className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="aspect-square rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                            <Icon name={doc.icon} className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    )}
                    <p className="text-xs text-center mt-1.5 text-slate-700 dark:text-slate-300 leading-tight line-clamp-2">
                        {doc.label}
                    </p>
                </div>
            );
        };

        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center">
                        <Icon name="ClipboardCheck" className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">مراجعة الطلب</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">تأكد من صحة جميع المعلومات قبل الإرسال</p>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-600 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الاسم الكامل</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">{formData.full_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 dir-ltr text-right text-sm sm:text-base">{formData.phone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الجنسية</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize text-sm sm:text-base">{formData.nationality === 'syrian' ? 'سوري' : 'غير سوري'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المبلغ</p>
                            <p className="font-bold text-primary text-base sm:text-lg dir-ltr">${currentPrice}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                        <p className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">المستندات المرفقة</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {documents.map((doc, idx) => (
                                <DocumentPreview key={idx} doc={doc} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={() => setStep(3)}
                        variant="outline"
                        className="px-6 py-4 h-auto"
                    >
                        رجوع
                    </Button>
                    <Button
                        onClick={handleFinalSubmit}
                        isLoading={loading}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 font-bold py-4 h-auto rounded-xl shadow-lg shadow-emerald-500/25 border-0"
                    >
                        تأكيد وإرسال الطلب
                        <Icon name="Send" className="w-5 h-5 mr-0 ml-2" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderSuccess = () => (
        <div className="py-6 sm:py-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-bounce">
                <Icon name="CheckCircle" className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-800 dark:text-slate-100">تم إرسال الطلب بنجاح!</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">رقم الطلب الخاص بك</p>
            <div className="inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <p className="text-xl sm:text-2xl font-black text-primary dir-ltr">{finalOrderNumber}</p>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-4 sm:mt-6">سيتم إعادة توجيهك إلى لوحة التحكم...</p>
        </div>
    );

    return (
        <Modal
            title={showSuccess ? '' : step === 4 ? 'مراجعة الطلب' : step === 0 ? '' : `طلب رخصة قيادة دولية`}
            onClose={onClose}
            size="lg"
        >
            <div className="py-2">
                {!isServiceActive ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Icon name="Lock" className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                            هذه الخدمة غير متاحة حالياً
                        </h3>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xs mx-auto px-4">
                            يرجى المحاولة لاحقاً
                        </p>
                    </div>
                ) : !showSuccess && (
                    <>
                        {/* Enhanced Stepper - Hidden on step 0 */}
                        {step > 0 && (
                            <div className="flex items-center justify-between mb-6 sm:mb-8 px-1 sm:px-2">
                                {[
                                    { num: 1, label: 'المعلومات', icon: 'User' },
                                    { num: 2, label: 'المستندات', icon: 'FileText' },
                                    { num: 3, label: 'الدفع', icon: 'CreditCard' },
                                    { num: 4, label: 'المراجعة', icon: 'CheckCircle' }
                                ].map((s, idx) => (
                                    <React.Fragment key={s.num}>
                                        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                                            <div className={cn(
                                                "w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all",
                                                s.num < step
                                                    ? 'bg-emerald-500 text-white'
                                                    : s.num === step
                                                        ? 'bg-primary text-white ring-2 sm:ring-4 ring-primary/20'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                            )}>
                                                {s.num < step ? (
                                                    <Icon name="Check" className="w-4 h-4 sm:w-6 sm:h-6" />
                                                ) : (
                                                    <Icon name={s.icon as any} className="w-4 h-4 sm:w-5 sm:h-5" />
                                                )}
                                            </div>
                                            <p className={cn(
                                                "text-[10px] sm:text-xs font-medium hidden sm:block",
                                                s.num <= step ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                                            )}>
                                                {s.label}
                                            </p>
                                        </div>
                                        {idx < 3 && (
                                            <div className={cn(
                                                "flex-1 h-0.5 sm:h-1 rounded-full transition-all",
                                                s.num < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                            )} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 sm:p-4 rounded-xl text-xs sm:text-sm mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
                                <Icon name="AlertCircle" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}
                    </>
                )}

                {isServiceActive && (
                    showSuccess ? renderSuccess() : (
                        <>
                            {step === 0 && renderStep0()}
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                            {step === 4 && renderStep4()}
                        </>
                    )
                )}
            </div>
        </Modal>
    );
};

export default InternationalLicenseModal;