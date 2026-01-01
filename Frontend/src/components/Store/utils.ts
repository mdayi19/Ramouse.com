
import { FlashProductRequestStatus } from '../../types';

export const getStatusLabel = (status: FlashProductRequestStatus) => {
    switch (status) {
        case 'pending': return 'بانتظار الموافقة';
        case 'payment_verification': return 'جاري التحقق من الدفع';
        case 'preparing': return 'جاري التجهيز';
        case 'shipped': return 'تم الشحن';
        case 'delivered': return 'تم التوصيل';
        case 'rejected': return 'مرفوض';
        case 'cancelled': return 'ملغي';
        case 'approved': return 'مقبول';
        default: return status;
    }
};

export const getStatusColor = (status: FlashProductRequestStatus) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case 'payment_verification': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'shipped': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
        case 'delivered': case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
};
