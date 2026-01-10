import React, { useState } from 'react';
import Icon from '../Icon';
import { NotificationService } from '../../services/notification.service';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';

interface SendNotificationViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type TargetGroup = 'all' | 'customers' | 'providers' | 'technicians' | 'tow_providers' | 'car_providers';

type NotificationView = 'welcome' | 'newOrder' | 'myOrders' | 'adminDashboard' | 'providerDashboard' | 'announcements' | 'customerDashboard' | 'notificationCenter' | 'technicianDashboard' | 'technicianDirectory' | 'technicianProfile' | 'technicianRegistration' | 'blog' | 'blogPost' | 'faq' | 'privacyPolicy' | 'termsOfUse' | 'contact' | 'towTruckDirectory' | 'towTruckProfile' | 'towTruckRegistration' | 'towTruckDashboard' | 'store';

const SendNotificationView: React.FC<SendNotificationViewProps> = ({ showToast }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
    const [sendMode, setSendMode] = useState<'bulk' | 'single'>('bulk');
    const [userId, setUserId] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; role: string; phone: string }[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [linkView, setLinkView] = useState<NotificationView | ''>('');
    const [linkOrderNumber, setLinkOrderNumber] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            showToast('يرجى ملء جميع الحقول', 'error');
            return;
        }

        if (sendMode === 'single') {
            if (!userId.trim()) {
                showToast('يرجى إدخال رقم الهاتف', 'error');
                return;
            }
            if (!userId.startsWith('+963')) {
                showToast('يجب أن يبدأ رقم الهاتف بـ +963', 'error');
                return;
            }
        }

        setIsSending(true);
        try {
            // Build link object if linkView is specified
            const link = linkView ? {
                view: linkView,
                params: linkOrderNumber ? { orderNumber: linkOrderNumber } : {}
            } : undefined;

            if (sendMode === 'single') {
                await NotificationService.send(
                    userId.trim(),
                    title.trim(),
                    message.trim(),
                    'NEW_ANNOUNCEMENT_CUSTOMER', // Default type or make selectable if needed
                    link
                );
            } else {
                await NotificationService.sendBulk({
                    title: title.trim(),
                    message: message.trim(),
                    target_group: targetGroup,
                    type: 'NEW_ANNOUNCEMENT_CUSTOMER',
                    link
                });
            }

            showToast('✅ تم إرسال الإشعار بنجاح!', 'success');

            // Reset form
            setTitle('');
            setMessage('');
            setTargetGroup('all');
            setUserId('');
            setLinkView('');
            setLinkOrderNumber('');
        } catch (error: any) {
            console.error('Failed to send notification:', error);
            showToast(error.response?.data?.message || 'فشل إرسال الإشعار', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const targetGroups: { value: TargetGroup; label: string; icon: string }[] = [
        { value: 'all', label: 'جميع المستخدمين', icon: 'Users' },
        { value: 'customers', label: 'العملاء فقط', icon: 'User' },
        { value: 'providers', label: 'المزودين فقط', icon: 'Package' },
        { value: 'technicians', label: 'الفنيين فقط', icon: 'Wrench' },
        { value: 'tow_providers', label: 'السطحات فقط', icon: 'Truck' },
        { value: 'car_providers', label: 'معارض السيارات', icon: 'Car' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Send" className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إرسال إشعارات</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">أرسل إشعارات مخصصة لمجموعات المستخدمين أو مستخدم محدد</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Send Mode Selection */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                            <Button
                                type="button"
                                onClick={() => setSendMode('bulk')}
                                variant="ghost"
                                className={cn(
                                    "rounded-md text-sm font-medium transition-all hover:bg-transparent",
                                    sendMode === 'bulk'
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                )}
                            >
                                إرسال لمجموعة
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setSendMode('single')}
                                variant="ghost"
                                className={cn(
                                    "rounded-md text-sm font-medium transition-all hover:bg-transparent",
                                    sendMode === 'single'
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                )}
                            >
                                إرسال لمستخدم محدد
                            </Button>
                        </div>

                        {/* Target Selection */}
                        {sendMode === 'bulk' ? (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    <Icon name="Target" className="w-4 h-4 inline ml-1" />
                                    المستهدفون
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {targetGroups.map((group) => (
                                        <div
                                            key={group.value}
                                            onClick={() => setTargetGroup(group.value)}
                                            className={cn(
                                                "cursor-pointer flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                                                targetGroup === group.value
                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                targetGroup === group.value
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            )}>
                                                <Icon name={group.icon as any} className="w-4 h-4" />
                                            </div>
                                            <span className={cn(
                                                "text-sm font-medium",
                                                targetGroup === group.value
                                                    ? 'text-primary'
                                                    : 'text-slate-700 dark:text-slate-300'
                                            )}>
                                                {group.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="relative space-y-2">
                                <label htmlFor="userId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    <Icon name="User" className="w-4 h-4 inline ml-1" />
                                    ابحث عن المستخدم (الاسم أو رقم الهاتف)
                                </label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        id="userId"
                                        value={userId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setUserId(val);
                                            // Simple debounce for search
                                            if (val.length >= 2) {
                                                NotificationService.searchUsers(val).then(results => {
                                                    setSearchResults(results);
                                                    setShowResults(true);
                                                }).catch(() => {
                                                    setSearchResults([]);
                                                });
                                            } else {
                                                setSearchResults([]);
                                                setShowResults(false);
                                            }
                                        }}
                                        onFocus={() => userId.length >= 2 && setShowResults(true)}
                                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                                        dir="auto"
                                        autoComplete="off"
                                    />
                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                                            {searchResults.map((user) => (
                                                <button
                                                    key={`${user.role}-${user.id}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setUserId(user.phone);
                                                        setShowResults(false);
                                                    }}
                                                    className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                                                >
                                                    <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between mt-1">
                                                        <span dir="ltr">{user.phone}</span>
                                                        <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-xs capitalize">{user.role}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {userId && userId.startsWith('+963') ? '✅ تنسيق الرقم صحيح' : '⚠️ اختر مستخدماً من القائمة أو أدخل رقماً يبدأ بـ +963'}
                                </p>
                            </div>
                        )}

                        {/* Title Input */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <Icon name="Type" className="w-4 h-4 inline ml-1" />
                                عنوان الإشعار
                            </label>
                            <Input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="مثال: إعلان هام"
                                maxLength={100}
                            />
                            <p className="text-xs text-slate-400 mt-1">{title.length}/100 حرف</p>
                        </div>

                        {/* Message Input */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <Icon name="MessageSquare" className="w-4 h-4 inline ml-1" />
                                نص الرسالة
                            </label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="اكتب رسالتك هنا..."
                                rows={5}
                                className="resize-none"
                                maxLength={500}
                            />
                            <p className="text-xs text-slate-400 mt-1">{message.length}/500 حرف</p>
                        </div>

                        {/* Link Section (Optional) */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                <Icon name="Link" className="w-4 h-4 inline ml-1" />
                                رابط الإشعار (اختياري)
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="linkView" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                        الصفحة المستهدفة
                                    </label>
                                    <select
                                        id="linkView"
                                        value={linkView}
                                        onChange={(e) => setLinkView(e.target.value as NotificationView | '')}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">لا يوجد رابط</option>
                                        <option value="myOrders">طلباتي</option>
                                        <option value="newOrder">طلب جديد</option>
                                        <option value="announcements">الإعلانات</option>
                                        <option value="store">المتجر</option>
                                        <option value="technicianDirectory">دليل الفنيين</option>
                                        <option value="towTruckDirectory">دليل السطحات</option>
                                        <option value="blog">المدونة</option>
                                        <option value="faq">الأسئلة الشائعة</option>
                                        <option value="contact">اتصل بنا</option>
                                    </select>
                                </div>
                                {linkView === 'myOrders' && (
                                    <div>
                                        <label htmlFor="linkOrderNumber" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                            رقم الطلب (اختياري)
                                        </label>
                                        <Input
                                            type="text"
                                            id="linkOrderNumber"
                                            value={linkOrderNumber}
                                            onChange={(e) => setLinkOrderNumber(e.target.value)}
                                            placeholder="مثال: ORD-12345"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            إذا تم تحديده، سيتم فتح الطلب مباشرة عند النقر على الإشعار
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        {(title || message) && (
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    <Icon name="Eye" className="w-4 h-4 inline ml-1" />
                                    معاينة الإشعار
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Icon name="Bell" className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-white">{title || 'عنوان الإشعار'}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{message || 'نص الرسالة'}</p>
                                            <p className="text-xs text-slate-400 mt-2">الآن</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isSending || !title.trim() || !message.trim() || (sendMode === 'single' && !userId.trim())}
                                isLoading={isSending}
                                className="flex-1"
                                icon="Send"
                            >
                                إرسال الإشعار
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 flex gap-3">
                    <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">ملاحظات مهمة:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                            <li>سيتم إرسال الإشعار فورًا للمستخدمين المحددين</li>
                            <li>لا يمكن التراجع عن الإرسال بعد الضغط على الزر</li>
                            <li>يظهر الإشعار في مركز الإشعارات لكل مستخدم</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SendNotificationView;
