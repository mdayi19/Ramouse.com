import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader, LayoutList, BarChart3, Star, Download, Printer, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarListingWizard } from '../CarListingWizard';
import UserSponsorListingModal from './UserSponsorListingModal';
import UserPrintableSaleCar from './UserPrintableSaleCar';
import UserPrintableRentCar from './UserPrintableRentCar';
import { MyCarListingsList } from './MyCarListingsList';
import { MyCarListingsAnalytics } from './MyCarListingsAnalytics';
import { MyCarListingsSponsorship } from './MyCarListingsSponsorship';

interface MyCarListingsViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    userRole: 'customer' | 'technician' | 'tow_truck';
    userPhone?: string;
    currentUser?: any;
    settings?: any;
}

import { Listing, Stats } from './types';

type Tab = 'listings' | 'analytics' | 'sponsorship';

export const MyCarListingsView: React.FC<MyCarListingsViewProps> = ({ showToast, userRole, userPhone = '', currentUser, settings }) => {

    // Construct pseudo-provider for print
    const userProvider: any = useMemo(() => ({
        id: currentUser?.id || 0,
        name: currentUser?.name || 'مستخدم',
        phone: currentUser?.phone || currentUser?.id || userPhone,
        city: currentUser?.city || '',
        address: currentUser?.address || '',
        socials: { whatsapp: currentUser?.phone || currentUser?.id || userPhone },
        logo: currentUser?.avatar,
        listing_count: 0,
        view_count: 0,
        is_verified: currentUser?.is_verified || false,
        created_at: '',
        updated_at: ''
    }), [currentUser, userPhone]);

    const [activeTab, setActiveTab] = useState<Tab>('listings');
    const [listings, setListings] = useState<Listing[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);

    // Sponsor State
    const [sponsorModal, setSponsorModal] = useState<{ isOpen: boolean; listing: any | null }>({ isOpen: false, listing: null });

    // Print/PDF State
    const [printListing, setPrintListing] = useState<Listing | null>(null);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isReadyForPrint, setIsReadyForPrint] = useState(false);
    const printableRef = useRef<HTMLDivElement>(null);

    // Determine API prefix based on user role
    const apiPrefix = useMemo(() => {
        return userRole === 'customer' ? '/customer'
            : userRole === 'technician' ? '/technician'
                : userRole === 'tow_truck' ? '/tow-truck'
                    : '/customer';
    }, [userRole]);

    useEffect(() => {
        loadData();
    }, [apiPrefix]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, listingsData] = await Promise.all([
                CarProviderService.getUserListingStats(apiPrefix),
                CarProviderService.getUserListings(apiPrefix)
            ]);

            setStats(statsData.stats);
            setListings(Array.isArray(listingsData.listings) ? listingsData.listings : []);
        } catch (error: any) {
            console.error('Failed to load data:', error);
            showToast(error.message || 'فشل تحميل البيانات', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (listingId: number) => {
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return;

        try {
            // Optimistic update
            setListings(prev => prev.map(l =>
                l.id === listingId ? { ...l, is_hidden: !l.is_hidden } : l
            ));

            await CarProviderService.toggleUserListingVisibility(apiPrefix, listingId);
            showToast(listing.is_hidden ? 'تم إظهار الإعلان' : 'تم إخفاء الإعلان', 'success');
        } catch (error) {
            // Revert on failure
            showToast('فشل تحديث حالة الإعلان', 'error');
            loadData();
        }
    };

    const handleDeleteListing = async (listingId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;

        try {
            await CarProviderService.deleteUserListing(apiPrefix, listingId);
            showToast('تم حذف الإعلان', 'success');
            setListings(prev => prev.filter(l => l.id !== listingId));
            if (stats) {
                setStats({ ...stats, total_listings: stats.total_listings - 1, remaining_listings: stats.remaining_listings + 1 });
            }
        } catch (error) {
            showToast('فشل حذف الإعلان', 'error');
        }
    };

    const handleEditListing = (listing: any) => {
        setEditingListing(listing);
        setShowWizard(true);
    };

    // Print Handlers
    const handlePrintClick = (listing: Listing) => {
        setPrintListing(listing);
        setIsReadyForPrint(false);
        setShowPrintPreview(true);
    };

    const handleConfirmPrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        if (!printableRef.current || !isReadyForPrint || !printListing) return;

        setIsGeneratingPdf(true);
        showToast('جارٍ إنشاء ملف PDF...', 'info');

        try {
            // @ts-ignore
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default;

            if (!html2pdf) throw new Error("html2pdf library not found");

            const element = printableRef.current;
            const opt = {
                margin: 0,
                filename: `listing-${printListing.id}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(element).save();
            setIsGeneratingPdf(false);
            showToast('تم تحميل الملف بنجاح', 'success');
        } catch (err) {
            console.error("PDF generation failed:", err);
            showToast('فشل إنشاء ملف PDF.', 'error');
            setIsGeneratingPdf(false);
        }
    };

    const handleUnsponsor = async (listingId: number) => {
        if (!confirm('هل أنت متأكد من إلغاء رعاية هذا الإعلان؟')) return;

        try {
            await CarProviderService.unsponsorUserListing(apiPrefix, listingId);
            showToast('تم إلغاء الرعاية بنجاح', 'success');
            loadData();
        } catch (error) {
            showToast('فشل إلغاء الرعاية', 'error');
        }
    };

    const computedStats = useMemo(() => {
        return {
            total: listings.length,
            active: listings.filter(l => !l.is_hidden).length,
            views: listings.reduce((acc, l) => acc + (l.views_count || 0), 0),
            sale: listings.filter(l => l.listing_type !== 'rent').length,
            rent: listings.filter(l => l.listing_type === 'rent').length
        };
    }, [listings]);

    return (
        <>
            <div className="space-y-6 p-4 md:p-1">
                {/* Tabs Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-fit">
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'listings'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            <LayoutList className="w-4 h-4" />
                            الإعلانات
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            الإحصائيات
                        </button>
                        <button
                            onClick={() => setActiveTab('sponsorship')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sponsorship'
                                ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            <Star className="w-4 h-4" />
                            الرعاية والتمييز
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700 font-medium disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">تحديث البيانات</span>
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'listings' && (
                        <MyCarListingsList
                            key="listings"
                            listings={listings}
                            loading={loading}
                            apiPrefix={apiPrefix}
                            onRefresh={loadData}
                            onEdit={handleEditListing}
                            onDelete={handleDeleteListing}
                            onPrint={handlePrintClick}
                            onSponsor={(listing) => setSponsorModal({ isOpen: true, listing })}
                            onUnsponsor={handleUnsponsor}
                            onToggleVisibility={handleToggleVisibility}
                            setShowWizard={setShowWizard}
                            showToast={showToast}
                            stats={stats}
                        />
                    )}
                    {activeTab === 'analytics' && (
                        <MyCarListingsAnalytics
                            key="analytics"
                            stats={stats}
                            computedStats={computedStats}
                            loading={loading}
                            listings={listings}
                        />
                    )}
                    {activeTab === 'sponsorship' && (
                        <MyCarListingsSponsorship
                            key="sponsorship"
                            listings={listings}
                            walletBalance={stats?.wallet_balance || 0}
                            loading={loading}
                            onUnsponsor={handleUnsponsor}
                            apiPrefix={apiPrefix}
                            onNavigateToTab={setActiveTab}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showWizard && (
                    <CarListingWizard
                        onClose={() => {
                            setShowWizard(false);
                            setEditingListing(null);
                        }}
                        onSuccess={() => {
                            setShowWizard(false);
                            setEditingListing(null);
                            loadData();
                        }}
                        showToast={showToast}
                        apiPrefix={apiPrefix}
                        editingListing={editingListing}
                        onlySale={false}
                    />
                )}

                {sponsorModal.isOpen && sponsorModal.listing && (
                    <UserSponsorListingModal
                        listing={sponsorModal.listing}
                        walletBalance={stats?.wallet_balance || 0}
                        onClose={() => setSponsorModal({ isOpen: false, listing: null })}
                        onSuccess={() => {
                            loadData(); // To refresh listing status and wallet balance
                            setSponsorModal({ isOpen: false, listing: null });
                        }}
                        showToast={showToast}
                        apiPrefix={apiPrefix}
                    />
                )}

                {showPrintPreview && printListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center z-[100] p-4 print:p-0 print:bg-white"
                        onClick={() => setShowPrintPreview(false)}
                    >
                        <style>{`
                            @media print {
                                @page { size: A4 portrait; margin: 0; }
                                html, body { height: auto !important; width: 210mm !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                                body * { visibility: hidden; }
                                .printable-area, .printable-area * { visibility: visible; }
                                .printable-area { position: absolute; top: 0; left: 0 !important; width: 210mm !important; min-height: 297mm !important; height: auto !important; margin: 0; padding: 0; background: white; z-index: 99999; }
                                .printable-area > div { transform: none !important; width: 100% !important; }
                                .print-hidden { display: none !important; }
                            }
                        `}</style>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[210mm] flex flex-col gap-0 max-h-full"
                        >
                            <div className="w-full bg-white dark:bg-slate-800 p-4 rounded-t-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4 print-hidden z-50 border-b border-gray-100 dark:border-gray-700">
                                <div className="text-center sm:text-right">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                        {printListing.listing_type === 'rent' ? 'معاينة العرض (إيجار)' : 'معاينة العرض (بيع)'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">جاهز للطباعة بحجم A4</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-center bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl">
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isGeneratingPdf || !isReadyForPrint}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                                    >
                                        {isGeneratingPdf ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>
                                    <button
                                        onClick={handleConfirmPrint}
                                        disabled={!isReadyForPrint}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>طباعة</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPrintPreview(false)}
                                    className="absolute top-2 right-2 sm:static w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="printable-area w-full flex-grow overflow-y-auto bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm p-4 sm:p-8 rounded-b-2xl shadow-inner custom-scrollbar flex justify-center sticky-scrollbar">
                                <div className="relative shadow-2xl bg-white transition-all duration-300 origin-top transform scale-[0.45] mb-[-120%] xs:scale-[0.55] xs:mb-[-100%] sm:scale-[0.7] sm:mb-[-60%] md:scale-[0.85] md:mb-[-30%] lg:scale-100 lg:mb-0 w-[210mm] h-[297mm] flex-shrink-0">
                                    {printListing.listing_type === 'rent' ? (
                                        <UserPrintableRentCar
                                            ref={printableRef}
                                            listing={printListing}
                                            provider={userProvider}
                                            settings={settings}
                                            onReady={() => setIsReadyForPrint(true)}
                                        />
                                    ) : (
                                        <UserPrintableSaleCar
                                            ref={printableRef}
                                            listing={printListing}
                                            provider={userProvider}
                                            settings={settings}
                                            onReady={() => setIsReadyForPrint(true)}
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
