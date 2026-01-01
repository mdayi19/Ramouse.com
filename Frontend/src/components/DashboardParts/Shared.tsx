
import React, { useState } from 'react';
import { OrderStatus, WithdrawalStatus, Provider, FlashProductRequestStatus } from '../../types';
import Icon from '../Icon';
import Modal from '../Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ViewHeader: React.FC<{ title: string; subtitle: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in-down">
        <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base font-medium">{subtitle}</p>
        </div>
        {actions && <div className="flex gap-3 shrink-0">{actions}</div>}
    </div>
);

export const getStatusColorClasses = (status: OrderStatus | WithdrawalStatus | FlashProductRequestStatus): string => {
    switch (status as string) {
        // Pending statuses
        case 'pending': case 'Pending': case 'قيد المراجعة':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700';

        // Quoted status
        case 'quoted': case 'تم استلام عروض':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';

        // Payment pending
        case 'payment_pending': case 'بانتظار تأكيد الدفع': case 'payment_verification':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700';

        // Processing/Preparing
        case 'processing': case 'جاري التجهيز': case 'preparing':
            return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700';

        // Provider received
        case 'provider_received': case 'تم الاستلام من المزود':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';

        // Ready for pickup
        case 'ready_for_pickup': case 'جاهز للاستلام':
            return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700';

        // Shipped
        case 'shipped': case 'تم الشحن للعميل':
            return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700';

        // Out for delivery
        case 'out_for_delivery': case 'قيد التوصيل':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';

        // Delivered/Completed
        case 'delivered': case 'completed': case 'تم التوصيل': case 'تم الاستلام من الشركة':
            return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700';

        // Approved
        case 'Approved': case 'approved': case 'تمت الموافقة':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';

        // Cancelled/Rejected
        case 'cancelled': case 'ملغي': case 'Rejected': case 'rejected': case 'مرفوض':
            return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700';

        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
};

import { Badge } from '../ui/Badge';

export const StatusBadge: React.FC<{ status: OrderStatus | WithdrawalStatus | FlashProductRequestStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
    const getStatusText = (s: string) => {
        switch (s) {
            // Order statuses
            case 'pending': return 'قيد المراجعة';
            case 'quoted': return 'تم استلام عروض';
            case 'payment_pending': return 'بانتظار تأكيد الدفع';
            case 'processing': return 'جاري التجهيز';
            case 'ready_for_pickup': return 'جاهز للاستلام';
            case 'provider_received': return 'تم الاستلام من المزود';
            case 'shipped': return 'تم الشحن للعميل';
            case 'out_for_delivery': return 'قيد التوصيل';
            case 'delivered': return 'تم التوصيل';
            case 'completed': return 'تم الاستلام من الشركة';
            case 'cancelled': return 'ملغي';

            // Withdrawal statuses
            case 'Pending': return 'قيد المراجعة';
            case 'Approved': case 'approved': return 'تمت الموافقة';
            case 'Rejected': case 'rejected': return 'مرفوض';

            // Flash product request statuses
            case 'payment_verification': return 'بانتظار تأكيد الدفع';
            case 'preparing': return 'جاري التجهيز';

            // Default - return as is (for legacy Arabic statuses)
            default: return s;
        }
    };

    const getVariant = (s: string): any => {
        switch (s as string) {
            case 'pending': case 'Pending': case 'قيد المراجعة': return 'warning';
            case 'quoted': case 'تم استلام عروض': return 'purple';
            case 'payment_pending': case 'بانتظار تأكيد الدفع': case 'payment_verification': return 'orange';
            case 'processing': case 'جاري التجهيز': case 'preparing': return 'sky';
            case 'provider_received': case 'تم الاستلام من المزود': return 'info';
            case 'ready_for_pickup': case 'جاهز للاستلام': return 'teal';
            case 'shipped': case 'تم الشحن للعميل': return 'indigo';
            case 'out_for_delivery': case 'قيد التوصيل': return 'purple';
            case 'delivered': case 'completed': case 'تم التوصيل': case 'تم الاستلام من الشركة': case 'Approved': case 'approved': case 'تمت الموافقة': return 'success';
            case 'cancelled': case 'ملغي': case 'Rejected': case 'rejected': case 'مرفوض': return 'destructive';
            default: return 'secondary';
        }
    }

    return (
        <Badge variant={getVariant(status)} className={`whitespace-nowrap shadow-sm ${size === 'sm' ? 'text-[10px] px-2 py-0.5 h-auto' : ''}`}>
            {getStatusText(status)}
        </Badge>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    iconClassName?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendDirection, trendLabel = "مقارنة بالشهر الماضي", iconClassName = "bg-primary/10 text-primary", className }) => (
    <div className={`bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group ${className}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconClassName}`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-xs font-bold">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${trendDirection === 'up' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    trendDirection === 'down' ? 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400' :
                        'text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                    {trendDirection === 'up' && <Icon name="TrendingUp" className="w-3 h-3" />}
                    {trendDirection === 'down' && <Icon name="TrendingDown" className="w-3 h-3" />}
                    {trendDirection === 'neutral' && <Icon name="Minus" className="w-3 h-3" />}
                    {trend}
                </span>
                <span className="text-slate-400 ml-2">{trendLabel}</span>
            </div>
        )}
    </div>
);

export const AddFundsModal: React.FC<{
    provider: Provider;
    onClose: () => void;
    onConfirm: (providerId: string, amount: number, description: string) => Promise<void>;
}> = ({ provider, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            setIsSubmitting(true);
            try {
                await onConfirm(provider.id, numAmount, description);
                onClose(); // Close modal on success
            } catch (error) {
                console.error('Error in AddFundsModal:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    return (
        <Modal title={`إضافة رصيد إلى ${provider.name}`} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <Input
                        label="المبلغ ($)"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        className="text-left"
                        dir="ltr"
                        min="0"
                    />
                </div>
                <div>
                    <Input
                        label="الوصف (اختياري)"
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="مثال: تسوية رصيد"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                        disabled={isSubmitting}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="primary"
                        className="font-bold flex items-center gap-2"
                        disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                    >
                        {isSubmitting && <Icon name="Loader" className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'جاري الإضافة...' : 'تأكيد الإضافة'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export { Icon };
export const EditIcon: React.FC<{ className?: string }> = ({ className }) => <Icon name="Pencil" className={className} />;
export const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => <Icon name="Trash2" className={className} />;
export const WrenchScrewdriverIcon: React.FC<{ className?: string }> = ({ className }) => <Icon name="Wrench" className={className} />;
