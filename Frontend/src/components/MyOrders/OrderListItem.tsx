import React from 'react';
import { Order } from '../../types';
import { StatusBadge } from '../DashboardParts/Shared';
import Icon from '../Icon';

// Status emoji mapping for visual clarity
const getStatusEmoji = (status: string): string => {
    switch (status) {
        case 'pending':
        case 'قيد المراجعة': return '⏳';
        case 'quoted':
        case 'تم استلام عروض': return '💬';
        case 'payment_pending':
        case 'بانتظار الدفع': return '💳';
        case 'processing':
        case 'جاري التجهيز': return '🔧';
        case 'shipped':
        case 'تم الشحن': return '🚚';
        case 'delivered':
        case 'تم التوصيل': return '✅';
        case 'completed':
        case 'مكتمل': return '🎉';
        case 'cancelled':
        case 'ملغي': return '❌';
        default: return '📦';
    }
};

// Simple, friendly status text
const getSimpleStatus = (status: string): string => {
    switch (status) {
        case 'pending':
        case 'قيد المراجعة': return 'ننتظر العروض';
        case 'quoted':
        case 'تم استلام عروض': return 'لديك عروض! 🎉';
        case 'payment_pending':
        case 'بانتظار الدفع': return 'أرسل الإيصال';
        case 'processing':
        case 'جاري التجهيز': return 'يتم تجهيزه';
        case 'shipped':
        case 'تم الشحن': return 'في الطريق إليك!';
        case 'delivered':
        case 'تم التوصيل': return 'تم التوصيل ✅';
        case 'completed':
        case 'مكتمل': return 'مكتمل 🎉';
        case 'cancelled':
        case 'ملغي': return 'ملغي';
        default: return status;
    }
};

const OrderListItem: React.FC<{
    order: Order;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ order, isSelected, onSelect }) => {
    const hasNewQuotes = order.quotes?.some(q => !q.viewedByCustomer);
    const hasRejectedPayment = !!order.rejectionReason;
    const quotesCount = order.quotes?.length || 0;

    // Defensive check for formData
    const formData = order.formData || (order as any).form_data;

    // If formData is still missing, render a fallback
    if (!formData) {
        return (
            <div className="p-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
        );
    }

    return (
        <button
            onClick={() => {
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(30);
                onSelect();
            }}
            className={`w-full text-right p-3 sm:p-5 mb-2 sm:mb-3 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 relative group active:scale-[0.98] touch-manipulation overflow-hidden ${isSelected
                ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-900 border-primary-500 shadow-xl shadow-primary-500/20'
                : hasRejectedPayment
                    ? 'bg-red-50/50 border-red-300 dark:bg-red-900/10 dark:border-red-900/30'
                    : hasNewQuotes
                        ? 'bg-gradient-to-br from-secondary-50 to-amber-50 dark:from-secondary-900/20 dark:to-slate-900 border-secondary-300 dark:border-secondary-700 shadow-lg'
                        : 'bg-white dark:bg-darkcard border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
                }`}
        >
            {/* NEW QUOTES BANNER - Compact on mobile */}
            {hasNewQuotes && !isSelected && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-secondary-500 to-orange-500 text-white text-[10px] sm:text-sm font-black py-1 sm:py-1.5 px-2 sm:px-4 text-center animate-pulse">
                    🔔 عروض جديدة!
                </div>
            )}

            {/* REJECTED PAYMENT BANNER */}
            {hasRejectedPayment && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] sm:text-sm font-black py-1 sm:py-1.5 px-2 sm:px-4 text-center">
                    ⚠️ إعادة رفع الإيصال
                </div>
            )}

            <div className={`flex items-center gap-2 sm:gap-4 ${hasNewQuotes && !isSelected || hasRejectedPayment ? 'mt-6 sm:mt-8' : ''}`}>
                {/* STATUS EMOJI - Smaller on mobile */}
                <div className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl ${isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/40'
                    : hasNewQuotes
                        ? 'bg-secondary-100 dark:bg-secondary-900/40'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                    {getStatusEmoji(order.status)}

                    {/* New quotes indicator dot */}
                    {hasNewQuotes && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-red-500 border-2 border-white dark:border-darkcard text-[8px] sm:text-[10px] font-black text-white items-center justify-center">
                                {quotesCount}
                            </span>
                        </span>
                    )}
                </div>

                {/* Main Content - Compact on mobile */}
                <div className="flex-1 min-w-0">
                    {/* Car info */}
                    <h3 className={`font-black text-base sm:text-xl leading-tight mb-0.5 sm:mb-1 truncate ${isSelected ? 'text-primary-900 dark:text-primary-50' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                        🚗 {formData.brand || 'سيارة'} {formData.model || ''}
                    </h3>

                    {/* Simple status */}
                    <p className={`text-xs sm:text-base font-bold mb-1 sm:mb-2 ${hasNewQuotes
                        ? 'text-secondary-600 dark:text-secondary-400'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {getSimpleStatus(order.status)}
                    </p>

                    {/* Date and quotes - Single line on mobile */}
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-sm text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                            📅 {new Date(order.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })}
                        </span>
                        {quotesCount > 0 && (
                            <span className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${hasNewQuotes
                                ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/50 dark:text-secondary-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                💬 {quotesCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Chevron arrow - Smaller on mobile */}
                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-600'
                    }`}>
                    <Icon name="ChevronLeft" className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </div>
        </button>
    );
};

export default OrderListItem;
