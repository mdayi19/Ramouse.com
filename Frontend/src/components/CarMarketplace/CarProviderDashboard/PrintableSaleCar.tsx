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
import { getStorageUrl } from '../../../config/api';

/* ---------------------------------- */
/* Printable Sale Car Component       */
/* ---------------------------------- */
interface PrintableSaleCarProps {
    listing: any;
    provider: CarProvider;
    settings: Settings;
    onReady?: () => void;
}

const PrintableSaleCar = forwardRef<
    HTMLDivElement,
    PrintableSaleCarProps
>(({
    listing,
    provider,
    settings,
    onReady
}, ref) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const providerQrCanvasRef = useRef<HTMLCanvasElement>(null);
    const readyCalledRef = useRef(false);

    /* -------- Listing URL -------- */
    const listingUrl = useMemo(() => {
        const baseUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : `https://${settings.mainDomain}`;

        // Construct listing public URL
        return `${baseUrl}/car-listings/${listing.slug}`;
    }, [listing.id, listing.slug, settings.mainDomain]);

    /* -------- Provider Profile URL -------- */
    const providerUrl = useMemo(() => {
        const baseUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : `https://${settings.mainDomain}`;

        return `${baseUrl}/car-providers/${provider.id}`;
    }, [provider.id, settings.mainDomain]);

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

        // Generate Provider URL QR
        if (providerUrl && providerQrCanvasRef.current) {
            try {
                await toCanvas(providerQrCanvasRef.current, providerUrl, {
                    width: 200,
                    margin: 1,
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF',
                    },
                });
            } catch (error) {
                console.error('Provider QR generation failed:', error);
            }
        }

        // Mark as ready
        if (onReady && !readyCalledRef.current) {
            if (qrCanvasRef.current || providerQrCanvasRef.current) {
                readyCalledRef.current = true;
                onReady();
            }
        }
    }, [listingUrl, providerUrl, onReady]);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);

    return (
        <>
            {/* Print-specific styles */}
            <style>{`
                @media print {
                    #printable-sale-car {
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
                id="printable-sale-car"
                className="relative w-[210mm] min-h-[297mm] max-h-[297mm] mx-auto bg-white p-[10mm] flex flex-col font-sans text-gray-800 box-border"
            >
                {/* Header */}
                <header className="border-b-4 border-blue-600 pb-4 mb-4 shrink-0">
                    <div className="flex justify-between items-start">
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
                                سيارة للبيع
                            </h2>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow flex flex-col items-start justify-start w-full gap-8">

                    {/* Header Section: Title Only */}
                    <div className="w-full flex justify-between items-center border-b-2 border-slate-100 pb-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">{listing.title}</h1>
                        </div>
                    </div>

                    {/* Data Grid & Details */}
                    <div className="w-full grid grid-cols-12 gap-8">

                        {/* Listing QR Code & Specs */}
                        <div className="col-span-12 flex justify-center items-center gap-8 mt-4">
                            {/* QR Code */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-slate-200">
                                <canvas ref={qrCanvasRef} className="w-[300px] h-[300px]" />
                                <p className="text-slate-800 text-sm font-bold mt-2">امسح الكود لعرض السيارة</p>
                            </div>

                            {/* Specs Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-2xl border border-blue-100 shadow-sm w-[268px] h-[268px] flex flex-col">
                                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">المواصفات الأساسية</h3>
                                <div className="grid grid-cols-2 gap-2.5 flex-1 content-start">
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
                                            { value: listing.brand?.name_ar || listing.brand?.name },
                                            { value: listing.model },
                                            { value: listing.year },
                                            { value: getTransmissionAr(listing.transmission) },
                                            { value: getFuelAr(listing.fuel_type) },
                                            { value: listing.mileage ? `${Number(listing.mileage).toLocaleString()} كم` : null }
                                        ].filter(item => item.value);

                                        return specs.map((spec, index) => (
                                            <div
                                                key={index}
                                                className="bg-white px-3 py-3 rounded-xl border border-slate-200 text-center shadow-sm flex items-center justify-center"
                                            >
                                                <span className="text-base font-black text-slate-800 leading-tight">{spec.value}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Provider Section */}
                        <div className="col-span-12 mt-6 pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between bg-gradient-to-br from-slate-50 to-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                {/* Decorative Background Element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl opacity-50"></div>

                                <div className="flex-1 relative z-10">
                                    <h3 className="text-3xl font-black text-slate-900 mb-6">{provider.name}</h3>

                                    <div className="flex flex-col gap-6">
                                        {provider.socials?.whatsapp && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                                    <Icon name="Phone" className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-500 mb-1">للحجز والتواصل</span>
                                                    <span dir="ltr" className="text-2xl font-black text-slate-900 tracking-tight">
                                                        {(() => {
                                                            const phone = provider.socials.whatsapp.replace(/\D/g, '');
                                                            return '+' + phone.replace(/(\d{3})/g, '$1 ').trim();
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {provider.city && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                    <Icon name="MapPin" className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-500 mb-1">العنوان</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-xl font-bold text-slate-900">{provider.city}</span>
                                                        {provider.address && (
                                                            <span className="text-sm font-medium text-slate-500">{provider.address}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Provider Profile QR */}
                                <div className="flex flex-col items-center gap-3 relative z-10 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <canvas ref={providerQrCanvasRef} className="w-[160px] h-[160px]" />
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Icon name="User" className="w-4 h-4" />
                                        <span className="text-xs font-bold">ملف المعرض</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto pt-4 border-t-4 border-blue-600 shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-800 gap-3">
                            <Icon name="Globe" className="w-5 h-5 text-blue-600" />
                            <span className="text-lg font-black text-gray-800 dir-ltr">
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
                    </div>
                </footer>
            </div>
        </>
    );
});

export default PrintableSaleCar;
