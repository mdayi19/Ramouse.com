
import React, { useEffect, useRef, forwardRef } from 'react';
import { TowTruck, Settings } from '../types';
import Icon from './Icon';
import { toCanvas } from 'qrcode';
import { getImageUrl } from '../utils/helpers';
import Rating from './Rating';

interface PrintableTowTruckProfileProps {
    towTruck: TowTruck;
    settings: Settings;
    onReady?: () => void;
    dynamicQrCodeUrl?: string;
}

const PrintableTowTruckProfile = forwardRef<HTMLDivElement, PrintableTowTruckProfileProps>(({ towTruck, settings, onReady, dynamicQrCodeUrl }, ref) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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
        <div ref={ref} id="printable-profile" className="w-[210mm] h-[297mm] mx-auto bg-white p-[10mm] flex flex-col font-sans text-gray-800 box-border overflow-hidden">
            {/* Enhanced Header */}
            <header className="border-b-4 border-primary-600 pb-4 mb-6 shrink-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <img src={settings.logoUrl || "/logo without name.svg"} alt="Logo" className="h-16 w-16 object-contain" />
                        <div>
                            <h1 className="text-2xl font-extrabold text-primary-800 leading-tight">{settings.appName}</h1>
                            <p className="text-xs text-gray-500 mt-0.5">منصة موثوقة لخدمات السيارات في سوريا</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-700 mb-1">ملف سائق سطحة معتمد</h2>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-start text-center py-4 gap-8">
                <div className="flex flex-col items-center">
                    {towTruck.profilePhoto && (
                        <div className="relative mb-4">
                            <img
                                src={getImageUrl(towTruck.profilePhoto)}
                                alt={towTruck.name}
                                className="w-40 h-40 rounded-full object-cover ring-4 ring-primary-100 shadow-xl"
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-3">
                        <h2 className="text-4xl font-extrabold text-primary-900 tracking-tight">{towTruck.name}</h2>
                        {towTruck.isVerified && <Icon name="BadgeCheck" className="w-8 h-8 text-primary shadow-sm" />}
                    </div>
                    <p className="text-xl font-bold text-gray-600 mt-2">{towTruck.vehicleType} <span className="text-gray-300 mx-2">|</span> {towTruck.city}</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 w-full max-w-2xl flex flex-row items-center justify-center gap-12 text-right dir-rtl shadow-sm">
                    <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-100 shrink-0">
                        <canvas ref={qrCanvasRef} className="w-[180px] h-[180px] mx-auto rounded-lg"></canvas>
                        <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">امسح الرمز لعرض الملف</p>
                    </div>

                    <div className="flex flex-col items-start gap-4 flex-grow">
                        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 w-full mb-2">معلومات التواصل</h3>

                        <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 w-full">
                            <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                                <Icon name="Phone" className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-start text-right">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">رقم الهاتف</span>
                                <span dir="ltr" className="text-xl font-black text-slate-800 font-mono tracking-wider">{towTruck.id}</span>
                            </div>
                        </div>

                        {towTruck.serviceArea && (
                            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 w-full text-right">
                                <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                                    <Icon name="MapPin" className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">منطقة الخدمة</span>
                                    <span className="text-base font-bold text-slate-800">{towTruck.serviceArea}</span>
                                </div>
                            </div>
                        )}

                        {towTruck.description && (
                            <div className="mt-2 text-right w-full border-t border-slate-100 pt-3">
                                <p className="text-sm font-bold text-slate-500 mb-1">عن السائق:</p>
                                <p className="text-sm leading-relaxed text-gray-700">{towTruck.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Enhanced Footer */}
            <footer className="mt-auto pt-4 border-t-4 border-primary-600 shrink-0 z-[99999] print:visible print:block !important">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <img src={settings.logoUrl || "/logo without name.svg"} alt="Logo" className="h-10 w-10 object-contain opacity-90" />
                        <div>
                            <p className="font-black text-primary-800 text-base leading-none">{settings.appName}</p>
                            <p className="text-[10px] text-gray-600 mt-1">
                                <Icon name="Globe" className="w-3 h-3 inline-block mr-1 text-primary-600" />
                                <span className="font-bold">{settings.mainDomain}</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-700 mb-1">
                            <span dir="ltr" className="text-xs font-bold font-mono tracking-tight">{settings.companyPhone}</span>
                            <span className="text-xs font-bold">:للدعم الفني</span>
                            <Icon name="Phone" className="w-3 h-3 text-primary-600" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                            © {new Date().getFullYear()} {settings.appName} - جميع الحقوق محفوظة
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
});

export default PrintableTowTruckProfile;
