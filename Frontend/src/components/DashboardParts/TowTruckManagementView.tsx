import React, { useState, useEffect, useMemo } from 'react';
import { TowTruck, NotificationType, Notification, Settings } from '../../types';
import { DEFAULT_TOW_TRUCK_TYPES } from '../../constants';
import Modal from '../Modal';
import Pagination from '../Pagination';
import { ViewHeader } from './Shared';
import { SYRIAN_CITIES } from '../../constants';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface TowTruckManagementViewProps {
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
}

const TowTruckFormModal: React.FC<{
    towTruck: TowTruck | null;
    onSave: (data: Partial<TowTruck>, password?: string) => void;
    onClose: () => void;
    allTowTrucks: TowTruck[];
}> = ({ towTruck, onSave, onClose, allTowTrucks }) => {
    const [formData, setFormData] = useState<Partial<TowTruck>>({});
    const [newPassword, setNewPassword] = useState('');
    const isAdding = !towTruck;

    useEffect(() => {
        setFormData(towTruck || { id: '', name: '', vehicleType: DEFAULT_TOW_TRUCK_TYPES[0]?.name, city: 'دمشق', serviceArea: '', description: '' });
    }, [towTruck]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAdding && allTowTrucks.some(t => t.id === formData.id)) {
            alert('رقم الهاتف هذا مسجل بالفعل.');
            return;
        }
        onSave(formData, newPassword.trim() ? newPassword.trim() : undefined);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";

    return (
        <Modal title={isAdding ? 'إضافة سائق جديد' : 'تعديل بيانات السائق'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {isAdding && <div><Input label="رقم الهاتف (مع الرمز الدولي)" type="tel" name="id" value={formData.id || ''} onChange={(e) => handleChange(e as any)} className="text-left" dir="ltr" required /></div>}
                <Input label="الاسم" type="text" name="name" value={formData.name || ''} onChange={(e) => handleChange(e as any)} required />
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">نوع المركبة</label><select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">{DEFAULT_TOW_TRUCK_TYPES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">المدينة</label><select name="city" value={formData.city} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">{SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <Input label="منطقة الخدمة (اختياري)" type="text" name="serviceArea" value={formData.serviceArea || ''} onChange={(e) => handleChange(e as any)} placeholder="مثال: دمشق وريفها" />
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الوصف</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" /></div>
                <div><Input label={isAdding ? 'كلمة المرور' : 'كلمة مرور جديدة'} type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="text-left" dir="ltr" placeholder={isAdding ? 'إلزامي' : 'اتركه فارغاً'} required={isAdding} /></div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="ghost">إلغاء</Button>
                    <Button type="submit">حفظ</Button>
                </div>
            </form>
        </Modal>
    );
};

const TowTruckManagementView: React.FC<TowTruckManagementViewProps> = (props) => {
    const { addNotificationForUser, showToast, settings } = props;
    const [allTowTrucks, setAllTowTrucks] = useState<TowTruck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTruck, setEditingTruck] = useState<TowTruck | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
    const [cityFilter, setCityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Fetch tow trucks from API
    useEffect(() => {
        const fetchTowTrucks = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/admin/tow-trucks');
                setAllTowTrucks(response.data.data || []);
            } catch (err: any) {
                console.error('Error fetching tow trucks:', err);
                setError(err.response?.data?.message || 'فشل في تحميل السطحات');
            } finally {
                setLoading(false);
            }
        };

        fetchTowTrucks();
    }, []);

    const filteredTrucks = useMemo(() => {
        return allTowTrucks.filter(t => {
            const searchMatch = searchTerm === '' ||
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.id.includes(searchTerm) ||
                t.uniqueId.includes(searchTerm);
            const verificationMatch = verificationFilter === 'all' ||
                (verificationFilter === 'verified' && t.isVerified) ||
                (verificationFilter === 'pending' && !t.isVerified);
            const cityMatch = cityFilter === 'all' || t.city === cityFilter;
            return searchMatch && verificationMatch && cityMatch;
        }).sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
    }, [allTowTrucks, searchTerm, verificationFilter, cityFilter]);

    const paginatedTrucks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTrucks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTrucks, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, verificationFilter, cityFilter]);

    const handleSave = async (data: Partial<TowTruck>, password?: string) => {
        try {
            if (editingTruck) {
                // Update existing
                const updateData: any = { ...data };
                if (password) updateData.password = password;

                const response = await api.put(`/admin/tow-trucks/${editingTruck.id}`, updateData);
                if (response.data.success) {
                    setAllTowTrucks(allTowTrucks.map(t => t.id === editingTruck.id ? { ...t, ...response.data.data } : t));
                    showToast('تم تحديث البيانات!', 'success');
                }
            } else {
                // Create new
                const createData: any = { ...data, password };
                const response = await api.post('/admin/tow-trucks', createData);
                if (response.data.success) {
                    setAllTowTrucks([...allTowTrucks, response.data.data]);
                    showToast('تمت الإضافة بنجاح!', 'success');
                }
            }
            setIsModalOpen(false);
            setEditingTruck(null);
        } catch (err: any) {
            console.error('Error saving tow truck:', err);
            showToast(err.response?.data?.error || 'فشل في حفظ البيانات', 'error');
        }
    };

    const handleToggleVerified = async (truckId: string, currentStatus: boolean, truckName: string) => {
        try {
            const response = await api.put(`/admin/tow-trucks/${truckId}`, { isVerified: !currentStatus });
            if (response.data.success) {
                setAllTowTrucks(allTowTrucks.map(t => t.id === truckId ? { ...t, isVerified: !currentStatus } : t));
                if (!currentStatus) {
                    addNotificationForUser(truckId, { title: 'تم توثيق حسابك!', message: `تهانينا ${truckName}، تم توثيق حسابك ويمكن للعملاء الآن العثور عليك في الدليل.`, link: { view: 'towTruckDashboard', params: {} }, type: 'TOW_TRUCK_VERIFIED' }, 'TOW_TRUCK_VERIFIED', { towTruckName: truckName });
                }
                showToast('تم تحديث حالة التوثيق.', 'info');
            }
        } catch (err: any) {
            console.error('Error toggling verified:', err);
            showToast('فشل في تحديث حالة التوثيق', 'error');
        }
    };

    const handleToggleActive = async (truckId: string) => {
        const truck = allTowTrucks.find(t => t.id === truckId);
        if (!truck) return;

        try {
            const response = await api.put(`/admin/tow-trucks/${truckId}`, { isActive: !truck.isActive });
            if (response.data.success) {
                setAllTowTrucks(allTowTrucks.map(t => t.id === truckId ? { ...t, isActive: !truck.isActive } : t));
                showToast('تم تحديث حالة التفعيل.', 'info');
            }
        } catch (err: any) {
            console.error('Error toggling active:', err);
            showToast('فشل في تحديث حالة التفعيل', 'error');
        }
    };

    const handleDelete = async (truckId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السائق؟')) {
            try {
                const response = await api.delete(`/admin/tow-trucks/${truckId}`);
                if (response.data.success) {
                    setAllTowTrucks(allTowTrucks.filter(t => t.id !== truckId));
                    showToast('تم حذف السائق.', 'info');
                }
            } catch (err: any) {
                console.error('Error deleting tow truck:', err);
                showToast('فشل في حذف السائق', 'error');
            }
        }
    };

    const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <Card className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 text-primary dark:bg-primary-900/50 dark:text-primary-400 p-3 rounded-full">{icon}</div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </Card>
    );

    const pendingVerificationCount = useMemo(() => allTowTrucks.filter(t => !t.isVerified).length, [allTowTrucks]);
    const activeCount = useMemo(() => allTowTrucks.filter(t => t.isActive).length, [allTowTrucks]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-darkcard p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">جاري تحميل السطحات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md space-y-6">
            <ViewHeader title="إدارة السطحات" subtitle="مراجعة وتفعيل حسابات سائقي السطحات." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="إجمالي السائقين" value={allTowTrucks.length} icon={<Icon name="Users" />} />
                <StatCard title="بانتظار التوثيق" value={pendingVerificationCount} icon={<Icon name="Clock" className="w-6 h-6" />} />
                <StatCard title="الحسابات النشطة" value={activeCount} icon={<Icon name="CheckCircle" className="w-6 h-6 text-green-500" />} />
            </div>

            <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-none shadow-sm pb-6">
                <Input placeholder="ابحث بالاسم أو الرقم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="md:col-span-1" />
                <select value={verificationFilter} onChange={e => setVerificationFilter(e.target.value as any)} className="w-full h-10 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    <option value="all">كل حالات التوثيق</option>
                    <option value="verified">موثق</option>
                    <option value="pending">بانتظار التوثيق</option>
                </select>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value as any)} className="w-full h-10 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    <option value="all">كل المدن</option>
                    {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button onClick={() => { setEditingTruck(null); setIsModalOpen(true); }} className="w-full">+ إضافة سائق</Button>
            </Card>

            <div className="space-y-4">
                {paginatedTrucks.length > 0 ? paginatedTrucks.map(t => (
                    <Card key={t.id} className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-start gap-4">
                                {t.profilePhoto ? <img src={t.profilePhoto} alt={t.name} className="w-16 h-16 rounded-full object-cover border-2" />
                                    : <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center"><Icon name="User" className="w-10 h-10 text-slate-400" /></div>}
                                <div>
                                    <h4 className="font-bold text-lg">{t.name} <span className="font-mono text-sm text-slate-500">#{t.uniqueId}</span></h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-mono" dir="ltr">{t.id}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1"><Icon name="Truck" className="w-4 h-4" />{t.vehicleType}</span>
                                        <span className="flex items-center gap-1"><Icon name="MapPin" className="w-4 h-4" /> {t.city}</span>
                                        <span className="flex items-center gap-1"><Icon name="Calendar" className="w-4 h-4" /> انضم في: {new Date(t.registrationDate).toLocaleDateString('ar-SY')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex sm:flex-col items-end gap-2 flex-shrink-0 w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                    {t.isVerified ?
                                        <Badge variant="success">موثق</Badge>
                                        : <Badge variant="warning">بانتظار التوثيق</Badge>
                                    }
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => { setEditingTruck(t); setIsModalOpen(true); }} variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" title="تعديل"><Icon name="Pencil" className="w-5 h-5" /></Button>
                                    <Button onClick={() => handleDelete(t.id)} variant="ghost" size="icon" className="text-red-600 hover:text-red-800 hover:bg-red-50" title="حذف"><Icon name="Trash2" className="w-5 h-5" /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {!t.isVerified && <Button onClick={() => handleToggleVerified(t.id, t.isVerified, t.name)} variant="primary" className="text-sm px-3 py-1.5 h-8 bg-green-500 hover:bg-green-600 text-white">توثيق الحساب</Button>}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">الحالة:</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={t.isActive} onChange={() => handleToggleActive(t.id)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : <EmptyState message="لا يوجد سائقون يطابقون معايير البحث." />}
            </div>

            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredTrucks.length / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredTrucks.length} />
            {isModalOpen && <TowTruckFormModal towTruck={editingTruck} onClose={() => setIsModalOpen(false)} onSave={handleSave} allTowTrucks={allTowTrucks} />}
        </div>
    );
};

export default TowTruckManagementView;