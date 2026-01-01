import React, { useState, useEffect, useRef } from 'react';
import { Customer, Vehicle, Category, Brand, EngineType, TransmissionType, OrderFormData } from '../types';
import Modal from './Modal';
import { DEFAULT_CAR_CATEGORIES, DEFAULT_ALL_BRANDS } from '../constants';
import EmptyState from './EmptyState';
import VehicleInfoModal from './VehicleInfoModal';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import Icon from './Icon';


interface CustomerGarageProps {
    userPhone: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onUpdateCustomer: (updatedData: Partial<Customer>) => Promise<void>;
    carCategories: Category[];
    onStartNewOrder: (prefillData: Partial<OrderFormData>) => void;
    onDiagnose: (vehicle: Vehicle) => void;
    allBrands: Brand[];
}

const emptyVehicle: Vehicle = {
    id: '', category: '', brand: '', model: '', year: '', vin: '', engineType: '', transmission: ''
};

const vehicleToFormData = (vehicle: Vehicle): Partial<OrderFormData> => ({
    category: vehicle.category,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    engineType: vehicle.engineType,
    transmission: vehicle.transmission,
});

const GenericCarLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8" /><path d="M10 16.5V8" /><path d="M2 12h20" /><path d="M5 12v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" /><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H2Z" /></svg>
);


const CustomerGarage: React.FC<CustomerGarageProps> = ({ userPhone, showToast, onUpdateCustomer, onStartNewOrder, onDiagnose, allBrands }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [infoVehicle, setInfoVehicle] = useState<Vehicle | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

    useEffect(() => {
        const allCustomersRaw = localStorage.getItem('all_customers');
        if (allCustomersRaw) {
            const allCustomers: Customer[] = JSON.parse(allCustomersRaw);
            const currentUser = allCustomers.find(c => c.id === userPhone);
            setCustomer(currentUser || null);
        }
    }, [userPhone]);

    const handleSaveVehicle = async (vehicle: Vehicle) => {
        if (!customer) return;

        let updatedGarage: Vehicle[];
        if (vehicle.id) { // Editing existing
            updatedGarage = (customer.garage || []).map(v => v.id === vehicle.id ? vehicle : v);
        } else { // Adding new
            const newVehicle = { ...vehicle, id: `veh-${Date.now()}` };
            updatedGarage = [...(customer.garage || []), newVehicle];
        }

        await onUpdateCustomer({ garage: updatedGarage });
        setCustomer(prev => prev ? { ...prev, garage: updatedGarage } : null);
        showToast('تم حفظ المركبة تلقائياً!', 'success');
    };

    const confirmDeleteVehicle = async () => {
        if (!customer || !vehicleToDelete) return;

        const updatedGarage = (customer.garage || []).filter(v => v.id !== vehicleToDelete.id);
        await onUpdateCustomer({ garage: updatedGarage });
        setCustomer(prev => prev ? { ...prev, garage: updatedGarage } : null);
        showToast('تم حذف المركبة.', 'info');
        setVehicleToDelete(null);
    };

    const handleOpenModal = (vehicle: Vehicle | null) => {
        setEditingVehicle(vehicle);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 sm:p-8 bg-white dark:bg-darkcard rounded-xl shadow-lg animate-fade-in w-full h-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">مرآبي</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة مركباتك المحفوظة للحصول على طلبات أسرع ونصائح مخصصة.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal(null)}
                    className="w-full mt-4 sm:w-auto sm:mt-0 font-bold px-4 hover:shadow-lg transition-shadow"
                    leftIcon={<Icon name="Plus" className="w-5 h-5" />}
                >
                    + إضافة مركبة جديدة
                </Button>
            </div>

            <div className="space-y-4">
                {customer?.garage && customer.garage.length > 0 ? (
                    customer.garage.map(vehicle => {
                        const brandData = allBrands.find(b => b.name === vehicle.brand);
                        return (
                            <Card key={vehicle.id} className="bg-slate-50 dark:bg-darkbg p-4 border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-md hover:border-primary/50">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-16 h-16 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center p-2">
                                            {brandData?.logo ? (
                                                <img src={brandData.logo} alt={vehicle.brand} className="w-full h-full object-contain" />
                                            ) : (
                                                <GenericCarLogo className="w-full h-full object-contain text-slate-600 dark:text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary dark:text-primary-400">{vehicle.brand} {vehicle.model}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{vehicle.year} - {vehicle.category}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-1">{vehicle.vin}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                                        <Button onClick={() => handleOpenModal(vehicle)} variant="ghost" size="sm" className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-white">
                                            تعديل
                                        </Button>
                                        <Button onClick={() => setVehicleToDelete(vehicle)} variant="danger" size="sm" className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900">
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                                    <Button onClick={() => onStartNewOrder(vehicleToFormData(vehicle))} className="flex-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900 border-none shadow-none h-auto py-2">
                                        اطلب قطعة لهذه السيارة
                                    </Button>
                                    <Button onClick={() => onDiagnose(vehicle)} className="flex-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 border-none shadow-none h-auto py-2">
                                        تشخيص مشكلة لهذه السيارة
                                    </Button>
                                    <Button onClick={() => setInfoVehicle(vehicle)} className="flex-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 border-none shadow-none h-auto py-2">
                                        نصائح ومعلومات
                                    </Button>
                                </div>
                            </Card>
                        )
                    })
                ) : (
                    <EmptyState
                        title="مرآبك فارغ"
                        message="أضف مركباتك هنا لحفظ تفاصيلها، وتسريع عملية طلب قطع الغيار في المستقبل، والحصول على نصائح مخصصة من مساعد الذكاء الاصطناعي."
                    />
                )}
            </div>

            {isModalOpen && (
                <VehicleFormModal
                    vehicle={editingVehicle}
                    onSave={handleSaveVehicle}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingVehicle(null);
                    }}
                />
            )}
            {infoVehicle && (
                <VehicleInfoModal
                    vehicle={infoVehicle}
                    onClose={() => setInfoVehicle(null)}
                />
            )}
            {vehicleToDelete && (
                <Modal
                    title="تأكيد الحذف"
                    onClose={() => setVehicleToDelete(null)}
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                onClick={() => setVehicleToDelete(null)}
                                variant="outline"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={() => confirmDeleteVehicle()}
                                variant="danger"
                            >
                                نعم، احذف
                            </Button>
                        </div>
                    }
                >
                    <p className="mb-2">هل أنت متأكد من أنك تريد حذف هذه المركبة من مرآبك؟</p>
                    <div className="bg-slate-100 dark:bg-darkbg p-3 rounded-md border dark:border-slate-700">
                        <p className="font-bold">{vehicleToDelete.brand} {vehicleToDelete.model}</p>
                        <p className="text-sm text-slate-500">{vehicleToDelete.year}</p>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-4">لا يمكن التراجع عن هذا الإجراء.</p>
                </Modal>
            )}
        </div>
    );
};

const VehicleFormModal: React.FC<{ vehicle: Vehicle | null, onSave: (vehicle: Vehicle) => void, onClose: () => void }> = ({ vehicle, onSave, onClose }) => {
    const [formData, setFormData] = useState<Vehicle>(vehicle || emptyVehicle);
    const initialData = useRef(vehicle || emptyVehicle);

    // Auto-save on unmount if data has changed and is valid
    useEffect(() => {
        return () => {
            const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialData.current);
            const hasRequiredFields = formData.category && formData.brand && formData.model && formData.year && formData.engineType && formData.transmission;

            if (hasChanged && hasRequiredFields) {
                onSave(formData);
            }
        };
    }, [formData, onSave]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    return (
        <Modal
            title={vehicle ? 'تعديل المركبة' : 'إضافة مركبة جديدة'}
            onClose={onClose}
            footer={
                <div className="flex justify-end">
                    <Button type="button" onClick={onClose} variant="ghost">إغلاق</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">الفئة</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                            <option value="">اختر فئة</option>
                            {DEFAULT_CAR_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">الشركة المصنعة</label>
                        <select name="brand" value={formData.brand} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                            <option value="">اختر شركة</option>
                            {DEFAULT_ALL_BRANDS.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <Input
                            label="الموديل"
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">سنة الصنع</label>
                        <select name="year" value={formData.year} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                            <option value="">اختر سنة</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <Input
                            label="رقم الهيكل (VIN)"
                            type="text"
                            name="vin"
                            value={formData.vin}
                            onChange={handleChange}
                            dir="ltr"
                            maxLength={17}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">نوع المحرك</label>
                        <select name="engineType" value={formData.engineType} onChange={e => setFormData(p => ({ ...p, engineType: e.target.value as EngineType }))} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                            <option value="">اختر النوع</option><option value="petrol">بنزين</option><option value="diesel">ديزل</option><option value="electric">كهربائي</option><option value="hybrid">هجين</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ناقل الحركة</label>
                        <select name="transmission" value={formData.transmission} onChange={e => setFormData(p => ({ ...p, transmission: e.target.value as TransmissionType }))} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                            <option value="">اختر النوع</option><option value="manual">عادي</option><option value="auto">أوتوماتيك</option>
                        </select>
                    </div>
                </div>
            </div>
        </Modal>
    )
};

export default CustomerGarage;
