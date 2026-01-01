

import React, { useState, useMemo, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import { AdminFlashProduct, StoreCategory, TechnicianSpecialty, GalleryItem, Settings, PartSizeCategory } from '../../../types';
import { ViewHeader, EditIcon, DeleteIcon } from '../Shared';
import Icon from '../../Icon';
import Modal from '../../Modal';
import MediaUpload from '../../MediaUpload';
import Pagination from '../../Pagination';
import CountdownTimer from '../../CountdownTimer';

interface FlashProductManagementProps {
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

const inputClasses = "w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-primary/50 outline-none transition-all";

const FlashProductFormModal: React.FC<{
    product: AdminFlashProduct | null;
    onSave: (product: AdminFlashProduct) => void;
    onClose: () => void;
    technicianSpecialties: TechnicianSpecialty[];
    settings: Settings;
}> = ({ product, onSave, onClose, technicianSpecialties, settings }) => {
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price.toString() || '');

    // Media State
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingMedia, setExistingMedia] = useState<GalleryItem[]>(product?.media || []);
    const [resolvedExistingMedia, setResolvedExistingMedia] = useState<{ item: GalleryItem, url: string }[]>([]);

    const [targetAudience, setTargetAudience] = useState<'technicians' | 'customers' | 'all' | 'providers' | 'tow_trucks'>(product?.targetAudience || 'all');
    const [selectedSpecialty, setSelectedSpecialty] = useState(product?.specialty || technicianSpecialties[0]?.name || '');
    const [totalStock, setTotalStock] = useState(product?.totalStock.toString() || '');
    const [purchaseLimit, setPurchaseLimit] = useState(product?.purchaseLimitPerBuyer.toString() || '');
    const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<string[]>(product?.allowedPaymentMethods || []);

    const [shippingSize, setShippingSize] = useState<PartSizeCategory>(product?.shippingSize || 'm');
    const [staticShippingCost, setStaticShippingCost] = useState(product?.staticShippingCost?.toString() || '');

    const formatDateTimeForInput = (isoString: string | undefined) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            return localDate.toISOString().slice(0, 16);
        } catch (e) { return ''; }
    };

    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 3); // Default to 3 days from now
    const [expiresAt, setExpiresAt] = useState(formatDateTimeForInput(product?.expiresAt || defaultExpiry.toISOString()));
    const [isSaving, setIsSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Load and resolve existing media URLs
    useEffect(() => {
        const resolveMediaUrls = async () => {
            if (!product || !product.media || product.media.length === 0) {
                setResolvedExistingMedia([]);
                return;
            }

            const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
            const resolved = product.media.map(item => {
                let url = item.data || '';
                // If it's a storage path, prepend API base
                if (url.startsWith('/storage/')) {
                    url = `${API_BASE}${url}`;
                }
                return { item, url };
            });
            setResolvedExistingMedia(resolved);
        };

        resolveMediaUrls();
    }, [product]);

    const handleRemoveExistingMedia = (index: number) => {
        setExistingMedia(prev => prev.filter((_, i) => i !== index));
        setResolvedExistingMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newMedia = [...existingMedia];
        const newResolvedMedia = [...resolvedExistingMedia];

        const draggedItem = newMedia[draggedIndex];
        const draggedResolvedItem = newResolvedMedia[draggedIndex];

        newMedia.splice(draggedIndex, 1);
        newMedia.splice(index, 0, draggedItem);

        newResolvedMedia.splice(draggedIndex, 1);
        newResolvedMedia.splice(index, 0, draggedResolvedItem);

        setExistingMedia(newMedia);
        setResolvedExistingMedia(newResolvedMedia);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
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

        try {
            const newMediaItems: GalleryItem[] = await Promise.all(mediaFiles.map(async (file) => ({
                type: file.type.startsWith('video/') ? 'video' : 'image',
                data: await fileToBase64(file)
            })));

            const finalMedia = [...existingMedia, ...newMediaItems];

            const productData = {
                name,
                description,
                price: parseFloat(price),
                media: finalMedia,
                targetAudience,
                specialty: targetAudience === 'technicians' ? selectedSpecialty : undefined,
                totalStock: parseInt(totalStock),
                purchaseLimitPerBuyer: parseInt(purchaseLimit),
                expiresAt: new Date(expiresAt).toISOString(),
                isFlash: true,
                allowedPaymentMethods,
                shippingSize,
                staticShippingCost: staticShippingCost ? parseFloat(staticShippingCost) : null
            };

            let savedProduct: AdminFlashProduct;
            if (product) {
                const response = await adminAPI.updateProduct(product.id, productData);
                savedProduct = response.data.data || response.data;
            } else {
                const response = await adminAPI.createProduct(productData);
                savedProduct = response.data.data || response.data;
            }

            onSave(savedProduct);
        } catch (error) {
            console.error('Failed to save product:', error);
            // Error handling is done in parent via showToast if needed, or we can add a local error state
            // For now, we'll let the parent handle the toast success, but we should probably notify error here or throw
            alert('فشل حفظ المنتج. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSaving(false);
        }
    };

    const audienceOptions = [{ value: 'all', label: 'الجميع' }, { value: 'customers', label: 'العملاء' }, { value: 'technicians', label: 'الفنيين' }, { value: 'providers', label: 'المزودين' }, { value: 'tow_trucks', label: 'السطحات' }];

    return (
        <Modal title={product ? "تعديل العرض الفوري" : "إضافة عرض فوري جديد"} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">اسم المنتج / العرض</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                    </div>

                    <div><label className="block text-sm font-medium">السعر ($)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputClasses} required /></div>
                    <div><label className="block text-sm font-medium">الكمية المتاحة</label><input type="number" value={totalStock} onChange={e => setTotalStock(e.target.value)} className={inputClasses} required /></div>

                    <div>
                        <label className="block text-sm font-medium text-amber-600 dark:text-amber-400">وقت انتهاء العرض</label>
                        <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputClasses} required />
                    </div>

                    <div><label className="block text-sm font-medium">حد الشراء لكل مستخدم</label><input type="number" value={purchaseLimit} onChange={e => setPurchaseLimit(e.target.value)} className={inputClasses} required /></div>
                    <div><label className="block text-sm font-medium">الجمهور المستهدف</label><select value={targetAudience} onChange={e => setTargetAudience(e.target.value as any)} className={inputClasses}>{audienceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>

                    {targetAudience === 'technicians' && (
                        <div><label className="block text-sm font-medium">التخصص</label><select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)} className={inputClasses}>{technicianSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                    )}

                    <div>
                        <label className="block text-sm font-medium">حجم الشحن (تقديري)</label>
                        <select value={shippingSize} onChange={e => setShippingSize(e.target.value as PartSizeCategory)} className={inputClasses}>
                            <option value="xs">صغير جداً (XS)</option>
                            <option value="s">صغير (S)</option>
                            <option value="m">متوسط (M)</option>
                            <option value="l">كبير (L)</option>
                            <option value="vl">كبير جداً (VL)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">تكلفة شحن ثابتة ($) (اختياري)</label>
                        <input
                            type="number"
                            value={staticShippingCost}
                            onChange={e => setStaticShippingCost(e.target.value)}
                            className={inputClasses}
                            placeholder="اتركه فارغاً لاستخدام الحجم"
                            min="0"
                            step="0.01"
                        />
                        <p className="text-xs text-slate-500 mt-1">إذا تم تعيينه، سيتجاهل النظام حجم الشحن ويستخدم هذه التكلفة.</p>
                    </div>

                    <div className="md:col-span-2"><label className="block text-sm font-medium">الوصف التفصيلي</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} required /></div>

                    {/* Payment Methods Selection */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">طرق الدفع المتاحة (اختياري)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {settings.storePaymentMethods?.map(method => (
                                <label key={method.id} className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${allowedPaymentMethods.includes(method.id) ? 'bg-primary/10 border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <input
                                        type="checkbox"
                                        checked={allowedPaymentMethods.includes(method.id)}
                                        onChange={() => togglePaymentMethod(method.id)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{method.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">اتركه فارغاً لإتاحة جميع طرق الدفع المفعلة في المتجر.</p>
                    </div>

                    <div className="md:col-span-2 space-y-3 border-t dark:border-slate-700 pt-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-bold">صور وفيديو العرض</label>
                            {resolvedExistingMedia.length > 0 && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Icon name="Move" className="w-3 h-3" />
                                    اسحب لإعادة الترتيب
                                </span>
                            )}
                        </div>

                        {/* Existing Media Preview with Drag and Drop */}
                        {resolvedExistingMedia.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
                                {resolvedExistingMedia.map((media, idx) => (
                                    <div
                                        key={idx}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move ${draggedIndex === idx
                                            ? 'border-primary scale-105 shadow-lg opacity-50'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                            }`}
                                    >
                                        {media.item.type === 'image' ? (
                                            <img src={media.url} alt={`product-${idx}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="relative w-full h-full">
                                                <video src={media.url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                                    <Icon name="Play" className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Order badge */}
                                        <div className="absolute top-1 left-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </div>

                                        {/* Media type badge */}
                                        <div className="absolute bottom-1 left-1 bg-black/70 text-white rounded px-1.5 py-0.5 text-xs font-medium flex items-center gap-0.5">
                                            {media.item.type === 'video' ? (
                                                <><Icon name="Video" className="w-3 h-3" />فيديو</>
                                            ) : (
                                                <><Icon name="Image" className="w-3 h-3" />صورة</>
                                            )}
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingMedia(idx)}
                                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                                            title="حذف"
                                        >
                                            <Icon name="X" className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Drag handle indicator */}
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Icon name="Move" className="w-3 h-3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <MediaUpload files={mediaFiles} setFiles={setMediaFiles} maxFiles={5 - existingMedia.length} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg font-bold">إلغاء</button>
                    <button type="submit" disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-primary-700 transition-colors">{isSaving ? 'جاري الحفظ...' : 'حفظ العرض'}</button>
                </div>
            </form>
        </Modal>
    );
}

const FlashProductManagement: React.FC<FlashProductManagementProps> = ({ products, updateProducts, technicianSpecialties, showToast, settings }) => {
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminFlashProduct | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const isFlash = p.isFlash !== false; // Is a flash product
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());

            let stockMatch = true;
            if (stockFilter === 'out') stockMatch = p.totalStock === 0;
            else if (stockFilter === 'low') stockMatch = p.totalStock > 0 && p.totalStock < 5;
            else if (stockFilter === 'in') stockMatch = p.totalStock >= 5;

            return isFlash && searchMatch && stockMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [products, searchTerm, stockFilter]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * 20;
        return filteredProducts.slice(startIndex, startIndex + 20);
    }, [filteredProducts, currentPage]);

    const handleSave = (product: AdminFlashProduct) => {
        let updated;
        if (products.some(p => p.id === product.id)) {
            updated = products.map(p => p.id === product.id ? product : p);
            showToast('تم تحديث العرض الفوري.', 'success');
        } else {
            updated = [product, ...products];
            showToast('تم إضافة العرض الفوري.', 'success');
        }
        updateProducts(updated);
        setIsModalOpen(false);
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} عروض؟`)) {
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
    }

    const handleDeleteSingle = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
            try {
                await adminAPI.deleteProduct(id);
                updateProducts(products.filter(p => p.id !== id));
                showToast('تم حذف العرض بنجاح.', 'info');
            } catch (error) {
                console.error('Failed to delete product:', error);
                showToast('فشل حذف العرض.', 'error');
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <ViewHeader title="إدارة العروض الفورية" subtitle="إدارة المنتجات المؤقتة والعروض الخاصة." />

            {/* Actions Bar */}
            <div className="flex flex-col gap-4 bg-white dark:bg-darkcard p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 flex-grow">
                        <div className="relative flex-grow max-w-md">
                            <Icon name="Search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="بحث (اسم، وصف، كود)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="p-2 pr-9 border rounded-lg dark:bg-slate-800 dark:border-slate-600 w-full focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        </div>
                        <select value={stockFilter} onChange={e => setStockFilter(e.target.value as any)} className="p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 outline-none focus:border-primary">
                            <option value="all">كل حالات المخزون</option>
                            <option value="in">متوفر</option>
                            <option value="low">منخفض (&lt;5)</option>
                            <option value="out">نفذت الكمية</option>
                        </select>
                    </div>

                    <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap">
                        <Icon name="Plus" className="w-5 h-5" /> إضافة عرض فوري
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
                                    <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? new Set(paginatedProducts.map(p => p.id)) : new Set())} checked={paginatedProducts.length > 0 && selectedIds.size >= paginatedProducts.length && paginatedProducts.every(p => selectedIds.has(p.id))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                </th>
                                <th className="p-4">العرض</th>
                                <th className="p-4">ينتهي خلال</th>
                                <th className="p-4">السعر</th>
                                <th className="p-4">المخزون</th>
                                <th className="p-4">الجمهور</th>
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {paginatedProducts.map(p => (
                                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(p.id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.description}</div>
                                    </td>
                                    <td className="p-4">
                                        <CountdownTimer expiresAt={p.expiresAt} />
                                    </td>
                                    <td className="p-4 font-mono font-bold">${p.price}</td>
                                    <td className="p-4 font-mono">
                                        {p.totalStock <= 0 ? <span className="text-red-500 font-bold">نفذت</span> : p.totalStock}
                                    </td>
                                    <td className="p-4 text-xs">
                                        {p.targetAudience === 'all' ? 'الجميع' :
                                            p.targetAudience === 'customers' ? 'العملاء' :
                                                p.targetAudience === 'technicians' ? 'الفنيين' :
                                                    p.targetAudience === 'providers' ? 'المزودين' : 'السطحات'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors" title="تعديل"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteSingle(p.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors" title="حذف"><DeleteIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Icon name="ZapOff" className="w-12 h-12 mb-2 opacity-50" />
                                            <p>لا توجد عروض فورية تطابق الفلاتر الحالية.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredProducts.length / 20)} onPageChange={setCurrentPage} totalItems={filteredProducts.length} itemsPerPage={20} />

            {isModalOpen && <FlashProductFormModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} technicianSpecialties={technicianSpecialties} settings={settings} />}
        </div>
    );
};

export default FlashProductManagement;
