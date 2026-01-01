import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { NotificationService } from '../services/notification.service';
import EmptyState from './EmptyState';
import Icon from './Icon';

interface NotificationCenterProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onNavigate: (view: any, params: any) => void;
    onBack: () => void;
    onDeleteNotification: (id: string) => void;
    onClearAllNotifications: () => void;
}

const PriceTagIcon = () => <Icon name="Banknote" className="w-6 h-6" />;
const TruckIcon = () => <Icon name="towtruck" className="w-10 h-10 text-white" />;
const CheckCircleIcon = () => <Icon name="CheckCircle" className="w-6 h-6" />;
const ClipboardListIcon = () => <Icon name="ClipboardList" className="w-6 h-6" />;
const InfoIcon = () => <Icon name="Info" className="w-6 h-6" />;
const BellIcon = () => <Icon name="Bell" className="w-16 h-16 mx-auto text-gray-400" />;


const getIconForNotification = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('عرض سعر')) return <PriceTagIcon />;
    if (lowerTitle.includes('شحن') || lowerTitle.includes('توصيل')) return <TruckIcon />;
    if (lowerTitle.includes('اكتمل') || lowerTitle.includes('مكتمل') || lowerTitle.includes('تم توصيل') || lowerTitle.includes('توثيق') || lowerTitle.includes('موافقة')) return <CheckCircleIcon />;
    if (lowerTitle.includes('طلب جديد')) return <ClipboardListIcon />;
    return <InfoIcon />;
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    setNotifications,
    onNavigate,
    onBack,
    onDeleteNotification,
    onClearAllNotifications
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Calculate pagination
    const totalPages = Math.ceil(notifications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentNotifications = notifications.slice(startIndex, endIndex);

    // Reset to page 1 if current page is out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [notifications.length, currentPage, totalPages]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read when clicked
        if (!notification.read) {
            try {
                await NotificationService.markAsRead(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        if (notification.link) {
            onNavigate(notification.link.view, notification.link.params);
        }
    };

    const handleDelete = (id: string) => {
        onDeleteNotification(id);
    };

    const handleClearAll = () => {
        onClearAllNotifications();
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="p-4 sm:p-8 bg-white dark:bg-darkcard rounded-xl shadow-lg animate-fade-in w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b-2 border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-2xl font-bold text-primary dark:text-primary-400">مركز الإشعارات</h3>
                <div className="flex items-center gap-4">
                    <button
                        onClick={async () => {
                            try {
                                const success = await NotificationService.subscribeToPush();
                                if (success) alert('تم تفعيل الإشعارات بنجاح!');
                            } catch (e) {
                                alert('فشل تفعيل الإشعارات. يرجى التأكد من إعدادات المتصفح.');
                            }
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        تفعيل التنبيهات
                    </button>
                    {notifications.length > 0 && (
                        <button onClick={handleClearAll} className="text-sm font-medium text-red-600 hover:underline">
                            مسح الكل
                        </button>
                    )}
                    <button onClick={onBack} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm">
                        &larr; العودة
                    </button>
                </div>
            </div>

            {notifications.length > 0 ? (
                <>
                    <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {currentNotifications.map(notif => (
                            <li key={notif.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 ${notif.link ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-darkbg' : ''} ${!notif.read ? 'border-primary/50 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${!notif.read ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-primary'}`}>
                                    {getIconForNotification(notif.title)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{notif.title}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{notif.message}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {new Date(notif.timestamp).toLocaleString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                                    className="flex-shrink-0 text-slate-400 hover:text-red-500 rounded-full p-1 text-xl font-bold"
                                    aria-label="Delete notification"
                                >
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                عرض {startIndex + 1} -  {Math.min(endIndex, notifications.length)} من {notifications.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-primary-600'
                                        }`}
                                >
                                    السابق
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let page;
                                        if (totalPages <= 5) {
                                            page = i + 1;
                                        } else if (currentPage <= 3) {
                                            page = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            page = totalPages - 4 + i;
                                        } else {
                                            page = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-primary-600'
                                        }`}
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <EmptyState
                    icon={<BellIcon />}
                    title="لا توجد إشعارات."
                    message="عندما يحدث شيء جديد، ستجد إشعارًا هنا."
                />
            )}
        </div>
    );
};

export default NotificationCenter;