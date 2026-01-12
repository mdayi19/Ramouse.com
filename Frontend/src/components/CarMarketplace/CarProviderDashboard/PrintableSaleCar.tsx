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
                    width: 240,
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
        <div
            ref={ref}
            id="printable-sale-car"
            className="relative w-[210mm] min-h-[297mm] mx-auto bg-white p-[10mm] flex flex-col font-sans text-gray-800 box-border"
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
                        <h2 className="text-xl font-bold text-gray-700 mb-1">
                            {provider.name}
                        </h2>
                        <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                            <span>{provider.city}</span>
                            <Icon name="MapPin" className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-start justify-start w-full gap-8">

                {/* Header Section: Title & Price */}
                <div className="w-full flex justify-between items-start border-b-2 border-slate-100 pb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-bold tracking-wide">
                                موديل {listing.year}
                            </span>
                            <span className="text-slate-500 font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg">
                                {listing.condition || 'مستعمل'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 leading-tight mb-2">{listing.title}</h1>
                        <div className="flex items-center gap-6 text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <Icon name="Gauge" className="w-5 h-5" />
                                <span dir="ltr">{Number(listing.mileage).toLocaleString()} كم</span>
                            </div>
                            <div className="w-px h-4 bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <Icon name="Fuel" className="w-5 h-5" />
                                <span>{listing.fuel_type}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-left bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100">
                        <span className="block text-sm text-blue-600 font-bold mb-1">السعر المطلوب</span>
                        <h2 className="text-5xl font-black text-blue-600 tracking-tight">
                            {Number(listing.price).toLocaleString()}
                        </h2>
                    </div>
                </div>

                {/* Data Grid & Details */}
                <div className="w-full grid grid-cols-12 gap-8">

                    {/* Specs Table */}
                    <div className="col-span-12">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <Icon name="FileText" className="w-4 h-4" />
                            </div>
                            المواصفات الفنية
                        </h3>

                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'الشركة المصنعة', value: listing.brand?.name_ar || listing.brand?.name || '-' },
                                { label: 'الموديل', value: listing.model },
                                { label: 'سنة الصنع', value: listing.year },
                                { label: 'الوقود', value: listing.fuel_type === 'Petrol' ? 'بنزين' : listing.fuel_type === 'Diesel' ? 'ديزل' : listing.fuel_type === 'Electric' ? 'كهرباء' : listing.fuel_type === 'Hybrid' ? 'هايبرد' : listing.fuel_type },
                                { label: 'ناقل الحركة', value: listing.transmission === 'Manual' ? 'عادي' : listing.transmission === 'Automatic' ? 'أوتوماتيك' : listing.transmission },
                                { label: 'اللون', value: listing.color },
                                { label: 'سعة المحرك', value: listing.engine_size ? `${listing.engine_size} سي سي` : '-' },
                                { label: 'عداد المشي', value: listing.mileage ? `${listing.mileage.toLocaleString()} كم` : '-' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="block text-xs font-bold text-slate-400 mb-1">{item.label}</span>
                                    <span className="block text-lg font-bold text-slate-800 truncate">{item.value || '-'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-8">
                        <div className="bg-white rounded-2xl p-6 border-2 border-slate-100 h-full">
                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <Icon name="AlignLeft" className="w-4 h-4" />
                                </div>
                                تفاصيل السيارة
                            </h3>
                            <p className="text-base text-slate-600 leading-8 whitespace-pre-line text-justify">
                                {listing.description || 'لا يتوفر وصف إضافي لهذه السيارة.'}
                            </p>
                        </div>
                    </div>

                    {/* QR Code Column */}
                    <div className="col-span-4 flex flex-col gap-4">
                        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center text-center h-full justify-center">
                            <div className="bg-white p-2 rounded-xl mb-4">
                                <canvas ref={qrCanvasRef} className="w-[220px] h-[220px]" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">التفاصيل الكاملة</h3>
                            <p className="text-slate-400 text-sm">امسح الكود لعرض الصور والمزيد</p>
                        </div>
                    </div>

                    {/* Provider Section */}
                    <div className="col-span-12 mt-2 pt-6 border-t-2 border-slate-100">
                        <div className="flex items-start justify-between bg-slate-50 p-6 rounded-3xl border border-slate-200">
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">{provider.name}</h3>

                                <div className="space-y-3">
                                    {provider.socials?.whatsapp && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                                                <Icon name="Phone" className="w-4 h-4" />
                                            </div>
                                            <span dir="ltr" className="text-xl font-bold text-slate-900">
                                                {(() => {
                                                    const phone = provider.socials.whatsapp.replace(/\D/g, '');
                                                    return '+' + phone.replace(/(\d{3})/g, '$1 ').trim();
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                    {provider.city && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                                                <Icon name="MapPin" className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-slate-900">{provider.city}</span>
                                                {provider.address && (
                                                    <span className="text-sm font-medium text-slate-600">{provider.address}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Provider Profile QR */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center ml-4">
                                <canvas ref={providerQrCanvasRef} className="w-[180px] h-[180px]" />
                                <p className="text-slate-500 text-xs font-bold mt-2">ملف المعرض</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-[10mm] left-[10mm] right-[10mm] pt-2 border-t-4 border-blue-600 bg-white z-[99999] print:visible print:block !important">
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
    );
});

export default PrintableSaleCar;
