import React, {
    useEffect,
    useRef,
    forwardRef,
    useMemo,
    useCallback,
} from 'react';
import { CarProvider, Settings } from '../../../types';
import Icon from '../../Icon';
import { toCanvas } from 'qrcode';

/* ---------------------------------- */
/* User Printable Rent Car Component  */
/* ---------------------------------- */
interface UserPrintableRentCarProps {
    listing: any;
    provider: any; // This is actually the user data passed as "provider" structure
    settings: Settings;
    onReady?: () => void;
}

const UserPrintableRentCar = forwardRef<
    HTMLDivElement,
    UserPrintableRentCarProps
>(({
    listing,
    provider,
    settings,
    onReady
}, ref) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const readyCalledRef = useRef(false);

    /* -------- Listing URL -------- */
    const listingUrl = useMemo(() => {
        const baseUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : `https://${settings.mainDomain}`;

        // Construct listing public URL
        return `${baseUrl}/rent-car/${listing.slug}`;
    }, [listing.id, listing.slug, settings.mainDomain]);

    /* -------- Rates Logic -------- */
    const rates = useMemo(() => {
        let daily = Number(listing.daily_rate || 0);
        let weekly = Number(listing.weekly_rate || 0);
        let monthly = Number(listing.monthly_rate || 0);

        const terms = listing.rental_terms;
        if (terms && typeof terms === 'object' && !Array.isArray(terms)) {
            if (terms.daily_rate) daily = Number(terms.daily_rate);
            if (terms.weekly_rate) weekly = Number(terms.weekly_rate);
            if (terms.monthly_rate) monthly = Number(terms.monthly_rate);
        }
        return { daily, weekly, monthly };
    }, [listing]);

    /* -------- QR Generator -------- */
    const generateQrCode = useCallback(async () => {
        // Generate Listing QR
        if (listingUrl && qrCanvasRef.current) {
            try {
                await toCanvas(qrCanvasRef.current, listingUrl, {
                    width: 320,
                    margin: 1,
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF',
                    },
                });
            } catch (error) {
                console.error('Listing QR generation failed:', error);
            }
        }

        // Mark as ready only after QR is generated
        if (onReady && !readyCalledRef.current) {
            if (qrCanvasRef.current) {
                readyCalledRef.current = true;
                onReady();
            }
        }
    }, [listingUrl, onReady]);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);

    return (
        <>
            {/* Print-specific styles */}
            <style>{`
                @media print {
                    #printable-rent-car {
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                        break-inside: avoid-page !important;
                        display: block !important;
                        position: relative !important;
                        max-height: 297mm !important;
                        height: 297mm !important;
                        overflow: hidden !important;
                    }
                    @page { 
                        size: A4 portrait;
                        margin: 0;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        height: 297mm !important;
                    }
                }
            `}</style>
            <div
                ref={ref}
                id="printable-rent-car"
                className="relative w-[210mm] min-h-[297mm] max-h-[297mm] mx-auto bg-white p-[10mm] flex flex-col font-sans text-gray-800 box-border"
            >
                {/* Header - Fixed Position */}
                <header className="absolute top-[10mm] left-[10mm] right-[10mm] border-b-4 border-blue-600 pb-4 h-[30mm] flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo without name.svg"
                            alt="Logo"
                            className="h-16 w-16 object-contain"
                        />
                        <div>
                            <h1 className="text-2xl font-extrabold text-blue-800 leading-tight">
                                {settings.appName}
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                سوق السيارات المعتمد
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-blue-700 mb-1">
                            سيارة للإيجار
                        </h2>
                    </div>
                </header>

                {/* Main Content - Centered Absolute */}
                <main className="absolute top-[45mm] bottom-[35mm] left-[10mm] right-[10mm] flex flex-col items-center justify-start gap-4">

                    {/* Hero Title */}
                    <div className="text-center space-y-1 mt-4">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight">
                            {listing.title}
                        </h1>
                    </div>

                    {/* Main Visual: QR Code & Details Side-by-Side */}
                    <div className="flex flex-row items-center justify-center w-full gap-6 mt-6 px-4">

                        {/* Car Details (Right side in RTL) - As Cards */}
                        <div className="flex flex-col items-stretch gap-3 w-[240px]">
                            {/* Year Card */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-slate-400 mb-0.5">الموديل</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tight">
                                    {listing.year}
                                </span>
                            </div>

                            {/* Brand Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-blue-400 mb-0.5">الشركة المصنعة</span>
                                <span className="text-2xl font-black text-blue-700 leading-tight">
                                    {listing.brand?.name_ar || listing.brand?.name}
                                </span>
                            </div>

                            {/* Model Card */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-slate-400 mb-0.5">الطراز</span>
                                <span className="text-2xl font-black text-slate-800 leading-tight">
                                    {listing.model}
                                </span>
                            </div>
                        </div>

                        {/* QR Code (Left side in RTL) */}
                        <div className="relative group scale-95 origin-top">
                            <div className="absolute inset-0 bg-blue-100 rounded-[1.5rem] rotate-2 transform scale-105 opacity-50"></div>
                            <div className="relative bg-white p-4 rounded-[1.3rem] shadow-lg border border-slate-100 flex flex-col items-center gap-2">
                                <canvas ref={qrCanvasRef} className="w-[220px] h-[220px]" />
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Icon name="Maximize" className="w-4 h-4" />
                                    <span className="text-sm">امسح الكود للتفاصيل</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rates Section */}
                    <div className="w-full max-w-3xl grid grid-cols-3 gap-4 px-6 mt-4">
                        {rates.daily > 0 && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 flex flex-col items-center text-center">
                                <span className="text-blue-600 font-bold text-xs mb-1">الإيجار اليومي</span>
                                <span className="text-xl font-black text-slate-900 leading-none">
                                    {rates.daily.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1">ليرة / يوم</span>
                            </div>
                        )}
                        {rates.weekly > 0 && (
                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm">
                                <span className="text-slate-500 font-bold text-xs mb-1">أسبوعي</span>
                                <span className="text-lg font-black text-slate-800 leading-none">
                                    {rates.weekly.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1">ليرة / أسبوع</span>
                            </div>
                        )}
                        {rates.monthly > 0 && (
                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm">
                                <span className="text-slate-500 font-bold text-xs mb-1">شهري</span>
                                <span className="text-lg font-black text-slate-800 leading-none">
                                    {rates.monthly.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1">ليرة / شهر</span>
                            </div>
                        )}
                    </div>

                    {/* Contact Section */}
                    <div className="w-full max-w-xl mt-auto mb-2">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-1 shadow-md">
                            <div className="bg-white rounded-[1rem] px-6 py-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 font-bold text-base">للتواصل مع المالك</span>
                                    {/* Username Removed */}
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-3" dir="ltr">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter font-mono" dir="ltr">
                                            {(() => {
                                                // Format +90 531 962 48 26 or similar spacing
                                                let p = provider.phone || '';
                                                if (!p) return '';
                                                if (p.startsWith('+')) {
                                                    return p.replace(/(\+\d{2})(\d{3})(\d{3})(\d{2})?(\d{2})?/, '$1 $2 $3 $4 $5').trim();
                                                }
                                                return p.replace(/(\d{3})(\d{3})/, '$1 $2 ').trim();
                                            })()}
                                        </span>
                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Icon name="Phone" className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </main>

                {/* Footer - Fixed Bottom */}
                <footer className="absolute bottom-[10mm] left-[10mm] right-[10mm] pt-4 border-t-4 border-blue-600 h-[25mm] flex items-center justify-between">
                    <div className="flex items-center text-gray-800 gap-3">
                        <Icon name="Globe" className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-black text-gray-800" dir="ltr">
                            {settings.mainDomain || 'ramouse.com'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-800">
                        <span className="text-lg font-bold">للدعم الفني:</span>
                        <span dir="ltr" className="text-lg font-black text-blue-700 font-mono tracking-wider">
                            {settings.companyPhone}
                        </span>
                        <Icon name="Phone" className="w-5 h-5 text-blue-600" />
                    </div>
                </footer>
            </div>
        </>
    );
});

export default UserPrintableRentCar;
