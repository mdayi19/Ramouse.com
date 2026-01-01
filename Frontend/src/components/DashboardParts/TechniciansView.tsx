import React, { useState, useEffect, useMemo } from 'react';
import { Technician, NotificationType, Notification, TechnicianSpecialty, Settings } from '../../types';
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

interface TechniciansViewProps {
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    navigationParams?: any;
    technicianSpecialties: TechnicianSpecialty[];
    settings: Settings;
}

const TechnicianFormModal: React.FC<{
    technician: Technician | null;
    onSave: (data: Partial<Technician>, password?: string) => void;
    onClose: () => void;
    allTechnicians: Technician[];
    technicianSpecialties: TechnicianSpecialty[];
}> = ({ technician, onSave, onClose, allTechnicians, technicianSpecialties }) => {
    const [formData, setFormData] = useState<Partial<Technician>>({});
    const [newPassword, setNewPassword] = useState('');
    const isAdding = !technician;

    useEffect(() => {
        if (technician) {
            setFormData({
                id: technician.id,
                name: technician.name || '',
                specialty: technician.specialty || '',
                city: technician.city || '',
                workshopAddress: technician.workshopAddress || '',
                description: technician.description || '',
            });
        } else {
            setFormData({ id: '', name: '', specialty: technicianSpecialties[0]?.name || '', city: 'دمشق', workshopAddress: '', description: '' });
        }
        setNewPassword('');
    }, [technician, technicianSpecialties]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAdding && allTechnicians.some(t => t.id === formData.id)) {
            alert('رقم الهاتف هذا مسجل بالفعل.');
            return;
        }
        onSave(formData, newPassword.trim() ? newPassword.trim() : undefined);
    };

    return (
        <Modal title={isAdding ? 'إضافة فني جديد' : 'تعديل بيانات الفني'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {isAdding && (
                    <Input
                        label="رقم الهاتف (مع الرمز الدولي)"
                        type="tel"
                        name="id"
                        value={formData.id || ''}
                        onChange={(e) => handleChange(e as any)}
                        dir="ltr"
                        required
                    />
                )}
                <Input
                    label="الاسم"
                    name="name"
                    value={formData.name || ''}
                    onChange={(e) => handleChange(e as any)}
                    required
                />
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">التخصص</label>
                    <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                        {technicianSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">المدينة</label>
                    <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" required>
                        {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <Input
                    label="عنوان الورشة"
                    name="workshopAddress"
                    value={formData.workshopAddress || ''}
                    onChange={(e) => handleChange(e as any)}
                />
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الوصف</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
                <Input
                    label={isAdding ? 'كلمة المرور' : 'كلمة مرور جديدة'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isAdding ? 'إلزامي' : 'اتركه فارغاً لعدم التغيير'}
                    dir="ltr"
                    required={isAdding}
                />
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="ghost">إلغاء</Button>
                    <Button type="submit">حفظ</Button>
                </div>
            </form>
        </Modal>
    );
};

const TechniciansView: React.FC<TechniciansViewProps> = ({ addNotificationForUser, showToast, navigationParams, technicianSpecialties, settings }) => {
    const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
    const [cityFilter, setCityFilter] = useState('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Fetch technicians from API
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/admin/technicians');
                setAllTechnicians(response.data.data || []);
            } catch (err: any) {
                console.error('Error fetching technicians:', err);
                setError(err.response?.data?.message || 'فشل في تحميل الفنيين');
            } finally {
                setLoading(false);
            }
        };

        fetchTechnicians();
    }, []);

    useEffect(() => {
        if (navigationParams?.orderNumber) { // orderNumber holds the technician ID from notification
            setSearchTerm(navigationParams.orderNumber);
        }
    }, [navigationParams]);


    const filteredTechnicians = useMemo(() => {
        return allTechnicians.filter(t => {
            const searchMatch = searchTerm === '' ||
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.id.includes(searchTerm) ||
                t.uniqueId.includes(searchTerm);
            const verificationMatch = verificationFilter === 'all' ||
                (verificationFilter === 'verified' && t.isVerified) ||
                (verificationFilter === 'pending' && !t.isVerified);
            const cityMatch = cityFilter === 'all' || t.city === cityFilter;

            return searchMatch && verificationMatch && cityMatch;
        }).sort((a, b) => (a.registrationDate && b.registrationDate) ? new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime() : 0);
    }, [allTechnicians, searchTerm, verificationFilter, cityFilter]);

    const totalPages = Math.ceil(filteredTechnicians.length / ITEMS_PER_PAGE);
    const paginatedTechnicians = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTechnicians.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTechnicians, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, verificationFilter, cityFilter]);


    const handleSaveTechnician = async (technicianData: Partial<Technician>, newPassword?: string) => {
        try {
            if (editingTechnician) {
                // Update existing
                const updateData: any = { ...technicianData };
                if (newPassword) updateData.password = newPassword;

                const response = await api.put(`/admin/technicians/${editingTechnician.id}`, updateData);
                if (response.data.success) {
                    setAllTechnicians(allTechnicians.map(t => t.id === editingTechnician.id ? { ...t, ...response.data.data } : t));
                    showToast('تم تحديث البيانات!', 'success');
                }
            } else {
                // Create new
                const createData: any = { ...technicianData, password: newPassword };
                const response = await api.post('/admin/technicians', createData);
                if (response.data.success) {
                    setAllTechnicians([...allTechnicians, response.data.data]);
                    showToast('تمت الإضافة بنجاح!', 'success');
                }
            }
            setIsModalOpen(false);
            setEditingTechnician(null);
        } catch (err: any) {
            console.error('Error saving technician:', err);
            showToast(err.response?.data?.error || 'فشل في حفظ البيانات', 'error');
        }
    };

    const handleToggleVerified = async (techId: string, currentStatus: boolean, techName: string) => {
        try {
            const response = await api.put(`/admin/technicians/${techId}`, { isVerified: !currentStatus });
            if (response.data.success) {
                setAllTechnicians(allTechnicians.map(t => t.id === techId ? { ...t, isVerified: !currentStatus } : t));
                showToast('تم تحديث حالة التوثيق.', 'info');
            }
        } catch (err: any) {
            console.error('Error toggling verified:', err);
            showToast('فشل في تحديث حالة التوثيق', 'error');
        }
    };

    const handleToggleActive = async (techId: string) => {
        const tech = allTechnicians.find(t => t.id === techId);
        if (!tech) return;

        try {
            const response = await api.put(`/admin/technicians/${techId}`, { isActive: !tech.isActive });
            if (response.data.success) {
                setAllTechnicians(allTechnicians.map(t => t.id === techId ? { ...t, isActive: !tech.isActive } : t));
                showToast('تم تحديث حالة التفعيل.', 'info');
            }
        } catch (err: any) {
            console.error('Error toggling active:', err);
            showToast('فشل في تحديث حالة التفعيل', 'error');
        }
    };

    const handleDeleteTechnician = async (techId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الفني؟')) {
            try {
                const response = await api.delete(`/admin/technicians/${techId}`);
                if (response.data.success) {
                    setAllTechnicians(allTechnicians.filter(t => t.id !== techId));
                    showToast('تم حذف الفني.', 'info');
                }
            } catch (err: any) {
                console.error('Error deleting technician:', err);
                showToast('فشل في حذف الفني', 'error');
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

    const pendingVerificationCount = useMemo(() => allTechnicians.filter(t => !t.isVerified).length, [allTechnicians]);
    const activeCount = useMemo(() => allTechnicians.filter(t => t.isActive).length, [allTechnicians]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-darkcard p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">جاري تحميل الفنيين...</p>
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
            <ViewHeader title="إدارة الفنيين" subtitle="مراجعة وتفعيل حسابات الفنيين المسجلين." />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="إجمالي الفنيين" value={allTechnicians.length} icon={<Icon name="Users" />} />
                <StatCard title="بانتظار التوثيق" value={pendingVerificationCount} icon={<Icon name="Clock" className="w-6 h-6" />} />
                <StatCard title="الحسابات النشطة" value={activeCount} icon={<Icon name="CheckCircle" className="w-6 h-6 text-green-500" />} />
            </div>

            {/* Filters & Add Button */}
            <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-none shadow-sm pb-6">
                <Input
                    placeholder="ابحث بالاسم أو الرقم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="md:col-span-1"
                />
                <select value={verificationFilter} onChange={e => setVerificationFilter(e.target.value as any)} className="w-full h-10 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    <option value="all">كل حالات التوثيق</option>
                    <option value="verified">موثق</option>
                    <option value="pending">بانتظار التوثيق</option>
                </select>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value as any)} className="w-full h-10 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                    <option value="all">كل المدن</option>
                    {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button onClick={() => { setEditingTechnician(null); setIsModalOpen(true); }} className="w-full">+ إضافة فني</Button>
            </Card>

            {/* Technicians List */}
            <div className="space-y-4">
                {paginatedTechnicians.length > 0 ? (
                    paginatedTechnicians.map((t) => {
                        const specialtyInfo = technicianSpecialties.find(
                            (s) => s.name === t.specialty
                        );
                        return (
                            <Card
                                key={t.id}
                                className="p-4"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex items-start gap-4">
                                        {t.profilePhoto ? (
                                            <img
                                                src={t.profilePhoto}
                                                alt={t.name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-600"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                <Icon
                                                    name="User"
                                                    className="w-10 h-10 text-slate-400 dark:text-slate-500"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                                                {t.name}{" "}
                                                <span className="font-mono text-sm text-slate-500">
                                                    #{t.uniqueId}
                                                </span>
                                            </h4>

                                            <p
                                                className="text-sm text-slate-600 dark:text-slate-400 font-mono"
                                                dir="ltr"
                                            >
                                                {t.id}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    {specialtyInfo?.icon ? (
                                                        <Icon
                                                            name={specialtyInfo.icon as any}
                                                            className="w-4 h-4"
                                                        />
                                                    ) : (
                                                        <Icon
                                                            name="Wrench"
                                                            className="w-4 h-4 text-slate-400"
                                                        />
                                                    )}
                                                    {t.specialty}
                                                </span>

                                                <span className="flex items-center gap-1">
                                                    <Icon
                                                        name="MapPin"
                                                        className="w-4 h-4 text-slate-400"
                                                    />
                                                    {t.city}
                                                </span>

                                                {t.registrationDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Icon
                                                            name="Calendar"
                                                            className="w-4 h-4 text-slate-400"
                                                        />
                                                        انضم في:{" "}
                                                        {new Date(
                                                            t.registrationDate
                                                        ).toLocaleDateString("ar-SY")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-end gap-2 flex-shrink-0 w-full sm:w-auto">
                                        <div className="flex items-center gap-2">
                                            {t.isVerified ? (
                                                <Badge variant="success">
                                                    موثق
                                                </Badge>
                                            ) : (
                                                <Badge variant="warning">
                                                    بانتظار التوثيق
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                onClick={() => {
                                                    setEditingTechnician(t);
                                                    setIsModalOpen(true);
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            >
                                                <Icon name="Pencil" className="w-5 h-5" />
                                            </Button>

                                            <Button
                                                onClick={() => handleDeleteTechnician(t.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                            >
                                                <Icon name="Trash2" className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        {!t.isVerified && (
                                            <Button
                                                onClick={() =>
                                                    handleToggleVerified(
                                                        t.id,
                                                        t.isVerified,
                                                        t.name
                                                    )
                                                }
                                                variant="primary"
                                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                                            >
                                                توثيق الحساب
                                            </Button>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor={`active-${t.id}`}
                                                className="text-sm font-medium"
                                            >
                                                الحالة:
                                            </label>

                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    id={`active-${t.id}`}
                                                    type="checkbox"
                                                    checked={t.isActive}
                                                    onChange={() =>
                                                        handleToggleActive(t.id)
                                                    }
                                                    className="sr-only peer"
                                                />

                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <EmptyState message="لم يتم العثور على فنيين يطابقون معايير البحث." />
                )}
            </div>


            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredTechnicians.length} />
            {isModalOpen && <TechnicianFormModal technician={editingTechnician} onClose={() => { setIsModalOpen(false); setEditingTechnician(null); }} onSave={handleSaveTechnician} allTechnicians={allTechnicians} technicianSpecialties={technicianSpecialties} />}
        </div>
    );
};

export default TechniciansView;