import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserDepositRequest, UserWithdrawalRequest, UserWalletTransaction } from '../../types';
import * as walletService from '../../services/wallet.service';
import Modal from '../Modal';
import ImageUpload from '../ImageUpload';
import { ViewHeader, StatusBadge, Icon } from './Shared';
import Pagination from '../Pagination';
import EmptyState from '../EmptyState';
import SkeletonLoader from '../SkeletonLoader';
import { useAdminWalletUpdates } from '../../hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface UserWalletManagementViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type TabType = 'deposits' | 'withdrawals' | 'transactions';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';
type UserTypeFilter = 'all' | 'customer' | 'technician' | 'tow_truck' | 'car_provider';

const ITEMS_PER_PAGE = 10;

const UserWalletManagementView: React.FC<UserWalletManagementViewProps> = ({ showToast }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('deposits');
    const [currentPage, setCurrentPage] = useState(1);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [deposits, setDeposits] = useState<UserDepositRequest[]>([]);
    const [withdrawals, setWithdrawals] = useState<UserWithdrawalRequest[]>([]);
    const [transactions, setTransactions] = useState<UserWalletTransaction[]>([]);

    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
    const [depositToReject, setDepositToReject] = useState<UserDepositRequest | null>(null);
    const [withdrawalToReject, setWithdrawalToReject] = useState<UserWithdrawalRequest | null>(null);
    const [depositToApprove, setDepositToApprove] = useState<UserDepositRequest | null>(null);
    const [withdrawalToApprove, setWithdrawalToApprove] = useState<UserWithdrawalRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalNotes, setApprovalNotes] = useState('');
    const [approvalReceipt, setApprovalReceipt] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    const [sortColumn, setSortColumn] = useState<string>('timestamp');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const fetchData = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [depositsRes, withdrawalsRes, transactionsRes] = await Promise.all([
                walletService.listUserDeposits(),
                walletService.listUserWithdrawals(),
                walletService.listUserTransactions(),
            ]);
            setDeposits(depositsRes.data || []);
            setWithdrawals(withdrawalsRes.data || []);
            setTransactions(transactionsRes.data || []);
        } catch (error) {
            console.error('Error fetching user wallet data:', error);
            if (!isBackground) showToast('حدث خطأ في تحميل البيانات', 'error');
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time updates using custom hook
    const handleDepositRequest = useCallback((e: any) => fetchData(true), [fetchData]);
    const handleWithdrawalRequest = useCallback((e: any) => fetchData(true), [fetchData]);
    const handleProcessed = useCallback((e: any) => fetchData(true), [fetchData]);

    useAdminWalletUpdates(
        handleDepositRequest,
        handleWithdrawalRequest,
        handleProcessed,
        showToast
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, statusFilter, userTypeFilter, dateFrom, dateTo]);

    const handleApproveDeposit = async () => {
        if (!depositToApprove) return;
        setProcessing(true);
        try {
            await walletService.approveUserDeposit(depositToApprove.id, approvalNotes);
            showToast('تمت الموافقة على الإيداع', 'success');
            setDepositToApprove(null);
            setApprovalNotes('');
            fetchData(true);
        } catch (error: any) {
            showToast(error.response?.data?.error || 'حدث خطأ', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectDeposit = async () => {
        if (!depositToReject) return;
        setProcessing(true);
        try {
            await walletService.rejectUserDeposit(depositToReject.id, rejectionReason);
            showToast('تم رفض الإيداع', 'success');
            setDepositToReject(null);
            setRejectionReason('');
            fetchData(true);
        } catch (error: any) {
            showToast(error.response?.data?.error || 'حدث خطأ', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveWithdrawal = async () => {
        if (!withdrawalToApprove) return;
        setProcessing(true);
        try {
            await walletService.approveUserWithdrawal(withdrawalToApprove.id, approvalNotes, approvalReceipt);
            showToast('تمت الموافقة على السحب', 'success');
            setWithdrawalToApprove(null);
            setApprovalNotes('');
            setApprovalReceipt(null);
            fetchData(true);
        } catch (error: any) {
            showToast(error.response?.data?.error || 'حدث خطأ', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectWithdrawal = async () => {
        if (!withdrawalToReject) return;
        setProcessing(true);
        try {
            await walletService.rejectUserWithdrawal(withdrawalToReject.id, rejectionReason);
            showToast('تم رفض السحب', 'success');
            setWithdrawalToReject(null);
            setRejectionReason('');
            fetchData(true);
        } catch (error: any) {
            showToast(error.response?.data?.error || 'حدث خطأ', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const getStorageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
        return `${baseUrl}${url}`;
    };

    const getUserTypeLabel = (type: string) => {
        switch (type) {
            case 'customer': return 'عميل';
            case 'technician': return 'فني';
            case 'tow_truck': return 'ونش';
            case 'car_provider': return 'معرض سيارات';
            default: return type;
        }
    };

    const getUserTypeColor = (type: string) => {
        switch (type) {
            case 'customer': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            case 'technician': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            case 'tow_truck': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
            case 'car_provider': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
            default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
    };

    const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; badge?: number }> =
        ({ isActive, onClick, children, badge }) => (
            <button
                onClick={onClick}
                className={cn(
                    "relative px-6 py-3 text-sm font-semibold transition-all duration-300 ease-in-out flex items-center gap-2",
                    isActive
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
            >
                {children}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {badge}
                    </span>
                )}
            </button>
        );

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const SortIcon: React.FC<{ column: string }> = ({ column }) => {
        if (sortColumn !== column) return <Icon name="ChevronsUpDown" className="w-3 h-3 text-slate-300 inline-block align-middle mr-1" />;
        return sortDirection === 'asc'
            ? <Icon name="ChevronUp" className="w-3 h-3 text-primary inline-block align-middle mr-1" />
            : <Icon name="ChevronDown" className="w-3 h-3 text-primary inline-block align-middle mr-1" />;
    };

    const pendingDepositsCount = useMemo(() => deposits.filter(d => d.status === 'pending').length, [deposits]);
    const pendingWithdrawalsCount = useMemo(() => withdrawals.filter(w => w.status === 'pending').length, [withdrawals]);

    const filteredData = useMemo(() => {
        let data: any[] = [];
        switch (activeTab) {
            case 'deposits': data = deposits; break;
            case 'withdrawals': data = withdrawals; break;
            case 'transactions': data = transactions; break;
        }

        return data.filter(item => {
            if (activeTab !== 'transactions' && statusFilter !== 'all') {
                if (item.status !== statusFilter) return false;
            }

            if (userTypeFilter !== 'all') {
                if (item.userType !== userTypeFilter) return false;
            }

            const itemDate = new Date(item.requestTimestamp || item.timestamp);
            if (dateFrom) {
                const start = new Date(dateFrom);
                start.setHours(0, 0, 0, 0);
                if (itemDate < start) return false;
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                if (itemDate > end) return false;
            }

            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const userName = item.userName?.toLowerCase() || '';
                const amount = item.amount?.toString() || '';
                const id = item.id?.toString() || '';
                const type = item.userType ? getUserTypeLabel(item.userType).toLowerCase() : '';
                const method = item.paymentMethodName?.toLowerCase() || '';

                return (
                    userName.includes(term) ||
                    amount.includes(term) ||
                    id.includes(term) ||
                    type.includes(term) ||
                    method.includes(term)
                );
            }

            return true;
        }).sort((a, b) => {
            let valueA = a[sortColumn];
            let valueB = b[sortColumn];

            if (sortColumn === 'timestamp') {
                valueA = a.requestTimestamp || a.timestamp;
                valueB = b.requestTimestamp || b.timestamp;
            } else if (sortColumn === 'amount') {
                valueA = Number(a.amount);
                valueB = Number(b.amount);
            }

            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activeTab, deposits, withdrawals, transactions, searchTerm, statusFilter, userTypeFilter, dateFrom, dateTo, sortColumn, sortDirection]);

    const financialTotals = useMemo(() => {
        const totalAmount = filteredData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        return {
            amount: totalAmount,
            count: filteredData.length
        };
    }, [filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const handleStatClick = (tab: TabType, filter: FilterStatus = 'all') => {
        setActiveTab(tab);
        setStatusFilter(filter);
        setUserTypeFilter('all');
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
    };

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        let headers = ['ID', 'Date', 'User Name', 'User Type', 'Amount', 'Status'];

        const csvRows = filteredData.map(item => {
            const date = new Date(item.requestTimestamp || item.timestamp).toLocaleDateString('en-GB');
            const status = item.status || (item.type || '-');
            return [
                item.id,
                date,
                `"${item.userName}"`,
                getUserTypeLabel(item.userType),
                Number(item.amount).toFixed(2),
                status
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `wallet_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setUserTypeFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'all' || userTypeFilter !== 'all' || dateFrom || dateTo;

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <ViewHeader
                    title="إدارة محفظة المستخدمين"
                    subtitle="إدارة طلبات الإيداع والسحب للعملاء والفنيين وسيارات الونش"
                />
                <div className="flex gap-2">
                    <Button
                        onClick={handleExportCSV}
                        disabled={filteredData.length === 0}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                        icon="Download"
                    >
                        <span className="hidden sm:inline">تصدير CSV</span>
                    </Button>
                    <Button
                        onClick={() => fetchData(true)}
                        variant="ghost"
                        className="bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        isLoading={loading}
                        icon="RefreshCw"
                    >
                        <span className="hidden sm:inline">تحديث</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    onClick={() => handleStatClick('deposits', 'pending')}
                    className="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                >
                    <CardContent className="p-6 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">طلبات إيداع معلقة</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{pendingDepositsCount}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="Clock" className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => handleStatClick('withdrawals', 'pending')}
                    className="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                >
                    <CardContent className="p-6 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">طلبات سحب معلقة</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{pendingWithdrawalsCount}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="ArrowUpCircle" className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => handleStatClick('transactions', 'all')}
                    className="cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                >
                    <CardContent className="p-6 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">إجمالي العمليات</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{transactions.length}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="Activity" className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b dark:border-slate-700 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/50">
                    <TabButton isActive={activeTab === 'deposits'} onClick={() => setActiveTab('deposits')} badge={pendingDepositsCount}>
                        <Icon name="ArrowDownCircle" className="w-4 h-4" />
                        طلبات الإيداع
                    </TabButton>
                    <TabButton isActive={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')} badge={pendingWithdrawalsCount}>
                        <Icon name="ArrowUpCircle" className="w-4 h-4" />
                        طلبات السحب
                    </TabButton>
                    <TabButton isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
                        <Icon name="List" className="w-4 h-4" />
                        سجل العمليات
                    </TabButton>
                </div>

                <div className="p-4 sm:p-6 border-b dark:border-slate-700 bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-800/50 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative sm:col-span-2">
                            <Input
                                type="text"
                                placeholder="ابحث عن مستخدم، مبلغ، أو معرف..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                startIcon={<Icon name="Search" className="w-4 h-4 text-slate-400" />}
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors h-7 w-7"
                                    icon="X"
                                />
                            )}
                        </div>

                        <div>
                            <select
                                value={userTypeFilter}
                                onChange={(e) => setUserTypeFilter(e.target.value as UserTypeFilter)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">🏷️ كل المستخدمين</option>
                                <option value="customer">👤 {getUserTypeLabel('customer')}</option>
                                <option value="technician">🔧 {getUserTypeLabel('technician')}</option>
                                <option value="tow_truck">🚚 {getUserTypeLabel('tow_truck')}</option>
                                <option value="car_provider">🚗 {getUserTypeLabel('car_provider')}</option>
                            </select>
                        </div>

                        {activeTab !== 'transactions' && (
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="all">📊 كل الحالات</option>
                                    <option value="pending">⏳ معلق</option>
                                    <option value="approved">✅ مقبول</option>
                                    <option value="rejected">❌ مرفوض</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">📅 من</label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-auto"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">📅 إلى</label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-auto"
                                />
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    onClick={clearFilters}
                                    variant="danger"
                                    size="sm"
                                    className="h-9"
                                    icon="X"
                                >
                                    إلغاء الفلاتر
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-5 py-3 rounded-lg border border-primary/20 shadow-sm">
                            <div className="text-center">
                                <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">العمليات</span>
                                <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{financialTotals.count}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
                            <div className="text-center">
                                <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">الإجمالي</span>
                                <span className="font-bold text-xl text-primary">${financialTotals.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {activeTab === 'deposits' && (
                        <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">التاريخ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المستخدم</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">النوع</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المبلغ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">طريقة الدفع</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الحالة</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(paginatedData as UserDepositRequest[]).map(d => (
                                            <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(d.requestTimestamp).toLocaleDateString('ar-SY', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{d.userName}</td>
                                                <td className="p-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(d.userType)}`}>
                                                        {getUserTypeLabel(d.userType)}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-mono font-bold text-green-600 dark:text-green-400 text-base">
                                                        ${Number(d.amount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{d.paymentMethodName}</td>
                                                <td className="p-3">
                                                    <StatusBadge status={d.status === 'pending' ? 'Pending' : d.status === 'approved' ? 'Approved' : 'Rejected'} />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {d.receiptUrl && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setViewingReceipt(getStorageUrl(d.receiptUrl))}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                title="عرض الإيصال"
                                                                icon="FileImage"
                                                            />
                                                        )}
                                                        {d.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setDepositToApprove(d)}
                                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                                    title="موافقة"
                                                                    icon="Check"
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setDepositToReject(d)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    title="رفض"
                                                                    icon="X"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {deposits.length === 0 ? (
                                <EmptyState message="لا توجد طلبات إيداع" icon={<Icon name="Inbox" className="w-16 h-16 text-slate-300" />} />
                            ) : filteredData.length === 0 ? (
                                <EmptyState message="لا توجد نتائج تطابق البحث" icon={<Icon name="Search" className="w-16 h-16 text-slate-300" />} />
                            ) : null}
                        </div>
                    )}

                    {activeTab === 'withdrawals' && (
                        <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">التاريخ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المستخدم</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">النوع</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المبلغ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">طريقة الدفع</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الحالة</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(paginatedData as UserWithdrawalRequest[]).map(w => (
                                            <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(w.requestTimestamp).toLocaleDateString('ar-SY', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{w.userName}</td>
                                                <td className="p-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(w.userType)}`}>
                                                        {getUserTypeLabel(w.userType)}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-mono font-bold text-red-600 dark:text-red-400 text-base">
                                                        ${Number(w.amount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium">{w.paymentMethodName}</span>
                                                        {w.paymentMethodDetails && (
                                                            <details className="mt-1">
                                                                <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                                                    عرض تفاصيل الحساب
                                                                </summary>
                                                                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs whitespace-pre-line">
                                                                    {w.paymentMethodDetails}
                                                                </div>
                                                            </details>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <StatusBadge status={w.status === 'pending' ? 'Pending' : w.status === 'approved' ? 'Approved' : 'Rejected'} />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {w.receiptUrl && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setViewingReceipt(getStorageUrl(w.receiptUrl!))}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                title="عرض الإيصال"
                                                                icon="FileImage"
                                                            />
                                                        )}
                                                        {w.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setWithdrawalToApprove(w)}
                                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                                    title="موافقة"
                                                                    icon="Check"
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setWithdrawalToReject(w)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    title="رفض"
                                                                    icon="X"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {withdrawals.length === 0 ? (
                                <EmptyState message="لا توجد طلبات سحب" icon={<Icon name="Inbox" className="w-16 h-16 text-slate-300" />} />
                            ) : filteredData.length === 0 ? (
                                <EmptyState message="لا توجد نتائج تطابق البحث" icon={<Icon name="Search" className="w-16 h-16 text-slate-300" />} />
                            ) : null}
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th
                                                className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                                onClick={() => handleSort('timestamp')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    التاريخ <SortIcon column="timestamp" />
                                                </div>
                                            </th>
                                            <th
                                                className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                                onClick={() => handleSort('userType')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    النوع <SortIcon column="userType" />
                                                </div>
                                            </th>
                                            <th
                                                className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                                onClick={() => handleSort('type')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    نوع العملية <SortIcon column="type" />
                                                </div>
                                            </th>
                                            <th
                                                className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                                onClick={() => handleSort('amount')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    المبلغ <SortIcon column="amount" />
                                                </div>
                                            </th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الوصف</th>
                                            <th
                                                className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                                onClick={() => handleSort('balanceAfter')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    الرصيد بعد <SortIcon column="balanceAfter" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(paginatedData as UserWalletTransaction[]).map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(t.timestamp).toLocaleDateString('ar-SY', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(t.userType)}`}>
                                                        {getUserTypeLabel(t.userType)}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{t.type}</td>
                                                <td className="p-3">
                                                    <span className={`font-mono font-bold text-base ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {t.amount > 0 ? '+' : ''}${Number(t.amount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={t.description}>
                                                    {t.description}
                                                </td>
                                                <td className="p-3 font-mono text-slate-500 dark:text-slate-400 text-sm">
                                                    ${Number(t.balanceAfter).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {transactions.length === 0 ? (
                                <EmptyState message="لا توجد عمليات" icon={<Icon name="Inbox" className="w-16 h-16 text-slate-300" />} />
                            ) : filteredData.length === 0 ? (
                                <EmptyState message="لا توجد نتائج تطابق البحث" icon={<Icon name="Search" className="w-16 h-16 text-slate-300" />} />
                            ) : null}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredData.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Receipt Viewer Modal */}
            {viewingReceipt && (
                <Modal title="إيصال الدفع" onClose={() => setViewingReceipt(null)}>
                    <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <img
                            src={viewingReceipt}
                            alt="Receipt"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                            onError={(e) => {
                                console.error('Error loading receipt image:', viewingReceipt);
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
                            }}
                            onLoad={() => console.log('Receipt image loaded successfully:', viewingReceipt)}
                        />
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setViewingReceipt(null)}
                            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-5 py-2.5 rounded-lg font-medium transition-all"
                        >
                            إغلاق
                        </Button>
                    </div>
                </Modal>
            )}

            {/* Deposit Approval Modal */}
            {depositToApprove && (
                <Modal title="تأكيد الموافقة على الإيداع" onClose={() => setDepositToApprove(null)}>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <Icon name="User" className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">المستخدم</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{depositToApprove.userName}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">المبلغ</span>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ${Number(depositToApprove.amount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        {depositToApprove.receiptUrl && (
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">إيصال الدفع</label>
                                <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                    <img
                                        src={getStorageUrl(depositToApprove.receiptUrl)}
                                        alt="Receipt"
                                        className="w-full max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            console.log('Viewing receipt:', getStorageUrl(depositToApprove.receiptUrl));
                                            setViewingReceipt(getStorageUrl(depositToApprove.receiptUrl));
                                        }}
                                        onError={(e) => {
                                            console.error('Error loading thumbnail:', getStorageUrl(depositToApprove.receiptUrl));
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.insertAdjacentHTML('afterend', '<div class="p-4 text-center text-red-500">فشل تحميل الصورة</div>');
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewingReceipt(getStorageUrl(depositToApprove.receiptUrl))}
                                        className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        title="عرض بالحجم الكامل"
                                        icon="Eye"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <Textarea
                                label="ملاحظات (اختياري)"
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                rows={3}
                                placeholder="أضف ملاحظات للمستخدم..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setDepositToApprove(null)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleApproveDeposit}
                                disabled={processing}
                                isLoading={processing}
                                icon={!processing ? "Check" : undefined}
                                className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                            >
                                تأكيد الموافقة
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Deposit Rejection Modal */}
            {depositToReject && (
                <Modal title="تأكيد رفض الإيداع" onClose={() => setDepositToReject(null)}>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                                    <Icon name="User" className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">المستخدم</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{depositToReject.userName}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">المبلغ</span>
                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    ${Number(depositToReject.amount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        {depositToReject.receiptUrl && (
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">إيصال الدفع</label>
                                <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                    <img
                                        src={getStorageUrl(depositToReject.receiptUrl)}
                                        alt="Receipt"
                                        className="w-full max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            console.log('Viewing receipt:', getStorageUrl(depositToReject.receiptUrl));
                                            setViewingReceipt(getStorageUrl(depositToReject.receiptUrl));
                                        }}
                                        onError={(e) => {
                                            console.error('Error loading thumbnail:', getStorageUrl(depositToReject.receiptUrl));
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.insertAdjacentHTML('afterend', '<div class="p-4 text-center text-red-500">فشل تحميل الصورة</div>');
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewingReceipt(getStorageUrl(depositToReject.receiptUrl))}
                                        className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        title="عرض بالحجم الكامل"
                                        icon="Eye"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <Textarea
                                label={<span>سبب الرفض <span className="text-red-500">*</span></span> as any}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                placeholder="أدخل سبب الرفض..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setDepositToReject(null)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleRejectDeposit}
                                disabled={processing || !rejectionReason.trim()}
                                isLoading={processing}
                                icon={!processing ? "X" : undefined}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                            >
                                تأكيد الرفض
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Withdrawal Approval Modal */}
            {withdrawalToApprove && (
                <Modal title="تأكيد الموافقة على السحب" onClose={() => setWithdrawalToApprove(null)}>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <Icon name="User" className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">المستخدم</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{withdrawalToApprove.userName}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">المبلغ</span>
                                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        ${Number(withdrawalToApprove.amount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">طريقة الدفع</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{withdrawalToApprove.paymentMethodName}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">إيصال التحويل (اختياري)</label>
                            <ImageUpload
                                files={approvalReceipt ? [approvalReceipt] : []}
                                setFiles={(files: File[]) => setApprovalReceipt(files[0] || null)}
                                maxFiles={1}
                            />
                        </div>
                        <div>
                            <Textarea
                                label="ملاحظات (اختياري)"
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                rows={3}
                                placeholder="أضف ملاحظات للمستخدم..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setWithdrawalToApprove(null)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleApproveWithdrawal}
                                disabled={processing}
                                isLoading={processing}
                                icon={!processing ? "Check" : undefined}
                                className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                            >
                                تأكيد الموافقة
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Withdrawal Rejection Modal */}
            {withdrawalToReject && (
                <Modal title="تأكيد رفض السحب" onClose={() => setWithdrawalToReject(null)}>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                                    <Icon name="User" className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">المستخدم</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{withdrawalToReject.userName}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">المبلغ</span>
                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    ${Number(withdrawalToReject.amount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div>
                            <Textarea
                                label={<span>سبب الرفض <span className="text-red-500">*</span></span> as any}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                placeholder="أدخل سبب الرفض..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setWithdrawalToReject(null)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleRejectWithdrawal}
                                disabled={processing || !rejectionReason.trim()}
                                isLoading={processing}
                                icon={!processing ? "X" : undefined}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                            >
                                تأكيد الرفض
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default UserWalletManagementView;