import React, { useState, useEffect, useMemo } from 'react';
import { Provider, Category } from '../types';
import Modal from './Modal';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { ViewHeader, AddFundsModal } from './DashboardParts/Shared';
import Icon from './Icon';

import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

interface ProvidersViewProps {
    allProviders: Provider[];
    onSaveProvider: (p: Provider) => Promise<void>;
    onDeleteProvider: (id: string) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    carCategories: Category[];
    navigationParams: any;
    addManualDeposit: (providerId: string, amount: number, description: string) => void;
    onRefresh?: () => void;
}

const ProviderFormModal: React.FC<{
    provider: Provider | null; onSave: (p: Provider) => void; onClose: () => void; carCategories: Category[];
}> = ({ provider, onSave, onClose, carCategories }) => {
    const [formData, setFormData] = useState<Provider>({ id: '', name: '', password: '', assignedCategories: [], isActive: true, uniqueId: '', walletBalance: 0, phone: '' });
    const [showPassword, setShowPassword] = useState(false);
    const isEditing = !!provider;

    useEffect(() => {
        if (provider) {
            setFormData({ ...provider, password: provider.password || '' });
        } else {
            setFormData({ id: '', name: '', password: '', assignedCategories: [], isActive: true, uniqueId: '', walletBalance: 0, phone: '' });
        }
    }, [provider]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleCategoryChange = (catName: string) => setFormData(p => ({ ...p, assignedCategories: p.assignedCategories.includes(catName) ? p.assignedCategories.filter(c => c !== catName) : [...p.assignedCategories, catName] }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    const selectedCount = formData.assignedCategories.length;

    return (
        <Modal title={isEditing ? 'تعديل مزود' : 'إضافة مزود جديد'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <Icon name="User" className="w-4 h-4 inline ml-1" />
                        الاسم
                    </label>
                    <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="اسم المزود"
                    />
                </div>

                {/* Phone Field */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <Icon name="Phone" className="w-4 h-4 inline ml-1" />
                        المعرف (رقم الهاتف)
                    </label>
                    <Input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        className="disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                        required
                        dir="ltr"
                        disabled={isEditing}
                        placeholder="+9665XXXXXXXX"
                    />
                    {isEditing && <p className="mt-1 text-xs text-slate-500">لا يمكن تعديل رقم الهاتف</p>}
                </div>

                {/* Password Field */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <Icon name="Lock" className="w-4 h-4 inline ml-1" />
                        كلمة المرور
                    </label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="pr-10"
                            required={!isEditing}
                            dir="ltr"
                            placeholder={isEditing ? 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية' : 'أدخل كلمة المرور'}
                        />
                        <Button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <Icon name={showPassword ? "EyeOff" : "Eye"} className="w-4 h-4" />
                        </Button>
                    </div>
                    {isEditing && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">اترك الحقل فارغاً إذا كنت لا تريد تغيير كلمة المرور</p>}
                </div>

                {/* Categories */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <Icon name="Tag" className="w-4 h-4 inline ml-1" />
                        الفئات المخصصة
                        {selectedCount > 0 && <span className="mr-2 text-primary text-xs font-bold">({selectedCount} محددة)</span>}
                    </label>
                    {isEditing && formData.assignedCategories.length > 0 && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">الفئات المخصصة حالياً:</p>
                            <div className="flex flex-wrap gap-1">
                                {formData.assignedCategories.map((cat, idx) => (
                                    <Badge key={idx} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-2 space-y-2 p-4 border border-slate-300 dark:border-slate-600 rounded-lg max-h-80 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
                        {carCategories.map(cat => {
                            const isAssigned = formData.assignedCategories.includes(cat.name);
                            return (
                                <div
                                    key={cat.id}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${isAssigned
                                        ? 'bg-primary/10 border-2 border-primary/40 shadow-sm'
                                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl ${isAssigned ? 'opacity-100' : 'opacity-40'}`}>
                                            {cat.flag}
                                        </span>
                                        <span className={`text-sm font-medium select-none ${isAssigned ? 'text-primary font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {cat.name}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isAssigned}
                                            onChange={() => handleCategoryChange(cat.name)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                    {selectedCount === 0 && <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">⚠️ يجب تحديد فئة واحدة على الأقل</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="ghost"
                        className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="font-bold shadow-sm"
                        disabled={selectedCount === 0}
                    >
                        {isEditing ? 'حفظ التعديلات' : 'إضافة المزود'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const ProvidersView: React.FC<ProvidersViewProps> = ({ allProviders, onSaveProvider, onDeleteProvider, showToast, carCategories, navigationParams, addManualDeposit, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
    const [providerForFunds, setProviderForFunds] = useState<Provider | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    useEffect(() => {
        if (navigationParams?.orderNumber) { // Using orderNumber to pass providerId
            setSearchTerm(navigationParams.orderNumber);
        }
    }, [navigationParams]);

    const filteredProviders = useMemo(() => {
        return allProviders.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.includes(searchTerm) ||
            p.uniqueId.includes(searchTerm)
        );
    }, [allProviders, searchTerm]);

    const paginatedProviders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProviders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProviders, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const handleSaveProvider = async (providerToSave: Provider) => {
        try {
            await onSaveProvider(providerToSave);
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteProvider = async (providerId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المزود؟ سيتم حذف جميع بياناته المتعلقة.')) {
            await onDeleteProvider(providerId);
        }
    };

    const handleToggleActive = async (providerId: string) => {
        const provider = allProviders.find(p => p.id === providerId);
        if (provider) {
            await onSaveProvider({ ...provider, isActive: !provider.isActive });
        }
    };

    const handleConfirmDeposit = async (providerId: string, amount: number, description: string) => {
        addManualDeposit(providerId, amount, description);
        setIsFundsModalOpen(false);
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <ViewHeader title="إدارة المزودين" subtitle="إضافة، تعديل، وتفعيل حسابات مزودي قطع الغيار." />
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <Input
                    type="text"
                    placeholder="ابحث بالاسم أو الرقم..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3"
                />
                <Button
                    onClick={() => { setEditingProvider(null); setIsModalOpen(true); }}
                    className="w-full sm:w-auto font-bold flex items-center justify-center gap-2"
                >
                    <Icon name="Plus" className="w-5 h-5" />
                    إضافة مزود
                </Button>
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-3">المزود</th>
                            <th className="p-3">الفئات</th>
                            <th className="p-3">الرصيد</th>
                            <th className="p-3">آخر دخول</th>
                            <th className="p-3">مفعل</th>
                            <th className="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900/50">
                        {paginatedProviders.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                                            <div className="text-xs text-slate-500 font-mono" dir="ltr">{p.id} (#{p.uniqueId})</div>
                                        </div>
                                        {!p.isActive && <Badge variant="destructive" className="text-xs px-2 py-0.5">معطل</Badge>}
                                    </div>
                                </td>
                                <td className="p-3 text-xs">
                                    {p.assignedCategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {p.assignedCategories.slice(0, 3).map((cat, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                                                    {cat}
                                                </Badge>
                                            ))}
                                            {p.assignedCategories.length > 3 && <span className="text-xs text-slate-500">+{p.assignedCategories.length - 3}</span>}
                                        </div>
                                    ) : <span className="text-slate-400">-</span>}
                                </td>
                                <td className="p-3 font-mono text-slate-700 dark:text-slate-300">${Number(p.walletBalance).toFixed(2)}</td>
                                <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{p.lastLoginTimestamp ? new Date(p.lastLoginTimestamp).toLocaleDateString() : 'لم يسجل دخول'}</td>
                                <td className="p-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={p.isActive} onChange={() => handleToggleActive(p.id)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                    </label>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            onClick={() => { setProviderForFunds(p); setIsFundsModalOpen(true); }}
                                            variant="ghost"
                                            size="icon"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                            title="إضافة رصيد"
                                        >
                                            <Icon name="Landmark" className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => { setEditingProvider(p); setIsModalOpen(true); }}
                                            variant="ghost"
                                            size="icon"
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            title="تعديل"
                                        >
                                            <Icon name="Pencil" className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteProvider(p.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="حذف"
                                        >
                                            <Icon name="Trash2" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List */}
            <div className="space-y-4 md:hidden">
                {paginatedProviders.map(p => (
                    <Card key={p.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold text-lg text-slate-800 dark:text-slate-200">{p.name}</div>
                                <div className="text-xs text-slate-500 font-mono" dir="ltr">{p.id} (#{p.uniqueId})</div>
                            </div>
                            <div className="flex items-center gap-1">
                                {!p.isActive && <Badge variant="destructive" className="text-xs">معطل</Badge>}
                                <Button onClick={() => { setProviderForFunds(p); setIsFundsModalOpen(true); }} variant="ghost" size="icon" className="text-green-600 h-8 w-8" title="إضافة رصيد"><Icon name="Landmark" className="w-4 h-4" /></Button>
                                <Button onClick={() => { setEditingProvider(p); setIsModalOpen(true); }} variant="ghost" size="icon" className="text-blue-600 h-8 w-8" title="تعديل"><Icon name="Pencil" className="w-4 h-4" /></Button>
                                <Button onClick={() => handleDeleteProvider(p.id)} variant="ghost" size="icon" className="text-red-600 h-8 w-8" title="حذف"><Icon name="Trash2" className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-xs text-slate-500">الرصيد</div>
                                <div className="font-semibold font-mono text-slate-700 dark:text-slate-300">${Number(p.walletBalance).toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">آخر دخول</div>
                                <div className="font-semibold text-slate-700 dark:text-slate-300">{p.lastLoginTimestamp ? new Date(p.lastLoginTimestamp).toLocaleDateString() : 'لم يسجل دخول'}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-xs text-slate-500 mb-1">الفئات المخصصة</div>
                                {p.assignedCategories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {p.assignedCategories.map((cat, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                {cat}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : <span className="text-slate-400 text-xs">لا توجد فئات</span>}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">الحساب مفعل</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={p.isActive} onChange={() => handleToggleActive(p.id)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </Card>
                ))}
            </div>


            {filteredProviders.length === 0 && (
                <div className="mt-8">
                    <EmptyState message={searchTerm ? "لم يتم العثور على مزودين مطابقين للبحث." : "لا يوجد مزودون بعد. ابدأ بإضافة مزود جديد."} />
                </div>
            )}
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredProviders.length / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} totalItems={filteredProviders.length} itemsPerPage={ITEMS_PER_PAGE} />

            {isModalOpen && <ProviderFormModal provider={editingProvider} carCategories={carCategories} onSave={handleSaveProvider} onClose={() => setIsModalOpen(false)} />}
            {isFundsModalOpen && providerForFunds && <AddFundsModal provider={providerForFunds} onClose={() => setIsFundsModalOpen(false)} onConfirm={handleConfirmDeposit} />}
        </Card>
    );
};

export default ProvidersView;
