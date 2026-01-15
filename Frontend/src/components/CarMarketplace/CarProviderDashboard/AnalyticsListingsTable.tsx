import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Icon } from '../../DashboardParts/Shared';
import { CarProviderService } from '../../../services/carprovider.service';
import { getImageUrl } from '../../../utils/helpers';

interface AnalyticsListingsTableProps {
    days: number;
}

export const AnalyticsListingsTable: React.FC<AnalyticsListingsTableProps> = ({ days }) => {
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    });
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [page, days]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await CarProviderService.getDetailedAnalytics(page, 10, days || 30);
            if (res && res.success && res.data) {
                setListings(res.data.data || []);
                setPagination({
                    current_page: res.data.current_page || 1,
                    last_page: res.data.last_page || 1,
                    total: res.data.total || 0,
                    per_page: res.data.per_page || 10
                });
            } else {
                if (res && !res.success) {
                    setError('فشل في جلب بيانات الإحصائيات');
                }
            }
        } catch (error) {
            console.error('Failed to fetch detailed analytics:', error);
            setError('حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold">تفاصيل أداء الإعلانات</CardTitle>
                        <CardDescription>جدول تفصيلي لجميع التفاعلات مع إعلاناتك خلال الفترة المحددة</CardDescription>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1">
                        {pagination.total} إعلان
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الإعلان</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Icon name="Eye" className="w-3 h-3" /> المشاهدات</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Icon name="Users" className="w-3 h-3" /> زوار فريدون</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Icon name="Phone" className="w-3 h-3" /> اتصال</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Icon name="MessageSquare" className="w-3 h-3" /> واتساب</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Icon name="Heart" className="w-3 h-3" /> مفضلة</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Icon name="Share2" className="w-3 h-3" /> مشاركة</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                // Skeleton Rows
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-48"></div></td>
                                        {[...Array(6)].map((_, j) => (
                                            <td key={j} className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-12 mx-auto"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-red-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon name="AlertCircle" className="w-8 h-8" />
                                            <span>{error}</span>
                                            <Button size="sm" variant="outline" onClick={fetchData} className="mt-2">
                                                إعادة المحاول
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : listings.length > 0 ? (
                                listings.map((item: any) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative">
                                                    <img
                                                        src={getImageUrl(item.photos?.[0]) || '/placeholder-car.jpg'}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {item.brand?.name} • {item.category?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {item.period_views || 0}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                                            {item.period_unique_visitors || 0}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={(item.period_contact_phone || 0) > 0 ? "success" : "secondary"} className="font-bold">
                                                {item.period_contact_phone || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={(item.period_contact_whatsapp || 0) > 0 ? "success" : "secondary"} className="font-bold">
                                                {item.period_contact_whatsapp || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={(item.period_favorites || 0) > 0 ? "destructive" : "secondary"} className="font-bold">
                                                {item.period_favorites || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500">
                                            {item.period_shares || 0}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon name="Inbox" className="w-12 h-12 text-slate-300" />
                                            <span>لا توجد بيانات متاحة للعرض</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                </div>
                            </div>
                        ))
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <Icon name="AlertCircle" className="w-8 h-8 mx-auto mb-2" />
                            <p>{error}</p>
                            <Button size="sm" variant="outline" onClick={fetchData} className="mt-4">
                                إعادة المحاول
                            </Button>
                        </div>
                    ) : listings.length > 0 ? (
                        listings.map((item: any) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-700">
                                        <img
                                            src={getImageUrl(item.photos?.[0]) || '/placeholder-car.jpg'}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-2 mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {item.brand?.name} • {item.category?.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                                            <Icon name="Eye" className="w-3 h-3" /> المشاهدات
                                        </span>
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{item.period_views || 0}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                                            <Icon name="Users" className="w-3 h-3" /> زوار فريدون
                                        </span>
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{item.period_unique_visitors || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] text-slate-400 mb-1">اتصال</span>
                                        <Badge variant={(item.period_contact_phone || 0) > 0 ? "success" : "secondary"} className="h-6">
                                            <Icon name="Phone" className="w-3 h-3 ml-1" />
                                            {item.period_contact_phone || 0}
                                        </Badge>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] text-slate-400 mb-1">واتساب</span>
                                        <Badge variant={(item.period_contact_whatsapp || 0) > 0 ? "success" : "secondary"} className="h-6">
                                            <Icon name="MessageSquare" className="w-3 h-3 ml-1" />
                                            {item.period_contact_whatsapp || 0}
                                        </Badge>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] text-slate-400 mb-1">مفضلة</span>
                                        <Badge variant={(item.period_favorites || 0) > 0 ? "destructive" : "secondary"} className="h-6">
                                            <Icon name="Heart" className="w-3 h-3 ml-1" />
                                            {item.period_favorites || 0}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Icon name="Inbox" className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>لا توجد بيانات متاحة للعرض</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                            disabled={page === pagination.last_page}
                        >
                            <Icon name="ChevronLeft" className="w-5 h-5" />
                        </Button>

                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            صفحة {page} من {pagination.last_page}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <Icon name="ChevronRight" className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
