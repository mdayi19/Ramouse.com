import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, LayoutList, BarChart3, Star, Download, Printer, X, RefreshCw } from 'lucide-react';
import { useSimplePrint } from '../../../hooks/usePrint';
import { motion, AnimatePresence } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarListingWizard } from '../CarListingWizard';
import UserSponsorListingModal from './UserSponsorListingModal';
import UserPrintableSaleCar from './UserPrintableSaleCar';
import UserPrintableRentCar from './UserPrintableRentCar';
import { MyCarListingsList } from './MyCarListingsList';
import { MyCarListingsAnalytics } from './MyCarListingsAnalytics';
import { MyCarListingsSponsorship } from './MyCarListingsSponsorship';
import { PrintPreviewModal } from '../../shared/PrintPreviewModal';

interface MyCarListingsViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    userRole: 'customer' | 'technician' | 'tow_truck' | 'car_provider';
    userPhone?: string;
    currentUser?: any;
    settings?: any;
}

import { Listing, Stats } from './types';

type Tab = 'listings' | 'analytics' | 'sponsorship';

export const MyCarListingsView: React.FC<MyCarListingsViewProps> = ({ showToast, userRole, userPhone = '', currentUser, settings }) => {
    const navigate = useNavigate();

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
                    : '/car-provider'; // Default for car provider orfallback
    }, [userRole]);

    useEffect(() => {
        loadData();
    }, [apiPrefix]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, listingsData] = await Promise.all([
                CarProviderService.getUserListingStats(apiPrefix),
                CarProviderService.getUserListings(apiPrefix, { _t: Date.now() })
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

    const handleOptimisticUpdate = (id: number, data: any) => {
        setListings(prev => prev.map(l => {
            if (l.id !== id) return l;

            const updated = { ...l, ...data };

            // Ensure rental_terms is synced if it exists
            const isRent = l.listing_type?.toLowerCase() === 'rent';
            if (isRent && l.rental_terms && typeof l.rental_terms === 'object' && !Array.isArray(l.rental_terms)) {
                updated.rental_terms = {
                    ...l.rental_terms,
                    ...(data.daily_rate !== undefined && { daily_rate: data.daily_rate }),
                    ...(data.weekly_rate !== undefined && { weekly_rate: data.weekly_rate }),
                    ...(data.monthly_rate !== undefined && { monthly_rate: data.monthly_rate })
                };
            }
            return updated;
        }));
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
            loadData();
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
            loadData();
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

    const handleConfirmPrint = useSimplePrint();

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

    const handleAddFunds = () => {
        // Navigate to the appropriate wallet page based on role
        if (userRole === 'technician') {
            navigate('/technician/wallet');
        } else if (userRole === 'tow_truck') {
            navigate('/tow-truck-dashboard/wallet');
        } else if (userRole === 'customer') {
            navigate('/dashboard/wallet');
        } else {
            // Default for car provider or others
            navigate('/car-provider-dashboard/wallet');
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
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-3 relative">
                        <div className="flex items-center gap-1 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                            {(['listings', 'analytics', 'sponsorship'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap z-10 ${activeTab === tab
                                        ? 'text-blue-600 dark:text-blue-400 shadow-sm bg-white dark:bg-slate-700'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    {tab === 'listings' && <LayoutList className="w-4 h-4" />}
                                    {tab === 'analytics' && <BarChart3 className="w-4 h-4" />}
                                    {tab === 'sponsorship' && <Star className="w-4 h-4" />}
                                    <span>
                                        {tab === 'listings' && 'الإعلانات'}
                                        {tab === 'analytics' && 'الإحصائيات'}
                                        {tab === 'sponsorship' && 'الرعاية والتمييز'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Refresh Button - Mobile Optimized */}
                    <div className="flex justify-end md:hidden">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200/60 dark:border-slate-700/60 font-medium disabled:opacity-50 text-xs"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            تحديث البيانات
                        </button>
                    </div>

                    {/* Refresh Button - Desktop */}
                    <div className="hidden md:flex justify-end">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700 font-bold disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">تحديث البيانات</span>
                        </button>
                    </div>
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
                            onOptimisticUpdate={handleOptimisticUpdate}
                            userRole={userRole}
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
                            onAddFunds={handleAddFunds}
                            apiPrefix={apiPrefix}
                            onNavigateToTab={setActiveTab}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {
                    showWizard && (
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
                            onlySale={userRole !== 'car_provider'}
                        />
                    )
                }

                {
                    sponsorModal.isOpen && sponsorModal.listing && (
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
                    )
                }

                {
                    showPrintPreview && printListing && (
                        <PrintPreviewModal
                            title={printListing.listing_type === 'rent' ? 'معاينة العرض (إيجار)' : 'معاينة العرض (بيع)'}
                            onClose={() => setShowPrintPreview(false)}
                            onPrint={handleConfirmPrint}
                            onDownloadPdf={handleDownloadPdf}
                            isGeneratingPdf={isGeneratingPdf}
                            isReadyForPrint={isReadyForPrint}
                        >
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
                        </PrintPreviewModal>
                    )
                }
            </AnimatePresence >
        </>
    );
};
