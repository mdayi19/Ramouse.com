import React, { useState, useEffect } from 'react';
import { AnnouncementPost, ApiResponse } from '../../types';
import { api } from '../../lib/api';
import ImageUpload from '../ImageUpload';
import { ViewHeader } from './Shared';
import { DeleteIcon } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

// Helper to get full image URL
const getImageUrl = (imageUrl?: string): string | undefined => {
    if (!imageUrl) return undefined;
    // If it's already a full URL or base64, return as is
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
    // If it's a storage path, prepend the backend URL
    const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = API_URL.replace('/api', '');
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
                await fetchAnnouncements(); // Refresh the list
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
            await fetchAnnouncements(); // Refresh the list
        } catch (error) {
            console.error('Error deleting announcement:', error);
            showToast('فشل في حذف الإعلان', 'error');
        }
    };

    return (
        <Card className="p-6">
            <ViewHeader title="لوحة الإعلانات" subtitle="نشر إعلانات لجميع المستخدمين أو فئات محددة." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-1">
                    <h3 className="text-lg font-semibold lg:mb-4">نشر إعلان جديد</h3>
                    <Input
                        label="العنوان"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        disabled={submitting}
                    />
                    <Textarea
                        label="الرسالة"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={5}
                        required
                        disabled={submitting}
                    />
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">صورة (اختياري)</label>
                        <ImageUpload files={image} setFiles={setImage} maxFiles={1} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الجمهور المستهدف</label>
                        <select
                            value={target}
                            onChange={e => setTarget(e.target.value as any)}
                            className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            disabled={submitting}
                        >
                            <option value="all">الكل</option>
                            <option value="customers">الزبائن فقط</option>
                            <option value="providers">المزودون فقط</option>
                            <option value="technicians">الفنيون فقط</option>
                            <option value="tow_trucks">السطحات فقط</option>
                        </select>
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={submitting}
                        isLoading={submitting}
                    >
                        {submitting ? 'جاري النشر...' : 'نشر'}
                    </Button>
                </form>
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold lg:mb-4">الإعلانات الحالية</h3>
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            لا توجد إعلانات حالياً
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {announcements.map(post => (
                                <Card key={post.id} className="p-4 relative hover:shadow-md transition-shadow">
                                    <Button
                                        onClick={() => handleDelete(post.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 left-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-8 h-8"
                                        title="حذف الإعلان"
                                    >
                                        <DeleteIcon className="w-5 h-5" />
                                    </Button>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 pr-0">{post.title}</p>
                                    <p className="text-xs text-slate-500 mb-3">{new Date(post.timestamp).toLocaleString('ar-SY')}</p>
                                    <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg whitespace-pre-wrap">{post.message}</p>
                                    {post.imageUrl && <img src={getImageUrl(post.imageUrl)} alt="" className="mt-3 rounded-xl max-h-40 border border-slate-200 dark:border-slate-700" />}
                                    <div className="mt-3 flex justify-end">
                                        <Badge variant="secondary">
                                            {post.target === 'all' ? 'عام' :
                                                post.target === 'customers' ? 'للزبائن' :
                                                    post.target === 'providers' ? 'للمزودين' :
                                                        post.target === 'technicians' ? 'للفنيين' : 'للسطحات'}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default BulletinBoardView;