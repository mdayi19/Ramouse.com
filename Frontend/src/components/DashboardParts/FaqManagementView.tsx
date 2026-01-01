import React, { useState, useEffect } from 'react';
import { FaqItem, ApiResponse } from '../../types';
import { api } from '../../lib/api';
import Modal from '../Modal';
import { ViewHeader, EditIcon, DeleteIcon } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

const FaqFormModal: React.FC<{
    item: FaqItem | null;
    onSave: (item: FaqItem) => void;
    onClose: () => void;
}> = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState<FaqItem>(item || { id: `faq-${Date.now()}`, question: '', answer: '' });

    useEffect(() => {
        setFormData(item || { id: `faq-${Date.now()}`, question: '', answer: '' });
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";

    return (
        <Modal title={item ? 'تعديل السؤال' : 'إضافة سؤال جديد'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="السؤال" name="question" value={formData.question} onChange={handleChange} required />
                <Textarea label="الإجابة" name="answer" value={formData.answer} onChange={handleChange} rows={5} required />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <Button type="button" onClick={onClose} variant="ghost">إلغاء</Button>
                    <Button type="submit">حفظ</Button>
                </div>
            </form>
        </Modal>
    );
};

const FaqManagementView = () => {
    const [items, setItems] = useState<FaqItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<ApiResponse<FaqItem[]>>('/faq');

            if (response.data.success && response.data.data) {
                setItems(response.data.data);
            } else {
                setError('فشل في تحميل الأسئلة الشائعة');
            }
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            setError('حدث خطأ أثناء تحميل الأسئلة الشائعة');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleSave = async (itemData: FaqItem) => {
        try {
            setError(null);

            if (items.some(i => i.id === itemData.id)) {
                // Editing existing FAQ
                const response = await api.put<ApiResponse<FaqItem>>(`/admin/faq/${itemData.id}`, {
                    question: itemData.question,
                    answer: itemData.answer
                });

                if (response.data.success && response.data.data) {
                    setItems(items.map(i => i.id === itemData.id ? response.data.data! : i));
                }
            } else {
                // Adding new FAQ
                const response = await api.post<ApiResponse<FaqItem>>('/admin/faq', {
                    question: itemData.question,
                    answer: itemData.answer
                });

                if (response.data.success && response.data.data) {
                    setItems([...items, response.data.data]);
                }
            }

            setIsModalOpen(false);
            setEditingItem(null);
        } catch (err) {
            console.error('Error saving FAQ:', err);
            setError('حدث خطأ أثناء حفظ السؤال');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
            try {
                setError(null);
                await api.delete(`/admin/faq/${id}`);
                setItems(items.filter(i => i.id !== id));
            } catch (err) {
                console.error('Error deleting FAQ:', err);
                setError('حدث خطأ أثناء حذف السؤال');
            }
        }
    };

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة الأسئلة الشائعة" subtitle="إضافة وتعديل وحذف الأسئلة والأجوبة." />

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end mb-6">
                <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                    + سؤال جديد
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    لا توجد أسئلة شائعة. انقر على "سؤال جديد" لإضافة سؤال.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <Card key={item.id} className="p-4 bg-slate-50 dark:bg-darkbg border dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{item.question}</h4>
                                <div className="flex gap-2 flex-shrink-0 ml-4">
                                    <Button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"><EditIcon className="w-5 h-5" /></Button>
                                    <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"><DeleteIcon className="w-5 h-5" /></Button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{item.answer}</p>
                        </Card>
                    ))}
                </div>
            )}

            {isModalOpen && <FaqFormModal item={editingItem} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </Card>
    );
};

export default FaqManagementView;
