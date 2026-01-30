import React, { useState, useEffect } from 'react';
import { FaqItem, ApiResponse } from '../../types';
import { api } from '../../lib/api';
import Modal from '../Modal';
import { ViewHeader, EditIcon, DeleteIcon, Icon } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

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

    return (
        <Modal title={item ? '✏️ تعديل السؤال' : '✨ إضافة سؤال جديد'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>نصيحة:</strong> اكتب أسئلة واضحة ومباشرة، وأجب عليها بشكل شامل ومفيد للزوار.
                        </div>
                    </div>
                </div>

                <Input
                    label="السؤال"
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    required
                    placeholder="مثال: كيف يمكنني طلب قطع غيار؟"
                    className="bg-slate-50 dark:bg-slate-900/50"
                />
                <Textarea
                    label="الإجابة"
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    rows={6}
                    required
                    placeholder="اكتب إجابة شاملة وواضحة تساعد العملاء..."
                    className="bg-slate-50 dark:bg-slate-900/50"
                />
                <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 dark:border-slate-700 mt-6">
                    <Button type="button" onClick={onClose} variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">إلغاء</Button>
                    <Button type="submit" className="shadow-lg shadow-primary/20">
                        <Icon name="Save" className="w-4 h-4 ml-2" />
                        حفظ السؤال
                    </Button>
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
                const response = await api.put<ApiResponse<FaqItem>>(`/admin/faq/${itemData.id}`, {
                    question: itemData.question,
                    answer: itemData.answer
                });

                if (response.data.success && response.data.data) {
                    setItems(items.map(i => i.id === itemData.id ? response.data.data! : i));
                }
            } else {
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
        if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.')) {
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchFaqs();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-xl">
                    <ViewHeader title="❓ إدارة الأسئلة الشائعة" subtitle="إضافة وتعديل وحذف الأسئلة والأجوبة." />
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700"></div>
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary absolute top-0"></div>
                        </div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">جاري تحميل الأسئلة...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ViewHeader title="❓ إدارة الأسئلة الشائعة" subtitle="إضافة وتعديل وحذف الأسئلة والأجوبة." />
                    <div className="flex gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="secondary"
                            size="icon"
                            className={`rounded-full shadow-md bg-white dark:bg-slate-800 ${isRefreshing ? 'animate-pulse' : ''}`}
                        >
                            <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                            className="shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Icon name="Plus" className="w-4 h-4 ml-2" />
                            سؤال جديد
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Error Alert */}
            {error && (
                <Card className="p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 shadow-lg">
                    <div className="flex items-start gap-3">
                        <Icon name="AlertCircle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-600 dark:text-red-400 font-medium flex-1">{error}</p>
                        <Button onClick={() => setError(null)} variant="ghost" size="icon" className="text-red-600 dark:text-red-400">
                            <Icon name="X" className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            )}

            {/* Stats */}
            <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 px-4 py-2">
                        <Icon name="HelpCircle" className="w-4 h-4 ml-2" />
                        {items.length} سؤال
                    </Badge>
                </div>
            </Card>

            {/* FAQ Items */}
            {items.length === 0 ? (
                <Card className="p-12 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-6 shadow-inner">
                            <Icon name="HelpCircle" className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">لا توجد أسئلة شائعة</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">ابدأ بإضافة الأسئلة الشائعة لمساعدة عملائك</p>
                        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="shadow-lg shadow-primary/20">
                            <Icon name="Plus" className="w-4 h-4 ml-2" />
                            إضافة أول سؤال
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => {
                        const isExpanded = expandedId === item.id;
                        return (
                            <Card
                                key={item.id}
                                className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Question Header */}
                                <div
                                    className="flex items-start gap-4 p-5 cursor-pointer group"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Icon name="HelpCircle" className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">
                                            {item.question}
                                        </h4>
                                        {isExpanded && (
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-3 animate-fade-in">
                                                {item.answer}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsModalOpen(true); }}
                                            variant="ghost"
                                            size="icon"
                                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                        </Button>
                                        <Icon
                                            name={isExpanded ? "ChevronUp" : "ChevronDown"}
                                            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && <FaqFormModal item={editingItem} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} />}
        </div>
    );
};

export default FaqManagementView;
