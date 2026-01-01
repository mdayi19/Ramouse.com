import React, { useState } from 'react';
import { Provider, Settings } from '../../types';
import Modal from '../Modal';

interface WithdrawModalProps {
    provider: Provider;
    settings: Settings;
    onClose: () => void;
    onSubmit: (amount: number, paymentMethodId: string) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ provider, settings, onClose, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState(provider.paymentInfo?.find(p => p.isPrimary)?.methodId || provider.paymentInfo?.[0]?.methodId || '');
    const [error, setError] = useState('');

    const handleWithdraw = () => {
        setError('');
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('الرجاء إدخال مبلغ صحيح.');
            return;
        }
        if (numAmount < (settings?.limitSettings?.minWithdrawalAmount || 0)) {
            setError(`الحد الأدنى للسحب هو $${settings?.limitSettings?.minWithdrawalAmount || 0}`);
            return;
        }
        if (numAmount > parseFloat(String(provider.walletBalance))) {
            setError('الرصيد غير كافٍ.');
            return;
        }
        if (!paymentMethodId) {
            setError('الرجاء اختيار طريقة دفع.');
            return;
        }

        onSubmit(numAmount, paymentMethodId);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";

    return (
        <Modal
            title="طلب سحب جديد"
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-lg text-sm font-semibold">إلغاء</button>
                    <button onClick={handleWithdraw} className="bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">تأكيد الطلب</button>
                </div>
            }
        >
            <div className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div>
                    <label className="block text-sm font-medium">المبلغ ($)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        max={Number(provider.walletBalance) || 0}
                        min={Number(settings?.limitSettings?.minWithdrawalAmount) || 0}
                        step="0.01"
                        className={inputClasses}
                        placeholder={`الحد الأدنى: $${settings?.limitSettings?.minWithdrawalAmount || 0}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">طريقة الدفع</label>
                    <select value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} className={inputClasses}>
                        {provider.paymentInfo?.map(p => <option key={p.methodId} value={p.methodId}>{p.methodName} {p.isPrimary && '(أساسي)'}</option>)}
                    </select>
                </div>
                <div className="text-xs text-slate-500 p-2 bg-slate-50 dark:bg-darkbg rounded-md">
                    الرصيد المتاح: ${parseFloat(String(provider.walletBalance)).toFixed(2)}
                </div>
            </div>
        </Modal>
    );
};

export default WithdrawModal;
