import React, { useState } from 'react';
import { AuctionCar } from '../../../types';
import { Button } from '../../ui/Button';
import { Badge, BadgeProps } from '../../ui/Badge';
import Icon from '../../Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface AuctionCarsTabProps {
    cars: AuctionCar[];
    loading: boolean;
    carFilter: string;
    onFilterChange: (filter: string) => void;
    onRefresh: () => void;
    onEdit: (car: AuctionCar) => void;
    onSchedule: (car: AuctionCar) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete: (id: string) => void;
}

type StatusConfig = {
    variant: BadgeProps['variant'];
    label: string;
    icon: string;
    className?: string;
};

const carStatusMap: Record<string, StatusConfig> = {
    'draft': { variant: 'secondary', label: 'مسودة', icon: 'FileEdit' },
    'pending_approval': { variant: 'warning', label: 'بانتظار الموافقة', icon: 'Clock', className: 'animate-pulse' },
    'approved': { variant: 'success', label: 'معتمدة', icon: 'CheckCircle' },
    'sold': { variant: 'info', label: 'مباعة', icon: 'DollarSign' },
    'unsold': { variant: 'secondary', label: 'غير مباعة', icon: 'XCircle' },
    'cancelled': { variant: 'destructive', label: 'ملغاة', icon: 'Ban' },
    'in_auction': { variant: 'indigo', label: 'في المزاد', icon: 'Hammer' },
};

const getCarStatusBadge = (status: string) => {
    const config = carStatusMap[status] || { variant: 'secondary' as const, label: status, icon: 'HelpCircle' };
    return (
        <Badge variant={config.variant} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold ${config.className || ''}`}>
            <Icon name={config.icon as any} className="w-3.5 h-3.5" />
            {config.label}
        </Badge>
    );
};

export const AuctionCarsTab: React.FC<AuctionCarsTabProps> = ({
    cars,
    loading,
    carFilter,
    onFilterChange,
    onRefresh,
    onEdit,
    onSchedule,
    onApprove,
    onReject,
    onDelete,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCars = searchQuery
        ? cars.filter(car =>
            car.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.model?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : cars;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex-1 relative">
                    <Icon name="Search" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث عن سيارة (الاسم، الماركة، الموديل)..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full py-3 px-5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm outline-none"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={carFilter}
                        onChange={e => onFilterChange(e.target.value)}
                        className="flex-1 md:flex-none px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer shadow-sm outline-none"
                    >
                        <option value="">جميع الحالات</option>
                        <option value="pending_approval">بانتظار الموافقة</option>
                        <option value="approved">معتمدة</option>
                        <option value="in_auction">في المزاد</option>
                        <option value="sold">مباعة</option>
                        <option value="draft">مسودة</option>
                    </select>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onRefresh}
                        className="!w-12 !h-12 !rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                        title="تحديث"
                    >
                        <Icon name="RefreshCw" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Results Header */}
            {!loading && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        تم العثور على <span className="font-black text-gray-900 dark:text-white mx-1">{filteredCars.length}</span> سيارة
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="bg-white md:bg-transparent dark:bg-darkcard md:dark:bg-transparent rounded-3xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <Icon name="Loader" className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
                    </div>
                ) : filteredCars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-darkcard">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <Icon name="Car" className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-300">لا توجد سيارات</p>
                        <p className="text-sm mt-2 opacity-75">لم يتم العثور على سيارات تطابق بحثك</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Grid View */}
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 gap-4 md:hidden p-4 md:p-0"
                        >
                            <AnimatePresence>
                                {filteredCars.map(car => (
                                    <motion.div
                                        key={car.id}
                                        variants={item}
                                        layout
                                        className="bg-white dark:bg-darkcard rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800"
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                                <img
                                                    src={car.media?.images?.[0] || '/placeholder-car.jpg'}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">
                                                        {car.brand} {car.model}
                                                    </h3>
                                                    <div className="shrink-0 scale-90 origin-top-left">
                                                        {getCarStatusBadge(car.status)}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2 truncate">{car.title}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                                                        {car.year}
                                                    </span>
                                                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                                                        ${car.starting_price?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => onEdit(car)}
                                                className="flex-1"
                                            >
                                                <Icon name="Pencil" className="w-3.5 h-3.5 ml-1.5" />
                                                تعديل
                                            </Button>

                                            {car.status === 'approved' && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => onSchedule(car)}
                                                    className="flex-1"
                                                >
                                                    <Icon name="Hammer" className="w-3.5 h-3.5 ml-1.5" />
                                                    جدولة
                                                </Button>
                                            )}

                                            {car.status === 'pending_approval' && (
                                                <>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => onApprove(car.id)}
                                                        className="flex-1"
                                                    >
                                                        <Icon name="Check" className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => onReject(car.id)}
                                                        className="flex-1"
                                                    >
                                                        <Icon name="X" className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(car.id)}
                                                className="w-9 px-0 text-red-500 hover:bg-red-50"
                                            >
                                                <Icon name="Trash2" className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto bg-white dark:bg-darkcard rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">تفاصيل السيارة</th>
                                        <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">السعر المبدئي</th>
                                        <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                                        <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">المالك</th>
                                        <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredCars.map(car => (
                                        <tr key={car.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group-hover:scale-105 transition-transform">
                                                        <img
                                                            src={car.media?.images?.[0] || '/placeholder-car.jpg'}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-gray-900 dark:text-white text-lg">{car.brand} {car.model}</p>
                                                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{car.year}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 line-clamp-1 max-w-[200px]">{car.title}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-blue-600 dark:text-blue-400 text-lg tracking-tight">
                                                    ${car.starting_price?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex">{getCarStatusBadge(car.status)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${car.seller_type === 'admin'
                                                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                            : 'bg-gray-50 border-gray-200 text-gray-500'
                                                        }`}>
                                                        <Icon name={car.seller_type === 'admin' ? 'Shield' : 'User'} className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                                            {car.seller_type === 'admin' ? 'System Admin' : car.seller_name || 'User'}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {car.seller_type === 'admin' ? 'Malik' : 'Seller'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit(car)}
                                                        className="w-10 h-10 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
                                                        title="تعديل البيانات"
                                                    >
                                                        <Icon name="Pencil" className="w-4 h-4" />
                                                    </Button>

                                                    {car.status === 'approved' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onSchedule(car)}
                                                            className="w-10 h-10 rounded-xl text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20"
                                                            title="جدولة مزاد لهذه السيارة"
                                                        >
                                                            <Icon name="Hammer" className="w-4 h-4" />
                                                        </Button>
                                                    )}

                                                    {car.status === 'pending_approval' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => onApprove(car.id)}
                                                                className="w-10 h-10 rounded-xl text-green-600 bg-green-50 hover:bg-green-100"
                                                                title="قبول"
                                                            >
                                                                <Icon name="Check" className="w-5 h-5 stroke-[3px]" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => onReject(car.id)}
                                                                className="w-10 h-10 rounded-xl text-orange-600 bg-orange-50 hover:bg-orange-100"
                                                                title="رفض"
                                                            >
                                                                <Icon name="X" className="w-5 h-5 stroke-[3px]" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete(car.id)}
                                                        className="w-10 h-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        title="حذف نهائي"
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
                    </>
                )}
            </div>
        </div>
    );
};

export default AuctionCarsTab;
