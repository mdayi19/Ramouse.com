import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { getEcho } from '../../lib/echo';

import Icon from '../Icon';
import { InternationalLicenseRequest } from '../../types';
import {
    StatusBadge,
    getStatusConfig,
    RequestCardSkeleton,
    EmptyState,
    INTERNATIONAL_LICENSE_STEPS,
    formatCurrency,
    formatDate
} from './InternationalLicenseComponents';
import InternationalLicenseRequestModal from './InternationalLicenseRequestModal';
import InternationalLicenseModal from '../InternationalLicenseModal';
import Pagination from '../Pagination';


const ITEMS_PER_PAGE = 10;

interface UserInternationalLicenseViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const STEPS = INTERNATIONAL_LICENSE_STEPS;

const UserInternationalLicenseView: React.FC<UserInternationalLicenseViewProps> = ({ showToast }) => {
    // State
    const [requests, setRequests] = useState<InternationalLicenseRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<InternationalLicenseRequest | null>(null);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch user's requests
    const fetchRequests = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await api.get('/international-license/my-requests');
            setRequests(response.data.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            showToast('فشل في تحميل الطلبات', 'error');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Real-time listener for international license status changes
    useEffect(() => {
        // Get current user ID from localStorage
        let userId: string | number | null = null;
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = user.user_id || user.id;
            }
        } catch (e) {
            console.error('Failed to parse currentUser for ID', e);
        }

        if (!userId) return;

        const echo = getEcho();
        if (!echo) return;

        console.log(`🔔 UserInternationalLicenseView: Listening for license updates for user ${userId}`);

        const channel = echo.private(`user.${userId}`);

        const handleLicenseUpdate = (data: any) => {
            console.log('📋 License status changed:', data);
            // Refresh the requests list when status changes
            fetchRequests(true);

            // Show toast notification
            if (data.license_request) {
                const statusMessages: Record<string, string> = {
                    'payment_check': 'جاري فحص الدفع لطلبك',
                    'documents_check': 'جاري فحص المستندات لطلبك',
                    'in_work': 'طلب الرخصة الدولية قيد التجهيز',
                    'ready_to_handle': '🎉 رخصتك الدولية جاهزة للتسليم!',
                    'rejected': 'يرجى مراجعة طلب الرخصة الدولية',
                };
                const message = statusMessages[data.license_request.status] || 'تم تحديث حالة طلب الرخصة الدولية';
                showToast(message, data.license_request.status === 'rejected' ? 'error' : 'info');
            }
        };

        channel.listen('.international-license.status.changed', handleLicenseUpdate);

        return () => {
            console.log('🔴 UserInternationalLicenseView: Cleaning up license update listener');
            echo.leave(`user.${userId}`);
        };
    }, [fetchRequests, showToast]);


    // Calculate progress percentage
    const getProgress = useCallback((status: string) => {
        if (status === 'rejected') return 0;
        const currentIndex = STEPS.findIndex(s => s.id === status);
        if (currentIndex === -1) return 0;
        return Math.round(((currentIndex + 1) / STEPS.length) * 100);
    }, []);

    // Get status message for user
    const getStatusMessage = useCallback((request: InternationalLicenseRequest) => {
        switch (request.status) {
            case 'pending':
                return {
                    icon: 'Clock',
                    color: 'slate',
                    title: 'طلبك قيد الانتظار',
                    message: 'سيتم مراجعة طلبك قريباً من قبل الإدارة',
                    action: null
                };
            case 'payment_check':
                return {
                    icon: 'CreditCard',
                    color: 'amber',
                    title: 'جاري فحص الدفع',
                    message: 'يتم التحقق من إثبات الدفع الخاص بك',
                    action: null
                };
            case 'documents_check':
                return {
                    icon: 'FileSearch',
                    color: 'violet',
                    title: 'جاري فحص المستندات',
                    message: 'يتم مراجعة المستندات المرفقة',
                    action: null
                };
            case 'in_work':
                return {
                    icon: 'Briefcase',
                    color: 'blue',
                    title: 'قيد التجهيز',
                    message: 'جاري تجهيز رخصتك الدولية',
                    action: null
                };
            case 'ready_to_handle':
                return {
                    icon: 'CheckCircle',
                    color: 'emerald',
                    title: 'جاهزة للتسليم! 🎉',
                    message: 'رخصتك الدولية جاهزة، يرجى التواصل لاستلامها',
                    action: null
                };
            case 'rejected':
                // Check for payment rejection (using type or legacy rejected_documents check)
                const isPaymentRejected = request.rejection_type === 'payment' ||
                    (!request.rejection_type && request.rejected_documents?.includes('proof_of_payment'));

                // Check for document rejection
                const isDocRejected = request.rejection_type === 'documents' ||
                    (request.rejected_documents && request.rejected_documents.length > 0 && !isPaymentRejected);
                if (isPaymentRejected) {
                    return {
                        icon: 'AlertTriangle',
                        color: 'red',
                        title: 'تم رفض إثبات الدفع',
                        message: request.rejection_reason || 'يرجى إعادة رفع إثبات الدفع',
                        action: 'reupload_payment'
                    };
                } else if (isDocRejected) {
                    return {
                        icon: 'AlertTriangle',
                        color: 'red',
                        title: 'تم رفض بعض المستندات',
                        message: request.rejection_reason || 'يرجى إعادة رفع المستندات المرفوضة',
                        action: 'reupload_documents'
                    };
                }
                return {
                    icon: 'XCircle',
                    color: 'red',
                    title: 'تم رفض الطلب',
                    message: request.rejection_reason || 'تم رفض طلبك',
                    action: null
                };
            default:
                return {
                    icon: 'HelpCircle',
                    color: 'slate',
                    title: 'حالة غير معروفة',
                    message: '',
                    action: null
                };
        }
    }, []);

    // Render request card
    const renderRequestCard = (request: InternationalLicenseRequest) => {
        const statusConfig = getStatusConfig(request.status);
        const statusInfo = getStatusMessage(request);
        const progress = getProgress(request.status);
        const isRejected = request.status === 'rejected';
        const isCompleted = request.status === 'ready_to_handle';

        return (
            <div
                key={request.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border-2 overflow-hidden
                    transition-all duration-300 hover:shadow-xl ${isCompleted
                        ? 'border-emerald-300 dark:border-emerald-700'
                        : isRejected
                            ? 'border-red-300 dark:border-red-700'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                    }`}
            >
                {/* Status Indicator Bar */}
                <div className={`h-2 bg-gradient-to-r ${statusConfig.bgGradient}`} />

                {/* Header */}
                <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                                طلب #{request.order_number}
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                                {request.full_name}
                            </h3>
                        </div>
                        <StatusBadge status={request.status} size="sm" />
                    </div>

                    {/* Progress Bar */}
                    {!isRejected && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>التقدم</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${statusConfig.bgGradient} 
                                        transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {/* Step Indicators */}
                            <div className="flex justify-between mt-2">
                                {STEPS.map((step, index) => {
                                    const currentIndex = STEPS.findIndex(s => s.id === request.status);
                                    const isActive = index <= currentIndex;
                                    const isCurrent = index === currentIndex;
                                    return (
                                        <div
                                            key={step.id}
                                            className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-slate-300 dark:text-slate-600'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${isCurrent
                                                ? 'bg-primary ring-4 ring-primary/20'
                                                : isActive
                                                    ? 'bg-primary'
                                                    : 'bg-slate-300 dark:bg-slate-600'
                                                }`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    <div className={`p-4 rounded-xl bg-${statusInfo.color}-50 dark:bg-${statusInfo.color}-900/20 
                        border border-${statusInfo.color}-200 dark:border-${statusInfo.color}-800`}>
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-${statusInfo.color}-100 
                                dark:bg-${statusInfo.color}-900/30 flex items-center justify-center 
                                text-${statusInfo.color}-600 dark:text-${statusInfo.color}-400 flex-shrink-0`}>
                                <Icon name={statusInfo.icon} size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold text-${statusInfo.color}-700 
                                    dark:text-${statusInfo.color}-300`}>
                                    {statusInfo.title}
                                </h4>
                                <p className={`text-sm text-${statusInfo.color}-600 
                                    dark:text-${statusInfo.color}-400 mt-1`}>
                                    {statusInfo.message}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center justify-between mt-4 pt-4 
                        border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Icon name="DollarSign" size={14} />
                                <span className="font-semibold text-primary">
                                    {formatCurrency(request.price)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Icon name="Calendar" size={14} />
                                <span>{formatDate(request.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-5 pb-5 flex gap-3">
                    <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 
                            text-slate-700 dark:text-slate-300 rounded-xl font-medium 
                            hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors
                            flex items-center justify-center gap-2"
                    >
                        <Icon name="Eye" size={18} />
                        <span>عرض التفاصيل</span>
                    </button>

                    {statusInfo.action && (
                        <button
                            onClick={() => setSelectedRequest(request)}
                            className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark 
                                text-white rounded-xl font-medium transition-colors
                                flex items-center justify-center gap-2"
                        >
                            <Icon name="Upload" size={18} />
                            <span>إعادة الرفع</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 
            dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">

            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Icon name="Globe" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">رخصتي الدولية</h1>
                            <p className="text-white/80 text-sm">تتبع طلبات الرخصة الدولية</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchRequests(true)}
                            disabled={isRefreshing}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                        >
                            <Icon name="RefreshCw" size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowNewRequestModal(true)}
                            className="px-5 py-3 bg-white text-violet-600 hover:bg-violet-50 
                                rounded-xl font-semibold transition-colors flex items-center gap-2"
                        >
                            <Icon name="Plus" size={20} />
                            <span>طلب جديد</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            {requests.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'الكل', value: requests.length, icon: 'Layers', color: 'slate' },
                        { label: 'قيد المعالجة', value: requests.filter(r => !['ready_to_handle', 'rejected'].includes(r.status)).length, icon: 'Clock', color: 'amber' },
                        { label: 'مكتملة', value: requests.filter(r => r.status === 'ready_to_handle').length, icon: 'CheckCircle', color: 'emerald' },
                        { label: 'تحتاج إجراء', value: requests.filter(r => r.status === 'rejected').length, icon: 'AlertTriangle', color: 'red' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 
                                dark:border-slate-700 flex items-center gap-3`}
                        >
                            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 
                                flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                <Icon name={stat.icon} size={18} />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-slate-500">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                        <RequestCardSkeleton key={i} viewMode="grid" />
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-violet-100 dark:bg-violet-900/30 rounded-full 
                        flex items-center justify-center mx-auto mb-6">
                        <Icon name="Globe" size={40} className="text-violet-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        لا توجد طلبات حتى الآن
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        ابدأ بتقديم طلب للحصول على رخصة قيادة دولية معترف بها عالمياً
                    </p>
                    <button
                        onClick={() => setShowNewRequestModal(true)}
                        className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 
                            text-white rounded-xl font-semibold hover:opacity-90 
                            transition-opacity flex items-center gap-2 mx-auto"
                    >
                        <Icon name="Plus" size={20} />
                        <span>تقديم طلب جديد</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Sort: rejected first (need action), then by date */}
                    {[...requests]
                        .sort((a, b) => {
                            if (a.status === 'rejected' && b.status !== 'rejected') return -1;
                            if (b.status === 'rejected' && a.status !== 'rejected') return 1;
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        })
                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                        .map(renderRequestCard)}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && requests.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(requests.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                    totalItems={requests.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            )}

            {/* New Request Modal */}
            {showNewRequestModal && (
                <InternationalLicenseModal
                    onClose={() => setShowNewRequestModal(false)}
                    onSuccess={(orderNumber: string) => {
                        showToast(`تم إنشاء الطلب ${orderNumber} بنجاح`, 'success');
                        setShowNewRequestModal(false);
                        fetchRequests();
                    }}
                />
            )}

            {/* Request Detail Modal */}
            {selectedRequest && (
                <InternationalLicenseRequestModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    showToast={showToast}
                    steps={STEPS}
                    isReadOnly={true}
                    onReuploadSuccess={() => {
                        setSelectedRequest(null);
                        fetchRequests();
                    }}
                />
            )}
        </div>
    );
};

export default UserInternationalLicenseView;