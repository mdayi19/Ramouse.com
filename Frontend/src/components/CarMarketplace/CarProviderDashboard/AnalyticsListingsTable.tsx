import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Eye, Users, Phone, Check,
    MessageSquare, Heart, Share2, Search, Filter
} from 'lucide-react';
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

    useEffect(() => {
        fetchData();
    }, [page, days]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await CarProviderService.getDetailedAnalytics(page, 10, days);
            if (res.success && res.data) {
                setListings(res.data.data);
                setPagination({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total,
                    per_page: res.data.per_page
                });
            }
        } catch (error) {
            console.error('Failed to fetch detailed analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const rowVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">تفاصيل أداء الإعلانات</h3>
                    <p className="text-sm text-slate-500 mt-1">جدول تفصيلي لجميع التفاعلات مع إعلاناتك خلال الفترة المحددة</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                        {pagination.total} إعلان
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الإعلان</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                <span className="flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> المشاهدات</span>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                <span className="flex items-center justify-center gap-1"><Users className="w-3 h-3" /> زوار فريدون</span>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                <span className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> اتصال</span>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                <span className="flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> واتساب</span>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                <span className="flex items-center justify-center gap-1"><Heart className="w-3 h-3" /> مفضلة</span>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                <span className="flex items-center justify-center gap-1"><Share2 className="w-3 h-3" /> مشاركة</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {loading ? (
                            // Skeleton Rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl w-48"></div></td>
                                    {[...Array(6)].map((_, j) => (
                                        <td key={j} className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 dark:bg-slate-700 rounded w-12 mx-auto"></div></td>
                                    ))}
                                </tr>
                            ))
                        ) : listings.length > 0 ? (
                            listings.map((item: any) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden relative">
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
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(item.period_contact_phone || 0) > 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'text-slate-400'
                                            }`}>
                                            {item.period_contact_phone || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(item.period_contact_whatsapp || 0) > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-400'
                                            }`}>
                                            {item.period_contact_whatsapp || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(item.period_favorites || 0) > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'text-slate-400'
                                            }`}>
                                            {item.period_favorites || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-500">
                                        {item.period_shares || 0}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    لا توجد بيانات متاحة للعرض
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        صفحة {page} من {pagination.last_page}
                    </span>

                    <button
                        onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                        disabled={page === pagination.last_page}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};
