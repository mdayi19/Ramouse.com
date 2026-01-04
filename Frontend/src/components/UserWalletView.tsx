import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    UserWithdrawalRequest,
    UserDepositRequest,
    UserWalletBalance,
    UserWalletTransaction,
    Settings,
    PaymentMethod,
    UserPaymentInfo
} from '../types';
import * as walletService from '../services/wallet.service';
import { ViewHeader, StatusBadge } from './DashboardParts/Shared';
import EmptyState from './EmptyState';
import Icon from './Icon';
import Pagination from './Pagination';
import Modal from './Modal';
import ImageUpload from './ImageUpload';
import SkeletonLoader from './SkeletonLoader';
import { Button } from './ui/Button';
import { useWalletUpdates } from '../hooks/useRealtime';

interface UserWalletViewProps {
    settings: Settings;
    onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
    userId?: string | number;
}

const ITEMS_PER_PAGE = 10;

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }> =
    ({ isActive, onClick, children, icon }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 ease-in-out ${isActive
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
        >
            {icon}
            {children}
        </button>
    );

const UserWalletView: React.FC<UserWalletViewProps> = ({ settings, onAddToast, userId }) => {
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<UserWalletBalance | null>(null);
    const [transactions, setTransactions] = useState<UserWalletTransaction[]>([]);
    const [deposits, setDeposits] = useState<UserDepositRequest[]>([]);
    const [withdrawals, setWithdrawals] = useState<UserWithdrawalRequest[]>([]);
    const [savedPaymentMethods, setSavedPaymentMethods] = useState<UserPaymentInfo[]>([]);

    const [activeTab, setActiveTab] = useState<'transactions' | 'deposits' | 'withdrawals' | 'payment_methods'>('transactions');
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    // Form state
    const [depositAmount, setDepositAmount] = useState('');
    const [depositMethod, setDepositMethod] = useState<PaymentMethod | null>(null);
    const [depositReceipt, setDepositReceipt] = useState<File | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod | null>(null);
    const [withdrawMethodDetails, setWithdrawMethodDetails] = useState('');
    const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string>('');
    const [saveNewMethod, setSaveNewMethod] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

    // Debugging logs
    useEffect(() => {
        console.log('🟢 UserWalletView MOUNTED');
        return () => console.log('🔴 UserWalletView UNMOUNTED');
    }, []);

    const prevOnAddToast = React.useRef(onAddToast);
    useEffect(() => {
        if (prevOnAddToast.current !== onAddToast) {
            console.log('⚠️ onAddToast CHANGED reference');
            prevOnAddToast.current = onAddToast;
        }
    }, [onAddToast]);

    const fetchWalletData = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [balanceData, transactionsData, depositsData, withdrawalsData, paymentMethodsData] = await Promise.all([
                walletService.getWalletBalance(isBackground), // Pass forceRefresh if needed, wait, API updated
                walletService.getWalletTransactions(1, isBackground),
                walletService.getDeposits(isBackground),
                walletService.getWithdrawals(isBackground),
                walletService.getUserPaymentMethods(),
            ]);
            setBalance(balanceData);
            setTransactions(transactionsData.data || []);
            setDeposits(depositsData.data || []);
            setWithdrawals(withdrawalsData.data || []);
            setSavedPaymentMethods(paymentMethodsData.paymentMethods || []);
        } catch (error) {
            console.error('Error fetching wallet data:', error);
            onAddToast('حدث خطأ في تحميل بيانات المحفظة', 'error');
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [onAddToast]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchWalletData(true);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Real-time updates using custom hook
    const handleWalletUpdate = useCallback(() => {
        fetchWalletData(true);
    }, [fetchWalletData]);

    useWalletUpdates(userId, handleWalletUpdate, onAddToast);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const dataToPaginate = useMemo(() => {
        switch (activeTab) {
            case 'transactions': return transactions;
            case 'deposits': return deposits;
            case 'withdrawals': return withdrawals;
            default: return [];
        }
    }, [activeTab, transactions, deposits, withdrawals]);

    const totalPages = Math.ceil(dataToPaginate.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return dataToPaginate.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [dataToPaginate, currentPage]);

    const handleSubmitDeposit = async () => {
        if (!depositAmount || !depositMethod || !depositReceipt) {
            onAddToast('يرجى ملء جميع الحقول وإرفاق إيصال الدفع', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await walletService.submitDeposit(
                parseFloat(depositAmount),
                depositMethod.id,
                depositMethod.name,
                depositReceipt
            );
            onAddToast('تم تقديم طلب الإيداع بنجاح', 'success');
            setShowDepositModal(false);
            setDepositAmount('');
            setDepositMethod(null);
            setDepositReceipt(null);
            fetchWalletData(true);
        } catch (error: any) {
            onAddToast(error.response?.data?.error || 'حدث خطأ', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePaymentMethod = async (methodId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return;

        try {
            await walletService.deleteUserPaymentMethod(methodId);
            onAddToast('تم حذف طريقة الدفع بنجاح', 'success');
            fetchWalletData(true);
        } catch (error: any) {
            onAddToast(error.response?.data?.error || 'حدث خطأ أثناء الحذف', 'error');
        }
    };

    const handleSubmitWithdraw = async () => {
        if (!withdrawAmount || !withdrawMethod || !withdrawMethodDetails.trim()) {
            onAddToast('يرجى ملء جميع الحقول', 'error');
            return;
        }
        if (withdrawMethodDetails.trim().length < 10) {
            onAddToast('يرجى إدخال تفاصيل الدفع كاملة (10 أحرف على الأقل)', 'error');
            return;
        }
        if (balance && parseFloat(withdrawAmount) > balance.availableBalance) {
            onAddToast('المبلغ المطلوب أكبر من الرصيد المتاح', 'error');
            return;
        }
        setSubmitting(true);
        try {
            // Save new payment method if checked
            if (saveNewMethod && !selectedSavedMethodId) {
                try {
                    await walletService.addUserPaymentMethod(withdrawMethod.name, withdrawMethodDetails);
                } catch (saveError) {
                    console.error('Failed to save payment method:', saveError);
                    // Continue with withdrawal even if save fails
                }
            }

            await walletService.submitWithdrawal(
                parseFloat(withdrawAmount),
                withdrawMethod.id,
                withdrawMethod.name,
                withdrawMethodDetails
            );
            onAddToast('تم تقديم طلب السحب بنجاح', 'success');
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setWithdrawMethod(null);
            setWithdrawMethodDetails('');
            setSelectedSavedMethodId('');
            setSaveNewMethod(false);
            fetchWalletData(true);
        } catch (error: any) {
            onAddToast(error.response?.data?.error || 'حدث خطأ', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatAmount = (amount: number) => {
        const absAmount = Math.abs(amount);
        return `${amount >= 0 ? '+' : '-'}$${absAmount.toFixed(2)}`;
    };

    const getStorageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
        return `${baseUrl}${url}`;
    };

    const pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;
    const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <ViewHeader title="محفظتي" subtitle="إدارة رصيدك المالي وعمليات الإيداع والسحب" />
                <Button
                    onClick={handleRefresh}
                    variant="secondary"
                    className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-pulse' : ''}`}
                >
                    <Icon name="RefreshCw" className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>تحديث</span>
                </Button>
            </div>

            {/* Balance Card with Enhanced Design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-8 rounded-2xl shadow-2xl text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <Icon name="Wallet" className="w-6 h-6" />
                        <h3 className="text-lg font-semibold">رصيد المحفظة</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <p className="text-white/80 text-sm mb-2 flex items-center gap-2">
                                <Icon name="DollarSign" className="w-4 h-4" />
                                الرصيد الإجمالي
                            </p>
                            <p className="text-4xl font-bold">
                                ${(balance?.balance ?? 0).toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <p className="text-white/80 text-sm mb-2 flex items-center gap-2">
                                <Icon name="CheckCircle" className="w-4 h-4" />
                                الرصيد المتاح
                            </p>
                            <p className="text-4xl font-bold text-green-300">
                                ${(balance?.availableBalance ?? 0).toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <p className="text-white/80 text-sm mb-2 flex items-center gap-2">
                                <Icon name="Lock" className="w-4 h-4" />
                                المبلغ المحجوز
                            </p>
                            <p className="text-4xl font-bold text-orange-300">
                                ${(balance?.heldAmount ?? 0).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            onClick={() => setShowDepositModal(true)}
                            size="lg"
                            className="bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            icon="ArrowDownCircle"
                        >
                            إيداع رصيد
                        </Button>
                        <Button
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={!balance || balance.availableBalance <= 0}
                            variant="outline"
                            size="lg"
                            className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/20 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                            icon="ArrowUpCircle"
                        >
                            سحب رصيد
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white dark:bg-darkcard rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b dark:border-slate-700 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/50">
                    <TabButton
                        isActive={activeTab === 'transactions'}
                        onClick={() => setActiveTab('transactions')}
                        icon={<Icon name="List" className="w-4 h-4" />}
                    >
                        سجل العمليات
                    </TabButton>
                    <TabButton
                        isActive={activeTab === 'deposits'}
                        onClick={() => setActiveTab('deposits')}
                        icon={<Icon name="ArrowDownCircle" className="w-4 h-4" />}
                    >
                        طلبات الإيداع
                        {pendingDepositsCount > 0 && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {pendingDepositsCount}
                            </span>
                        )}
                    </TabButton>
                    <TabButton
                        isActive={activeTab === 'withdrawals'}
                        onClick={() => setActiveTab('withdrawals')}
                        icon={<Icon name="ArrowUpCircle" className="w-4 h-4" />}
                    >
                        طلبات السحب
                        {pendingWithdrawalsCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {pendingWithdrawalsCount}
                            </span>
                        )}
                    </TabButton>
                    <TabButton
                        isActive={activeTab === 'payment_methods'}
                        onClick={() => setActiveTab('payment_methods')}
                        icon={<Icon name="CreditCard" className="w-4 h-4" />}
                    >
                        طرق الدفع المحفوظة
                    </TabButton>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">التاريخ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الوصف</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المبلغ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الرصيد بعد</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(paginatedData as UserWalletTransaction[]).map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(t.timestamp || (t as any).created_at).toLocaleDateString('ar-SY', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-3 text-slate-700 dark:text-slate-300">{t.description}</td>
                                                <td className="p-3">
                                                    <span className={`font-mono font-bold text-base inline-flex items-center gap-1 ${(t.amount || 0) > 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {(t.amount || 0) > 0 ? (
                                                            <Icon name="TrendingUp" className="w-4 h-4" />
                                                        ) : (
                                                            <Icon name="TrendingDown" className="w-4 h-4" />
                                                        )}
                                                        {formatAmount(t.amount || 0)}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                                                    ${Number(t.balanceAfter ?? (t as any).balance_after ?? 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {transactions.length === 0 && (
                                <EmptyState
                                    message="لا يوجد سجل عمليات بعد"
                                    icon={<Icon name="Receipt" className="w-16 h-16 text-slate-300" />}
                                />
                            )}
                        </div>
                    )}

                    {/* Deposits Tab */}
                    {activeTab === 'deposits' && (
                        <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">التاريخ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المبلغ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">طريقة الدفع</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الحالة</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(paginatedData as UserDepositRequest[]).map(d => {
                                            const receiptUrl = d.receiptUrl || (d as any).receipt_url;
                                            const adminNotes = d.adminNotes || (d as any).admin_notes;
                                            const timestamp = d.requestTimestamp || (d as any).request_timestamp || (d as any).created_at;
                                            const methodName = d.paymentMethodName || (d as any).payment_method_name || '';
                                            return (
                                                <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                        {new Date(timestamp).toLocaleDateString('ar-SY', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-mono font-bold text-green-600 dark:text-green-400 text-base">
                                                            ${Number(d.amount || 0).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{methodName}</td>
                                                    <td className="p-3">
                                                        <div className="space-y-1">
                                                            <StatusBadge status={d.status === 'pending' ? 'Pending' : d.status === 'approved' ? 'Approved' : 'Rejected'} />
                                                            {adminNotes && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                                    {adminNotes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        {receiptUrl && (
                                                            <button
                                                                onClick={() => setViewingReceipt(getStorageUrl(receiptUrl))}
                                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                title="عرض الإيصال"
                                                            >
                                                                <Icon name="Eye" className="w-4 h-4" />
                                                                <span className="text-xs">عرض</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {deposits.length === 0 && (
                                <EmptyState
                                    message="لا توجد طلبات إيداع"
                                    icon={<Icon name="Inbox" className="w-16 h-16 text-slate-300" />}
                                />
                            )}
                        </div>
                    )}

                    {/* Withdrawals Tab */}
                    {activeTab === 'withdrawals' && (
                        <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">التاريخ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">المبلغ</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">طريقة الدفع</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الحالة</th>
                                            <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(paginatedData as UserWithdrawalRequest[]).map(w => {
                                            const receiptUrl = w.receiptUrl || (w as any).receipt_url;
                                            const adminNotes = w.adminNotes || (w as any).admin_notes;
                                            const timestamp = w.requestTimestamp || (w as any).request_timestamp || (w as any).created_at;
                                            const methodName = w.paymentMethodName || (w as any).payment_method_name || '';
                                            return (
                                                <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                        {new Date(timestamp).toLocaleDateString('ar-SY', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-mono font-bold text-red-600 dark:text-red-400 text-base">
                                                            ${Number(w.amount || 0).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{methodName}</td>
                                                    <td className="p-3">
                                                        <div className="space-y-1">
                                                            <StatusBadge status={w.status === 'pending' ? 'Pending' : w.status === 'approved' ? 'Approved' : 'Rejected'} />
                                                            {adminNotes && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                                    {adminNotes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        {w.status === 'approved' && receiptUrl && (
                                                            <button
                                                                onClick={() => setViewingReceipt(getStorageUrl(receiptUrl))}
                                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                title="عرض الإيصال"
                                                            >
                                                                <Icon name="Eye" className="w-4 h-4" />
                                                                <span className="text-xs">عرض</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {withdrawals.length === 0 && (
                                <EmptyState
                                    message="لا توجد طلبات سحب"
                                    icon={<Icon name="Inbox" className="w-16 h-16 text-slate-300" />}
                                />
                            )}
                        </div>
                    )}

                    {/* Payment Methods Tab */}
                    {activeTab === 'payment_methods' && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            {savedPaymentMethods.length === 0 ? (
                                <EmptyState
                                    icon={<Icon name="CreditCard" className="w-16 h-16 text-slate-300" />}
                                    title="لا توجد طرق دفع محفوظة"
                                    message="يمكنك حفظ طرق الدفع عند تقديم طلب سحب جديد لتسهيل العمليات القادمة."
                                />
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {savedPaymentMethods.map((method) => {
                                        return (
                                            <div key={method.methodId} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all group relative">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <Icon name="CreditCard" className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{method.methodName}</h3>
                                                            {method.isPrimary && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">افتراضي</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeletePaymentMethod(method.methodId)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                        title="حذف"
                                                        icon="Trash2"
                                                    />
                                                </div>

                                                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 whitespace-pre-wrap font-mono">
                                                    {method.details}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && activeTab !== 'payment_methods' && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={dataToPaginate.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <Modal title="إيداع رصيد" onClose={() => setShowDepositModal(false)}>
                    <div className="space-y-5">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                <Icon name="Info" className="w-4 h-4" />
                                قم بتحويل المبلغ إلى الحساب المحدد ثم أرفق إيصال الدفع
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                المبلغ ($) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 transition-all"
                                    placeholder="0.00"
                                    min="1"
                                    step="0.01"
                                />
                                <Icon name="DollarSign" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                طريقة الدفع <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={depositMethod?.id || ''}
                                onChange={(e) => {
                                    const method = settings.paymentMethods.find(m => m.id === e.target.value);
                                    setDepositMethod(method || null);
                                }}
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 transition-all"
                            >
                                <option value="">اختر طريقة الدفع</option>
                                {settings.paymentMethods.filter(m => m.isActive).map(method => (
                                    <option key={method.id} value={method.id}>{method.name}</option>
                                ))}
                            </select>
                            {depositMethod && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                        {depositMethod.details}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                إيصال الدفع <span className="text-red-500">*</span>
                            </label>
                            <ImageUpload
                                files={depositReceipt ? [depositReceipt] : []}
                                setFiles={(files: File[]) => setDepositReceipt(files[0] || null)}
                                maxFiles={1}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                يرجى إرفاق صورة واضحة لإيصال التحويل
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDepositModal(false)}
                                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-all"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleSubmitDeposit}
                                disabled={submitting || !depositAmount || !depositMethod || !depositReceipt}
                                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                isLoading={submitting}
                                icon="Send"
                            >
                                تقديم الطلب
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <Modal title="سحب رصيد" onClose={() => setShowWithdrawModal(false)}>
                    <div className="space-y-5">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">الرصيد المتاح للسحب</span>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ${(balance?.availableBalance ?? 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                المبلغ ($) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 transition-all"
                                    placeholder="0.00"
                                    min="1"
                                    max={balance?.availableBalance || 0}
                                    step="0.01"
                                />
                                <Icon name="DollarSign" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                طريقة استلام المبلغ <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={withdrawMethod?.id || ''}
                                onChange={(e) => {
                                    const method = settings.paymentMethods.find(m => m.id === e.target.value);
                                    setWithdrawMethod(method || null);
                                }}
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 transition-all"
                            >
                                <option value="">اختر طريقة الاستلام</option>
                                {settings.paymentMethods.filter(m => m.isActive).map(method => (
                                    <option key={method.id} value={method.id}>{method.name}</option>
                                ))}
                            </select>
                            {withdrawMethod && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                        {withdrawMethod.details}
                                    </p>
                                </div>
                            )}
                        </div>

                        {withdrawMethod && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        تفاصيل الحساب <span className="text-red-500">*</span>
                                    </label>

                                    {/* Saved Methods Dropdown */}
                                    {savedPaymentMethods.filter(m => m.methodName === withdrawMethod.name).length > 0 && (
                                        <select
                                            value={selectedSavedMethodId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedSavedMethodId(id);
                                                if (id) {
                                                    const saved = savedPaymentMethods.find(m => m.methodId === id);
                                                    if (saved) {
                                                        setWithdrawMethodDetails(saved.details);
                                                        setSaveNewMethod(false);
                                                    }
                                                } else {
                                                    setWithdrawMethodDetails('');
                                                    setSaveNewMethod(false);
                                                }
                                            }}
                                            className="text-xs p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                                        >
                                            <option value="">استخدام حساب جديد</option>
                                            {savedPaymentMethods
                                                .filter(m => m.methodName === withdrawMethod.name)
                                                .map(m => (
                                                    <option key={m.methodId} value={m.methodId}>
                                                        {m.details.substring(0, 30)}...
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    )}
                                </div>

                                <textarea
                                    value={withdrawMethodDetails}
                                    onChange={(e) => {
                                        setWithdrawMethodDetails(e.target.value);
                                        // If user edits a saved method, switch to "New/Custom" mode
                                        if (selectedSavedMethodId) {
                                            setSelectedSavedMethodId('');
                                            setSaveNewMethod(true);
                                        }
                                    }}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 transition-all min-h-[100px]"
                                    placeholder={`أدخل تفاصيل ${withdrawMethod.name} الخاصة بك:\n\nمثال:\nرقم الحساب: 1234567890\nالبنك: البنك الأهلي\nاسم صاحب الحساب: محمد أحمد\nIBAN: SA...`}
                                    required
                                />

                                {!selectedSavedMethodId && withdrawMethodDetails.length > 10 && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="saveMethod"
                                            checked={saveNewMethod}
                                            onChange={(e) => setSaveNewMethod(e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="saveMethod" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                            حفظ بيانات هذا الحساب لاستخدامه مستقبلاً
                                        </label>
                                    </div>
                                )}

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    يرجى إدخال المعلومات اللازمة لتحويل المبلغ (رقم الحساب، IBAN، اسم صاحب الحساب، إلخ)
                                </p>
                            </div>
                        )}

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <Icon name="AlertCircle" className="w-4 h-4" />
                                سيتم مراجعة طلبك والتحويل خلال 24-48 ساعة
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                            <Button
                                variant="ghost"
                                onClick={() => setShowWithdrawModal(false)}
                                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-all"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleSubmitWithdraw}
                                disabled={submitting || !withdrawAmount || !withdrawMethod || !withdrawMethodDetails.trim()}
                                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                isLoading={submitting}
                                icon="Send"
                            >
                                تقديم الطلب
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Receipt Viewer Modal */}
            {viewingReceipt && (
                <Modal title="إيصال الدفع" onClose={() => setViewingReceipt(null)}>
                    <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <img src={viewingReceipt} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
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
        </div>
    );
};

export default UserWalletView;