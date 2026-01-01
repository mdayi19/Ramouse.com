
import React, { useState, useMemo, useEffect } from 'react';
import { Review } from '../../types';
import { ViewHeader } from './Shared';
import Icon from '../Icon';
import Rating from '../Rating';
import EmptyState from '../EmptyState';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import Modal from '../Modal';

interface ReviewsManagementViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ReviewsManagementView: React.FC<ReviewsManagementViewProps> = ({ showToast }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeType, setActiveType] = useState<'technician' | 'tow_truck'>('technician');
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [moderatingId, setModeratingId] = useState<number | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/admin/reviews', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // Handle pagination if present, otherwise set data directly
                setReviews(data.data || data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showToast('فشل تحميل التقييمات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReviews = useMemo(() => {
        return reviews
            .filter(r => {
                // Normalize backend class path to simple type
                const type = r.reviewable_type.includes('Technician') ? 'technician' :
                    r.reviewable_type.includes('TowTruck') ? 'tow_truck' : r.reviewable_type;
                return type === activeType;
            })
            .filter(r => r.status === statusFilter)
            .filter(r =>
                r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.comment.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [reviews, activeType, statusFilter, searchTerm]);

    const handleModerate = async (reviewId: number, status: 'approved' | 'rejected') => {
        setModeratingId(reviewId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                showToast(`تم ${status === 'approved' ? 'قبول' : 'رفض'} التقييم بنجاح`, 'success');
                await fetchReviews();
            } else {
                const error = await response.json();
                showToast(error.message || 'فشل تحديث حالة التقييم', 'error');
            }
        } catch (error) {
            console.error('Error moderating review:', error);
            showToast('حدث خطأ أثناء تحديث حالة التقييم', 'error');
        } finally {
            setModeratingId(null);
        }
    };

    const handleEdit = (review: Review) => {
        setEditingReview(review);
        setEditComment(review.comment);
        setEditRating(review.rating);
    };

    const handleCancelEdit = () => {
        setEditingReview(null);
        setEditComment('');
        setEditRating(5);
    };

    const handleSaveEdit = async () => {
        if (!editingReview) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/reviews/${editingReview.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: editRating,
                    comment: editComment.trim()
                })
            });

            if (response.ok) {
                showToast('تم تحديث التقييم بنجاح', 'success');
                await fetchReviews();
                handleCancelEdit();
            } else {
                const error = await response.json();
                showToast(error.message || 'فشل تحديث التقييم', 'error');
            }
        } catch (error) {
            console.error('Error updating review:', error);
            showToast('حدث خطأ أثناء تحديث التقييم', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (reviewId: number) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا التقييم نهائياً؟')) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast('تم حذف التقييم بنجاح', 'success');
                await fetchReviews();
            } else {
                const error = await response.json();
                showToast(error.message || 'فشل حذف التقييم', 'error');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast('حدث خطأ أثناء حذف التقييم', 'error');
        }
    };

    const stats = useMemo(() => {
        const techReviews = reviews.filter(r => r.reviewable_type === 'technician' || r.reviewable_type.includes('Technician'));
        const truckReviews = reviews.filter(r => r.reviewable_type === 'tow_truck' || r.reviewable_type.includes('TowTruck'));

        return {
            technician: {
                total: techReviews.length,
                pending: techReviews.filter(r => r.status === 'pending').length,
                approved: techReviews.filter(r => r.status === 'approved').length,
                rejected: techReviews.filter(r => r.status === 'rejected').length
            },
            tow_truck: {
                total: truckReviews.length,
                pending: truckReviews.filter(r => r.status === 'pending').length,
                approved: truckReviews.filter(r => r.status === 'approved').length,
                rejected: truckReviews.filter(r => r.status === 'rejected').length
            }
        };
    }, [reviews]);

    const currentStats = stats[activeType];

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة التقييمات" subtitle="مراجعة وإدارة جميع التقييمات في النظام." />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-slate-50 dark:bg-slate-800 border-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">الإجمالي</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{currentStats.total}</p>
                </Card>
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">قيد المراجعة</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{currentStats.pending}</p>
                </Card>
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">المقبولة</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{currentStats.approved}</p>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">المرفوضة</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{currentStats.rejected}</p>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <Button
                        onClick={() => setActiveType('technician')}
                        variant={activeType === 'technician' ? 'primary' : 'ghost'}
                        size="sm"
                        className={activeType === 'technician' ? 'shadow-sm' : 'text-slate-500'}
                    >
                        الفنيين
                    </Button>
                    <Button
                        onClick={() => setActiveType('tow_truck')}
                        variant={activeType === 'tow_truck' ? 'primary' : 'ghost'}
                        size="sm"
                        className={activeType === 'tow_truck' ? 'shadow-sm' : 'text-slate-500'}
                    >
                        السطحات
                    </Button>
                </div>

                <div className="flex gap-2 items-center">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="p-2.5 border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="pending">قيد المراجعة</option>
                        <option value="approved">المقبولة</option>
                        <option value="rejected">المرفوضة</option>
                    </select>
                    <div className="w-48">
                        <Input
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            startIcon={<Icon name="Search" className="text-slate-400" size={16} />}
                            className="bg-white dark:bg-slate-900"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-slate-500">جاري التحميل...</p>
                </div>
            ) : filteredReviews.length > 0 ? (
                <div className="space-y-4">
                    {filteredReviews.map(review => (
                        <Card key={review.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{review.customer_name}</span>
                                        <span className="text-xs text-slate-500">•</span>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            ID: {review.user_id}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{new Date(review.created_at).toLocaleString('ar-SY')}</div>
                                </div>
                                <Rating rating={review.rating} readOnly size="sm" />
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-darkcard p-3 rounded-lg border dark:border-slate-600 italic mb-3">
                                "{review.comment}"
                            </p>

                            {review.provider_response && (
                                <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">رد المزود:</p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 italic">"{review.provider_response}"</p>
                                </div>
                            )}

                            {review.moderation_notes && (
                                <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-xs">
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">ملاحظات:</p>
                                    <p className="text-yellow-700 dark:text-yellow-300">{review.moderation_notes}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                                <span className="text-xs text-slate-500">
                                    Ref ID: {review.reviewable_id}
                                </span>
                                <div className="flex gap-2">
                                    {statusFilter === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => handleModerate(review.id, 'approved')}
                                                disabled={moderatingId === review.id}
                                                variant="success"
                                                size="sm"
                                                isLoading={moderatingId === review.id}
                                            >
                                                <Icon name="Check" className="w-3 h-3 mr-1" /> قبول
                                            </Button>
                                            <Button
                                                onClick={() => handleModerate(review.id, 'rejected')}
                                                disabled={moderatingId === review.id}
                                                variant="danger"
                                                size="sm"
                                                isLoading={moderatingId === review.id}
                                            >
                                                <Icon name="X" className="w-3 h-3 mr-1" /> رفض
                                            </Button>
                                        </>
                                    )}
                                    {statusFilter !== 'pending' && (
                                        <Button
                                            onClick={() => handleModerate(review.id, statusFilter === 'approved' ? 'rejected' : 'approved')}
                                            disabled={moderatingId === review.id}
                                            variant="ghost"
                                            size="sm"
                                            isLoading={moderatingId === review.id}
                                        >
                                            {statusFilter === 'approved' ? 'رفض' : 'إعادة القبول'}
                                        </Button>
                                    )}
                                    <Button onClick={() => handleEdit(review)} variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700">
                                        <Icon name="Edit" className="w-4 h-4" />
                                    </Button>
                                    <Button onClick={() => handleDelete(review.id)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                                        <Icon name="Trash2" className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState message="لا توجد تقييمات تطابق معايير البحث." />
            )}

            {/* Edit Modal */}
            {editingReview && (
                <Modal
                    title="تعديل التقييم"
                    onClose={handleCancelEdit}
                    size="md"
                    footer={
                        <>
                            <Button onClick={handleCancelEdit} variant="ghost">إلغاء</Button>
                            <Button onClick={handleSaveEdit} isLoading={isSaving} disabled={isSaving}>
                                حفظ
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">التقييم:</label>
                            <Rating rating={editRating} onRating={setEditRating} />
                        </div>

                        <div>
                            <Textarea
                                label="التعليق:"
                                value={editComment}
                                onChange={e => setEditComment(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </Card>
    );
};

export default ReviewsManagementView;