import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../Icon';

interface AuctionPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    depositAmount: number;
}

export const AuctionPolicyModal: React.FC<AuctionPolicyModalProps> = ({
    isOpen,
    onClose,
    onAccept,
    depositAmount,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-3 rounded-xl">
                                            <Icon name="shield-check" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">شروط وأحكام المزاد</h2>
                                            <p className="text-blue-100 text-sm mt-1">يرجى القراءة بعناية قبل المتابعة</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    >
                                        <Icon name="x" className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {/* Deposit Warning */}
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-amber-500 p-2 rounded-lg flex-shrink-0">
                                            <Icon name="alert-triangle" className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg mb-2">
                                                تحذير هام - سياسة التأمين
                                            </h3>
                                            <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                                                <strong className="text-amber-900 dark:text-amber-100">إذا فزت بالمزاد ولم تكمل عملية الشراء، لن يتم إرجاع مبلغ التأمين البالغ {depositAmount.toLocaleString('ar-SA')} ريال.</strong> يرجى التأكد من جديتك في الشراء قبل التسجيل.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms List */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">شروط المشاركة في المزاد:</h3>

                                    <div className="space-y-3">
                                        <PolicyItem
                                            icon="lock"
                                            title="حجز مبلغ التأمين"
                                            description={`سيتم حجز مبلغ ${depositAmount.toLocaleString('ar-SA')} ريال من محفظتك كتأمين للمشاركة في المزاد. هذا المبلغ سيبقى محجوزاً حتى نهاية المزاد.`}
                                        />

                                        <PolicyItem
                                            icon="credit-card"
                                            title="المزايدة حسب الرصيد"
                                            description="يمكنك المزايدة بأي مبلغ متوفر في رصيد محفظتك. تأكد من وجود رصيد كافٍ قبل تقديم عرضك."
                                        />

                                        <PolicyItem
                                            icon="trophy"
                                            title="في حالة الفوز"
                                            description="إذا فزت بالمزاد، سيتواصل معك المسؤول لإتمام عملية الشراء خلال 24 ساعة. يرجى الاستعداد لإتمام الدفع."
                                        />

                                        <PolicyItem
                                            icon="x-circle"
                                            title="عدم إتمام الشراء"
                                            description="في حالة الفوز وعدم إتمام عملية الشراء، سيتم مصادرة مبلغ التأمين بالكامل ولن يتم إرجاعه."
                                        />

                                        <PolicyItem
                                            icon="rotate-ccw"
                                            title="استرجاع التأمين"
                                            description="إذا لم تفز بالمزاد، سيتم إرجاع مبلغ التأمين تلقائياً إلى محفظتك بعد انتهاء المزاد."
                                        />

                                        <PolicyItem
                                            icon="shield"
                                            title="الخصوصية والبيانات"
                                            description="سيتم استخدام بياناتك فقط لأغراض المزاد والتواصل معك في حالة الفوز. نحن نحترم خصوصيتك ولن نشارك معلوماتك مع أطراف ثالثة."
                                        />

                                        <PolicyItem
                                            icon="check-circle"
                                            title="الالتزام بالشروط"
                                            description="بالموافقة على هذه الشروط، أنت تلتزم بجميع القواعد والسياسات المذكورة أعلاه."
                                        />
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <Icon name="info" className="w-4 h-4 inline mr-2" />
                                        للمزيد من المعلومات أو الاستفسارات، يرجى التواصل مع فريق الدعم.
                                    </p>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-gray-50 dark:bg-gray-900 p-6 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={onAccept}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                >
                                    <Icon name="check" className="w-5 h-5 mr-2" />
                                    أوافق على الشروط والأحكام
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

// Helper component for policy items
interface PolicyItemProps {
    icon: string;
    title: string;
    description: string;
}

const PolicyItem: React.FC<PolicyItemProps> = ({ icon, title, description }) => (
    <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Icon name={icon} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

export default AuctionPolicyModal;
