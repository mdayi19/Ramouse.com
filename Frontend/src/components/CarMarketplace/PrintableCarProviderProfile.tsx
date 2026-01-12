import React, {
    useEffect,
    useRef,
    forwardRef,
    useMemo,
    useCallback,
} from 'react';
import { CarProvider, Settings } from '../../types';
import Icon from '../Icon';
import { toCanvas } from 'qrcode';
import { getStorageUrl } from '../../config/api';

/* ---------------------------------- */
/* Printable Profile Component        */
/* ---------------------------------- */
interface PrintableCarProviderProfileProps {
    provider: CarProvider;
    settings: Settings;
    onReady?: () => void;
    dynamicQrCodeUrl?: string; // Optional URL override
}

const PrintableCarProviderProfile = forwardRef<
    HTMLDivElement,
    PrintableCarProviderProfileProps
>(({
    provider,
    settings,
    onReady,
    dynamicQrCodeUrl,
}, ref) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const readyCalledRef = useRef(false);

    /* -------- Profile URL -------- */
    const profileUrl = useMemo(() => {
        if (dynamicQrCodeUrl) return dynamicQrCodeUrl;

        const baseUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : `https://${settings.mainDomain}`;

        // Construct provider public profile URL
        // Typically /car-providers/:id
        return `${baseUrl}/car-providers/${encodeURIComponent(
            provider.id
        )}`;
    }, [
        dynamicQrCodeUrl,
        provider.id,
        settings.mainDomain,
    ]);

    /* -------- QR Generator -------- */
    const generateQrCode = useCallback(async () => {
        if (!profileUrl || !qrCanvasRef.current) return;

        try {
            await toCanvas(qrCanvasRef.current, profileUrl, {
                width: 300,
                margin: 1,
                errorCorrectionLevel: 'H',
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
        } catch (error) {
            console.error('QR Code generation failed:', error);
        } finally {
            if (onReady && !readyCalledRef.current) {
                readyCalledRef.current = true;
                onReady();
            }
        }
    }, [profileUrl, onReady]);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);

    return (
        <div
            ref={ref}
            id="printable-profile"
            className="relative w-[210mm] h-[297mm] mx-auto bg-white p-[10mm] flex flex-col font-sans text-gray-800 box-border overflow-hidden"
        >
            {/* Header (Matching Technician Profile Style) */}
            <header className="border-b-4 border-blue-600 pb-4 mb-4 shrink-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo without name.svg"
                            alt="Logo"
                            className="h-20 w-20 object-contain"
                        />
                        <div>
                            <h1 className="text-3xl font-extrabold text-blue-800 leading-tight">
                                {settings.appName}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                سوق السيارات المعتمد
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">
                            {provider.business_type === 'rental_agency' ? 'مكتب تأجير معتمد' :
                                provider.business_type === 'individual' ? 'بائع معتمد' :
                                    'معرض سيارات معتمد'}
                        </h2>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-start text-center py-2 w-full gap-4 pb-16">

                {/* Profile Identity */}
                <div className="flex flex-row items-center justify-center gap-6 shrink-0 w-full mt-4 px-0 dir-rtl text-right">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {provider.profile_photo ? (
                            <img
                                src={getStorageUrl(provider.profile_photo)}
                                alt={provider.name}
                                className="relative w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-xl bg-white"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-white shadow-xl">
                                <Icon name="Building2" className="w-12 h-12 text-blue-500" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                                {provider.name}
                            </h2>
                            {provider.is_active && (
                                <div className="bg-blue-500 rounded-full p-1 text-white shadow-sm">
                                    <Icon name="BadgeCheck" className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        <p className="text-xl text-blue-600 font-bold">
                            {provider.business_type === 'dealership' ? 'معرض سيارات' :
                                provider.business_type === 'rental_agency' ? 'مكتب تأجير' : 'بائع فردي'}
                            <span className="text-gray-300 mx-2">|</span>
                            {provider.city}
                        </p>
                    </div>
                </div>

                {/* QR + Contact Card (Matching Technician Style) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full mb-4 flex flex-col items-center">
                    <p className="text-gray-500 text-sm font-medium mb-6 uppercase tracking-wider text-center w-full border-b pb-4">
                        معلومات التواصل والتفاصيل
                    </p>

                    <div className="flex flex-row items-center justify-center gap-12 w-full mb-8 dir-rtl">
                        {/* QR Code Section */}
                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-inner shrink-0">
                            <canvas
                                ref={qrCanvasRef}
                                className="w-[140px] h-[140px]"
                            />
                            <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">امسح الرمز لعرض السيارات المتاحة</p>
                        </div>

                        {/* Contact Info Section */}
                        <div className="flex flex-col gap-4 items-start min-w-[250px]">

                            {/* WhatsApp */}
                            {provider.socials?.whatsapp && (
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 w-full hover:bg-blue-50 transition-colors">
                                    <div className="bg-white p-2 rounded-lg shadow-sm text-green-600">
                                        <Icon name="Phone" className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-gray-500 font-medium mb-0.5">واتساب</span>
                                        <span dir="ltr" className="text-xl font-black text-gray-800 tracking-wider font-mono">{provider.socials.whatsapp}</span>
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            {provider.public_email && (
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 w-full hover:bg-blue-50 transition-colors">
                                    <div className="bg-white p-2 rounded-lg shadow-sm text-orange-600">
                                        <Icon name="Mail" className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-gray-500 font-medium mb-0.5">البريد الإلكتروني</span>
                                        <span className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[200px]">{provider.public_email}</span>
                                    </div>
                                </div>
                            )}

                            {/* Address/Location */}
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 w-full hover:bg-blue-50 transition-colors">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                                    <Icon name="MapPin" className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-gray-500 font-medium mb-0.5">الموقع</span>
                                    <span className="text-base font-bold text-gray-800 leading-tight">
                                        {provider.city} {provider.address ? ` - ${provider.address}` : ''}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Description Section */}
                    {provider.description && (
                        <div className="w-full bg-gray-50 rounded-xl p-5 border border-gray-100 text-right">
                            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                                <Icon name="FileText" className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-bold text-gray-700">نبذة عن المعرض</span>
                            </div>
                            <p className="text-gray-700 text-lg font-medium leading-relaxed whitespace-pre-line line-clamp-1">
                                {provider.description}
                            </p>
                        </div>
                    )}

                    {/* Gallery Preview (Added Feature) */}
                    {/* Working Hours (Replaces Gallery) */}
                    {provider.working_hours && (
                        <div className="w-full mt-4 bg-gray-50 rounded-xl p-5 border border-gray-100 text-right">
                            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                                <Icon name="Clock" className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-bold text-gray-700">ساعات العمل</span>
                            </div>
                            <p className="text-gray-700 text-lg font-medium leading-relaxed whitespace-pre-line dir-rtl">
                                {provider.working_hours}
                            </p>
                        </div>
                    )}
                </div>

            </main>

            {/* Footer (Matching Technician Profile Style) */}
            <footer className="absolute bottom-[10mm] left-[10mm] right-[10mm] pt-2 border-t-4 border-blue-600 bg-white z-[99999] print:visible print:block !important">
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-800 gap-3">
                        <Icon name="Globe" className="w-6 h-6 text-blue-600" />
                        <span className="text-xl font-black text-gray-800 dir-ltr">
                            {settings.mainDomain || 'ramouse.com'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-800">
                        <span className="text-xl font-bold">للدعم الفني:</span>
                        <span dir="ltr" className="text-xl font-black text-blue-700 font-mono tracking-wider">
                            {settings.companyPhone}
                        </span>
                        <Icon name="Phone" className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
            </footer>
        </div>
    );
});

export default PrintableCarProviderProfile;
