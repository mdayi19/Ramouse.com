
import React, { useState, useEffect } from 'react';
import { Settings, PaymentMethod } from '../types';
import Modal from './Modal';
import ImageUpload from './ImageUpload';
import { ViewHeader } from './DashboardParts/Shared';
import { EditIcon, DeleteIcon, Icon } from './DashboardParts/Shared';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface PaymentMethodsViewProps {
    settings: Settings;
    onSave: (newSettings: Partial<Settings>) => void;
}

const emptyPaymentMethod: PaymentMethod = { id: '', name: '', details: '', iconUrl: '', isActive: true };

const PaymentMethodFormModal: React.FC<{
    method: PaymentMethod | null;
    onSave: (method: PaymentMethod) => void;
    onClose: () => void;
}> = ({ method, onSave, onClose }) => {
    const [formData, setFormData] = useState<PaymentMethod>(method || emptyPaymentMethod);
    const [iconFile, setIconFile] = useState<File[]>([]);
    const isEditing = !!method;

    useEffect(() => {
        setFormData(method || { ...emptyPaymentMethod, id: `pm-${Date.now()}` });
    }, [method]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleIconChange = (files: File[]) => {
        setIconFile(files);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalData = { ...formData };
        if (iconFile.length > 0) {
            finalData.iconUrl = await fileToBase64(iconFile[0]);
        }
        onSave(finalData);
    };

    return (
        <Modal title={isEditing ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Input
                        label="اسم الطريقة"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">التفاصيل (رقم حساب، تعليمات، إلخ)</label>
                    <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleChange}
                        rows={4}
                        className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-primary h-auto resize-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">أيقونة (اختياري)</label>
                    {formData.iconUrl && !iconFile.length && <img src={formData.iconUrl} alt="icon" className="w-16 h-16 object-contain my-2 bg-slate-100 rounded-md p-1" />}
                    <ImageUpload files={iconFile} setFiles={handleIconChange} maxFiles={1} />
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded text-primary focus:ring-primary" />
                        <span className="text-sm font-medium">مفعلة</span>
                    </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="ghost" className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">إلغاء</Button>
                    <Button type="submit" variant="primary" className="font-bold">حفظ</Button>
                </div>
            </form>
        </Modal>
    );
};


const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({ settings, onSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const handleSaveMethod = (methodToSave: PaymentMethod) => {
        let updatedMethods: PaymentMethod[];
        if (settings.paymentMethods.some(m => m.id === methodToSave.id)) { // Editing
            updatedMethods = settings.paymentMethods.map(m => m.id === methodToSave.id ? methodToSave : m);
        } else { // Adding
            updatedMethods = [...settings.paymentMethods, methodToSave];
        }
        onSave({ paymentMethods: updatedMethods });
        setIsModalOpen(false);
    };

    const handleDeleteMethod = (methodId: string) => {
        if (window.confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
            const updatedMethods = settings.paymentMethods.filter(m => m.id !== methodId);
            onSave({ paymentMethods: updatedMethods });
        }
    };

    const handleToggleActive = (methodId: string) => {
        const updatedMethods = settings.paymentMethods.map(m =>
            m.id === methodId ? { ...m, isActive: !m.isActive } : m
        );
        onSave({ paymentMethods: updatedMethods });
    };


    return (
        <Card className="p-6">
            <ViewHeader title="إدارة طرق الدفع" subtitle="إضافة وتعديل طرق الدفع المتاحة في التطبيق." />
            <div className="flex justify-end mb-4">
                <Button
                    onClick={() => { setEditingMethod(null); setIsModalOpen(true); }}
                    className="font-bold flex items-center justify-center gap-2"
                >
                    <Icon name="Plus" className="w-5 h-5" />
                    إضافة طريقة دفع
                </Button>
            </div>

            <div className="space-y-4">
                {settings.paymentMethods.map(method => (
                    <Card key={method.id} className="p-4 flex justify-between items-start bg-slate-50 dark:bg-darkbg shadow-sm">
                        <div className="flex items-start gap-4">
                            {method.iconUrl && <img src={method.iconUrl} alt={method.name} className="w-12 h-12 object-contain rounded-md" />}
                            <div>
                                <h4 className="font-semibold">{method.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{method.details}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={method.isActive} onChange={() => handleToggleActive(method.id)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300 sr-only">مفعل</span>
                            </label>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingMethod(method); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="تعديل"><EditIcon className="w-5 h-5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMethod(method.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20" title="حذف"><DeleteIcon className="w-5 h-5" /></Button>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && <PaymentMethodFormModal method={editingMethod} onSave={handleSaveMethod} onClose={() => setIsModalOpen(false)} />}
        </Card>
    );

};

export default PaymentMethodsView;
