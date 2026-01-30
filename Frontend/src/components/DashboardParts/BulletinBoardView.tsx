import React, { useState, useEffect } from 'react';
import { AnnouncementPost, ApiResponse } from '../../types';
import { api } from '../../lib/api';
import ImageUpload from '../ImageUpload';
import { ViewHeader, DeleteIcon, Icon } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

// Helper to get full image URL
const getImageUrl = (imageUrl?: string): string | undefined => {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
    const API_URL = (import.meta as any).env.VITE_API_URL || '/api';
    const baseUrl = API_URL.endsWith('/api') ? API_URL.replace('/api', '') : API_URL;
    return baseUrl + imageUrl;
};

interface BulletinBoardViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const BulletinBoardView: React.FC<BulletinBoardViewProps> = ({ showToast }) => {
    const [announcements, setAnnouncements] = useState<AnnouncementPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<'all' | 'customers' | 'providers' | 'technicians' | 'tow_trucks'>('all');
    const [image, setImage] = useState<File[]>([]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse<AnnouncementPost[]>>('/announcements');
            if (response.data.success && response.data.data) {
                setAnnouncements(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
            showToast('فشل في تحميل الإعلانات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            let imageUrl: string | undefined = undefined;

            if (image.length > 0) {
                const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
                imageUrl = await toBase64(image[0]);
            }

            const response = await api.post<ApiResponse<AnnouncementPost>>('/admin/announcements', {
                title,
                message,
                target,
                image_url: imageUrl
            });

            if (response.data.data) {
                showToast('تم نشر الإعلان بنجاح', 'success');
                setTitle('');
                setMessage('');
                setTarget('all');
                setImage([]);
                await fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error creating announcement:', error);
            showToast('فشل في نشر الإعلان', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

        try {
            await api.delete(`/admin/announcements/${id}`);
            showToast('تم حذف الإعلان بنجاح', 'success');
            await fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            showToast('فشل في حذف الإعلان', 'error');
        }
    };

    const targetGroups = [
        { value: 'all', label: 'الكل', icon: 'Users', color: 'from-blue-500 to-indigo-500' },
        { value: 'customers', label: 'الزبائن', icon: 'User', color: 'from-emerald-500 to-teal-500' },
        { value: 'providers', label: 'المزودون', icon: 'Package', color: 'from-purple-500 to-pink-500' },
        { value: 'technicians', label: 'الفنيون', icon: 'Wrench', color: 'from-amber-500 to-orange-500' },
        { value: 'tow_trucks', label: 'السطحات', icon: 'Truck', color: 'from-rose-500 to-red-500' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-lg">
                        <Icon name="Megaphone" className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <ViewHeader title="📣 لوحة الإعلانات" subtitle="نشر إعلانات لجميع المستخدمين أو فئات محددة." />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Form */}
                <Card className="lg:col-span-1 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-primary to-blue-500 p-5 rounded-t-xl">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Icon name="Plus" className="w-5 h-5" />
                            نشر إعلان جديد
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <Input
                            label="العنوان"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            disabled={submitting}
                            className="bg-slate-50 dark:bg-slate-900/50"
                            placeholder="مثال: عرض خاص لفترة محدودة"
                        />
                        <Textarea
                            label="الرسالة"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={5}
                            required
                            disabled={submitting}
                            className="bg-slate-50 dark:bg-slate-900/50"
                            placeholder="اكتب تفاصيل الإعلان..."
                        />
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <Icon name="Image" className="w-4 h-4 inline ml-1" />
                                صورة (اختياري)
                            </label>
                            <ImageUpload files={image} setFiles={setImage} maxFiles={1} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                <Icon name="Target" className="w-4 h-4 inline ml-1" />
                                الجمهور المستهدف
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {targetGroups.map((group) => (
                                    <button
                                        key={group.value}
                                        type="button"
                                        onClick={() => setTarget(group.value as any)}
                                        disabled={submitting}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300
                                            ${target === group.value
                                                ? 'border-primary bg-primary/10 shadow-md'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center
                                            ${target === group.value
                                                ? `bg-gradient-to-br ${group.color} text-white`
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }
                                        `}>
                                            <Icon name={group.icon as any} className="w-4 h-4" />
                                        </div>
                                        <span className={`text-sm font-medium ${target === group.value ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {group.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full shadow-lg shadow-primary/20"
                            disabled={submitting}
                            isLoading={submitting}
                        >
                            {submitting ? 'جاري النشر...' : (
                                <>
                                    <Icon name="Send" className="w-4 h-4 ml-2" />
                                    نشر الإعلان
                                </>
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Announcements List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Icon name="List" className="w-5 h-5 text-primary" />
                                الإعلانات الحالية
                            </h3>
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                {announcements.length} إعلان
                            </Badge>
                        </div>
                    </Card>

                    {loading ? (
                        <Card className="p-12 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700"></div>
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary absolute top-0"></div>
                                </div>
                                <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">جاري التحميل...</p>
                            </div>
                        </Card>
                    ) : announcements.length === 0 ? (
                        <Card className="p-12 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mb-6 shadow-inner">
                                    <Icon name="Megaphone" className="w-12 h-12 text-amber-500 dark:text-amber-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">لا توجد إعلانات</h3>
                                <p className="text-slate-500 dark:text-slate-400">ابدأ بنشر إعلانك الأول للمستخدمين</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 custom-scrollbar">
                            {announcements.map((post, index) => {
                                const targetGroup = targetGroups.find(g => g.value === post.target) || targetGroups[0];
                                return (
                                    <Card
                                        key={post.id}
                                        className="group relative backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="p-5">
                                            <Button
                                                onClick={() => handleDelete(post.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-3 left-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="حذف الإعلان"
                                            >
                                                <DeleteIcon className="w-4 h-4" />
                                            </Button>

                                            <div className="flex items-start gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${targetGroup.color} text-white flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                    <Icon name={targetGroup.icon as any} className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">{post.title}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <Icon name="Calendar" className="w-3.5 h-3.5" />
                                                        {new Date(post.timestamp).toLocaleString('ar-SY')}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl whitespace-pre-wrap mb-3">
                                                {post.message}
                                            </p>

                                            {post.imageUrl && (
                                                <img
                                                    src={getImageUrl(post.imageUrl)}
                                                    alt=""
                                                    className="rounded-xl max-h-48 w-auto border-2 border-slate-200 dark:border-slate-700 shadow-md"
                                                />
                                            )}

                                            <div className="mt-4 flex justify-end">
                                                <Badge
                                                    variant="secondary"
                                                    className={`bg-gradient-to-r ${targetGroup.color} bg-opacity-20 text-white border-none`}
                                                >
                                                    <Icon name={targetGroup.icon as any} className="w-3.5 h-3.5 ml-1.5" />
                                                    {targetGroup.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulletinBoardView;