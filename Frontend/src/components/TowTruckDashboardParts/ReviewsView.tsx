
import React, { useState, useMemo, useEffect } from 'react';
import { TowTruck, Review } from '../../types';
import EmptyState from '../EmptyState';
import Rating from '../Rating';
import { ViewHeader } from '../DashboardParts/Shared';
import Icon from '../Icon';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Modal from '../Modal';
import { Input } from '../ui/Input';
import { getEcho } from '../../lib/echo';

interface ReviewsViewProps {
    towTruck: TowTruck;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ReviewsView: React.FC<ReviewsViewProps> = ({ towTruck, showToast }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSavingReply, setIsSavingReply] = useState(false);
    const [moderatingId, setModeratingId] = useState<number | null>(null);
    const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
    const [moderationNotes, setModerationNotes] = useState('');
    const [showModerateModal, setShowModerateModal] = useState(false);
    const [moderateAction, setModerateAction] = useState<'approved' | 'rejected'>('approved');

    // Fetch reviews from API
    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/provider/reviews', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showToast('فشل تحميل التقييمات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Echo listener for new reviews
    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const providerId = towTruck.user_id;
        const channel = echo.private(`provider.${providerId}`);

        channel.listen('.review.submitted', (data: any) => {
            console.log('📝 New review submitted:', data);
            showToast(data.message || 'تقييم جديد', 'info');
            fetchReviews(); // Refresh reviews
        });

        return () => {
            echo.leave(`provider.${providerId}`);
        };
    }, [towTruck.user_id]);


    const filteredReviews = useMemo(() => {
        return reviews.filter(r => r.status === activeTab).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [reviews, activeTab]);

    const handleModerate = async (reviewId: number, status: 'approved' | 'rejected') => {
        setModeratingId(reviewId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/provider/reviews/${reviewId}/moderate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    moderation_notes: moderationNotes.trim() || undefined
                })
            });

            if (response.ok) {
                showToast(`تم ${status === 'approved' ? 'قبول' : 'رفض'} التقييم بنجاح`, 'success');
                await fetchReviews();
                setShowModerateModal(false);
                setModerationNotes('');
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

    const handleAddResponseClick = (review: Review) => {
        setReplyingTo(review.id);
        setReplyText(review.provider_response || '');
    };

    const handleCancelResponse = () => {
        setReplyingTo(null);
        setReplyText('');
    };

    const handleSaveResponse = async (reviewId: number) => {
        if (!replyText.trim()) {
            showToast('الرجاء كتابة رد.', 'error');
            return;
        }
        setIsSavingReply(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/provider/reviews/${reviewId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider_response: replyText.trim()
                })
            });

            if (response.ok) {
                showToast('تم حفظ ردك بنجاح.', 'success');
                await fetchReviews();
                handleCancelResponse();
            } else {
                const error = await response.json();
                showToast(error.message || 'فشل حفظ الرد', 'error');
            }
        } catch (error) {
            console.error('Error saving response:', error);
            showToast('حدث خطأ أثناء حفظ الرد', 'error');
        } finally {
            setIsSavingReply(false);
        }
    };

    const openModerateModal = (reviewId: number, action: 'approved' | 'rejected') => {
        setSelectedReviewId(reviewId);
        setModerateAction(action);
        setShowModerateModal(true);
    };

    const TabButton: React.FC<{ tab: 'pending' | 'approved' | 'rejected', label: string, count: number }> = ({ tab, label, count }) => (
        <Button
            variant="ghost"
            onClick={() => setActiveTab(tab)}
            className={`rounded-none border-b-2 px-4 py-2 h-auto text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab
                ? 'border-primary text-primary dark:text-primary-400 bg-primary/5'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
        >
            {label} {count > 0 && <Badge variant={activeTab === tab ? "default" : "secondary"} className="ml-1">{count}</Badge>}
        </Button>
    );

    const pendingCount = reviews.filter(r => r.status === 'pending').length;
    const approvedCount = reviews.filter(r => r.status === 'approved').length;
    const rejectedCount = reviews.filter(r => r.status === 'rejected').length;

    return (
        <div className="p-4 sm:p-6">
            <ViewHeader title="التقييمات" subtitle="راجع التقييمات واقبلها أو ارفضها وقم بالرد عليها." />

            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
                <TabButton tab="pending" label="قيد المراجعة" count={pendingCount} />
                <TabButton tab="approved" label="المقبولة" count={approvedCount} />
                <TabButton tab="rejected" label="المرفوضة" count={rejectedCount} />
            </div>

            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-slate-500">جاري التحميل...</p>
                </div>
            ) : filteredReviews.length > 0 ? (
                <div className="space-y-4">
                    {filteredReviews.map(review => (
                        <Card key={review.id} className="p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{review.customer_name}</p>
                                    <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleString('ar-SY')}</p>
                                    <div className="mt-1"><Rating rating={review.rating} readOnly size="sm" /></div>
                                </div>
                                {activeTab === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openModerateModal(review.id, 'approved')}
                                            disabled={moderatingId === review.id}
                                            variant="success"
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Icon name="Check" className="w-4 h-4" />
                                            قبول
                                        </Button>
                                        <Button
                                            onClick={() => openModerateModal(review.id, 'rejected')}
                                            disabled={moderatingId === review.id}
                                            variant="danger"
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Icon name="X" className="w-4 h-4" />
                                            رفض
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-darkbg p-2 rounded-md border border-slate-100 dark:border-slate-800">"{review.comment}"</p>

                            {review.moderation_notes && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs border border-yellow-100 dark:border-yellow-800/30">
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">ملاحظات المراجعة:</p>
                                    <p className="text-yellow-700 dark:text-yellow-300">{review.moderation_notes}</p>
                                </div>
                            )}

                            {activeTab === 'approved' && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    {review.provider_response ? (
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ردك:</h5>
                                            <blockquote className="text-sm italic text-slate-700 dark:text-slate-300 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-md border-r-2 border-primary">
                                                {review.provider_response}
                                            </blockquote>
                                        </div>
                                    ) : (
                                        replyingTo === review.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                    placeholder="اكتب ردك هنا..."
                                                ></textarea>
                                                <div className="flex gap-2 justify-end">
                                                    <Button onClick={handleCancelResponse} variant="ghost" size="sm">إلغاء</Button>
                                                    <Button onClick={() => handleSaveResponse(review.id)} disabled={isSavingReply} size="sm">
                                                        {isSavingReply ? 'جاري الحفظ...' : 'حفظ الرد'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button onClick={() => handleAddResponseClick(review)} variant="link" size="sm" className="p-0 h-auto gap-1">
                                                <Icon name="Reply" className="w-4 h-4" />
                                                إضافة رد
                                            </Button>
                                        )
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState message={`لا توجد تقييمات ${activeTab === 'pending' ? 'جديدة' : activeTab === 'approved' ? 'مقبولة' : 'مرفوضة'}.`} />
            )}

            {/* Moderation Modal */}
            {showModerateModal && (
                <Modal
                    title={`${moderateAction === 'approved' ? 'قبول' : 'رفض'} التقييم`}
                    onClose={() => setShowModerateModal(false)}
                    size="md"
                    footer={
                        <div className="flex gap-2 justify-end">
                            <Button onClick={() => setShowModerateModal(false)} variant="ghost">إلغاء</Button>
                            <Button
                                onClick={() => handleModerate(selectedReviewId!, moderateAction)}
                                disabled={moderatingId !== null}
                                variant={moderateAction === 'approved' ? 'success' : 'danger'}
                            >
                                {moderatingId === selectedReviewId ? 'جاري المعالجة...' : (moderateAction === 'approved' ? 'قبول' : 'رفض')}
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {moderateAction === 'approved' ? 'سيظهر هذا التقييم في ملفك الشخصي العام.' : 'لن يظهر هذا التقييم في ملفك الشخصي.'}
                        </p>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">ملاحظات (اختياري):</label>
                            <textarea
                                value={moderationNotes}
                                onChange={e => setModerationNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                placeholder="أضف ملاحظات إن وجدت..."
                            ></textarea>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ReviewsView;