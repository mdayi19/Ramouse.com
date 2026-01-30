
import React, { useState, useMemo, useEffect } from 'react';
import { Review } from '../../types';
import { ViewHeader, Icon } from './Shared';
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center shadow-lg">
                        <Icon name="Star" className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <ViewHeader title="⭐ إدارة التقييمات" subtitle="مراجعة وإدارة جميع التقييمات في النظام." />
                    </div>
                </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-none shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
                            <Icon name="Package" className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">الإجمالي</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{currentStats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Icon name="Clock" className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">قيد المراجعة</p>
                            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{currentStats.pending}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-green-200 dark:border-green-800 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Icon name="CheckCircle" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">المقبولة</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{currentStats.approved}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/30 border-red-200 dark:border-red-800 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <Icon name="XCircle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium">المرفوضة</p>
                            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{currentStats.rejected}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <Button
                            onClick={() => setActiveType('technician')}
                            variant={activeType === 'technician' ? 'primary' : 'ghost'}
                            size="sm"
                            className={activeType === 'technician' ? 'shadow-sm' : 'text-slate-500'}
                        >
                            <Icon name="Wrench" className="w-4 h-4 ml-1.5" />
                            الفنيين
                        </Button>
                        <Button
                            onClick={() => setActiveType('tow_truck')}
                            variant={activeType === 'tow_truck' ? 'primary' : 'ghost'}
                            size="sm"
                            className={activeType === 'tow_truck' ? 'shadow-sm' : 'text-slate-500'}
                        >
                            <Icon name="Truck" className="w-4 h-4 ml-1.5" />
                            السطحات
                        </Button>
                    </div>

                    <div className="flex gap-2 items-center">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                                className="bg-slate-50 dark:bg-slate-900"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Reviews List */}
            {isLoading ? (
                <Card className="p-12 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700"></div>
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary absolute top-0"></div>
                        </div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">جاري التحميل...</p>
                    </div>
                </Card>
            ) : filteredReviews.length > 0 ? (
                <div className="space-y-4">
                    {filteredReviews.map((review, index) => (
                        <Card
                            key={review.id}
                            className="group backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{review.customer_name}</span>
                                            <span className="text-xs text-slate-500">•</span>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                ID: {review.user_id}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Icon name="Calendar" className="w-3.5 h-3.5" />
                                            {new Date(review.created_at).toLocaleString('ar-SY')}
                                        </div>
                                    </div>
                                    <Rating rating={review.rating} readOnly size="sm" />
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-3 italic">
                                    "{review.comment}"
                                </p>

                                {review.provider_response && (
                                    <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                            <Icon name="MessageSquare" className="w-3.5 h-3.5" />
                                            رد المزود:
                                        </p>
                                        <p className="text-sm text-blue-800 dark:text-blue-200 italic">"{review.provider_response}"</p>
                                    </div>
                                )}

                                {review.moderation_notes && (
                                    <div className="mb-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                                            <Icon name="AlertCircle" className="w-3.5 h-3.5" />
                                            ملاحظات:
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{review.moderation_notes}</p>
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
                                                    <Icon name="Check" className="w-3 h-3 ml-1" /> قبول
                                                </Button>
                                                <Button
                                                    onClick={() => handleModerate(review.id, 'rejected')}
                                                    disabled={moderatingId === review.id}
                                                    variant="danger"
                                                    size="sm"
                                                    isLoading={moderatingId === review.id}
                                                >
                                                    <Icon name="X" className="w-3 h-3 ml-1" /> رفض
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
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6 shadow-inner">
                            <Icon name="Star" className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">لا توجد تقييمات</h3>
                        <p className="text-slate-500 dark:text-slate-400">لا توجد تقييمات تطابق معايير البحث</p>
                    </div>
                </Card>
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
        </div>
    );
};

export default ReviewsManagementView;