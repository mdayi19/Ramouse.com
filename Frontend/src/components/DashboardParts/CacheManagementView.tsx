import React from 'react';
import { ViewHeader } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const CacheManagementView: React.FC<{ showToast: (msg: string, type: 'success' | 'error' | 'info') => void; cacheVersion: string }> = ({ showToast, cacheVersion }) => {
    const handleClearCache = () => {
        if (window.confirm('هل أنت متأكد من أنك تريد مسح ذاكرة التخزين المؤقت للتطبيق؟ سيؤدي هذا إلى تسجيل خروج جميع المستخدمين وقد يفقدون أي بيانات غير محفوظة.')) {
            const version = localStorage.getItem('cache_version');
            localStorage.clear();
            if (version) {
                localStorage.setItem('cache_version', version); // Keep version to avoid re-seeding
            }
            showToast('تم مسح ذاكرة التخزين المؤقت بنجاح. سيتم إعادة تحميل الصفحة.', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    const handleClearAndReseed = () => {
        if (window.confirm('تحذير: سيؤدي هذا الإجراء إلى مسح جميع البيانات، بما في ذلك المستخدمين والطلبات، وإعادة ملء البيانات الأولية. هل أنت متأكد؟')) {
            localStorage.clear();
            showToast('تم مسح جميع البيانات. سيتم إعادة ملء البيانات الأولية عند إعادة التحميل.', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    }

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة ذاكرة التخزين المؤقت" subtitle="إدارة ذاكرة التخزين المؤقت للمتصفح (localStorage)." />
            <div className="space-y-6">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p><strong>إصدار ذاكرة التخزين المؤقت الحالي:</strong> <code>{cacheVersion}</code></p>
                    <p className="text-xs text-slate-500">يتم مسح ذاكرة التخزين المؤقت تلقائيًا للمستخدمين عند تحديث هذا الإصدار في الكود.</p>
                </div>

                <div className="p-4 border border-yellow-300 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200">مسح ذاكرة التخزين المؤقت (localStorage)</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 my-2">
                        سيؤدي هذا الإجراء إلى إزالة جميع البيانات المخزنة محليًا في متصفحك، بما في ذلك بيانات تسجيل الدخول والطلبات والإعدادات. لن يؤثر هذا على المستخدمين الآخرين.
                    </p>
                    <Button onClick={() => handleClearCache()} variant="warning">
                        امسح ذاكرة التخزين المؤقت لمتصفحي
                    </Button>
                </div>

                <div className="p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <h4 className="font-bold text-red-800 dark:text-red-200">إعادة تعيين وإعادة ملء البيانات</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 my-2">
                        <strong>تحذير: إجراء خطير.</strong> سيؤدي هذا إلى حذف جميع البيانات الأولية (المستخدمين، الطلبات، المنتجات، إلخ) وإعادة إنشائها من جديد. استخدم هذا فقط في بيئة التطوير أو إذا كنت تريد البدء من جديد.
                    </p>
                    <Button onClick={() => handleClearAndReseed()} variant="danger">
                        إعادة تعيين جميع البيانات الأولية
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default CacheManagementView;
