
import React, { useState, useMemo, useEffect } from 'react';
import { Provider, WithdrawalRequest, Transaction } from '../../types';
import Modal from '../Modal';
import ImageUpload from '../ImageUpload';
import { ViewHeader, StatusBadge, AddFundsModal, Icon } from './Shared';
import { AccountingViewTab } from './types';
import Pagination from '../Pagination';
import EmptyState from '../EmptyState';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface AccountingViewProps {
    providers: Provider[];
    withdrawals: WithdrawalRequest[];
    transactions: Transaction[];
    onApproveWithdrawal: (reqId: string, receiptUrl?: string) => void;
    onRejectWithdrawal: (reqId: string, reason: string) => void;
    onAddFunds: (providerId: string, amount: number, description: string) => Promise<void>;
    onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 10;

const AccountingView: React.FC<AccountingViewProps> = ({ providers, withdrawals, transactions, onApproveWithdrawal, onRejectWithdrawal, onAddFunds, onRefresh }) => {
    const [tab, setTab] = useState<AccountingViewTab>('withdrawals');
    const [rejectingRequest, setRejectingRequest] = useState<WithdrawalRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvingRequest, setApprovingRequest] = useState<WithdrawalRequest | null>(null);
    const [receiptFile, setReceiptFile] = useState<File[]>([]);
    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
    const [providerForFunds, setProviderForFunds] = useState<Provider | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    const { dataToPaginate, totalPages, paginatedData } = useMemo(() => {
        let data: (WithdrawalRequest | Provider | Transaction)[] = [];
        if (tab === 'withdrawals') data = withdrawals;
        if (tab === 'balances') data = providers;
        if (tab === 'history') data = transactions;

        const total = Math.ceil(data.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { dataToPaginate: data, totalPages: total, paginatedData: paginated };
    }, [tab, withdrawals, providers, transactions, currentPage]);


    const handleConfirmRejection = () => {
        if (rejectingRequest && rejectionReason) {
            onRejectWithdrawal(rejectingRequest.id, rejectionReason);
            setRejectingRequest(null);
            setRejectionReason('');
        }
    };

    const handleConfirmApproval = async () => {
        if (!approvingRequest) return;
        let receiptUrl: string | undefined;
        if (receiptFile.length > 0) {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
            receiptUrl = await toBase64(receiptFile[0]);
        }
        onApproveWithdrawal(approvingRequest.id, receiptUrl);
        setApprovingRequest(null);
        setReceiptFile([]);
    };

    const handleConfirmDeposit = async (providerId: string, amount: number, description: string) => {
        await onAddFunds(providerId, amount, description);
        setProviderForFunds(null);
    };

    const getPaymentDetails = (req: WithdrawalRequest) => {
        const provider = providers.find(p => p.id === req.providerId);
        const info = provider?.paymentInfo?.find(pi => pi.methodId === req.paymentMethodId);

        if (!info || !info.details) {
            return {
                details: null,
                warning: 'تحذير: لم يتم العثور على تفاصيل طريقة الدفع في ملف المزود. يرجى التواصل مع المزود للحصول على التفاصيل.'
            };
        }

        return {
            details: info.details,
            warning: null
        };
    };

    const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
        <Button
            onClick={onClick}
            variant="ghost"
            className={`rounded-b-none px-4 py-2 text-sm font-semibold transition-all ${isActive ? 'border-b-2 border-primary text-primary bg-primary/5 hover:bg-primary/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            {children}
        </Button>
    );

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <ViewHeader title="المحاسبة والمالية" subtitle="إدارة أرصدة المزودين، طلبات السحب، وسجل العمليات." />
                {onRefresh && (
                    <Button
                        onClick={handleRefresh}
                        variant="secondary"
                        size="icon"
                        className={`rounded-full shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-pulse' : ''}`}
                    >
                        <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>
            <div className="flex border-b mb-4">
                <TabButton isActive={tab === 'withdrawals'} onClick={() => setTab('withdrawals')}>طلبات السحب</TabButton>
                <TabButton isActive={tab === 'balances'} onClick={() => setTab('balances')}>أرصدة المزودين</TabButton>
                <TabButton isActive={tab === 'history'} onClick={() => setTab('history')}>سجل العمليات</TabButton>
            </div>
            {tab === 'withdrawals' && (
                <>
                    {/* Desktop Table */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase"><tr>
                                <th className="p-2">التاريخ</th><th className="p-2">المزود</th><th className="p-2">المبلغ</th><th className="p-2">طريقة الدفع</th><th className="p-2">ملاحظات</th><th className="p-2">الإيصال</th><th className="p-2">الحالة</th><th className="p-2">إجراءات</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{(paginatedData as WithdrawalRequest[]).map(w => (
                                <tr key={w.id}>
                                    <td className="p-2 text-xs">{new Date(w.requestTimestamp).toLocaleDateString()}</td>
                                    <td className="p-2">{w.providerName} (#{w.providerUniqueId})</td>
                                    <td className="p-2 font-mono">${Number(w.amount).toFixed(2)}</td>
                                    <td className="p-2 text-xs">{w.paymentMethodName}</td>
                                    <td className="p-2 text-xs max-w-[150px] truncate" title={w.adminNotes}>{w.adminNotes || '-'}</td>
                                    <td className="p-2">
                                        {w.receiptUrl && (
                                            <Button variant="ghost" size="sm" onClick={() => setViewingReceipt(w.receiptUrl!)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Icon name="Receipt" className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </td>
                                    <td className="p-2"><StatusBadge status={w.status} /></td>
                                    <td className="p-2">{w.status === 'Pending' && <div className="flex gap-2">
                                        <Button size="sm" onClick={() => setApprovingRequest(w)} className="bg-green-500 hover:bg-green-600 text-white h-7 px-2 text-xs">موافقة</Button>
                                        <Button size="sm" onClick={() => setRejectingRequest(w)} className="bg-red-500 hover:bg-red-600 text-white h-7 px-2 text-xs">رفض</Button>
                                    </div>}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="space-y-4 md:hidden">
                        {(paginatedData as WithdrawalRequest[]).map(w => (
                            <Card key={w.id} className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">{w.providerName} (#{w.providerUniqueId})</div>
                                        <div className="text-xs text-slate-500">{new Date(w.requestTimestamp).toLocaleDateString()}</div>
                                    </div>
                                    <StatusBadge status={w.status} />
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <p className="font-bold text-lg font-mono">${Number(w.amount).toFixed(2)}</p>
                                    <p className="text-xs text-slate-500">{w.paymentMethodName}</p>
                                    {w.adminNotes && <p className="text-xs text-slate-400 mt-1">ملاحظات: {w.adminNotes}</p>}
                                    {w.receiptUrl && (
                                        <Button variant="ghost" size="sm" onClick={() => setViewingReceipt(w.receiptUrl!)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mt-1 h-auto py-1">
                                            <Icon name="Receipt" className="w-3 h-3" /> عرض الإيصال
                                        </Button>
                                    )}
                                </div>
                                {w.status === 'Pending' && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <Button size="sm" onClick={() => setApprovingRequest(w)} className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white">موافقة</Button>
                                        <Button size="sm" onClick={() => setRejectingRequest(w)} className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white">رفض</Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                    {paginatedData.length === 0 && <EmptyState message="لا توجد طلبات سحب." />}
                </>
            )
            }
            {
                tab === 'balances' && (
                    <>
                        {/* Desktop Table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase"><tr><th className="p-2">المزود</th><th className="p-2">الرصيد الحالي</th><th className="p-2">إجراء</th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{(paginatedData as Provider[]).map(p => (
                                    <tr key={p.id}>
                                        <td className="p-2">{p.name} (#{p.uniqueId})</td>
                                        <td className="p-2 font-mono">${Number(p.walletBalance || 0).toFixed(2)}</td>
                                        <td className="p-2"><Button size="sm" onClick={() => setProviderForFunds(p)} className="bg-blue-500 hover:bg-blue-600 text-white h-7 px-2 text-xs">إضافة رصيد</Button></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="space-y-4 md:hidden">
                            {(paginatedData as Provider[]).map(p => (
                                <Card key={p.id} className="p-4 border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                    <div>
                                        <div className="font-semibold">{p.name} (#{p.uniqueId})</div>
                                        <div className="text-lg font-bold font-mono text-primary dark:text-primary-400">${Number(p.walletBalance || 0).toFixed(2)}</div>
                                    </div>
                                    <Button size="sm" onClick={() => setProviderForFunds(p)} className="bg-blue-500 hover:bg-blue-600 text-white">إضافة رصيد</Button>
                                </Card>
                            ))}
                        </div>
                        {paginatedData.length === 0 && <EmptyState message="لا يوجد مزودون لعرض أرصدتهم." />}
                    </>
                )
            }
            {
                tab === 'history' && (
                    <>
                        {/* Desktop Table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase"><tr><th className="p-2">التاريخ</th><th className="p-2">المزود</th><th className="p-2">النوع</th><th className="p-2">الوصف</th><th className="p-2">المبلغ</th><th className="p-2">الرصيد بعد</th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{(paginatedData as Transaction[]).map(t => (
                                    <tr key={t.id}>
                                        <td className="p-2 text-xs">{new Date(t.timestamp).toLocaleString()}</td>
                                        <td className="p-2 text-xs">{providers.find(p => p.id === t.providerId)?.name || t.providerId}</td>
                                        <td className="p-2 text-xs">{t.type}</td>
                                        <td className="p-2 text-xs">{t.description}</td>
                                        <td className={`p-2 font-mono text-xs ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>${Math.abs(Number(t.amount)).toFixed(2)}</td>
                                        <td className="p-2 font-mono text-xs text-slate-500">${Number(t.balanceAfter).toFixed(2)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="space-y-4 md:hidden">
                            {(paginatedData as Transaction[]).map(t => (
                                <Card key={t.id} className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-sm">{t.description}</div>
                                            <div className="text-xs text-slate-500">{providers.find(p => p.id === t.providerId)?.name || t.providerId}</div>
                                            <div className="text-xs text-slate-400 mt-1">{new Date(t.timestamp).toLocaleString()}</div>
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-bold font-mono text-lg ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount > 0 ? '+' : '-'}${Math.abs(Number(t.amount)).toFixed(2)}</div>
                                            <div className="text-xs text-slate-500 font-mono">الرصيد: ${Number(t.balanceAfter).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        {paginatedData.length === 0 && <EmptyState message="لا يوجد سجل عمليات." />}
                    </>
                )
            }
            {
                totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={dataToPaginate.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                )
            }
            {
                rejectingRequest && <Modal title="رفض طلب السحب" onClose={() => setRejectingRequest(null)}><div className="space-y-4">
                    <textarea
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        placeholder="سبب الرفض..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setRejectingRequest(null)}>إلغاء</Button>
                        <Button onClick={() => handleConfirmRejection()} className="bg-red-500 hover:bg-red-600 text-white">تأكيد الرفض</Button>
                    </div>
                </div></Modal>
            }

            {
                approvingRequest && (
                    <Modal title="الموافقة على طلب السحب" onClose={() => setApprovingRequest(null)}>
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                                <p className="font-bold text-blue-800 dark:text-blue-200 mb-2">تفاصيل التحويل ({approvingRequest.paymentMethodName}):</p>
                                {(() => {
                                    const { details, warning } = getPaymentDetails(approvingRequest);
                                    return (
                                        <>
                                            {warning && (
                                                <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">{warning}</p>
                                            )}
                                            {details && (
                                                <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{details}</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <p className="font-medium">هل تؤكد موافقتك على سحب مبلغ <span className="font-bold font-mono">${Number(approvingRequest.amount).toFixed(2)}</span> للمزود {approvingRequest.providerName}؟</p>
                            <div>
                                <label className="block text-sm font-semibold mb-2">إرفاق إيصال التحويل (اختياري)</label>
                                <ImageUpload files={receiptFile} setFiles={setReceiptFile} maxFiles={1} />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setApprovingRequest(null)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200">إلغاء</Button>
                                <Button onClick={() => handleConfirmApproval()} className="bg-green-500 hover:bg-green-600 text-white font-bold">تأكيد الموافقة</Button>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {providerForFunds && <AddFundsModal provider={providerForFunds} onClose={() => setProviderForFunds(null)} onConfirm={handleConfirmDeposit} />}

            {
                viewingReceipt && (
                    <Modal title="إيصال التحويل" onClose={() => setViewingReceipt(null)}>
                        <div className="flex justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <img src={viewingReceipt} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setViewingReceipt(null)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold">إغلاق</Button>
                        </div>
                    </Modal>
                )
            }
        </Card >
    );
};

export default AccountingView;
