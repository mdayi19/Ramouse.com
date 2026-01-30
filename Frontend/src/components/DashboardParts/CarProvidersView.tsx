import React, { useState, useEffect, useMemo } from 'react';
import { AdminService } from '../../services/admin.service';
import { SYRIAN_CITIES } from '../../constants';
import Modal from '../Modal';
import Pagination from '../Pagination';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ViewHeader } from './Shared';

interface CarProvider {
    id: string; // phone
    phone: string;
    business_name: string;
    business_type: string;
    city: string;
    address: string;
    business_license?: string;
    description?: string;
    is_verified: boolean;
    is_active: boolean;
    is_trusted: boolean;
    total_listings: number;
    created_at: string;
    wallet_balance: number;
    profile_photo?: string;
    gallery?: string[];
    socials?: {
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
        website?: string;
    };
    latitude?: number;
    longitude?: number;
    user?: {
        email?: string;
    };
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarProvidersView: React.FC<Props> = ({ showToast }) => {
    const [providers, setProviders] = useState<CarProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Modal State
    const [selectedProvider, setSelectedProvider] = useState<CarProvider | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'location'>('info');

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/car-providers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();
            setProviders(data.data || data.data?.data || data);
        } catch (error) {
            showToast('فشل تحميل قائمة المزودين', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        try {
            await action();
            showToast(successMsg, 'success');
            loadProviders();
        } catch (error) {
            showToast('فشلت العملية', 'error');
        }
    };

    const toggleVerification = (provider: CarProvider) => {
        handleAction(
            () => AdminService.verifyCarProvider(provider.id, !provider.is_verified),
            provider.is_verified ? 'تم إلغاء توثيق المزود' : 'تم توثيق المزود بنجاح'
        );
        // Optimistic update for modal
        if (selectedProvider && selectedProvider.id === provider.id) {
            setSelectedProvider({ ...selectedProvider, is_verified: !provider.is_verified });
        }
    };

    const toggleTrustedStratus = (provider: CarProvider) => {
        handleAction(
            () => AdminService.toggleTrustedCarProvider(provider.id, !provider.is_trusted),
            !provider.is_trusted ? 'تم تمييز المزود كموثوق' : 'تمت إزالة صفة موثوق من المزود'
        );
        if (selectedProvider && selectedProvider.id === provider.id) {
            setSelectedProvider({ ...selectedProvider, is_trusted: !provider.is_trusted });
        }
    };

    const toggleActiveStatus = (provider: CarProvider) => {
        handleAction(
            () => AdminService.updateCarProviderStatus(provider.id, !provider.is_active),
            !provider.is_active ? 'تم تفعيل حساب المزود' : 'تم إيقاف تفعيل حساب المزود'
        );
        if (selectedProvider && selectedProvider.id === provider.id) {
            setSelectedProvider({ ...selectedProvider, is_active: !provider.is_active });
        }
    };

    const handleDelete = (provider: CarProvider) => {
        if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا المزود؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        handleAction(
            () => AdminService.deleteCarProvider(provider.id),
            'تم حذف المزود بنجاح'
        );
        if (selectedProvider && selectedProvider.id === provider.id) {
            setSelectedProvider(null);
        }
    };

    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            const searchMatch = (p.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.phone || '').includes(searchTerm);

            const cityMatch = cityFilter === 'all' || p.city === cityFilter;

            let statusMatch = true;
            if (statusFilter === 'verified') statusMatch = p.is_verified;
            if (statusFilter === 'pending') statusMatch = !p.is_verified;
            if (statusFilter === 'active') statusMatch = p.is_active;
            if (statusFilter === 'inactive') statusMatch = !p.is_active;

            return searchMatch && cityMatch && statusMatch;
        });
    }, [providers, searchTerm, cityFilter, statusFilter]);

    const paginatedProviders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProviders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProviders, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, cityFilter, statusFilter]);

    const StatCard = ({ title, value, icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
        <Card className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon name={icon} className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </Card>
    );

    if (loading) {
        return (
            <div className="bg-white dark:bg-darkcard p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">جاري تحميل المزودين...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 p-8 shadow-lg">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Icon name="Car" className="w-8 h-8" />
                        مزودي السيارات
                    </h2>
                    <p className="text-white/90">إدارة حسابات معارض ووكالات السيارات، التوثيق، وحالة الحساب</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Glassmorphism Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/30 border-2 border-cyan-200 dark:border-cyan-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-br from-cyan-500 to-sky-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Users" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">إجمالي المزودين</p>
                        <p className="text-2xl font-black text-cyan-900 dark:text-cyan-100">{providers.length}</p>
                    </div>
                </Card>
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="CheckCircle" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">نشط</p>
                        <p className="text-2xl font-black text-green-900 dark:text-green-100">{providers.filter(p => p.is_active).length}</p>
                    </div>
                </Card>
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/30 border-2 border-orange-200 dark:border-orange-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Clock" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">بانتظار التوثيق</p>
                        <p className="text-2xl font-black text-orange-900 dark:text-orange-100">{providers.filter(p => !p.is_verified).length}</p>
                    </div>
                </Card>
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/30 border-2 border-purple-200 dark:border-purple-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Shield" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">موثوق</p>
                        <p className="text-2xl font-black text-purple-900 dark:text-purple-100">{providers.filter(p => p.is_trusted).length}</p>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-none shadow-sm pb-6">
                <Input
                    placeholder="بحث بالاسم أو رقم الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="md:col-span-2"
                />
                <select
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                    <option value="all">كل المدن</option>
                    {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full h-10 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                    <option value="all">كل الحالات</option>
                    <option value="verified">موثق</option>
                    <option value="pending">بانتظار التوثيق</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                </select>
            </Card>

            {/* List */}
            <div className="space-y-4">
                {paginatedProviders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedProviders.map(provider => (
                            <Card key={provider.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {provider.profile_photo ? (
                                                <img src={provider.profile_photo} alt={provider.business_name} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <Icon name="Briefcase" className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{provider.business_name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{provider.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                            {provider.is_active ? <Badge variant="success" className="text-[10px] py-0.5">نشط</Badge> : <Badge variant="destructive" className="text-[10px] py-0.5">غير نشط</Badge>}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Icon name="MapPin" className="w-4 h-4 text-slate-400" />
                                            <span className="truncate">{provider.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon name="Briefcase" className="w-4 h-4 text-slate-400" />
                                            <span className="truncate">{provider.business_type}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icon name="List" className="w-4 h-4 text-slate-400" />
                                            <span>{provider.total_listings} إعلان</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {provider.is_verified && <Badge variant="info" className="flex items-center gap-1"><Icon name="CheckCircle" className="w-3 h-3" /> موثق</Badge>}
                                        {provider.is_trusted && <Badge variant="warning" className="flex items-center gap-1"><Icon name="Shield" className="w-3 h-3" /> موثوق</Badge>}
                                        {!provider.is_verified && <Badge variant="secondary" className="flex items-center gap-1">غير موثق</Badge>}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedProvider(provider)} className="text-primary hover:bg-primary/10 w-full justify-center">
                                        عرض التفاصيل
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="لم يتم العثور على مزودين يطابقون بحثك." />
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredProviders.length / ITEMS_PER_PAGE)}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredProviders.length}
            />

            {/* DETAIL MODAL */}
            {selectedProvider && (
                <Modal
                    title={selectedProvider.business_name}
                    onClose={() => setSelectedProvider(null)}
                    size="3xl"
                >
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                                ? 'border-primary text-primary dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            المعلومات
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'media'
                                ? 'border-primary text-primary dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            الوسائط
                        </button>
                        <button
                            onClick={() => setActiveTab('location')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'location'
                                ? 'border-primary text-primary dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            الموقع
                        </button>
                    </div>

                    <div className="min-h-[300px]">
                        {activeTab === 'info' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">معلومات التواصل</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                                <Icon name="Phone" className="w-4 h-4 text-slate-400" />
                                                <span dir="ltr">{selectedProvider.phone}</span>
                                            </div>
                                            {selectedProvider.user?.email && (
                                                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                                    <Icon name="Mail" className="w-4 h-4 text-slate-400" />
                                                    <span>{selectedProvider.user.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                                <Icon name="MapPin" className="w-4 h-4 text-slate-400" />
                                                <span>{selectedProvider.address}, {selectedProvider.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">وسائل التواصل</h4>
                                        <div className="space-y-3 text-sm">
                                            {selectedProvider.socials?.facebook ? (
                                                <a href={selectedProvider.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline">
                                                    <Icon name="Facebook" className="w-4 h-4" />
                                                    <span>Facebook</span>
                                                </a>
                                            ) : <p className="text-slate-400 text-xs italic">غير متوفر</p>}
                                            {selectedProvider.socials?.instagram && (
                                                <a href={selectedProvider.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-pink-600 hover:underline">
                                                    <Icon name="Instagram" className="w-4 h-4" />
                                                    <span>Instagram</span>
                                                </a>
                                            )}
                                            {selectedProvider.socials?.website && (
                                                <a href={selectedProvider.socials.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:underline">
                                                    <Icon name="Globe" className="w-4 h-4" />
                                                    <span>الموقع الإلكتروني</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedProvider.description && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">نبذة</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{selectedProvider.description}</p>
                                    </div>
                                )}

                                {selectedProvider.business_license && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">الرخصة التجارية</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 inline-block">
                                            {selectedProvider.business_license}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Icon name="User" className="w-4 h-4" /> الصورة الشخصية
                                    </h4>
                                    {selectedProvider.profile_photo ? (
                                        <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
                                            <img src={selectedProvider.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">لم يتم رفع صورة شخصية.</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Icon name="Image" className="w-4 h-4" /> المعرض
                                    </h4>
                                    {selectedProvider.gallery && selectedProvider.gallery.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {selectedProvider.gallery.map((img, idx) => (
                                                <div key={idx} className="aspect-square rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 group relative">
                                                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">لم يتم رفع صور.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'location' && (
                            <div className="space-y-4">
                                {selectedProvider.latitude && selectedProvider.longitude ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">الإحداثيات</p>
                                                <p className="text-sm text-slate-500 font-mono mt-1">
                                                    {selectedProvider.latitude}, {selectedProvider.longitude}
                                                </p>
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps?q=${selectedProvider.latitude},${selectedProvider.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <Icon name="MapPin" className="w-4 h-4" />
                                                فتح في خرائط جوجل
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                        <Icon name="MapPin" className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                        <p>لا تتوافر معلومات الموقع.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 justify-end">
                        <Button
                            onClick={() => toggleVerification(selectedProvider)}
                            variant={selectedProvider.is_verified ? 'warning' : 'success'}
                            className="flex items-center gap-2"
                        >
                            <Icon name={selectedProvider.is_verified ? 'X' : 'CheckCircle'} className="w-4 h-4" />
                            {selectedProvider.is_verified ? 'إلغاء التوثيق' : 'توثيق الحساب'}
                        </Button>

                        <Button
                            onClick={() => toggleTrustedStratus(selectedProvider)}
                            variant={selectedProvider.is_trusted ? 'ghost' : 'primary'}
                            className="flex items-center gap-2"
                        >
                            <Icon name="Shield" className="w-4 h-4" />
                            {selectedProvider.is_trusted ? 'إزالة الموثوقية' : 'تمييز كموثوق'}
                        </Button>

                        <Button
                            onClick={() => toggleActiveStatus(selectedProvider)}
                            variant={selectedProvider.is_active ? 'danger' : 'success'}
                            className="flex items-center gap-2"
                        >
                            {selectedProvider.is_active ? (
                                <>
                                    <Icon name="Power" className="w-4 h-4" /> إيقاف الحساب
                                </>
                            ) : (
                                <>
                                    <Icon name="Power" className="w-4 h-4" /> تفعيل الحساب
                                </>
                            )}
                        </Button>

                        <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>

                        <Button
                            onClick={() => handleDelete(selectedProvider)}
                            variant="danger"
                            className="flex items-center gap-2 hover:bg-red-600 text-white"
                        >
                            <Icon name="Trash2" className="w-4 h-4" />
                            حذف
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CarProvidersView;
