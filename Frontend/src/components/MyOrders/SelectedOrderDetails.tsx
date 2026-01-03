import React, { useState, useMemo, useCallback } from 'react';
import { Order, Quote, Settings, Provider } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import Icon from '../Icon';
import { StatusBadge } from '../DashboardParts/Shared';
import VisualOrderTimeline from '../VisualOrderTimeline';
import QuoteGrid from './QuoteGrid';
import EmptyState from '../EmptyState';
import { getStorageUrl } from '../../config/api';

const SelectedOrderDetails: React.FC<{
    order: Order;
    onBack: () => void;
    providers: Provider[];
    onAcceptOffer: (quote: Quote) => void;
    settings: Settings;
    onOpenReuploadModal: (order: Order) => void;
}> = ({ order, onBack, providers, onAcceptOffer, settings, onOpenReuploadModal }) => {
    const { formData, quotes, status, acceptedQuote } = order;
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

    const mediaUrls = useMemo(() => {
        const result: { video?: string; voiceNote?: string; images: string[] } = { images: [] };

        if (formData) {
            if (formData.images && Array.isArray(formData.images)) {
                result.images = formData.images.map((path: string) => getStorageUrl(path)).filter(url => !!url);
            }
            if (formData.video) {
                result.video = getStorageUrl(formData.video);
            }
            if (formData.voiceNote || formData.voice_note) {
                result.voiceNote = getStorageUrl(formData.voiceNote || formData.voice_note || '');
            }
        }

        return result;
    }, [formData]);

    const toggleDetails = useCallback(() => setDetailsExpanded(prev => !prev), []);

    const renderDetail = useCallback((label: string, value?: string | string[] | number) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return null;
        const displayValue = Array.isArray(value) ? value.join('، ') : value;
        return (
            <div className="py-2.5 grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-gray-800 last:border-0 items-center">
                <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100 col-span-2 break-words text-left dir-ltr">{displayValue}</dd>
            </div>
        );
    }, []);

    const quoteStats = useMemo(() => {
        if (!quotes || quotes.length === 0) return null;
        const prices = quotes.map(q => q.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        return { minPrice, maxPrice, avgPrice, count: quotes.length };
    }, [quotes]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-gray-50 dark:from-darkcard dark:to-slate-900 w-full h-full overflow-y-auto custom-scrollbar">
            {/* Mobile Back Button - Compact */}
            <div className="md:hidden pb-4 sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-darkcard/80 -mx-4 px-4 pt-2 border-b border-gray-100 dark:border-slate-800/50 mb-4 transition-all">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Icon name="ArrowRight" className="w-4 h-4" />
                    </div>
                    <span>العودة للقائمة</span>
                </button>
            </div>

            {/* Premium Order Header - Compact Mobile */}
            <div className="mb-6 relative">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6">
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                                <Icon name="Package" className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                    <h3 className="font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight truncate">
                                        {formData.brand} {formData.model}
                                    </h3>
                                    <div className="flex-shrink-0 self-start sm:self-auto">
                                        <StatusBadge status={order.status} size="sm" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-bold text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Icon name="Calendar" className="w-3.5 h-3.5" />
                                        {new Date(order.date).toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                        <Icon name="Hash" className="w-3 h-3" />
                                        {order.orderNumber}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Container - Optimized */}
                    <div className="w-full lg:w-[450px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-2 py-4 sm:p-5 rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-sm">
                        <VisualOrderTimeline order={order} />
                    </div>
                </div>
            </div>

            {/* Rejection Warning - Compact */}
            {order.rejectionReason && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-sm animate-pulse-slow">
                    <div className="flex gap-3">
                        <Icon name="AlertCircle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h5 className="font-bold text-red-800 dark:text-red-300 text-sm mb-1">تم رفض إيصال الدفع</h5>
                            <p className="text-xs text-red-600 dark:text-red-400 mb-3 leading-relaxed">
                                <span className="font-bold">السبب:</span> {order.rejectionReason}
                            </p>
                            <Button
                                onClick={() => onOpenReuploadModal(order)}
                                variant="danger"
                                size="sm"
                                className="w-full sm:w-auto text-xs"
                                leftIcon={<Icon name="Upload" className="w-3.5 h-3.5" />}
                            >
                                إعادة رفع إيصال الدفع
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quotes Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-gray-800 dark:text-gray-200">
                            العروض المستلمة
                        </h4>
                        <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-bold px-2 py-0.5 rounded-full">
                            {quotes?.length || 0}
                        </span>
                    </div>
                    {/* Only show stats if useful and space allows */}
                    {quoteStats && (
                        <div className="hidden sm:flex gap-3 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1"><Icon name="TrendingDown" className="w-3 h-3 text-green-500" /> ${quoteStats.minPrice}</span>
                            <span className="flex items-center gap-1"><Icon name="TrendingUp" className="w-3 h-3 text-red-500" /> ${quoteStats.maxPrice}</span>
                        </div>
                    )}
                </div>

                {quotes && quotes.length > 0 ? (
                    <QuoteGrid
                        orderNumber={order.orderNumber}
                        quotes={quotes}
                        providers={providers}
                        onAcceptOffer={onAcceptOffer}
                        status={status}
                        acceptedQuote={acceptedQuote}
                        settings={settings}
                        city={formData.city}
                    />
                ) : (
                    <div className="bg-slate-50 dark:bg-darkcard/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                        <EmptyState
                            title=""
                            message="لم تستلم أي عروض لهذا الطلب بعد. سيتم إعلامك عند وصول أول عرض."
                            icon="Clock"
                        />
                    </div>
                )}
            </div>

            {/* Collapsible Details Section - Optimized */}
            <Card className="shadow-sm border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-darkcard">
                <button
                    onClick={toggleDetails}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary-600 transition-colors">
                            <Icon name="FileText" className="w-4 h-4" />
                        </div>
                        <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                            تفاصيل الطلب
                        </h4>
                    </div>
                    <Icon
                        name="ChevronDown"
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${detailsExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {detailsExpanded && (
                    <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/20 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Vehicle Info */}
                            <div>
                                <h5 className="font-bold text-xs text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                    <Icon name="Car" className="w-3.5 h-3.5" />
                                    السيارة
                                </h5>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <dl className="space-y-0">
                                        {renderDetail('فئة السيارة', formData.category)}
                                        {renderDetail('الشركة', formData.brandManual || formData.brand_manual || formData.brand)}
                                        {renderDetail('الموديل', formData.model)}
                                        {renderDetail('سنة الصنع', formData.year)}
                                        {renderDetail('رقم الهيكل (VIN)', formData.vin)}
                                    </dl>
                                </div>
                            </div>

                            {/* Part Info */}
                            <div>
                                <h5 className="font-bold text-xs text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                    <Icon name="Package" className="w-3.5 h-3.5" />
                                    القطعة
                                </h5>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm mb-4">
                                    <dl className="space-y-0">
                                        {renderDetail('أنواع القطع', formData.partTypes || formData.part_types)}
                                        {renderDetail('وصف القطعة', formData.partDescription || formData.part_description)}
                                    </dl>
                                </div>

                                {/* Media Attachments */}
                                {(mediaUrls.video || mediaUrls.voiceNote) && (
                                    <div className="space-y-3">
                                        {mediaUrls.video && (
                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                                                    <Icon name="Video" className="w-3.5 h-3.5" />
                                                    <span>فيديو توضيحي</span>
                                                </div>
                                                <video src={mediaUrls.video} controls className="w-full rounded-lg bg-black" />
                                            </div>
                                        )}
                                        {mediaUrls.voiceNote && (
                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                                                    <Icon name="Mic" className="w-3.5 h-3.5" />
                                                    <span>ملاحظة صوتية</span>
                                                </div>
                                                <audio src={mediaUrls.voiceNote} controls className="w-full h-8" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Images Gallery */}
                        {mediaUrls.images.length > 0 && (
                            <div className="mt-6">
                                <h5 className="font-bold text-xs text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                    <Icon name="Image" className="w-3.5 h-3.5" />
                                    الصور المرفقة
                                </h5>
                                <div className="flex overflow-x-auto pb-4 gap-3 snap-x">
                                    {mediaUrls.images.map((imgSrc, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setImageModalUrl(imgSrc)}
                                            className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-xl border-2 border-white dark:border-slate-700 shadow-sm snap-start transition-all hover:scale-105"
                                        >
                                            <img
                                                src={imgSrc}
                                                alt={`Part image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Image Modal */}
            {imageModalUrl && (
                <div
                    className="fixed inset-0 bg-black/95 flex items-center justify-center z-[70] p-4 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setImageModalUrl(null)}
                >
                    <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
                        <img
                            src={imageModalUrl}
                            alt="Full view"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()} // Allow clicking image without closing
                        />
                        <button
                            onClick={() => setImageModalUrl(null)}
                            className="absolute top-4 right-4 sm:-top-2 sm:-right-2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                        >
                            <Icon name="X" className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectedOrderDetails;
