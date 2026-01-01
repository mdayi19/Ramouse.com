
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Order } from '../../types';
import Modal from '../Modal';
import { ViewHeader, EditIcon, DeleteIcon, Icon } from './Shared';
import Pagination from '../Pagination';
import EmptyState from '../EmptyState';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface UsersViewProps {
    allOrders: Order[];
}

const CustomerFormModal: React.FC<{
    customer: Customer;
    onSave: (data: Partial<Customer>) => void;
    onClose: () => void;
}> = ({ customer, onSave, onClose }) => {
    const [name, setName] = useState(customer.name || '');
    const [address, setAddress] = useState(customer.address || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, address });
    };

    return (
        <Modal title={`تعديل بيانات ${customer.name || customer.id}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="الاسم"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">العنوان</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-500" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="ghost">إلغاء</Button>
                    <Button type="submit">حفظ</Button>
                </div>
            </form>
        </Modal>
    );
};

const ITEMS_PER_PAGE = 10;

const UsersView: React.FC<UsersViewProps> = ({ allOrders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch users from API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/admin/users');
                setCustomers(response.data.data || []);
            } catch (err: any) {
                console.error('Error fetching users:', err);
                setError(err.response?.data?.message || 'فشل في تحميل المستخدمين');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUpdateCustomer = async (customerId: string, data: Partial<Customer>) => {
        try {
            const response = await api.put(`/admin/users/${customerId}`, data);
            if (response.data.success) {
                setCustomers(customers.map(c => c.id === customerId ? { ...c, ...data } : c));
            }
        } catch (err: any) {
            console.error('Error updating user:', err);
            alert(err.response?.data?.error || 'فشل في تحديث المستخدم');
        }
    };

    const handleResetPassword = async (customerId: string) => {
        const newPass = prompt("كلمة المرور الجديدة:");
        if (newPass) {
            try {
                const response = await api.post(`/admin/users/${customerId}/reset-password`, {
                    password: newPass
                });
                if (response.data.success) {
                    alert('تم تغيير كلمة المرور بنجاح');
                }
            } catch (err: any) {
                console.error('Error resetting password:', err);
                alert(err.response?.data?.error || 'فشل في تغيير كلمة المرور');
            }
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                const response = await api.delete(`/admin/users/${customerId}`);
                if (response.data.success) {
                    setCustomers(customers.filter(c => c.id !== customerId));
                }
            } catch (err: any) {
                console.error('Error deleting user:', err);
                alert(err.response?.data?.error || 'فشل في حذف المستخدم');
            }
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            c.id.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredCustomers, currentPage]);

    return (
        <div className="space-y-6">
            <ViewHeader title="إدارة المستخدمين" subtitle="عرض وتعديل معلومات العملاء المسجلين." />

            {loading && (
                <div className="bg-white dark:bg-darkcard p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">جاري تحميل المستخدمين...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    <Card className="p-4 shadow-sm border-none">
                        <div className="relative max-w-md">
                            <Input
                                placeholder="ابحث بالاسم أو الرقم..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<Icon name="Search" className="w-5 h-5" />}
                            />
                        </div>
                    </Card>

                    <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">العميل</th>
                                        <th className="px-6 py-4">العنوان</th>
                                        <th className="px-6 py-4">عدد الطلبات</th>
                                        <th className="px-6 py-4">الحالة</th>
                                        <th className="px-6 py-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {paginatedCustomers.map(c => {
                                        const orderCount = allOrders.filter(o => o.userPhone === c.id).length;
                                        return (
                                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                                            {(c.name?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-slate-100">{c.name || 'مستخدم جديد'}</div>
                                                            <div className="text-xs text-slate-500 font-mono" dir="ltr">{c.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{c.address || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                                        {orderCount} طلبات
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={c.isActive} onChange={() => handleUpdateCustomer(c.id, { isActive: !c.isActive })} className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            onClick={() => setEditingCustomer(c)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            title="تعديل"
                                                        >
                                                            <EditIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleResetPassword(c.id)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                            title="إعادة تعيين كلمة المرور"
                                                        >
                                                            <Icon name="KeyRound" className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteCustomer(c.id)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="حذف"
                                                        >
                                                            <DeleteIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                            {paginatedCustomers.map(c => {
                                const orderCount = allOrders.filter(o => o.userPhone === c.id).length;
                                return (
                                    <Card key={c.id} className="p-4 rounded-xl">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                    {(c.name?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-slate-100">{c.name || 'مستخدم جديد'}</div>
                                                    <div className="text-xs text-slate-500 font-mono" dir="ltr">{c.id}</div>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={c.isActive} onChange={() => handleUpdateCustomer(c.id, { isActive: !c.isActive })} className="sr-only peer" />
                                                <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4 pl-2">
                                            <div>
                                                <span className="text-slate-500 text-xs block mb-1">العنوان</span>
                                                <span className="font-medium">{c.address || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-xs block mb-1">الطلبات</span>
                                                <span className="font-medium">{orderCount}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t dark:border-slate-700/50">
                                            <Button
                                                onClick={() => setEditingCustomer(c)}
                                                variant="ghost"
                                                className="flex-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                                            >
                                                <EditIcon className="w-3 h-3 mr-1" /> تعديل
                                            </Button>
                                            <Button
                                                onClick={() => handleResetPassword(c.id)}
                                                variant="ghost"
                                                className="flex-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100"
                                            >
                                                <Icon name="KeyRound" className="w-3 h-3 mr-1" /> كلمة المرور
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteCustomer(c.id)}
                                                variant="ghost"
                                                className="flex-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100"
                                            >
                                                <DeleteIcon className="w-3 h-3 mr-1" /> حذف
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {filteredCustomers.length === 0 && <EmptyState message="لم يتم العثور على عملاء." />}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredCustomers.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    )}
                    {editingCustomer && <CustomerFormModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} onSave={(data) => { handleUpdateCustomer(editingCustomer.id, data); setEditingCustomer(null); }} />}
                </>
            )}
        </div>
    );
};

export default UsersView;
