import React, { useState } from 'react';
import { ViewHeader } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCacheManager } from '../../hooks/useCacheManager';
import { RefreshCw, Trash2, Database, HardDrive, Server, Archive, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const CacheManagementView: React.FC<{
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    cacheVersion: string
}> = ({ showToast, cacheVersion }) => {
    const {
        cacheStats,
        isLoading,
        isRefreshing,
        clearLocalStorage,
        clearServiceWorkerCache,
        clearIndexedDB,
        clearAllCaches,
        clearAndReseed,
        invalidateBackendCache,
        updateServiceWorker,
        refreshStats
    } = useCacheManager(showToast);

    const [expandedCache, setExpandedCache] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <ViewHeader
                        title="إدارة ذاكرة التخزين المؤقت"
                        subtitle="إدارة شاملة لذاكرات التخزين المؤقت في المتصفح والخادم"
                    />
                    <Button
                        onClick={refreshStats}
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                </div>

                {/* Cache Version Info */}
                <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-500/10">
                            <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                إصدار ذاكرة التخزين المؤقت الحالي
                            </p>
                            <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                                {cacheVersion}
                            </p>
                        </div>
                        {cacheStats?.lastCleared && (
                            <div className="text-left">
                                <p className="text-xs text-slate-500 dark:text-slate-400">آخر مسح</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {new Date(cacheStats.lastCleared).toLocaleString('ar-SY')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cache Statistics Overview */}
                {cacheStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* localStorage Stats */}
                        <div className="group relative p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                    <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">localStorage</h3>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {cacheStats.localStorage.sizeInMB}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {cacheStats.localStorage.items} عنصر مخزن
                                </p>
                            </div>
                        </div>

                        {/* Service Worker Stats */}
                        <div className="group relative p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                    <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Service Worker</h3>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {cacheStats.serviceWorker.available ? cacheStats.serviceWorker.totalSizeInMB : 'غير متاح'}
                                </p>
                                {cacheStats.serviceWorker.available && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {cacheStats.serviceWorker.caches.length} ذاكرة مؤقتة
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* IndexedDB Stats */}
                        <div className="group relative p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                    <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">IndexedDB</h3>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {cacheStats.indexedDB.count}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    قاعدة بيانات
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Service Worker Cache Details */}
                {cacheStats?.serviceWorker.available && cacheStats.serviceWorker.caches.length > 0 && (
                    <div className="mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <button
                            onClick={() => setExpandedCache(expandedCache ? null : 'sw')}
                            className="w-full flex items-center justify-between text-right"
                        >
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                تفاصيل ذاكرات Service Worker ({cacheStats.serviceWorker.caches.length})
                            </h4>
                            <RefreshCw className={`w-4 h-4 transition-transform ${expandedCache === 'sw' ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedCache === 'sw' && (
                            <div className="mt-4 space-y-2">
                                {cacheStats.serviceWorker.caches.map((cache, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                {cache.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {cache.resourceCount} موارد • {(cache.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => clearServiceWorkerCache(cache.name)}
                                            variant="outline"
                                            className="text-xs"
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="w-3 h-3 ml-1" />
                                            مسح
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Cache Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clear localStorage */}
                <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                            <HardDrive className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                مسح localStorage
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                إزالة البيانات المخزنة محليًا في متصفحك فقط
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={clearLocalStorage}
                        variant="warning"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        امسح localStorage
                    </Button>
                </Card>

                {/* Clear Service Worker Cache */}
                <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                مسح Service Worker
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                إزالة الملفات المخزنة مؤقتًا للعمل دون اتصال
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => clearServiceWorkerCache()}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        disabled={isLoading || !cacheStats?.serviceWorker.available}
                    >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        امسح SW Cache
                    </Button>
                </Card>

                {/* Clear IndexedDB */}
                <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                مسح IndexedDB
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                حذف قواعد البيانات المحلية في المتصفح
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={clearIndexedDB}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        disabled={isLoading || cacheStats?.indexedDB.count === 0}
                    >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        امسح IndexedDB
                    </Button>
                </Card>

                {/* Invalidate Backend Cache */}
                <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                            <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                مسح ذاكرة الخادم
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                تحديث ذاكرة Laravel المؤقتة (مسؤول فقط)
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => invalidateBackendCache('all')}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                        مسح ذاكرة الخادم
                    </Button>
                </Card>
            </div>

            {/* Dangerous Operations */}
            <Card className="p-6 border-2 border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-800 dark:text-red-200 mb-1 text-lg">
                            عمليات خطيرة - استخدم بحذر
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            هذه الإجراءات لا يمكن التراجع عنها وستؤثر على جميع المستخدمين النشطين
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Clear All Caches */}
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">
                            مسح جميع ذاكرات التخزين المؤقت
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                            سيتم مسح localStorage و Service Worker و IndexedDB. سيتم إعادة تحميل الصفحة تلقائيًا.
                        </p>
                        <Button
                            onClick={clearAllCaches}
                            variant="danger"
                            className="w-full flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            امسح جميع ذاكرات التخزين
                        </Button>
                    </div>

                    {/* Clear and Reseed */}
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">
                            إعادة تعيين كاملة وإعادة البذر
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                            <strong>⚠️ تحذير شديد:</strong> سيتم حذف جميع البيانات وإعادة إنشاء البيانات الأولية من الصفر.
                        </p>
                        <Button
                            onClick={clearAndReseed}
                            variant="danger"
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                            إعادة تعيين وإعادة البذر
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Info Panel */}
            <Card className="p-5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 border border-sky-200 dark:border-sky-800">
                <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                        <p className="font-semibold text-sky-800 dark:text-sky-300">
                            معلومات مهمة حول إدارة ذاكرة التخزين المؤقت:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>تحديث إصدار ذاكرة التخزين يؤدي إلى تحديث تلقائي لجميع المستخدمين</li>
                            <li>Service Worker يقوم بتخزين الملفات تلقائيًا للعمل دون اتصال</li>
                            <li>التغييرات على ذاكرة التخزين تُبث تلقائيًا لجميع علامات التبويب المفتوحة</li>
                            <li>لا يمكن مسح ذاكرة تخزين المستخدمين عن بُعد (حماية أمان المتصفح)</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CacheManagementView;
