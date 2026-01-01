
import React, { useState, useMemo, useEffect } from 'react';
import { Provider, WithdrawalRequest, Transaction, Settings } from '../../types';
import { ViewHeader, StatusBadge } from '../DashboardParts/Shared';
import EmptyState from '../EmptyState';
import WithdrawModal from './WithdrawModal';
import Icon from '../Icon';
import Pagination from '../Pagination';
import Modal from '../Modal';

interface WalletViewProps {
    provider: Provider;
    withdrawals: WithdrawalRequest[];
    transactions: Transaction[];
    settings: Settings;
    onSubmitWithdrawal: (amount: number, paymentMethodId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const WalletView: React.FC<WalletViewProps> = ({ provider, withdrawals, transactions, settings, onSubmitWithdrawal }) => {
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

    const myWithdrawals = useMemo(() => {
        return [...withdrawals].sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());
    }, [withdrawals]);

    const myTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [transactions]);

    const dataToPaginate = activeTab === 'transactions' ? myTransactions : myWithdrawals;
    const totalPages = Math.ceil(dataToPaginate.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return dataToPaginate.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [dataToPaginate, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleWithdrawSubmit = (amount: number, paymentMethodId: string) => {
        onSubmitWithdrawal(amount, paymentMethodId);
        setIsWithdrawModalOpen(false);
    };

    const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
        <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${isActive ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}>{children}</button>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <ViewHeader title="المحفظة" subtitle="إدارة رصيدك، طلبات السحب، وسجل العمليات المالية." />

            <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center text-center sm:text-right">
                <div>
                    <p className="text-slate-500 dark:text-slate-400">الرصيد الحالي</p>
                    <p className="text-4xl font-bold text-primary dark:text-primary-400">${Number(provider.walletBalance ?? 0).toFixed(2)}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button onClick={() => setIsWithdrawModalOpen(true)} className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={!provider.paymentInfo || provider.paymentInfo.length === 0}>
                        طلب سحب
                    </button>
                    {(!provider.paymentInfo || provider.paymentInfo.length === 0) && <p className="text-xs text-red-500 mt-2">أضف طريقة دفع في الإعدادات لتتمكن من السحب.</p>}
                </div>
            </div>

            <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                <div className="flex border-b mb-4 dark:border-slate-700">
                    <TabButton isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>سجل العمليات</TabButton>
                    <TabButton isActive={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')}>طلبات السحب</TabButton>
                </div>

                {activeTab === 'transactions' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 dark:bg-slate-800"><tr className="border-b dark:border-slate-700"><th className="p-2">التاريخ</th><th className="p-2">الوصف</th><th className="p-2">المبلغ</th><th className="p-2">الرصيد بعد</th></tr></thead>
                            <tbody>
                                {(paginatedData as Transaction[]).map(t => (
                                    <tr key={t.id} className="border-b dark:border-slate-700 last:border-0">
                                        <td className="p-2 text-xs">{new Date(t.timestamp).toLocaleString('ar-SY')}</td>
                                        <td className="p-2">{t.description}</td>
                                        <td className={`p-2 font-mono font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount > 0 ? '+' : '-'}${Math.abs(Number(t.amount)).toFixed(2)}</td>
                                        <td className="p-2 font-mono text-slate-500">${Number(t.balanceAfter).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {myTransactions.length === 0 && <EmptyState message="لا يوجد سجل عمليات." />}
                    </div>
                )}

                {activeTab === 'withdrawals' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 dark:bg-slate-800"><tr className="border-b dark:border-slate-700"><th className="p-2">التاريخ</th><th className="p-2">المبلغ</th><th className="p-2">طريقة الدفع</th><th className="p-2">الحالة</th></tr></thead>
                            <tbody>{(paginatedData as WithdrawalRequest[]).map(w => (
                                <tr key={w.id} className="border-b dark:border-slate-700 last:border-0">
                                    <td className="p-2 text-xs">{new Date(w.requestTimestamp).toLocaleDateString()}</td>
                                    <td className="p-2 font-mono">${Number(w.amount).toFixed(2)}</td>
                                    <td className="p-2 text-xs">
                                        {w.paymentMethodName ||
                                            provider.paymentInfo?.find(p => p.methodId === w.paymentMethodId)?.methodName ||
                                            settings.paymentMethods.find(p => p.id === w.paymentMethodId)?.name ||
                                            w.paymentMethodId}
                                    </td>
                                    <td className="p-2 flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2 justify-end">
                                            <StatusBadge status={w.status} />
                                            {w.status === 'Approved' && w.receiptUrl && (
                                                <button
                                                    onClick={() => setViewingReceipt(w.receiptUrl!)}
                                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    title="عرض الإيصال"
                                                >
                                                    <Icon name="Receipt" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        {w.adminNotes && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={w.adminNotes}>
                                                ملاحظات: {w.adminNotes}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                        {myWithdrawals.length === 0 && <EmptyState message="لا توجد طلبات سحب." />}
                    </div>
                )}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={dataToPaginate.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                )}
            </div>

            {isWithdrawModalOpen && <WithdrawModal provider={provider} settings={settings} onClose={() => setIsWithdrawModalOpen(false)} onSubmit={handleWithdrawSubmit} />}

            {viewingReceipt && (
                <Modal title="إيصال التحويل" onClose={() => setViewingReceipt(null)}>
                    <div className="flex justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <img src={viewingReceipt} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setViewingReceipt(null)} className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg font-bold">إغلاق</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WalletView;
