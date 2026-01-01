import React, { useState } from 'react';
import { Category, Brand, PartType, TechnicianSpecialty, CarModel } from '../../types';
import { ModelManagementTab } from './types';
import { ViewHeader, EditIcon, DeleteIcon } from './Shared';
import Modal from '../Modal';
import ImageUpload from '../ImageUpload';
import Icon from '../Icon';
import IconSearch from '../IconSearch';
import { AdminService } from '../../services/admin.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface ModelManagementViewProps {
    carCategories: Category[];
    updateCarCategories: (categories: Category[]) => void;
    allBrands: Brand[];
    updateAllBrands: (brands: Brand[]) => void;
    brandModels: { [key: string]: string[] };
    updateBrandModels: (models: { [key: string]: string[] }) => void;
    partTypes: PartType[];
    updatePartTypes: (types: PartType[]) => void;
    technicianSpecialties: TechnicianSpecialty[];
    updateTechnicianSpecialties: (specialties: TechnicianSpecialty[]) => void;
    allModels?: { [key: string]: CarModel[] };
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// --- Categories Manager ---
const CategoriesManager: React.FC<Pick<ModelManagementViewProps, 'carCategories' | 'updateCarCategories' | 'allBrands'>> = ({ carCategories, updateCarCategories, allBrands }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (category: Category) => {
        setIsLoading(true);
        try {
            const savedCategory = await AdminService.saveCategory(category);
            if (savedCategory) {
                let updatedCategories;
                if (carCategories.some(c => c.id === savedCategory.id)) {
                    updatedCategories = carCategories.map(c => c.id === savedCategory.id ? savedCategory : c);
                } else {
                    updatedCategories = [...carCategories, savedCategory];
                }
                updateCarCategories(updatedCategories);
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save category", error);
            alert("فشل حفظ الفئة");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
            try {
                const success = await AdminService.deleteCategory(id);
                if (success) {
                    updateCarCategories(carCategories.filter(c => c.id !== id));
                }
            } catch (error) {
                console.error("Failed to delete category", error);
                alert("فشل حذف الفئة");
            }
        }
    };

    const CategoryFormModal: React.FC<{ category: Category | null }> = ({ category }) => {
        const [formData, setFormData] = useState<Category>(category || { id: `cat-${Date.now()}`, name: '', flag: '', brands: [], telegramBotToken: '', telegramChannelId: '' });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleSave(formData);
        };

        const handleBrandToggle = (brandName: string) => {
            setFormData(prev => ({
                ...prev,
                brands: prev.brands.includes(brandName) ? prev.brands.filter(b => b !== brandName) : [...prev.brands, brandName]
            }));
        };

        return (
            <Modal title={category ? 'تعديل الفئة' : 'إضافة فئة جديدة'} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="اسم الفئة" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <Input label="العلم (Emoji)" value={formData.flag} onChange={e => setFormData(p => ({ ...p, flag: e.target.value }))} required />
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الشركات المصنعة</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border dark:border-slate-600 rounded-md max-h-48 overflow-y-auto">
                            {allBrands.map(brand => (
                                <label key={brand.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.brands.includes(brand.name)} onChange={() => handleBrandToggle(brand.name)} />{brand.name}</label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t dark:border-slate-600">
                        <h4 className="text-md font-semibold text-slate-600 dark:text-slate-400 mb-2">إعدادات قناة تيليجرام (اختياري)</h4>
                        <p className="text-xs text-slate-500 mb-2">لنشر الطلبات الجديدة من هذه الفئة تلقائياً على قناة تيليجرام.</p>
                        <div className="space-y-3">
                            <Input label="Telegram Bot Token" value={formData.telegramBotToken || ''} onChange={e => setFormData(p => ({ ...p, telegramBotToken: e.target.value }))} dir="ltr" />
                            <Input label="Telegram Channel ID" value={formData.telegramChannelId || ''} onChange={e => setFormData(p => ({ ...p, telegramChannelId: e.target.value }))} dir="ltr" placeholder="@channel_username or -100123456789" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200">إلغاء</Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-700 text-white font-bold">{isLoading ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={() => { setEditingCategory(null); setIsModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm">+ إضافة فئة</Button></div>
            <div className="space-y-3">{carCategories.map(cat => (
                <Card key={cat.id} className="p-3 flex justify-between items-center shadow-sm">
                    <div><span className="text-2xl mr-2">{cat.flag}</span><span className="font-semibold">{cat.name}</span> <span className="text-sm text-slate-500">({cat.brands.length} شركة)</span></div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"><EditIcon className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"><DeleteIcon className="w-5 h-5" /></Button>
                    </div>
                </Card>
            ))}</div>
            {isModalOpen && <CategoryFormModal category={editingCategory} />}
        </div>
    );
};

// --- Brands Manager ---
const BrandsManager: React.FC<Pick<ModelManagementViewProps, 'allBrands' | 'updateAllBrands'>> = ({ allBrands, updateAllBrands }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (brand: Brand) => {
        setIsLoading(true);
        try {
            const savedBrand = await AdminService.saveBrand(brand);
            if (savedBrand) {
                let updatedBrands;
                if (allBrands.some(b => b.id === savedBrand.id)) {
                    updatedBrands = allBrands.map(b => b.id === savedBrand.id ? savedBrand : b);
                } else {
                    updatedBrands = [...allBrands, savedBrand];
                }
                updateAllBrands(updatedBrands);
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save brand", error);
            alert("فشل حفظ الشركة");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد؟ حذف الشركة قد يؤثر على الفئات والموديلات المرتبطة بها.')) {
            try {
                const success = await AdminService.deleteBrand(id);
                if (success) {
                    updateAllBrands(allBrands.filter(b => b.id !== id));
                }
            } catch (error) {
                console.error("Failed to delete brand", error);
                alert("فشل حذف الشركة");
            }
        }
    };

    const BrandFormModal: React.FC<{ brand: Brand | null }> = ({ brand }) => {
        const [formData, setFormData] = useState<Brand>(brand || { id: `brand-${Date.now()}`, name: '', logo: '' });
        const [logoFile, setLogoFile] = useState<File[]>([]);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            let finalData = { ...formData };
            if (logoFile.length > 0) {
                finalData.logo = await fileToBase64(logoFile[0]);
            }
            handleSave(finalData);
        };

        return (
            <Modal title={brand ? 'تعديل الشركة' : 'إضافة شركة جديدة'} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="اسم الشركة" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الشعار (اختياري)</label>{formData.logo && !logoFile.length && <img src={formData.logo} alt="logo" className="w-20 h-20 object-contain my-2 p-1 bg-slate-100 rounded-md" />}<ImageUpload files={logoFile} setFiles={setLogoFile} maxFiles={1} /></div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200">إلغاء</Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-700 text-white font-bold">{isLoading ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={() => { setEditingBrand(null); setIsModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm">+ إضافة شركة</Button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{allBrands.map(brand => (
                <Card key={brand.id} className="p-3 text-center relative group shadow-sm bg-white dark:bg-darkcard">
                    <div className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingBrand(brand); setIsModalOpen(true); }} className="text-blue-600 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black p-1 rounded-full h-8 w-8"><EditIcon className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)} className="text-red-600 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black p-1 rounded-full h-8 w-8"><DeleteIcon className="w-4 h-4" /></Button>
                    </div>
                    <img src={brand.logo} alt={brand.name} className="h-16 w-full object-contain mb-2" onError={(e) => { e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; e.currentTarget.alt = 'No Logo'; }} />
                    <p className="font-semibold text-sm">{brand.name}</p>
                </Card>
            ))}</div>
            {isModalOpen && <BrandFormModal brand={editingBrand} />}
        </div>
    );
};

// --- Models Manager ---
const ModelsManager: React.FC<Pick<ModelManagementViewProps, 'brandModels' | 'updateBrandModels' | 'allBrands' | 'allModels'>> = ({ brandModels, updateBrandModels, allBrands, allModels }) => {
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [newModel, setNewModel] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddModel = async () => {
        if (!selectedBrand || !newModel.trim()) return;
        setIsLoading(true);
        try {
            const modelToSave = {
                brand_name: selectedBrand,
                name: newModel.trim()
            };
            const savedModel = await AdminService.saveModel(modelToSave);
            if (savedModel) {
                const updated = { ...brandModels, [selectedBrand]: [...(brandModels[selectedBrand] || []), savedModel.name] };
                updateBrandModels(updated);
                setNewModel('');
            }
        } catch (error) {
            console.error("Failed to save model", error);
            alert("فشل حفظ الموديل");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteModel = async (modelName: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف ${modelName}؟`)) return;

        // Find ID if possible
        let modelId: string | number = modelName;
        if (allModels && allModels[selectedBrand]) {
            const foundModel = allModels[selectedBrand].find(m => m.name === modelName);
            if (foundModel && foundModel.id) {
                modelId = foundModel.id;
            }
        }

        try {
            const success = await AdminService.deleteModel(modelId);
            if (success) {
                const updated = { ...brandModels, [selectedBrand]: brandModels[selectedBrand].filter(m => m !== modelName) };
                updateBrandModels(updated);
            }
        } catch (error) {
            console.error("Failed to delete model", error);
            alert("فشل حذف الموديل");
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اختر شركة مصنعة</label><select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600"><option value="">-- اختر --</option>{allBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
            {selectedBrand && <div className="mt-4">
                <div className="flex gap-2 mb-4">
                    <Input value={newModel} onChange={e => setNewModel(e.target.value)} className="flex-grow" placeholder="اسم الموديل الجديد" />
                    <Button onClick={handleAddModel} disabled={isLoading} className="bg-primary text-white font-bold">{isLoading ? '...' : 'إضافة'}</Button>
                </div>
                <Card className="p-3 min-h-[10rem] flex flex-wrap gap-2">{brandModels[selectedBrand]?.map(model => (
                    <span key={model} className="bg-slate-200 dark:bg-slate-700 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">{model}<button onClick={() => handleDeleteModel(model)} className="text-red-500 hover:text-red-700 p-0.5">&times;</button></span>
                ))}</Card>
            </div>}
        </div>
    );
};

// --- Part Types Manager ---
const PartTypesManager: React.FC<Pick<ModelManagementViewProps, 'partTypes' | 'updatePartTypes'>> = ({ partTypes, updatePartTypes }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartType, setEditingPartType] = useState<PartType | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (partType: PartType) => {
        setIsLoading(true);
        try {
            const savedPartType = await AdminService.savePartType(partType);
            if (savedPartType) {
                let updated;
                if (partTypes.some(p => p.id === savedPartType.id)) {
                    updated = partTypes.map(p => p.id === savedPartType.id ? savedPartType : p);
                } else {
                    updated = [...partTypes, savedPartType];
                }
                updatePartTypes(updated);
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save part type", error);
            alert("فشل حفظ نوع القطعة");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا النوع؟')) {
            try {
                const success = await AdminService.deletePartType(id);
                if (success) {
                    updatePartTypes(partTypes.filter(p => p.id !== id));
                }
            } catch (error) {
                console.error("Failed to delete part type", error);
                alert("فشل حذف نوع القطعة");
            }
        }
    };

    const PartTypeFormModal: React.FC<{ partType: PartType | null }> = ({ partType }) => {
        const [formData, setFormData] = useState<PartType>(partType || { id: `pt-${Date.now()}`, name: '', icon: '' });

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            handleSave(formData);
        };

        return (
            <Modal title={partType ? 'تعديل نوع القطعة' : 'إضافة نوع جديد'} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="اسم النوع" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الأيقونة</label>
                        <IconSearch value={formData.icon || ''} onChange={iconName => setFormData(p => ({ ...p, icon: iconName }))} />
                        <p className="text-xs text-slate-500 mt-1">ابحث عن أيقونة من مكتبة <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Lucide Icons</a>.</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200">إلغاء</Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-700 text-white font-bold">{isLoading ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={() => { setEditingPartType(null); setIsModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm">+ إضافة نوع</Button></div>
            <div className="space-y-3">{partTypes.map(pt => (
                <Card key={pt.id} className="p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">{pt.icon && <Icon name={pt.icon as any} className="w-6 h-6" />}<span className="font-semibold">{pt.name}</span></div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPartType(pt); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"><EditIcon className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pt.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"><DeleteIcon className="w-5 h-5" /></Button>
                    </div>
                </Card>
            ))}</div>
            {isModalOpen && <PartTypeFormModal partType={editingPartType} />}
        </div>
    );
};

// --- Specialties Manager ---
const SpecialtiesManager: React.FC<Pick<ModelManagementViewProps, 'technicianSpecialties' | 'updateTechnicianSpecialties'>> = ({ technicianSpecialties, updateTechnicianSpecialties }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<TechnicianSpecialty | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (specialty: TechnicianSpecialty) => {
        setIsLoading(true);
        try {
            const savedSpecialty = await AdminService.saveSpecialty(specialty);
            if (savedSpecialty) {
                let updated;
                if (technicianSpecialties.some(s => s.id === savedSpecialty.id)) {
                    updated = technicianSpecialties.map(s => s.id === savedSpecialty.id ? savedSpecialty : s);
                } else {
                    updated = [...technicianSpecialties, savedSpecialty];
                }
                updateTechnicianSpecialties(updated);
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to save specialty", error);
            alert("فشل حفظ التخصص");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التخصص؟')) {
            try {
                const success = await AdminService.deleteSpecialty(id);
                if (success) {
                    updateTechnicianSpecialties(technicianSpecialties.filter(s => s.id !== id));
                }
            } catch (error) {
                console.error("Failed to delete specialty", error);
                alert("فشل حذف التخصص");
            }
        }
    };

    const SpecialtyFormModal: React.FC<{ specialty: TechnicianSpecialty | null }> = ({ specialty }) => {
        const [formData, setFormData] = useState<TechnicianSpecialty>(specialty || { id: `spec-${Date.now()}`, name: '', icon: '' });

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            handleSave(formData);
        };
        return (
            <Modal title={specialty ? 'تعديل التخصص' : 'إضافة تخصص جديد'} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="اسم التخصص" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الأيقونة</label>
                        <IconSearch value={formData.icon || ''} onChange={iconName => setFormData(p => ({ ...p, icon: iconName }))} />
                        <p className="text-xs text-slate-500 mt-1">ابحث عن أيقونة من مكتبة <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Lucide Icons</a>.</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200">إلغاء</Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-700 text-white font-bold">{isLoading ? 'جاري الحفظ...' : 'حفظ'}</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={() => { setEditingSpecialty(null); setIsModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm">+ إضافة تخصص</Button></div>
            <div className="space-y-3">{technicianSpecialties.map(spec => (
                <Card key={spec.id} className="p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        {spec.icon && <Icon name={spec.icon as any} className="w-6 h-6" />}
                        <span className="font-semibold">{spec.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingSpecialty(spec); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"><EditIcon className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(spec.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"><DeleteIcon className="w-5 h-5" /></Button>
                    </div>
                </Card>
            ))}</div>
            {isModalOpen && <SpecialtyFormModal specialty={editingSpecialty} />}
        </div>
    );
};

// Main Component
const ModelManagementView: React.FC<ModelManagementViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ModelManagementTab>('categories');

    const TabButton: React.FC<{ tabId: ModelManagementTab; label: string }> = ({ tabId, label }) => (
        <Button
            onClick={() => setActiveTab(tabId)}
            variant="ghost"
            className={`rounded-b-none px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tabId ? 'border-b-2 border-primary text-primary dark:text-primary-400 bg-primary/5 hover:bg-primary/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            {label}
        </Button>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'categories': return <CategoriesManager {...props} />;
            case 'brands': return <BrandsManager {...props} />;
            case 'models': return <ModelsManager {...props} />;
            case 'partTypes': return <PartTypesManager {...props} />;
            case 'specialties': return <SpecialtiesManager {...props} />;
            default: return null;
        }
    };

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة النماذج" subtitle="إدارة البيانات الديناميكية للتطبيق مثل فئات السيارات، الشركات، والموديلات." />
            <div className="flex border-b mb-4 dark:border-slate-700">
                <TabButton tabId="categories" label="الفئات" />
                <TabButton tabId="brands" label="الشركات المصنّعة" />
                <TabButton tabId="models" label="الموديلات" />
                <TabButton tabId="partTypes" label="أنواع القطع" />
                <TabButton tabId="specialties" label="تخصصات الفنيين" />
            </div>
            <div>{renderTabContent()}</div>
        </Card>
    );
};

export default ModelManagementView;