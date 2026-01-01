import React, { useState } from 'react';
import { ProviderPaymentInfo, Settings } from '../../types';
import Modal from '../Modal';

interface PaymentInfoFormModalProps {
    paymentInfo: ProviderPaymentInfo | null;
    existingMethods: ProviderPaymentInfo[];
    systemMethods: Settings['paymentMethods'];
    onSave: (info: ProviderPaymentInfo) => void;
    onClose: () => void;
}

const PaymentInfoFormModal: React.FC<PaymentInfoFormModalProps> = ({ paymentInfo, existingMethods, systemMethods, onSave, onClose }) => {
    const [methodId, setMethodId] = useState(paymentInfo?.methodId || '');
    const [details, setDetails] = useState(paymentInfo?.details || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const systemMethod = systemMethods.find(m => m.id === methodId);
        if (!systemMethod) return;

        if (!paymentInfo && existingMethods.some(em => em.methodId === methodId)) {
            alert('لقد أضفت طريقة الدفع هذه بالفعل. يمكنك تعديلها.');
            return;
        }

        onSave({
            methodId, methodName: systemMethod.name, details,
            isPrimary: paymentInfo?.isPrimary || existingMethods.length === 0,
        });
    };
    
    const availableSystemMethods = systemMethods.filter(sm => sm.isActive && (!existingMethods.some(em => em.methodId === sm.id) || paymentInfo?.methodId === sm.id));
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";

    return (
        <Modal 
            title={paymentInfo ? "تعديل معلومات الدفع" : "إضافة طريقة دفع"} 
            onClose={onClose}
            footer={
                 <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-lg text-sm font-semibold">إلغاء</button>
                    <button type="submit" form="payment-form" className="bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">حفظ</button>
                </div>
            }
        >
            <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">طريقة الدفع</label>
                    <select value={methodId} onChange={e => setMethodId(e.target.value)} className={inputClasses} required>
                        <option value="" disabled>-- اختر طريقة --</option>
                        {availableSystemMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">تفاصيل حسابك (رقم الحساب، رقم الهاتف، إلخ)</label>
                    <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} className={inputClasses} required placeholder={systemMethods.find(m=>m.id === methodId)?.details} />
                </div>
            </form>
        </Modal>
    );
};

export default PaymentInfoFormModal;
