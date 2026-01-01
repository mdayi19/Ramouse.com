import React from 'react';
import { Notification } from '../types';
import Icon from './Icon';
import type { icons } from 'lucide-react';

interface NotificationDropdownProps {
    notifications: Notification[];
    onClose: () => void;
    onViewAll: () => void;
    onClearAll: () => void;
    onDelete: (id: string) => void;
    onNavigate: (view: any, params: any) => void;
}

const getIconInfo = (title: string): { iconName: keyof typeof icons, bgClass: string, textClass: string } => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('عرض سعر') || lowerTitle.includes('فوز')) return { iconName: "Tag", bgClass: 'bg-blue-100 dark:bg-blue-900/50', textClass: 'text-blue-600 dark:text-blue-300' };
    if (lowerTitle.includes('شحن') || lowerTitle.includes('توصيل')) return { iconName: "Truck", bgClass: 'bg-indigo-100 dark:bg-indigo-900/50', textClass: 'text-indigo-600 dark:text-indigo-300' };
    if (lowerTitle.includes('اكتمل') || lowerTitle.includes('مكتمل') || lowerTitle.includes('تم توصيل') || lowerTitle.includes('توثيق') || lowerTitle.includes('موافقة')) return { iconName: "CheckCircle", bgClass: 'bg-green-100 dark:bg-green-900/50', textClass: 'text-green-600 dark:text-green-300' };
    if (lowerTitle.includes('طلب جديد')) return { iconName: "ClipboardList", bgClass: 'bg-amber-100 dark:bg-amber-900/50', textClass: 'text-amber-600 dark:text-amber-300' };
    if (lowerTitle.includes('رفض') || lowerTitle.includes('إلغاء') || lowerTitle.includes('خسارة')) return { iconName: "XCircle", bgClass: 'bg-red-100 dark:bg-red-900/50', textClass: 'text-red-600 dark:text-red-300' };
    if (lowerTitle.includes('سحب') || lowerTitle.includes('إيداع') || lowerTitle.includes('رصيد')) return { iconName: "Wallet", bgClass: 'bg-emerald-100 dark:bg-emerald-900/50', textClass: 'text-emerald-600 dark:text-emerald-300' };

    return { iconName: "Bell", bgClass: 'bg-primary/10 dark:bg-primary-900/50', textClass: 'text-primary dark:text-primary-300' };
};

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
    interval = seconds / 2592000;
    if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
    interval = seconds / 86400;
    if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
    interval = seconds / 3600;
    if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
    interval = seconds / 60;
    if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
    return 'الآن';
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onViewAll, onClearAll, onDelete, onNavigate }) => {
    const handleViewAllClick = () => {
        onViewAll();
        onClose();
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.link) {
            onNavigate(notification.link.view, notification.link.params);
            onClose();
        }
    };

    return (
        <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:top-full md:-right-0 md:mt-2 md:w-96 max-w-[95vw] md:max-w-none bg-white dark:bg-darkcard rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[100] animate-modal-in flex flex-col overflow-hidden transform origin-top md:origin-top-right">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Icon name="Bell" className="w-4 h-4 text-primary" />
                    الإشعارات
                </h4>
                {notifications.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); onClearAll(); }} className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        مسح الكل
                    </button>
                )}
            </div>

            {notifications.length > 0 ? (
                <ul className="flex-grow overflow-y-auto max-h-[60vh] divide-y divide-slate-100 dark:divide-slate-700/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {notifications.slice(0, 8).map((notif) => {
                        const iconInfo = getIconInfo(notif.title);
                        return (
                            <li key={notif.id} className={`relative group transition-colors duration-200 ${notif.link ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''} ${!notif.read ? 'bg-primary-50/40 dark:bg-primary-900/10' : 'bg-white dark:bg-darkcard'}`} onClick={() => handleNotificationClick(notif)}>
                                <div className="flex items-start gap-3 p-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${iconInfo.bgClass} ${iconInfo.textClass}`}>
                                        <Icon name={iconInfo.iconName} className="w-5 h-5" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`text-sm truncate pr-4 ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>{notif.title}</p>
                                            {!notif.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>}
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{timeSince(notif.timestamp)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                                    className="absolute top-3 left-3 p-1.5 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    title="حذف الإشعار"
                                >
                                    <Icon name="X" className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                        <Icon name="BellOff" className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="font-medium">لا توجد إشعارات جديدة</p>
                    <p className="text-xs text-slate-400 max-w-[150px]">سنخبرك عند وصول تحديثات مهمة حول طلباتك.</p>
                </div>
            )}

            <div className="p-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <button onClick={handleViewAllClick} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary dark:text-primary-400 hover:bg-white dark:hover:bg-slate-700 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                    <span>عرض مركز الإشعارات</span>
                    <Icon name="ArrowLeft" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
