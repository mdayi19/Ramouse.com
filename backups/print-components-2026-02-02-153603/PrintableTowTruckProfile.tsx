
import React, { useEffect, useRef, forwardRef } from 'react';
import { TowTruck, Settings } from '../types';
import Icon from './Icon';
import { toCanvas } from 'qrcode';
import { getImageUrl, urlToBase64 } from '../utils/helpers';
import Rating from './Rating';

interface PrintableTowTruckProfileProps {
    towTruck: TowTruck;
    settings: Settings;
    onReady?: () => void;
    dynamicQrCodeUrl?: string;
}

const PrintableTowTruckProfile = forwardRef<HTMLDivElement, PrintableTowTruckProfileProps>(({ towTruck, settings, onReady, dynamicQrCodeUrl }, ref) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const [profilePhotoBase64, setProfilePhotoBase64] = React.useState<string>('');
    const [headerLogoBase64, setHeaderLogoBase64] = React.useState<string>('');

    useEffect(() => {
        const loadImages = async () => {
            // Profile photo
            if (towTruck.profilePhoto) {
                const url = getImageUrl(towTruck.profilePhoto);
                const base64 = await urlToBase64(url);
                if (base64) setProfilePhotoBase64(base64);
            }

            // Header/Footer logo
            const logoUrl = settings.logoUrl || "/logo without name.svg";
            if (logoUrl.startsWith('http')) {
                const base64 = await urlToBase64(logoUrl);
                if (base64) setHeaderLogoBase64(base64);
            }
        };
        loadImages();
    }, [towTruck.profilePhoto, settings.logoUrl]);

    useEffect(() => {
        // Generate URL from towTruck ID if not provided
        const urlToUse = dynamicQrCodeUrl || `${window.location.origin}/tow-trucks/${encodeURIComponent(towTruck.id)}`;

        const generateQr = () => {
            if (!qrCanvasRef.current) {
                if (onReady) onReady();
                return;
            }
            toCanvas(qrCanvasRef.current, urlToUse, {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H',
                color: { dark: '#000000', light: '#FFFFFF' }
            }, (error) => {
                if (error) console.error('QR generation error:', error);
                if (onReady) onReady();
            });
        };
        const timer = setTimeout(generateQr, 100);
        return () => clearTimeout(timer);
    }, [towTruck.id, dynamicQrCodeUrl, onReady]);

    const whatsappMessage = encodeURIComponent('مرحباً، لقد وجدت رقمك عبر تطبيق راموسة لقطع غيار السيارات.\nThis message redirect from Ramouse');

    return (
        <div
            ref={ref}
            id="printable-profile"
            dir="rtl"
            lang="ar"
            className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[10mm] flex flex-col font-sans text-gray-800 box-border overflow-visible"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
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
                    #printable-profile {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
            {/* Header - Sticky on Print */}
            <header className="border-b-4 border-primary-600 pb-4 mb-4 flex items-start justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <img
                        src={headerLogoBase64 || settings.logoUrl || "/logo without name.svg"}
                        alt="Logo"
                        className="h-20 w-20 object-contain"
                    />
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary-800 leading-tight">
                            {settings.appName}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            منصة موثوقة لخدمات السيارات في سوريا
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">
                        ملف ونش معتمد
                    </h2>
                </div>
            </header>

            {/* Main Content - Dynamic Flow */}
            <main className="flex-1 flex flex-col items-center justify-start text-center gap-2 py-2 overflow-hidden">

                {/* Profile Identity */}
                <div className="flex flex-row items-center justify-center gap-6 shrink-0 w-full mt-4 px-8 dir-rtl text-right">
                    {towTruck.profilePhoto && (
                        <div className="relative shrink-0">
                            <img
                                src={profilePhotoBase64 || getImageUrl(towTruck.profilePhoto)}
                                alt={towTruck.name}
                                className="relative w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-xl"
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}

                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                                {towTruck.name}
                            </h2>
                            {towTruck.isVerified && (
                                <div className="bg-blue-500 rounded-full p-1 text-white shadow-sm">
                                    <Icon
                                        name="BadgeCheck"
                                        className="w-5 h-5"
                                    />
                                </div>
                            )}
                        </div>

                        <p className="text-xl text-primary-600 font-bold">
                            {towTruck.city} <span className="text-gray-300 mx-2">|</span> {towTruck.vehicleType === 'flatbed' ? 'سطحة' : 'ونش عادي'}
                        </p>
                    </div>
                </div>

                {/* QR + Contact Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full max-w-4xl mb-4 flex flex-col items-center">
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
                            <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">امسح الرمز للتواصل</p>
                        </div>

                        {/* Contact Info Section */}
                        <div className="flex flex-col gap-4 items-start min-w-[250px]">
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 w-full hover:bg-blue-50 transition-colors">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-primary-600">
                                    <Icon
                                        name="Phone"
                                        className="w-6 h-6"
                                    />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-gray-500 font-medium mb-0.5">رقم الهاتف</span>
                                    <span dir="ltr" className="text-xl font-black text-gray-800 tracking-wider font-mono">{towTruck.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    {towTruck.description && (
                        <div className="w-full bg-gray-50 rounded-xl p-5 border border-gray-100 text-right">
                            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                                <Icon name="Info" className="w-5 h-5 text-primary-600" />
                                <span className="text-sm font-bold text-gray-700">نبذة تعريفية</span>
                            </div>
                            <p className="text-gray-700 text-lg font-medium leading-relaxed line-clamp-4">
                                {towTruck.description}
                            </p>
                        </div>
                    )}
                </div>

            </main>

            {/* Footer - Sticky on Print */}
            <footer className="pt-2 mt-4 border-t-4 border-primary-600 flex justify-between items-center shrink-0">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center text-gray-800 gap-3">
                        <Icon
                            name="Globe"
                            className="w-6 h-6 text-primary-600"
                        />
                        <a
                            href={`https://${settings.mainDomain}`}
                            className="text-xl font-black text-gray-800 hover:text-primary-600 hover:underline dir-ltr print:text-black print:text-xl print:font-bold print:opacity-100 !important"
                        >
                            {settings.mainDomain || 'ramouse.com'}
                        </a>
                    </div>

                    <div className="flex items-center gap-3 text-gray-800">
                        <span className="text-xl font-bold">للدعم الفني:</span>
                        <span dir="ltr" className="text-xl font-black text-primary-700 font-mono tracking-wider">
                            {settings.companyPhone}
                        </span>
                        <Icon
                            name="Phone"
                            className="w-6 h-6 text-primary-600"
                        />
                    </div>
                </div>
            </footer>
        </div>
    );
});

export default PrintableTowTruckProfile;
