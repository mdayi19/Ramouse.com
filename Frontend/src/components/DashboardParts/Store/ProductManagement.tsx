
import React, { useState, useMemo, useEffect } from 'react';
import { AdminFlashProduct, StoreCategory, TechnicianSpecialty, GalleryItem, Settings, PartSizeCategory } from '../../../types';
import { ViewHeader, EditIcon, DeleteIcon } from '../Shared';
import Icon from '../../Icon';
import Modal from '../../Modal';
import MediaUpload from '../../MediaUpload';
import Pagination from '../../Pagination';
import ImageUpload from '../../ImageUpload';
import { adminAPI, storeAPI } from '../../../lib/api';

interface ProductManagementProps {
    products: AdminFlashProduct[];
    updateProducts: (products: AdminFlashProduct[]) => void;
    storeCategories: StoreCategory[];
    technicianSpecialties: TechnicianSpecialty[];
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const StoreProductFormModal: React.FC<{
    product: AdminFlashProduct | null;
    onSave: (product: AdminFlashProduct) => void;
    onClose: () => void;
    storeCategories: StoreCategory[];
    technicianSpecialties: TechnicianSpecialty[];
    settings: Settings;
}> = ({ product, onSave, onClose, storeCategories, technicianSpecialties, settings }) => {
    const [activeTab, setActiveTab] = useState('basic');

    // Form State
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price.toString() || '');

    // Media State
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingMedia, setExistingMedia] = useState<GalleryItem[]>(product?.media || []);
    const [resolvedExistingMedia, setResolvedExistingMedia] = useState<{ item: GalleryItem, url: string }[]>([]);

    const [targetAudience, setTargetAudience] = useState<'technicians' | 'customers' | 'all' | 'providers' | 'tow_trucks' | 'car_providers'>(product?.targetAudience || 'all');
    const [selectedSpecialty, setSelectedSpecialty] = useState(product?.specialty || technicianSpecialties[0]?.name || '');
    const [totalStock, setTotalStock] = useState(product?.totalStock.toString() || '');
    const [purchaseLimit, setPurchaseLimit] = useState(product?.purchaseLimitPerBuyer.toString() || '');
    const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<string[]>(product?.allowedPaymentMethods || []);
    const [storeCategoryId, setStoreCategoryId] = useState(product?.storeCategoryId || '');
    const [storeSubcategoryId, setStoreSubcategoryId] = useState(product?.storeSubcategoryId || '');

    const [shippingSize, setShippingSize] = useState<PartSizeCategory>(product?.shippingSize || 'm');
    const [staticShippingCost, setStaticShippingCost] = useState(product?.staticShippingCost?.toString() || '');

    const [isSaving, setIsSaving] = useState(false);
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm";

    // Resolve existing media for preview
    useEffect(() => {
        const resolveMedia = async () => {
            const db = (window as any).db;
            const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
            let resolved: { item: GalleryItem, url: string }[] = [];

            // If database is available, try to resolve blob URLs
            if (db && product?.id) {
                const files: File[] = await db.getMedia('productMedia', product.id) || [];

                resolved = existingMedia.map((item, index) => {
                    // If it's base64 data or blob URL, use as is
                    const data = item.data || '';
                    if (data.startsWith('data:') || data.startsWith('blob:')) {
                        return { item, url: data };
                    }

                    // If it's a full HTTP URL, use as is
                    if (data.startsWith('http://') || data.startsWith('https://')) {
                        return { item, url: data };
                    }

                    // If it starts with /storage/, prepend backend URL
                    if (data.startsWith('/storage/')) {
                        return { item, url: `${API_BASE}${data}` };
                    }

                    // Try to get from IndexedDB
                    const file = files[index];
                    return file ? { item, url: URL.createObjectURL(file) } : null;
                }).filter((i): i is { item: GalleryItem, url: string } => i !== null);
            } else {
                // Fallback for non-DB (base64) or initial state
                resolved = existingMedia.map(item => {
                    const data = item.data || '';
                    let url = data;

                    // If it's a storage path, prepend backend URL
                    if (!data.startsWith('data:') &&
                        !data.startsWith('blob:') &&
                        !data.startsWith('http://') &&
                        !data.startsWith('https://')) {

                        if (data.startsWith('/storage/')) {
                            url = `${API_BASE}${data}`;
                        } else if (data.startsWith('storage/')) {
                            url = `${API_BASE}/${data}`;
                        }
                    }

                    return { item, url };
                });
            }
            setResolvedExistingMedia(resolved);
        };
        resolveMedia();
    }, [product, existingMedia]);

    const handleRemoveExistingMedia = (index: number) => {
        setExistingMedia(prev => prev.filter((_, i) => i !== index));
    };

    const togglePaymentMethod = (methodId: string) => {
        setAllowedPaymentMethods(prev =>
            prev.includes(methodId)
                ? prev.filter(id => id !== methodId)
                : [...prev, methodId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const productId = product?.id || `store-prod-${Date.now()}`;

        const newMediaItems: GalleryItem[] = await Promise.all(mediaFiles.map(async (file) => ({
            type: file.type.startsWith('video/') ? 'video' : 'image',
            data: await fileToBase64(file)
        })));

        const finalMedia = [...existingMedia, ...newMediaItems];

        // Default expiry for store products is far future (10 years)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 10);

        const finalProduct: AdminFlashProduct = {
            id: productId,
            createdAt: product?.createdAt || new Date().toISOString(),
            name, description, price: parseFloat(price),
            media: finalMedia,
            targetAudience, specialty: targetAudience === 'technicians' ? selectedSpecialty : undefined,
            totalStock: parseInt(totalStock), purchaseLimitPerBuyer: parseInt(purchaseLimit),
            expiresAt: product?.expiresAt || expiryDate.toISOString(),
            isFlash: false,
            allowedPaymentMethods, storeCategoryId, storeSubcategoryId,
            shippingSize,
            staticShippingCost: staticShippingCost ? parseFloat(staticShippingCost) : null
        };

        onSave(finalProduct);
    };

    const subcategories = storeCategories.find(c => c.id === storeCategoryId)?.subcategories || [];
    const audienceOptions = [{ value: 'all', label: 'الجميع' }, { value: 'customers', label: 'العملاء' }, { value: 'technicians', label: 'الفنيين' }, { value: 'providers', label: 'المزودين' }, { value: 'tow_trucks', label: 'السطحات' }, { value: 'car_providers', label: 'معارض السيارات' }];

    const tabs = [
        { id: 'basic', label: 'البيانات الأساسية', icon: 'FileText' },
        { id: 'pricing', label: 'السعر والمخزون', icon: 'Banknote' },
        { id: 'media', label: 'الصور والوسائط', icon: 'Image' },
        { id: 'settings', label: 'إعدادات متقدمة', icon: 'Settings' },
    ];

    return (
        <Modal title={product ? "تعديل منتج المتجر" : "إضافة منتج جديد"} onClose={onClose} size="2xl">
            <div className="flex border-b dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id
                            ? 'border-primary text-primary bg-primary/5 dark:bg-primary-900/10'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Icon name={tab.icon as any} className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- TAB: BASIC INFO --- */}
                {activeTab === 'basic' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-medium mb-1">اسم المنتج</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required placeholder="مثال: زيت محرك تخليقي 5W30" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">الفئة الرئيسية</label>
                                <select value={storeCategoryId} onChange={e => setStoreCategoryId(e.target.value)} className={inputClasses} required>
                                    <option value="">اختر الفئة</option>
                                    {storeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">الفئة الفرعية</label>
                                <select value={storeSubcategoryId} onChange={e => setStoreSubcategoryId(e.target.value)} className={inputClasses} disabled={!storeCategoryId}>
                                    <option value="">اختر القسم (اختياري)</option>
                                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">الوصف التفصيلي</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} className={inputClasses} required placeholder="وصف كامل للمنتج، المواصفات، التوافقية..." />
                        </div>
                    </div>
                )}

                {/* --- TAB: PRICING & STOCK --- */}
                {activeTab === 'pricing' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b dark:border-slate-600 pb-2">التسعير</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">السعر ($)</label>
                                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputClasses} required min="0" step="0.01" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b dark:border-slate-600 pb-2">المخزون</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">الكمية المتاحة</label>
                                        <input type="number" value={totalStock} onChange={e => setTotalStock(e.target.value)} className={inputClasses} required min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">حد الشراء لكل مستخدم</label>
                                        <input type="number" value={purchaseLimit} onChange={e => setPurchaseLimit(e.target.value)} className={inputClasses} required min="1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-3 border-b border-blue-200 dark:border-blue-800 pb-2 flex items-center gap-2"><Icon name="Truck" className="w-4 h-4" /> الشحن والتوصيل</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">حجم الشحن (تقديري)</label>
                                    <select value={shippingSize} onChange={e => setShippingSize(e.target.value as PartSizeCategory)} className={inputClasses}>
                                        <option value="xs">صغير جداً (XS)</option>
                                        <option value="s">صغير (S)</option>
                                        <option value="m">متوسط (M)</option>
                                        <option value="l">كبير (L)</option>
                                        <option value="vl">كبير جداً (VL)</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">يستخدم لحساب تكلفة الشحن تلقائياً حسب المدينة.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">تكلفة شحن ثابتة ($) (اختياري)</label>
                                    <input
                                        type="number"
                                        value={staticShippingCost}
                                        onChange={e => setStaticShippingCost(e.target.value)}
                                        className={inputClasses}
                                        placeholder="اتركه فارغاً لاستخدام الحجم"
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">إذا تم تعيينه، سيتجاهل النظام حجم الشحن.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: MEDIA --- */}
                {activeTab === 'media' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-bold mb-3">صور وفيديو المنتج</label>

                            {resolvedExistingMedia.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-4">
                                    {resolvedExistingMedia.map((media, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                                            {media.item.type === 'image' ? (
                                                <img src={media.url} alt={`product-${idx}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Icon name="Video" className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingMedia(idx)}
                                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm transform hover:scale-110"
                                                title="حذف"
                                            >
                                                <Icon name="X" className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <MediaUpload files={mediaFiles} setFiles={setMediaFiles} maxFiles={5 - existingMedia.length} />
                            <p className="text-xs text-slate-500 mt-2">يفضل استخدام صور عالية الدقة بخلفية بيضاء.</p>
                        </div>
                    </div>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-medium mb-2">الجمهور المستهدف</label>
                            <select value={targetAudience} onChange={e => setTargetAudience(e.target.value as any)} className={inputClasses}>
                                {audienceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">من يمكنه رؤية وشراء هذا المنتج؟</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">طرق الدفع المسموحة (اختياري)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {settings.storePaymentMethods?.map(method => (
                                    <label key={method.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${allowedPaymentMethods.includes(method.id) ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                        <input
                                            type="checkbox"
                                            checked={allowedPaymentMethods.includes(method.id)}
                                            onChange={() => togglePaymentMethod(method.id)}
                                            className="rounded text-primary focus:ring-primary w-4 h-4"
                                        />
                                        <span className="text-sm font-medium">{method.name}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">اتركه فارغاً لإتاحة جميع طرق الدفع المفعلة في المتجر.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">إلغاء</button>
                    <button type="submit" disabled={isSaving} className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-md hover:bg-primary-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                        {isSaving ? <><Icon name="Loader" className="animate-spin w-4 h-4" /> جاري الحفظ...</> : 'حفظ المنتج'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, updateProducts, storeCategories: propCategories, technicianSpecialties, showToast, settings }) => {
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all'); // New Category Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminFlashProduct | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Categories - fetch from API on mount
    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>(propCategories);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await storeAPI.getCategories();
                const fetchedCategories = response.data.data || response.data || [];
                setStoreCategories(fetchedCategories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                // Fall back to props if API fails
                setStoreCategories(propCategories);
            }
        };
        fetchCategories();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const isStoreProduct = p.isFlash === false;
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = categoryFilter === 'all' || p.storeCategoryId === categoryFilter;

            let stockMatch = true;
            if (stockFilter === 'out') stockMatch = p.totalStock === 0;
            else if (stockFilter === 'low') stockMatch = p.totalStock > 0 && p.totalStock < 5;
            else if (stockFilter === 'in') stockMatch = p.totalStock >= 5;

            return isStoreProduct && searchMatch && stockMatch && categoryMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [products, searchTerm, stockFilter, categoryFilter]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * 20;
        return filteredProducts.slice(startIndex, startIndex + 20);
    }, [filteredProducts, currentPage]);

    const handleSave = async (product: AdminFlashProduct) => {
        try {
            const isEditing = products.some(p => p.id === product.id);

            if (isEditing) {
                await adminAPI.updateProduct(product.id, product);
                const updated = products.map(p => p.id === product.id ? product : p);
                updateProducts(updated);
                showToast('تم تحديث المنتج.', 'success');
            } else {
                const response = await adminAPI.createProduct(product);
                const updated = [product, ...products];
                updateProducts(updated);
                showToast('تم إضافة المنتج.', 'success');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Failed to save product:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'فشل حفظ المنتج.';
            showToast(errorMsg, 'error');
        }
    };

    const handleDuplicate = (product: AdminFlashProduct) => {
        // Create a copy with a new ID and reset dates
        const newProduct: AdminFlashProduct = {
            ...product,
            id: `store-prod-${Date.now()}`,
            name: `${product.name} (نسخة)`,
            createdAt: new Date().toISOString(),
            totalStock: 0, // Reset stock for safety
            reviews: [], // Clear reviews
            media: product.media, // Keep media (references base64 or DB keys)
        };

        updateProducts([newProduct, ...products]);
        showToast('تم تكرار المنتج بنجاح. يرجى مراجعته.', 'success');
        setEditingProduct(newProduct);
        setIsModalOpen(true); // Open modal to edit the copy
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} منتجات؟`)) {
            try {
                await Promise.all(Array.from(selectedIds).map(id => adminAPI.deleteProduct(id)));
                updateProducts(products.filter(p => !selectedIds.has(p.id)));
                setSelectedIds(new Set());
                showToast('تم الحذف بنجاح.', 'info');
            } catch (error) {
                console.error('Failed to delete products:', error);
                showToast('فشل حذف بعض المنتجات.', 'error');
            }
        }
    };

    const getCategoryName = (catId: string) => {
        const cat = storeCategories.find(c => c.id === catId);
        return cat ? cat.name : '-';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <ViewHeader title="إدارة منتجات المتجر" subtitle="إدارة المخزون والمنتجات الدائمة في المتجر." />

            {/* Filters & Actions Bar */}
            <div className="flex flex-col gap-4 bg-white dark:bg-darkcard p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-grow">
                        <div className="relative flex-grow max-w-md">
                            <Icon name="Search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="بحث (اسم، وصف)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="p-2.5 pr-9 border rounded-lg dark:bg-slate-800 dark:border-slate-600 w-full focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-600 outline-none focus:border-primary text-sm min-w-[140px]">
                                <option value="all">كل الفئات</option>
                                {storeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={stockFilter} onChange={e => setStockFilter(e.target.value as any)} className="p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-600 outline-none focus:border-primary text-sm min-w-[140px]">
                                <option value="all">كل الحالات</option>
                                <option value="in">متوفر</option>
                                <option value="low">منخفض (&lt;5)</option>
                                <option value="out">نفذت الكمية</option>
                            </select>
                        </div>
                    </div>

                    <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-primary text-white font-bold py-2.5 px-5 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap text-sm">
                        <Icon name="Plus" className="w-5 h-5" /> إضافة منتج جديد
                    </button>
                </div>

                {/* Bulk Actions */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-2 px-4 rounded-lg border border-primary-200 dark:border-primary-800 animate-fade-in">
                        <span className="text-sm font-bold text-primary dark:text-primary-300">{selectedIds.size} عنصر محدد</span>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-slate-700 text-sm px-3 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء التحديد</button>
                            <button onClick={handleBulkDelete} className="bg-red-500 text-white font-bold py-1.5 px-4 rounded-lg hover:bg-red-600 text-sm flex items-center gap-2 shadow-sm">
                                <Icon name="Trash2" className="w-4 h-4" /> حذف المحدد
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-hidden border dark:border-slate-700 rounded-xl bg-white dark:bg-darkcard shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700">
                            <tr>
                                <th className="p-4 text-center w-12">
                                    <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? new Set(paginatedProducts.map(p => p.id)) : new Set())} checked={paginatedProducts.length > 0 && selectedIds.size >= paginatedProducts.length && paginatedProducts.every(p => selectedIds.has(p.id))} className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                                </th>
                                <th className="p-4">المنتج</th>
                                <th className="p-4">الفئة</th>
                                <th className="p-4">السعر</th>
                                <th className="p-4">المخزون</th>
                                <th className="p-4">حالة المخزون</th>
                                <th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {paginatedProducts.map(p => (
                                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(p.id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.description}</div>
                                    </td>
                                    <td className="p-4 text-xs">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {getCategoryName(p.storeCategoryId || '')}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-primary">${p.price.toLocaleString()}</td>
                                    <td className="p-4 font-mono">{p.totalStock}</td>
                                    <td className="p-4">
                                        {p.totalStock <= 0 ? <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs px-2.5 py-0.5 rounded-full font-bold">نفذت</span> :
                                            p.totalStock < 5 ? <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs px-2.5 py-0.5 rounded-full font-bold">منخفض</span> :
                                                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-2.5 py-0.5 rounded-full font-bold">متوفر</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleDuplicate(p)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors" title="تكرار"><Icon name="Copy" className="w-4 h-4" /></button>
                                            <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors" title="تعديل"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={async () => {
                                                if (window.confirm('حذف؟')) {
                                                    try {
                                                        await adminAPI.deleteProduct(p.id);
                                                        updateProducts(products.filter(pr => pr.id !== p.id));
                                                        showToast('تم حذف المنتج.', 'success');
                                                    } catch (error) {
                                                        console.error('Failed to delete product:', error);
                                                        showToast('فشل حذف المنتج.', 'error');
                                                    }
                                                }
                                            }} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors" title="حذف"><DeleteIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Icon name="SearchX" className="w-12 h-12 mb-3 opacity-50" />
                                            <p className="text-lg font-medium">لا توجد منتجات</p>
                                            <p className="text-sm mt-1">لم يتم العثور على منتجات تطابق الفلاتر الحالية.</p>
                                            <button onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setStockFilter('all'); }} className="mt-4 text-primary font-semibold hover:underline">مسح جميع الفلاتر</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredProducts.length / 20)} onPageChange={setCurrentPage} totalItems={filteredProducts.length} itemsPerPage={20} />

            {isModalOpen && <StoreProductFormModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} technicianSpecialties={technicianSpecialties} storeCategories={storeCategories} settings={settings} />}
        </div>
    );
};

export default ProductManagement;
