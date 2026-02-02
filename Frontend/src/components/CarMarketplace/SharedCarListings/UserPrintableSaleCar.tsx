import React, {
    useEffect,
    useRef,
    forwardRef,
    useMemo,
    useCallback,
    useState,
} from 'react';
import { CarProvider, Settings } from '../../../types';
import Icon from '../../Icon';
import { toCanvas } from 'qrcode';
import { getStorageUrl } from '../../../config/api';
import { urlToBase64 } from '../../../utils/helpers';

/* ---------------------------------- */
/* User Printable Sale Car Component  */
/* ---------------------------------- */
interface UserPrintableSaleCarProps {
    listing: any;
    provider: any; // This is actually the user data passed as "provider" structure
    settings: Settings;
    onReady?: () => void;
}

const UserPrintableSaleCar = forwardRef<
    HTMLDivElement,
    UserPrintableSaleCarProps
>(({
    listing,
    provider,
    settings,
    onReady
}, ref) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const readyCalledRef = useRef(false);
    const [logoBase64, setLogoBase64] = useState<string>('');

    // Pre-load logo as base64 for PDF generation
    useEffect(() => {
        const loadLogo = async () => {
            const logoPath = provider.logo || provider.profile_photo;
            if (logoPath) {
                const url = getStorageUrl(logoPath);
                const base64 = await urlToBase64(url);
                if (base64) setLogoBase64(base64);
            }
        };
        loadLogo();
    }, [provider.logo, provider.profile_photo]);

    /* -------- Listing URL -------- */
    const listingUrl = useMemo(() => {
        const baseUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : `https://${settings.mainDomain}`;

        // Construct listing public URL
        return `${baseUrl}/car-listings/${listing.slug}`;
    }, [listing.id, listing.slug, settings.mainDomain]);

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
                    @page { 
                        size: A4 portrait;
                        margin: 0;
                    }
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    #printable-sale-car {
                        width: 210mm !important;
                        height: 297mm !important;
                        max-height: 297mm !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
            <div
                ref={ref}
                id="printable-sale-car"
                className="relative w-[210mm] h-[297mm] mx-auto bg-white p-[10mm] flex flex-col justify-between font-sans text-gray-800 box-border"
            >
                {/* Header - Sticky on Print */}
                <header className="border-b-4 border-blue-600 pb-4 mb-4 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <img
                            src={logoBase64 || (provider.logo ? getStorageUrl(provider.logo) : (provider.profile_photo ? getStorageUrl(provider.profile_photo) : "/logo without name.svg"))}
                            alt="Logo"
                            className="h-16 w-16 object-contain rounded-full bg-white"
                            crossOrigin="anonymous"
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

                    {/* Big Red Heading */}
                    <div className="flex items-center">
                        <h2 className="text-5xl font-black text-red-600 tracking-tight">
                            سيارة للبيع
                        </h2>
                    </div>
                </header>

                {/* Main Content - Dynamic Flow */}
                <main className="flex-1 flex flex-col items-center justify-start gap-4 overflow-hidden">

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
                                <div className="flex items-center gap-2 text-slate-400 font-bold">
                                    <Icon name="Maximize" className="w-4 h-4" />
                                    <span className="text-sm">امسح الكود للتفاصيل</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Specs Grid */}
                    <div className="w-full max-w-2xl grid grid-cols-3 gap-3 mt-4">
                        {(() => {
                            const getTransmissionAr = (val: string) => {
                                if (!val) return null;
                                const v = val.toLowerCase();
                                if (v.includes('auto')) return 'أوتوماتيك';
                                if (v.includes('manual') || v.includes('normal')) return 'عادي';
                                return val;
                            };
                            const getFuelAr = (val: string) => {
                                if (!val) return null;
                                const v = val.toLowerCase();
                                if (v.includes('petrol') || v.includes('gasoline') || v.includes('gas')) return 'بنزين';
                                if (v.includes('diesel')) return 'ديزل';
                                if (v.includes('electric') || v.includes('ev')) return 'كهرباء';
                                if (v.includes('hybrid')) return 'هايبرد';
                                return val;
                            };

                            const specs = [
                                { label: 'ناقل الحركة', value: getTransmissionAr(listing.transmission), icon: 'Settings' },
                                { label: 'الوقود', value: getFuelAr(listing.fuel_type), icon: 'Droplet' },
                                { label: 'المسافة المقطوعة', value: listing.mileage ? `${Number(listing.mileage).toLocaleString()} كم` : null, icon: 'Gauge' },
                            ].filter(item => item.value);

                            return specs.map((spec, index) => (
                                <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col items-center text-center gap-1.5">
                                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
                                        <Icon name={spec.icon as any} className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400">{spec.label}</span>
                                        <span className="text-base font-black text-slate-800">{spec.value}</span>
                                    </div>
                                </div>
                            ));
                        })()}
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
                                                // Try to add space after country code (assumed 2-3 chars if starts with +)
                                                // Simple heuristic: just space every 2 or 3 chars for readability
                                                // Or if it looks like +XX..., keep +XX then space
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

                {/* Footer - Sticky on Print */}
                <footer className="pt-4 mt-4 border-t-4 border-blue-600 flex items-center justify-between shrink-0">
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

export default UserPrintableSaleCar;
