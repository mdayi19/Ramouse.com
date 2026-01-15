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
            console.log(`Fetching analytics for page ${page}, days ${days}...`);
            const res = await CarProviderService.getDetailedAnalytics(page, 10, days || 30);

            console.log('Analytics API Response:', res);

            if (res && res.success && res.data) {
                setListings(res.data.data || []);
                setPagination({
                    current_page: res.data.current_page || 1,
                    last_page: res.data.last_page || 1,
                    total: res.data.total || 0,
                    per_page: res.data.per_page || 10
                });
            } else {
                console.warn('Analytics API returned unsuccessful or empty response:', res);
                if (res && !res.success) {
                    setError(`فشل في جلب البيانات من الخادم: ${res.message || JSON.stringify(res)}`);
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch detailed analytics:', error);
            setError(`حدث خطأ أثناء تحميل البيانات: ${error.message || JSON.stringify(error)}`);
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
                <div className="overflow-x-auto">
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
