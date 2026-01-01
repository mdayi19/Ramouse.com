import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminAPI } from '../../lib/api';
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
import Modal from '../Modal';
import Pagination from '../Pagination';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

const ITEMS_PER_PAGE = 10;

interface InternationalLicenseManagementViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type ViewMode = 'kanban' | 'list';

// Workflow columns configuration
const WORKFLOW_COLUMNS = [
    { id: 'pending', label: 'قيد الانتظار', icon: 'Clock', color: 'slate', gradient: 'from-slate-500 to-slate-600' },
    { id: 'payment_check', label: 'فحص الدفع', icon: 'CreditCard', color: 'amber', gradient: 'from-amber-500 to-orange-600' },
    { id: 'documents_check', label: 'فحص المستندات', icon: 'FileText', color: 'violet', gradient: 'from-violet-500 to-purple-600' },
    { id: 'in_work', label: 'قيد العمل', icon: 'Briefcase', color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
    { id: 'ready_to_handle', label: 'جاهز للتسليم', icon: 'CheckCircle', color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
];

const STEPS = INTERNATIONAL_LICENSE_STEPS;

const InternationalLicenseManagementView: React.FC<InternationalLicenseManagementViewProps> = ({ showToast }) => {
    // Core State
    const [requests, setRequests] = useState<InternationalLicenseRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<InternationalLicenseRequest | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Rejection State
    const [rejectingRequest, setRejectingRequest] = useState<InternationalLicenseRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectedDocuments, setRejectedDocuments] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // Fetch requests
    const fetchRequests = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const response = await adminAPI.getInternationalLicenseRequests();
            const data = response.data?.data || response.data || [];
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            showToast('فشل في تحميل الطلبات', 'error');
            setRequests([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);


    // Update status
    const handleStatusUpdate = useCallback(async (
        id: number,
        status: string,
        note?: string,
        rejectedDocs?: string[]
    ) => {
        setIsUpdating(true);
        try {
            let rejectionType: 'payment' | 'documents' | 'other' | undefined;
            if (status === 'rejected' && rejectedDocs) {
                if (rejectedDocs.includes('proof_of_payment')) {
                    rejectionType = 'payment';
                } else if (rejectedDocs.length > 0) {
                    rejectionType = 'documents';
                } else {
                    rejectionType = 'other';
                }
            }

            await adminAPI.updateInternationalLicenseStatus(
                id.toString(),
                status,
                note,
                rejectionType,
                rejectedDocs
            );
            showToast('تم تحديث الحالة بنجاح ✓', 'success');

            setRequests(prev => prev.map(r =>
                r.id === id ? {
                    ...r,
                    status: status as any,
                    admin_note: note || r.admin_note,
                    rejected_documents: status === 'rejected' ? rejectedDocs : undefined
                } : r
            ));

            setRejectingRequest(null);
            setSelectedRequest(null);
            setRejectReason('');
            setRejectedDocuments([]);
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast('فشل في تحديث الحالة', 'error');
        } finally {
            setIsUpdating(false);
        }
    }, [showToast]);

    // Quick actions for each status
    const getNextAction = (request: InternationalLicenseRequest) => {
        switch (request.status) {
            case 'pending':
                return { label: 'بدء مراجعة الدفع', nextStatus: 'payment_check', icon: 'CreditCard', gradient: 'from-amber-500 to-orange-600' };
            case 'payment_check':
                return { label: 'موافقة على الدفع', nextStatus: 'documents_check', icon: 'Check', gradient: 'from-violet-500 to-purple-600' };
            case 'documents_check':
                return { label: 'موافقة على المستندات', nextStatus: 'in_work', icon: 'Check', gradient: 'from-blue-500 to-cyan-600' };
            case 'in_work':
                return { label: 'جاهز للتسليم', nextStatus: 'ready_to_handle', icon: 'CheckCircle', gradient: 'from-emerald-500 to-teal-600' };
            default:
                return null;
        }
    };

    // Filter requests by search and status
    const filteredRequests = useMemo(() => {
        const requestList = Array.isArray(requests) ? requests : [];
        let filtered = requestList;

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.full_name?.toLowerCase().includes(query) ||
                r.order_number?.toLowerCase().includes(query) ||
                r.phone?.includes(query)
            );
        }

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(r => r.status === filterStatus);
        }

        return filtered;
    }, [requests, searchQuery, filterStatus]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredRequests, currentPage]);

    // Group requests by status for Kanban
    const requestsByStatus = useMemo(() => {
        const grouped: Record<string, InternationalLicenseRequest[]> = {};
        const requestList = Array.isArray(paginatedRequests) ? paginatedRequests : [];
        WORKFLOW_COLUMNS.forEach(col => {
            grouped[col.id] = requestList.filter(r => r.status === col.id);
        });
        grouped['rejected'] = requestList.filter(r => r.status === 'rejected');
        return grouped;
    }, [filteredRequests]);

    // Stats
    const stats = useMemo(() => {
        const requestList = Array.isArray(requests) ? requests : [];
        return {
            total: requestList.length,
            pending: requestList.filter(r => r.status === 'pending').length,
            payment: requestList.filter(r => r.status === 'payment_check').length,
            documents: requestList.filter(r => r.status === 'documents_check').length,
            inWork: requestList.filter(r => r.status === 'in_work').length,
            ready: requestList.filter(r => r.status === 'ready_to_handle').length,
            rejected: requestList.filter(r => r.status === 'rejected').length,
        };
    }, [requests]);

    // Render compact card for Kanban
    const renderKanbanCard = (request: InternationalLicenseRequest) => {
        const nextAction = getNextAction(request);

        return (
            <Card
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="group p-4 cursor-pointer hover:shadow-xl hover:border-primary border-2 border-slate-200 dark:border-slate-700 hover:-translate-y-1 transition-all duration-300 relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 
                        group-hover:text-primary transition-colors">
                        #{request.order_number}
                    </span>
                    <span className="text-base font-black text-primary">
                        {formatCurrency(request.price)}
                    </span>
                </div>

                {/* Name */}
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 
                    group-hover:text-primary transition-colors">
                    {request.full_name}
                </h4>

                {/* Phone */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                    <Icon name="Phone" size={14} />
                    <span dir="ltr" className="font-medium">{request.phone}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-3 
                    pb-3 border-b border-slate-100 dark:border-slate-700">
                    <Icon name="Calendar" size={12} />
                    <span>{formatDate(request.created_at)}</span>
                </div>

                {/* Quick Action */}
                {nextAction && request.status !== 'rejected' && (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(request.id, nextAction.nextStatus);
                        }}
                        disabled={isUpdating}
                        className={`w-full bg-gradient-to-r ${nextAction.gradient}
                            hover:opacity-90 text-white shadow-sm hover:shadow-md border-0`}
                    >
                        <Icon name={nextAction.icon} size={16} className="mr-2" />
                        {nextAction.label}
                    </Button>
                )}

                {/* Reject button */}
                {(request.status === 'payment_check' || request.status === 'documents_check') && (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setRejectingRequest(request);
                        }}
                        variant="danger"
                        className="w-full mt-2 bg-red-50 dark:bg-red-900/20 
                            hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 
                            border border-red-200 dark:border-red-800 shadow-none hover:shadow-none"
                    >
                        <Icon name="XCircle" size={16} className="mr-2" />
                        رفض
                    </Button>
                )}
            </Card>
        );
    };


    // Render list view row
    const renderListRow = (request: InternationalLicenseRequest) => {
        const statusConfig = getStatusConfig(request.status);
        const nextAction = getNextAction(request);

        return (
            <Card
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="group flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-700 cursor-pointer 
                    hover:shadow-xl hover:border-primary hover:-translate-y-0.5 transition-all duration-300"
            >
                {/* Status Indicator */}
                <div className={`w-1 h-16 rounded-full bg-gradient-to-b ${statusConfig.bgGradient} 
                    shadow-sm group-hover:shadow-md transition-shadow`} />

                {/* Order Number */}
                <div className="w-28 flex-shrink-0">
                    <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 
                        group-hover:text-primary transition-colors">
                        #{request.order_number}
                    </span>
                </div>

                {/* Name & Phone */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate 
                        group-hover:text-primary transition-colors">
                        {request.full_name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                        <Icon name="Phone" size={12} />
                        <span dir="ltr" className="font-medium">{request.phone}</span>
                    </div>
                </div>

                {/* Status */}
                <div className="w-36 flex-shrink-0">
                    <StatusBadge status={request.status} size="md" />
                </div>

                {/* Price */}
                <div className="w-24 flex-shrink-0 text-left">
                    <span className="text-lg font-black text-primary">{formatCurrency(request.price)}</span>
                </div>

                {/* Date */}
                <div className="w-32 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Icon name="Calendar" size={12} />
                        <span className="font-medium">{formatDate(request.created_at)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {nextAction && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(request.id, nextAction.nextStatus);
                            }}
                            disabled={isUpdating}
                            className={`p-2 bg-gradient-to-br ${nextAction.gradient} hover:opacity-90 
                                text-white border-0 shadow-sm hover:shadow-md h-auto`}
                            title={nextAction.label}
                        >
                            <Icon name={nextAction.icon} size={18} />
                        </Button>
                    )}
                    {(request.status === 'payment_check' || request.status === 'documents_check') && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setRejectingRequest(request);
                            }}
                            variant="danger"
                            className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 
                                dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 
                                border border-red-200 dark:border-red-800 h-auto shadow-none"
                            title="رفض"
                        >
                            <Icon name="XCircle" size={18} />
                        </Button>
                    )}
                </div>
            </Card>
        );
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 
            dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">

            {/* Enhanced Header */}
            <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 
                rounded-2xl p-6 mb-6 text-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
                </div>

                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center 
                            justify-center shadow-lg">
                            <Icon name="Globe" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">إدارة الرخص الدولية</h1>
                            <p className="text-white/90 text-sm font-medium mt-1">
                                نظام إدارة شامل لطلبات الرخص الدولية
                            </p>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => fetchRequests(true)}
                    disabled={isRefreshing}
                    variant="ghost"
                    className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                >
                    <Icon name="RefreshCw" size={22} className={isRefreshing ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Enhanced Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                {[
                    { label: 'الكل', value: stats.total, icon: 'Layers', gradient: 'from-slate-500 to-slate-600', iconBg: 'bg-slate-100 dark:bg-slate-700' },
                    { label: 'انتظار', value: stats.pending, icon: 'Clock', gradient: 'from-slate-400 to-slate-500', iconBg: 'bg-slate-100 dark:bg-slate-700' },
                    { label: 'الدفع', value: stats.payment, icon: 'CreditCard', gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
                    { label: 'المستندات', value: stats.documents, icon: 'FileText', gradient: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-100 dark:bg-violet-900/30' },
                    { label: 'قيد العمل', value: stats.inWork, icon: 'Briefcase', gradient: 'from-blue-500 to-cyan-600', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
                    { label: 'جاهز', value: stats.ready, icon: 'CheckCircle', gradient: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
                    { label: 'مرفوض', value: stats.rejected, icon: 'XCircle', gradient: 'from-red-500 to-rose-600', iconBg: 'bg-red-100 dark:bg-red-900/30' },
                ].map((stat) => (
                    <Card
                        key={stat.label}
                        onClick={() => setFilterStatus(stat.label === 'الكل' ? 'all' :
                            stat.label === 'انتظار' ? 'pending' :
                                stat.label === 'الدفع' ? 'payment_check' :
                                    stat.label === 'المستندات' ? 'documents_check' :
                                        stat.label === 'قيد العمل' ? 'in_work' :
                                            stat.label === 'جاهز' ? 'ready_to_handle' :
                                                'rejected'
                        )}
                        className={`group p-3 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-right
                            ${filterStatus === (stat.label === 'الكل' ? 'all' :
                                stat.label === 'انتظار' ? 'pending' :
                                    stat.label === 'الدفع' ? 'payment_check' :
                                        stat.label === 'المستندات' ? 'documents_check' :
                                            stat.label === 'قيد العمل' ? 'in_work' :
                                                stat.label === 'جاهز' ? 'ready_to_handle' :
                                                    'rejected')
                                ? 'border-primary shadow-md shadow-primary/20 ring-1 ring-primary'
                                : 'hover:border-primary/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center 
                                group-hover:scale-110 transition-transform duration-300`}>
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} 
                                    flex items-center justify-center text-white shadow-sm`}>
                                    <Icon name={stat.icon} size={18} />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white 
                                    group-hover:text-primary transition-colors">
                                    {stat.value}
                                </div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Enhanced Toolbar */}
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[250px] relative">
                        <Input
                            placeholder="بحث بالاسم، رقم الطلب، أو رقم الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startIcon={<Icon name="Search" className="text-slate-400" size={20} />}
                            endIcon={searchQuery ? (
                                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-100 rounded-full">
                                    <Icon name="X" size={16} className="text-slate-400" />
                                </button>
                            ) : undefined}
                            className="bg-slate-50 dark:bg-slate-900"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <Button
                            onClick={() => setViewMode('kanban')}
                            variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                            size="sm"
                            className={viewMode === 'kanban' ? 'shadow-sm' : 'text-slate-500'}
                        >
                            <Icon name="Columns" size={18} className="mr-2" />
                            كانبان
                        </Button>
                        <Button
                            onClick={() => setViewMode('list')}
                            variant={viewMode === 'list' ? 'primary' : 'ghost'}
                            size="sm"
                            className={viewMode === 'list' ? 'shadow-sm' : 'text-slate-500'}
                        >
                            <Icon name="List" size={18} className="mr-2" />
                            قائمة
                        </Button>
                    </div>

                    {/* Results Count */}
                    {filteredRequests.length !== requests.length && (
                        <div className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl 
                            font-bold text-sm border-2 border-primary/20">
                            {filteredRequests.length} من {requests.length}
                        </div>
                    )}
                </div>
            </Card>

            {/* Content */}
            {
                isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <RequestCardSkeleton key={i} viewMode="grid" />
                        ))}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <EmptyState
                        icon={searchQuery || filterStatus !== 'all' ? "Search" : "FileText"}
                        title={searchQuery || filterStatus !== 'all' ? "لا توجد نتائج" : "لا توجد طلبات"}
                        description={searchQuery || filterStatus !== 'all'
                            ? "لم يتم العثور على طلبات مطابقة للبحث أو الفلتر"
                            : "لم يتم العثور على طلبات رخص دولية"
                        }
                    />
                ) : viewMode === 'kanban' ? (
                    /* Enhanced Kanban View */
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                        {WORKFLOW_COLUMNS.map((column) => (
                            <div key={column.id} className="flex-shrink-0 w-80 snap-start">
                                {/* Column Header */}
                                <div className={`bg-gradient-to-r ${column.gradient} rounded-t-2xl p-4 
                                flex items-center justify-between shadow-lg`}>
                                    <div className="flex items-center gap-3 text-white">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg 
                                        flex items-center justify-center">
                                            <Icon name={column.icon} size={18} />
                                        </div>
                                        <span className="font-black text-lg">{column.label}</span>
                                    </div>
                                    <span className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full 
                                    text-sm font-black text-white shadow-sm">
                                        {requestsByStatus[column.id]?.length || 0}
                                    </span>
                                </div>

                                {/* Column Body */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl p-3 
                                min-h-[500px] space-y-3 border-2 border-t-0 border-slate-200 
                                dark:border-slate-700">
                                    {requestsByStatus[column.id]?.map(renderKanbanCard)}

                                    {requestsByStatus[column.id]?.length === 0 && (
                                        <div className="text-center py-12 px-4">
                                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl 
                                            flex items-center justify-center mx-auto mb-4 opacity-50">
                                                <Icon name="Inbox" size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">لا توجد طلبات</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Rejected Column */}
                        {requestsByStatus['rejected']?.length > 0 && (
                            <div className="flex-shrink-0 w-80 snap-start">
                                <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-t-2xl p-4 
                                flex items-center justify-between shadow-lg">
                                    <div className="flex items-center gap-3 text-white">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg 
                                        flex items-center justify-center">
                                            <Icon name="XCircle" size={18} />
                                        </div>
                                        <span className="font-black text-lg">مرفوض</span>
                                    </div>
                                    <span className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full 
                                    text-sm font-black text-white shadow-sm">
                                        {requestsByStatus['rejected']?.length || 0}
                                    </span>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-b-2xl p-3 
                                min-h-[500px] space-y-3 border-2 border-t-0 border-red-200 
                                dark:border-red-800">
                                    {requestsByStatus['rejected']?.map(renderKanbanCard)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Enhanced List View */
                    <div className="space-y-3">
                        {paginatedRequests.map(renderListRow)}
                    </div>
                )
            }

            {/* Pagination */}
            {
                !isLoading && filteredRequests.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredRequests.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                )
            }

            {/* Request Detail Modal */}
            {
                selectedRequest && (
                    <InternationalLicenseRequestModal
                        request={selectedRequest}
                        onClose={() => setSelectedRequest(null)}
                        onStatusUpdate={handleStatusUpdate}
                        showToast={showToast}
                        steps={STEPS}
                    />
                )
            }

            {/* Enhanced Rejection Modal */}
            {
                rejectingRequest && (
                    <Modal
                        title="رفض الطلب"
                        onClose={() => {
                            setRejectingRequest(null);
                            setRejectReason('');
                            setRejectedDocuments([]);
                        }}
                        size="md"
                        footer={
                            <>
                                <Button
                                    onClick={() => {
                                        setRejectingRequest(null);
                                        setRejectReason('');
                                        setRejectedDocuments([]);
                                    }}
                                    variant="secondary"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (rejectingRequest.status === 'documents_check' && rejectedDocuments.length === 0) {
                                            showToast('يرجى تحديد المستندات المرفوضة', 'error');
                                            return;
                                        }
                                        handleStatusUpdate(
                                            rejectingRequest.id,
                                            'rejected',
                                            rejectReason,
                                            rejectingRequest.status === 'documents_check' ? rejectedDocuments : ['proof_of_payment']
                                        );
                                    }}
                                    disabled={!rejectReason || isUpdating}
                                    variant="danger"
                                    isLoading={isUpdating}
                                >
                                    <Icon name="XCircle" size={18} className="mr-2" />
                                    تأكيد الرفض
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500">
                                    <Icon name="AlertTriangle" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">تأكيد الرفض</h3>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {rejectingRequest.status === 'payment_check'
                                            ? 'سيتم رفض إثبات الدفع وإشعار المستخدم'
                                            : 'سيتم رفض المستندات المحددة وإشعار المستخدم'}
                                    </p>
                                </div>
                            </div>

                            {/* Document Selection */}
                            {rejectingRequest.status === 'documents_check' && (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Icon name="FileX" size={16} />
                                        حدد المستندات المرفوضة:
                                    </label>
                                    {[
                                        { key: 'personal_photo', label: 'الصورة الشخصية', icon: 'User' },
                                        { key: 'id_document', label: 'وثيقة الهوية (أمامي)', icon: 'CreditCard' },
                                        { key: 'id_document_back', label: 'وثيقة الهوية (خلفي)', icon: 'CreditCard' },
                                        { key: 'passport_document', label: 'جواز السفر', icon: 'Book' },
                                        { key: 'driving_license_front', label: 'رخصة القيادة (أمامي)', icon: 'FileText' },
                                        { key: 'driving_license_back', label: 'رخصة القيادة (خلفي)', icon: 'FileText' },
                                    ].map((doc) => (
                                        <label
                                            key={doc.key}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                                            ${rejectedDocuments.includes(doc.key)
                                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-red-200'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={rejectedDocuments.includes(doc.key)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setRejectedDocuments([...rejectedDocuments, doc.key]);
                                                    } else {
                                                        setRejectedDocuments(rejectedDocuments.filter(d => d !== doc.key));
                                                    }
                                                }}
                                                className="w-5 h-5 text-red-500 rounded border-2 border-slate-300 focus:ring-2 focus:ring-red-500/20"
                                            />
                                            <Icon name={doc.icon} size={18} className="text-slate-500" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {doc.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Reason */}
                            <Textarea
                                label="سبب الرفض"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="أدخل سبب الرفض بالتفصيل..."
                                rows={4}
                                required
                            />
                        </div>
                    </Modal>
                )
            }      </div >
    );
};

export default InternationalLicenseManagementView;