

import React, { useState, useMemo, useEffect } from 'react';
import { StoreCategory, StoreSubCategory, Settings, PaymentMethod, StoreBanner } from '../../../types';
import { ViewHeader, EditIcon, DeleteIcon } from '../Shared';
import Icon from '../../Icon';
import Modal from '../../Modal';
import IconSearch from '../../IconSearch';
import EmptyState from '../../EmptyState';
import ImageUpload from '../../ImageUpload';
import { adminStoreAPI } from '../../../lib/api';

interface StoreSettingsProps {
    categories: StoreCategory[];
    updateCategories: (cats: StoreCategory[]) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
    updateSettings: (s: Partial<Settings>) => void;
}

const emptyPaymentMethod: PaymentMethod = { id: '', name: '', details: '', iconUrl: '', isActive: true };
const emptyBanner: StoreBanner = { id: '', title: '', imageUrl: '', isActive: true, link: '' };

// Helper for file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// --- Banner Modal ---
const BannerFormModal: React.FC<{
    banner: StoreBanner | null;
    onSave: (banner: StoreBanner) => void;
    onClose: () => void;
}> = ({ banner, onSave, onClose }) => {
    const [formData, setFormData] = useState<StoreBanner>(banner || emptyBanner);
    const [imageFile, setImageFile] = useState<File[]>([]);
    const isEditing = !!banner;

    useEffect(() => {
        setFormData(banner || { ...emptyBanner, id: `bn-${Date.now()}` });
    }, [banner]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const checked = e.target.checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalData = { ...formData };
        if (imageFile.length > 0) {
            finalData.imageUrl = await fileToBase64(imageFile[0]);
        }
        if (!finalData.imageUrl && !isEditing) {
            alert('الرجاء رفع صورة للبانر');
            return;
        }
        onSave(finalData);
    };

    return (
        <Modal title={isEditing ? 'تعديل بانر إعلاني' : 'إضافة بانر إعلاني'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">عنوان البانر</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">صورة البانر (نسبة 3:1 مفضلة)</label>
                    {formData.imageUrl && !imageFile.length && <img src={formData.imageUrl} alt="preview" className="w-full h-24 object-cover my-2 rounded-md" />}
                    <ImageUpload files={imageFile} setFiles={setImageFile} maxFiles={1} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">رابط (اختياري)</label>
                    <input type="text" name="link" value={formData.link || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600" placeholder="/store?cat=oils" dir="ltr" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActiveBanner" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded text-primary w-4 h-4 cursor-pointer" />
                    <label htmlFor="isActiveBanner" className="text-sm font-medium cursor-pointer">مفعل</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium">إلغاء</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Payment Method Modal ---
const PaymentMethodFormModal: React.FC<{
    method: PaymentMethod | null;
    onSave: (method: PaymentMethod) => void;
    onClose: () => void;
}> = ({ method, onSave, onClose }) => {
    const [formData, setFormData] = useState<PaymentMethod>(method || emptyPaymentMethod);
    const [iconFile, setIconFile] = useState<File[]>([]);
    const isEditing = !!method;

    useEffect(() => {
        setFormData(method || { ...emptyPaymentMethod, id: `spm-${Date.now()}` });
    }, [method]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const checked = e.target.checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        <Modal title={isEditing ? 'تعديل طريقة دفع المتجر' : 'إضافة طريقة دفع للمتجر'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">اسم الطريقة</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">التفاصيل</label>
                    <textarea name="details" value={formData.details} onChange={handleChange} rows={4} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600" required placeholder="رقم الحساب، التعليمات، إلخ..." />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">أيقونة (اختياري)</label>
                    {formData.iconUrl && !iconFile.length && <img src={formData.iconUrl} alt="icon" className="w-16 h-16 object-contain my-2 bg-slate-100 rounded-md p-1" />}
                    <ImageUpload files={iconFile} setFiles={setIconFile} maxFiles={1} />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded text-primary w-4 h-4 cursor-pointer" />
                    <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">مفعلة</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium">إلغاء</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Category Modal ---
const CategoryFormModal: React.FC<{
    category: StoreCategory | null;
    existingCategories: StoreCategory[];
    onSave: (cat: StoreCategory) => void;
    onClose: () => void;
}> = ({ category, existingCategories, onSave, onClose }) => {
    const [name, setName] = useState(category?.name || '');
    const [icon, setIcon] = useState(category?.icon || 'Box');
    const [isFeatured, setIsFeatured] = useState(category?.isFeatured || false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('يرجى إدخال اسم الفئة');
            return;
        }

        const isDuplicate = existingCategories.some(
            c => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== category?.id
        );

        if (isDuplicate) {
            setError('اسم الفئة موجود بالفعل');
            return;
        }

        onSave({
            id: category?.id || `store-cat-${Date.now()}`,
            name: name.trim(),
            icon,
            subcategories: category?.subcategories || [],
            isFeatured
        });
    };

    return (
        <Modal title={category ? 'تعديل الفئة الرئيسية' : 'إضافة فئة رئيسية جديدة'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                        <Icon name="AlertCircle" className="w-4 h-4" />
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الفئة</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        placeholder="مثال: زيوت ومحركات"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded text-primary w-4 h-4 cursor-pointer" />
                    <label htmlFor="isFeatured" className="text-sm font-medium cursor-pointer">فئة مميزة (تظهر في أعلى المتجر)</label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">أيقونة الفئة</label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-primary border border-slate-200 dark:border-slate-600">
                                <Icon name={icon as any} className="w-8 h-8" />
                            </div>
                            <div className="text-sm text-slate-500">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">معاينة الأيقونة</p>
                                <p>اختر أيقونة تعبر بوضوح عن محتوى الفئة</p>
                            </div>
                        </div>
                        <IconSearch value={icon} onChange={setIcon} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">إلغاء</button>
                    <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors">حفظ الفئة</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Subcategory Modal ---
const SubcategoryFormModal: React.FC<{
    subcategory: StoreSubCategory | null;
    parentCategoryName: string;
    existingSubcategories: StoreSubCategory[];
    onSave: (sub: StoreSubCategory) => void;
    onClose: () => void;
}> = ({ subcategory, parentCategoryName, existingSubcategories, onSave, onClose }) => {
    const [name, setName] = useState(subcategory?.name || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) { setError('يرجى إدخال اسم الفئة الفرعية'); return; }
        const isDuplicate = existingSubcategories.some(s => s.name.toLowerCase() === name.trim().toLowerCase() && s.id !== subcategory?.id);
        if (isDuplicate) { setError('هذا الاسم موجود بالفعل في هذه الفئة'); return; }
        onSave({ id: subcategory?.id || `store-sub-${Date.now()}`, name: name.trim() });
    };

    return (
        <Modal title={subcategory ? 'تعديل الفئة الفرعية' : 'إضافة فئة فرعية'} onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md text-sm mb-4">
                    <span className="text-slate-500">تابع للفئة الرئيسية:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{parentCategoryName}</span>
                </div>
                {error && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">{error}</div>}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الفئة الفرعية</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary focus:border-primary" placeholder="مثال: زيوت محركات 5W30" autoFocus />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600">إلغاء</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

const StoreSettings: React.FC<StoreSettingsProps> = ({ categories: propCategories, updateCategories, showToast, settings, updateSettings }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'payment'>('general');

    // Categories - use local state that loads from API
    const [categories, setCategories] = useState<StoreCategory[]>(propCategories);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [activeParentCategory, setActiveParentCategory] = useState<StoreCategory | null>(null);
    const [editingSubcategory, setEditingSubcategory] = useState<StoreSubCategory | null>(null);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);

    // Payment Methods
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
    const storePaymentMethods = settings.storePaymentMethods || [];

    // Banners
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<StoreBanner | null>(null);
    const storeBanners = settings.storeBanners || [];

    const [isSaving, setIsSaving] = useState(false);

    // Fetch categories from API on mount
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await adminStoreAPI.getCategories();
                const fetchedCategories = response.data.data || [];
                setCategories(fetchedCategories);
                // Also update parent state so it stays in sync
                updateCategories(fetchedCategories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                // Fall back to prop categories if API fails
                setCategories(propCategories);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // Category Handlers
    const handleSaveCategory = async (cat: StoreCategory) => {
        setIsSaving(true);
        try {
            const isExisting = categories.some(c => c.id === cat.id);
            if (isExisting) {
                await adminStoreAPI.updateCategory(cat.id, {
                    name: cat.name,
                    icon: cat.icon,
                    subcategories: cat.subcategories,
                    isFeatured: cat.isFeatured
                });
            } else {
                await adminStoreAPI.createCategory({
                    name: cat.name,
                    icon: cat.icon,
                    subcategories: cat.subcategories,
                    isFeatured: cat.isFeatured
                });
            }
            // Update local state
            let updated;
            if (isExisting) {
                updated = categories.map(c => c.id === cat.id ? cat : c);
            } else {
                updated = [...categories, cat];
            }
            setCategories(updated);
            updateCategories(updated);
            setIsCategoryModalOpen(false);
            showToast('تم حفظ الفئة بنجاح', 'success');
        } catch (error) {
            console.error('Failed to save category:', error);
            showToast('فشل حفظ الفئة', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('هل أنت متأكد؟ سيؤدي حذف الفئة الرئيسية إلى حذف جميع الفئات الفرعية التابعة لها.')) {
            try {
                await adminStoreAPI.deleteCategory(id);
                const updated = categories.filter(c => c.id !== id);
                setCategories(updated);
                updateCategories(updated);
                showToast('تم حذف الفئة', 'info');
            } catch (error) {
                console.error('Failed to delete category:', error);
                showToast('فشل حذف الفئة', 'error');
            }
        }
    };

    const handleSaveSubcategory = async (sub: StoreSubCategory) => {
        if (!activeParentCategory) return;
        const updatedSubcategories = editingSubcategory
            ? activeParentCategory.subcategories?.map(s => s.id === sub.id ? sub : s)
            : [...(activeParentCategory.subcategories || []), sub];
        const updatedCategory = { ...activeParentCategory, subcategories: updatedSubcategories };

        try {
            await adminStoreAPI.updateCategory(activeParentCategory.id, {
                subcategories: updatedSubcategories
            });
            const updated = categories.map(c => c.id === activeParentCategory.id ? updatedCategory : c);
            setCategories(updated);
            updateCategories(updated);
            setIsSubModalOpen(false);
            showToast('تم حفظ الفئة الفرعية', 'success');
        } catch (error) {
            console.error('Failed to save subcategory:', error);
            showToast('فشل حفظ الفئة الفرعية', 'error');
        }
    };

    const handleDeleteSubcategory = async (parentId: string, subId: string) => {
        const parent = categories.find(c => c.id === parentId);
        if (!parent) return;
        if (window.confirm('حذف هذه الفئة الفرعية؟')) {
            const updatedSubcategories = parent.subcategories?.filter(s => s.id !== subId) || [];
            try {
                await adminStoreAPI.updateCategory(parentId, {
                    subcategories: updatedSubcategories
                });
                const updatedCategory = { ...parent, subcategories: updatedSubcategories };
                const updated = categories.map(c => c.id === parentId ? updatedCategory : c);
                setCategories(updated);
                updateCategories(updated);
                showToast('تم حذف الفئة الفرعية', 'info');
            } catch (error) {
                console.error('Failed to delete subcategory:', error);
                showToast('فشل حذف الفئة الفرعية', 'error');
            }
        }
    };

    // Payment Handlers
    const handleSavePaymentMethod = (method: PaymentMethod) => {
        let updatedMethods: PaymentMethod[];
        if (storePaymentMethods.some(m => m.id === method.id)) { updatedMethods = storePaymentMethods.map(m => m.id === method.id ? method : m); }
        else { updatedMethods = [...storePaymentMethods, method]; }
        updateSettings({ storePaymentMethods: updatedMethods });
        setIsPaymentModalOpen(false);
        showToast('تم حفظ طريقة الدفع الخاصة بالمتجر', 'success');
    };

    const handleDeletePaymentMethod = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف طريقة الدفع هذه من المتجر؟')) {
            updateSettings({ storePaymentMethods: storePaymentMethods.filter(m => m.id !== id) });
            showToast('تم حذف طريقة الدفع', 'info');
        }
    };

    const togglePaymentMethodActive = (id: string) => {
        updateSettings({ storePaymentMethods: storePaymentMethods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m) });
    };

    // Banner Handlers
    const handleSaveBanner = (banner: StoreBanner) => {
        let updatedBanners;
        if (storeBanners.some(b => b.id === banner.id)) {
            updatedBanners = storeBanners.map(b => b.id === banner.id ? banner : b);
        } else {
            updatedBanners = [...storeBanners, banner];
        }
        updateSettings({ storeBanners: updatedBanners });
        setIsBannerModalOpen(false);
        showToast('تم حفظ البانر', 'success');
    };

    const handleDeleteBanner = (id: string) => {
        if (window.confirm('حذف هذا البانر؟')) {
            updateSettings({ storeBanners: storeBanners.filter(b => b.id !== id) });
            showToast('تم حذف البانر', 'info');
        }
    }

    const toggleBannerActive = (id: string) => {
        updateSettings({ storeBanners: storeBanners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b) });
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <ViewHeader title="إعدادات المتجر" subtitle="إدارة هيكلية المتجر، الإعلانات، وطرق الدفع." />

            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('general')} className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>عام والبانرات</button>
                <button onClick={() => setActiveTab('categories')} className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>الفئات والأقسام</button>
                <button onClick={() => setActiveTab('payment')} className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'payment' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>طرق الدفع</button>
            </div>

            {/* --- General & Banners --- */}
            {activeTab === 'general' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">البانرات الإعلانية (أعلى المتجر)</h3>
                        <button onClick={() => { setEditingBanner(null); setIsBannerModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm shadow-sm"><Icon name="Plus" className="w-4 h-4" /> إضافة بانر</button>
                    </div>

                    {storeBanners.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {storeBanners.map(banner => (
                                <div key={banner.id} className="bg-white dark:bg-darkcard rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 group">
                                    <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
                                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button onClick={() => { setEditingBanner(banner); setIsBannerModalOpen(true); }} className="p-1.5 bg-white/80 hover:bg-white text-blue-600 rounded-full shadow"><EditIcon className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteBanner(banner.id)} className="p-1.5 bg-white/80 hover:bg-white text-red-600 rounded-full shadow"><DeleteIcon className="w-3 h-3" /></button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-sm font-bold">{banner.title}</div>
                                    </div>
                                    <div className="p-3 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>{banner.isActive ? 'نشط' : 'غير نشط'}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={banner.isActive} onChange={() => toggleBannerActive(banner.id)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="لا توجد بانرات إعلانية حالياً." />
                    )}
                </div>
            )}

            {/* --- Categories Section --- */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">هيكلية المتجر</h3>
                        <button onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-md text-sm"><Icon name="Plus" className="w-4 h-4" /> إضافة فئة</button>
                    </div>

                    {categories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {categories.map(cat => (
                                <div key={cat.id} className={`bg-white dark:bg-darkcard rounded-xl shadow-sm hover:shadow-md transition-shadow border ${cat.isFeatured ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-slate-200 dark:border-slate-700'} flex flex-col relative`}>
                                    {cat.isFeatured && <div className="absolute -top-3 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><Icon name="Star" className="w-3 h-3 fill-current" /> مميزة</div>}

                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/30 rounded-t-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-600">
                                                <Icon name={cat.icon as any} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</h4>
                                                <p className="text-xs text-slate-500">{cat.subcategories?.length || 0} قسم فرعي</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><DeleteIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-grow">
                                        {cat.subcategories && cat.subcategories.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {cat.subcategories.map(sub => (
                                                    <div key={sub.id} className="group flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer" onClick={() => { setActiveParentCategory(cat); setEditingSubcategory(sub); setIsSubModalOpen(true); }}>
                                                        <span>{sub.name}</span>
                                                    </div>
                                                ))}
                                                <button onClick={() => { setActiveParentCategory(cat); setEditingSubcategory(null); setIsSubModalOpen(true); }} className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="إضافة قسم فرعي"><Icon name="Plus" className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                                                <p className="text-xs mb-2">لا توجد أقسام فرعية</p>
                                                <button onClick={() => { setActiveParentCategory(cat); setEditingSubcategory(null); setIsSubModalOpen(true); }} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"><Icon name="Plus" className="w-3 h-3" /> إضافة الآن</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Icon name="Layers" className="w-16 h-16 text-slate-300" />} title="لا توجد فئات" message="قم بإضافة فئات رئيسية لتنظيم منتجات المتجر." />
                    )}
                </div>
            )}

            {/* --- Payment Methods Section --- */}
            {activeTab === 'payment' && (
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">طرق الدفع (للمتجر)</h3>
                        <button onClick={() => { setEditingPaymentMethod(null); setIsPaymentModalOpen(true); }} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2 shadow-sm text-sm">
                            <Icon name="Plus" className="w-4 h-4" /> إضافة طريقة دفع
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">حدد طرق الدفع التي يمكن للعملاء استخدامها عند شراء منتجات من المتجر.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {storePaymentMethods.length > 0 ? (
                            storePaymentMethods.map(method => (
                                <div key={method.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${method.isActive ? 'bg-white dark:bg-darkcard border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75 grayscale'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {method.iconUrl ? <img src={method.iconUrl} className="w-10 h-10 object-contain" alt={method.name} /> : <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center"><Icon name="CreditCard" className="w-5 h-5 text-slate-400" /></div>}
                                            <div>
                                                <h4 className="font-bold text-sm">{method.name}</h4>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${method.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{method.isActive ? 'مفعل' : 'معطل'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setEditingPaymentMethod(method); setIsPaymentModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeletePaymentMethod(method.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"><DeleteIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{method.details}</p>
                                    <label className="flex items-center gap-2 cursor-pointer mt-auto pt-2 border-t dark:border-slate-700">
                                        <input type="checkbox" checked={method.isActive} onChange={() => togglePaymentMethodActive(method.id)} className="rounded text-primary focus:ring-primary w-4 h-4" />
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">تفعيل في المتجر</span>
                                    </label>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500">لا توجد طرق دفع مخصصة للمتجر.</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Modals */}
            {isCategoryModalOpen && <CategoryFormModal category={editingCategory} existingCategories={categories} onSave={handleSaveCategory} onClose={() => setIsCategoryModalOpen(false)} />}
            {isSubModalOpen && activeParentCategory && <SubcategoryFormModal subcategory={editingSubcategory} parentCategoryName={activeParentCategory.name} existingSubcategories={activeParentCategory.subcategories || []} onSave={handleSaveSubcategory} onClose={() => setIsSubModalOpen(false)} />}
            {isPaymentModalOpen && <PaymentMethodFormModal method={editingPaymentMethod} onSave={handleSavePaymentMethod} onClose={() => setIsPaymentModalOpen(false)} />}
            {isBannerModalOpen && <BannerFormModal banner={editingBanner} onSave={handleSaveBanner} onClose={() => setIsBannerModalOpen(false)} />}
        </div>
    );
};

export default StoreSettings;