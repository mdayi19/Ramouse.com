
import React, { useState } from 'react';
import { Settings, LimitSettings } from '../../types';
import { ViewHeader } from './Shared';
import Icon from '../Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface LimitsSettingsViewProps {
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}

type NumericLimitKeys = {
    [K in keyof LimitSettings]: LimitSettings[K] extends number | undefined ? K : never;
}[keyof LimitSettings];


const LimitsSettingsView: React.FC<LimitsSettingsViewProps> = ({ settings, onSave }) => {
    const [limits, setLimits] = useState<LimitSettings>(settings.limitSettings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const numValue = Number(value);
        if (type === 'number' && numValue < 0) return;
        setLimits(prev => ({ ...prev, [name]: numValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ limitSettings: limits });
    };

    const InputField: React.FC<{ label: string, name: NumericLimitKeys, type?: string, desc?: string }> = ({ label, name, type = 'number', desc }) => (
        <div>
            <Input
                label={label}
                type={type}
                id={name}
                name={name}
                value={limits ? (limits[name as keyof LimitSettings] as number) ?? '' : ''}
                onChange={(e) => handleChange(e as any)}
                className="text-left"
                dir="ltr"
                min="0"
            />
            {desc && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 p-8 shadow-lg">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2">⚙️ إدارة الحدود</h2>
                    <p className="text-white/90">تحديد القيود والحدود المختلفة داخل التطبيق</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- COLUMN 1 --- */}
                    <div className="space-y-8">
                        {/* Customer Limits */}
                        <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-md">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-blue-800 dark:text-blue-200"><Icon name="Users" /> حدود العملاء</h3>
                            <div className="space-y-4">
                                <InputField label="الحد الأقصى للطلبات النشطة" name="maxActiveOrders" desc="أقصى عدد من الطلبات غير المكتملة التي يمكن للعميل الواحد فتحها في وقت واحد." />
                                <InputField label="الحد الأقصى للصور لكل طلب" name="maxImagesPerOrder" desc="أقصى عدد من الصور يمكن للعميل رفعها لتوضيح تفاصيل الطلب." />
                            </div>
                        </Card>

                        {/* Security Limits */}
                        <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 shadow-md">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-green-800 dark:text-green-200"><Icon name="Shield" className="w-6 h-6" /> حدود الأمان</h3>
                            <div className="space-y-4">
                                <InputField label="الحد الأقصى لمحاولات التحقق" name="maxVerificationAttempts" desc="عدد المرات التي يمكن للمستخدم طلب رمز التحقق فيها قبل الحظر المؤقت." />
                                <InputField label="نافذة محاولات التحقق (بالدقائق)" name="verificationWindowMinutes" desc="المدة الزمنية التي يتم فيها حساب محاولات التحقق وإعادة تعيين العداد." />
                            </div>
                        </Card>

                        {/* Rate Limiting */}
                        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800 shadow-none">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-red-800 dark:text-red-200">
                                <Icon name="Shield" className="w-6 h-6" />
                                تحديد معدل الطلبات (Rate Limiting)
                            </h3>
                            <div className="space-y-4">
                                <InputField
                                    label="الحد الأقصى للطلبات API في الدقيقة"
                                    name="apiRateLimitPerMinute"
                                    desc="عدد طلبات API المسموحة لكل مستخدم/IP في الدقيقة الواحدة. (القيمة الافتراضية: 60)"
                                />
                                <InputField
                                    label="مدة الحظر عند التجاوز (بالثواني)"
                                    name="apiRateLimitDecaySeconds"
                                    desc="المدة التي يتم فيها حظر المستخدم بعد تجاوز الحد. (القيمة الافتراضية: 60)"
                                />
                                <div className="mt-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                                        <Icon name="AlertCircle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>
                                            <strong>تنبيه:</strong> تأكد من إعادة تشغيل السيرفر بعد تغيير هذه الإعدادات لتطبيق التغييرات. معدل منخفض جداً قد يؤثر على تجربة المستخدم.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Order Lifecycle Limits */}
                        <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="Clock" /> دورة حياة الطلب</h3>
                            <div className="space-y-4">
                                <InputField label="الحد الأقصى للعروض لكل طلب" name="maxQuotesPerOrder" desc="أقصى عدد من عروض الأسعار التي يمكن أن يستلمها طلب واحد." />
                                <InputField label="صلاحية عرض السعر (بالأيام)" name="quoteValidityDays" desc="المدة التي يبقى فيها عرض السعر صالحاً قبل انتهاء صلاحيته تلقائياً." />
                                <InputField label="إلغاء الطلب التلقائي بعد (يوم)" name="orderAutoCancelDays" desc="عدد الأيام التي يتم بعدها إلغاء الطلب القديم الذي لم يتم اتخاذ إجراء بشأنه." />
                            </div>
                        </Card>
                    </div>

                    {/* --- COLUMN 2 --- */}
                    <div className="space-y-8">
                        {/* Provider Limits */}
                        <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="Briefcase" /> حدود المزودين</h3>
                            <div className="space-y-4">
                                <InputField label="الحد الأقصى للصور لكل عرض سعر" name="maxImagesPerQuote" desc="عدد الصور المسموح للمزود إرفاقها لإثبات حالة القطعة." />
                                <InputField label="الحد الأقصى للعروض النشطة" name="maxActiveBidsPerProvider" desc="أقصى عدد من العروض المعلقة التي يمكن للمزود تقديمها في آن واحد." />
                                <InputField label="أيام عدم النشاط للتعطيل" name="providerInactivityDeactivationDays" desc="عدد الأيام التي يتم بعدها اعتبار حساب المزود غير نشط وإرسال تنبيه." />
                            </div>
                        </Card>

                        {/* Financial Limits */}
                        <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="Wallet" /> الحدود المالية والسحوبات</h3>
                            <div className="space-y-4">
                                <InputField label="أدنى مبلغ للسحب ($)" name="minWithdrawalAmount" desc="أقل مبلغ يمكن للمزود طلب سحبه من المحفظة." />
                                <InputField label="أقصى مبلغ للسحب ($)" name="maxWithdrawalAmount" desc="أعلى مبلغ مسموح به في عملية سحب واحدة." />
                                <InputField label="أقصى عدد طلبات سحب" name="maxWithdrawalRequestsPerPeriod" desc="عدد مرات السحب المسموح بها خلال الفترة المحددة." />
                                <InputField label="مدة فترة السحب (بالأيام)" name="withdrawalRequestsPeriodDays" desc="طول الفترة الزمنية لحساب عدد مرات السحب (مثلاً كل 30 يوم)." />
                                <InputField label="فترة الانتظار بين السحوبات (بالساعات)" name="withdrawalCooldownHours" desc="الوقت اللازم انتظاره بين طلب سحب وآخر." />
                                <InputField label="عتبة المعاملات عالية القيمة ($)" name="highValueTransactionThreshold" desc="المبلغ الذي سيؤدي تجاوزه في معاملة واحدة إلى إرسال إشعار أمان للمشرف." />
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="flex items-center gap-2 font-medium text-md mb-4 text-slate-700 dark:text-slate-300">حدود إيداع المستخدم</h4>
                                <div className="space-y-4">
                                    <InputField label="أدنى مبلغ للإيداع ($)" name="minDepositAmount" desc="أقل مبلغ يمكن للمستخدم إيداعه في المحفظة." />
                                    <InputField label="أقصى مبلغ للإيداع ($)" name="maxDepositAmount" desc="أعلى مبلغ يمكن للمستخدم إيداعه في عملية واحدة." />
                                    <InputField label="الحد الأقصى لرصيد المحفظة ($)" name="maxWalletBalance" desc="الحد الأقصى للرصيد الذي يمكن للمحفظة استيعابه." />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="flex items-center gap-2 font-medium text-md mb-4 text-slate-700 dark:text-slate-300">حدود سحب المستخدم</h4>
                                <div className="space-y-4">
                                    <InputField label="أدنى مبلغ للسحب ($)" name="userMinWithdrawalAmount" desc="أقل مبلغ يمكن للمستخدم (عميل/فني/سطحة) طلبه للسحب." />
                                    <InputField label="أقصى مبلغ للسحب ($)" name="userMaxWithdrawalAmount" desc="أعلى مبلغ يمكن للمستخدم طلبه للسحب." />
                                    <InputField label="فترة الانتظار بين السحوبات (ساعات)" name="userWithdrawalCooldownHours" desc="الوقت اللازم انتظاره بين طلبات السحب المتتالية." />
                                    <InputField label="أقصى عدد طلبات سحب في الفترة" name="userMaxWithdrawalRequestsPerPeriod" desc="الحد الأقصى لعدد مرات السحب خلال الفترة المحددة." />
                                </div>
                            </div>
                        </Card>

                        {/* File Upload Limits */}
                        <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="FileUp" /> حدود رفع الملفات</h3>
                            <div className="space-y-4">
                                <InputField label="أقصى حجم للصورة (MB)" name="maxImageSizeMB" desc="الحجم الأقصى المسموح به لملف الصورة الواحدة." />
                                <InputField label="أقصى حجم للفيديو (MB)" name="maxVideoSizeMB" desc="الحجم الأقصى المسموح به لملف الفيديو." />
                                <InputField label="أقصى حجم للملاحظة الصوتية (MB)" name="maxVoiceNoteSizeMB" desc="الحجم الأقصى المسموح به للملفات الصوتية." />
                            </div>
                        </Card>

                        {/* International License Limits */}
                        <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                            <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="Globe" /> رخصة القيادة الدولية</h3>
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        label="السعر (سوري) ($)"
                                        type="number"
                                        value={limits.international_license_settings?.syrian_price ?? 350}
                                        onChange={(e) => setLimits(prev => {
                                            const defaults = { syrian_price: 350, non_syrian_price: 650, license_duration: "1 Year", informations: "" };
                                            return {
                                                ...prev,
                                                international_license_settings: {
                                                    ...defaults,
                                                    ...(prev.international_license_settings || {}),
                                                    syrian_price: Number(e.target.value)
                                                }
                                            };
                                        })}
                                        className="text-left"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="السعر (غير سوري) ($)"
                                        type="number"
                                        value={limits.international_license_settings?.non_syrian_price ?? 650}
                                        onChange={(e) => setLimits(prev => {
                                            const defaults = { syrian_price: 350, non_syrian_price: 650, license_duration: "1 Year", informations: "" };
                                            return {
                                                ...prev,
                                                international_license_settings: {
                                                    ...defaults,
                                                    ...(prev.international_license_settings || {}),
                                                    non_syrian_price: Number(e.target.value)
                                                }
                                            };
                                        })}
                                        className="text-left"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="مدة الصلاحية"
                                        type="text"
                                        value={limits.international_license_settings?.license_duration ?? "1 Year"}
                                        onChange={(e) => setLimits(prev => {
                                            const defaults = { syrian_price: 350, non_syrian_price: 650, license_duration: "1 Year", informations: "" };
                                            return {
                                                ...prev,
                                                international_license_settings: {
                                                    ...defaults,
                                                    ...(prev.international_license_settings || {}),
                                                    license_duration: e.target.value
                                                }
                                            };
                                        })}
                                        className="text-left"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">معلومات إضافية</label>
                                    <textarea
                                        value={limits.international_license_settings?.informations ?? ""}
                                        onChange={(e) => setLimits(prev => {
                                            const defaults = { syrian_price: 350, non_syrian_price: 650, license_duration: "1 Year", informations: "" };
                                            return {
                                                ...prev,
                                                international_license_settings: {
                                                    ...defaults,
                                                    ...(prev.international_license_settings || {}),
                                                    informations: e.target.value
                                                }
                                            };
                                        })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-24"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg mt-4 border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">تفعيل الخدمة</label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تفعيل أو إيقاف استقبال طلبات جديدة</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={limits.international_license_settings?.is_active ?? true}
                                            onChange={(e) => setLimits(prev => {
                                                const defaults = { syrian_price: 350, non_syrian_price: 650, license_duration: "1 Year", informations: "", is_active: true };
                                                return {
                                                    ...prev,
                                                    international_license_settings: {
                                                        ...defaults,
                                                        ...(prev.international_license_settings || {}),
                                                        is_active: e.target.checked
                                                    }
                                                };
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 fs rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div className="col-span-1 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">طرق الدفع المتاحة</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                        {settings.paymentMethods.filter(pm => pm.isActive).map(pm => (
                                            <div key={pm.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`pm-${pm.id}`}
                                                    checked={limits.international_license_settings?.allowed_payment_methods?.includes(pm.id) ?? true} // Default to true if undefined
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setLimits(prev => {
                                                            const currentSettings = prev.international_license_settings || { syrian_price: 350, non_syrian_price: 650, license_duration: "1 Year", informations: "" };
                                                            const currentMethods = currentSettings.allowed_payment_methods || settings.paymentMethods.map(p => p.id);

                                                            let newMethods;
                                                            if (isChecked) {
                                                                newMethods = [...currentMethods, pm.id];
                                                            } else {
                                                                newMethods = currentMethods.filter(id => id !== pm.id);
                                                            }

                                                            return {
                                                                ...prev,
                                                                international_license_settings: {
                                                                    ...currentSettings,
                                                                    allowed_payment_methods: newMethods
                                                                }
                                                            };
                                                        });
                                                    }}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <label htmlFor={`pm-${pm.id}`} className="mr-2 block text-sm text-slate-900 dark:text-slate-300">
                                                    {pm.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">حدد طرق الدفع التي ستظهر للمستخدمين عند طلب رخصة دولية.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button type="submit" className="px-8 py-2.5 shadow-sm flex items-center gap-2">
                        <Icon name="Save" className="w-5 h-5" />
                        حفظ التغييرات
                    </Button>
                </div>
            </form >
        </div>
    );
};

export default LimitsSettingsView;
