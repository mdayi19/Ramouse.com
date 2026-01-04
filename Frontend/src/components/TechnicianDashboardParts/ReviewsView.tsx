
import React, { useState, useMemo, useEffect } from 'react';
import { Technician, Review } from '../../types';
import EmptyState from '../EmptyState';
import Rating from '../Rating';
import { ViewHeader } from '../DashboardParts/Shared';
import Icon from '../Icon';
import { getEcho } from '../../lib/echo';

interface ReviewsViewProps {
    technician: Technician;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ReviewsView: React.FC<ReviewsViewProps> = ({ technician, showToast }) => {
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

        const providerId = technician.user_id;
        const channel = echo.private(`provider.${providerId}`);

        channel.listen('.review.submitted', (data: any) => {
            console.log('📝 New review submitted:', data);
            showToast(data.message || 'تقييم جديد', 'info');
            fetchReviews(); // Refresh reviews
        });

        return () => {
            echo.leave(`provider.${providerId}`);
        };
    }, [technician.user_id, getEcho]); // ✅ Added getEcho dependency


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
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab
                ? 'border-b-2 border-primary text-primary dark:text-primary-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
        >
            {label} {count > 0 && <span className="ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">{count}</span>}
        </button>
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
                        <div key={review.id} className="p-4 bg-white dark:bg-darkcard rounded-lg border dark:border-slate-700 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{review.customer_name}</p>
                                    <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleString('ar-SY')}</p>
                                    <div className="mt-1"><Rating rating={review.rating} readOnly size="sm" /></div>
                                </div>
                                {activeTab === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModerateModal(review.id, 'approved')}
                                            disabled={moderatingId === review.id}
                                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:bg-slate-400"
                                        >
                                            <Icon name="Check" className="w-4 h-4" />
                                            قبول
                                        </button>
                                        <button
                                            onClick={() => openModerateModal(review.id, 'rejected')}
                                            disabled={moderatingId === review.id}
                                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:bg-slate-400"
                                        >
                                            <Icon name="X" className="w-4 h-4" />
                                            رفض
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-darkbg p-2 rounded-md">"{review.comment}"</p>

                            {review.moderation_notes && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
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
                                                    className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                                                    placeholder="اكتب ردك هنا..."
                                                ></textarea>
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={handleCancelResponse} className="text-xs font-semibold px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">إلغاء</button>
                                                    <button onClick={() => handleSaveResponse(review.id)} disabled={isSavingReply} className="text-xs font-semibold px-3 py-1 rounded-md bg-primary text-white hover:bg-primary-700 disabled:bg-slate-400">
                                                        {isSavingReply ? 'جاري الحفظ...' : 'حفظ الرد'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleAddResponseClick(review)} className="flex items-center gap-1 text-xs font-semibold text-primary dark:text-primary-400 hover:underline">
                                                <Icon name="Reply" className="w-4 h-4" />
                                                إضافة رد
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState message={`لا توجد تقييمات ${activeTab === 'pending' ? 'جديدة' : activeTab === 'approved' ? 'مقبولة' : 'مرفوضة'}.`} />
            )}

            {/* Moderation Modal */}
            {showModerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModerateModal(false)}>
                    <div className="bg-white dark:bg-darkcard p-6 rounded-xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">{moderateAction === 'approved' ? 'قبول' : 'رفض'} التقييم</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {moderateAction === 'approved' ? 'سيظهر هذا التقييم في ملفك الشخصي العام.' : 'لن يظهر هذا التقييم في ملفك الشخصي.'}
                        </p>
                        <label className="block text-sm font-medium mb-2">ملاحظات (اختياري):</label>
                        <textarea
                            value={moderationNotes}
                            onChange={e => setModerationNotes(e.target.value)}
                            rows={3}
                            className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 mb-4"
                            placeholder="أضف ملاحظات إن وجدت..."
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowModerateModal(false)} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300">إلغاء</button>
                            <button
                                onClick={() => handleModerate(selectedReviewId!, moderateAction)}
                                disabled={moderatingId !== null}
                                className={`px-4 py-2 rounded-md text-white ${moderateAction === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:bg-slate-400`}
                            >
                                {moderatingId === selectedReviewId ? 'جاري المعالجة...' : (moderateAction === 'approved' ? 'قبول' : 'رفض')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsView;