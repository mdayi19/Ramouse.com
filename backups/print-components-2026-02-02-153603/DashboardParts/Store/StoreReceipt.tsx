
import React, { useEffect, useRef } from 'react';
import { FlashProductBuyerRequest, Settings } from '../../../types';
import { toCanvas } from 'qrcode';

interface StoreReceiptProps {
    request: FlashProductBuyerRequest;
    productName: string;
    settings: Settings;
    onDone: () => void;
}

export const StoreReceipt: React.FC<StoreReceiptProps> = ({ request, productName, settings, onDone }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            toCanvas(canvasRef.current, request.id, { width: 100, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
        }

        const handleAfterPrint = () => {
            onDone();
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);

        const timer = setTimeout(() => {
            window.print();
        }, 500);

        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
            clearTimeout(timer);
        };
    }, [onDone, request.id]);

    const printStyles = `
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body * { visibility: hidden; }
      #store-receipt, #store-receipt * { visibility: visible; }
      #store-receipt { position: absolute; left: 0; top: 0; width: 100%; min-height: 100vh; background: white; padding: 15mm; box-sizing: border-box; }
    }
  `;

    return (
        <>
            <style>{printStyles}</style>
            <div id="store-receipt" className="bg-white text-slate-900 font-sans" dir="rtl">

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                    <div className="flex flex-col gap-1">
                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto object-contain mb-2" />}
                        <h1 className="text-2xl font-black text-slate-900">{settings.appName}</h1>
                        <div className="text-sm text-slate-600">
                            <p>{settings.companyAddress}</p>
                            <p dir="ltr" className="text-right">{settings.companyPhone}</p>
                        </div>
                    </div>
                    <div className="text-left flex flex-col items-end">
                        <h2 className="text-3xl font-bold text-slate-300 uppercase tracking-widest mb-3">فاتورة شراء</h2>
                        <div className="text-center border-2 border-slate-900 p-2 rounded-lg">
                            <canvas ref={canvasRef} className="w-24 h-24 mb-1"></canvas>
                            <p className="text-xs font-mono font-bold">{request.id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="flex justify-between mb-10">
                    <div className="w-1/2 pr-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">معلومات المشتري</h3>
                        <div className="text-sm leading-relaxed">
                            <p className="font-bold text-lg">{request.buyerName}</p>
                            <p>{request.deliveryMethod === 'shipping' ? request.shippingAddress : 'استلام من المركز'}</p>
                            <p className="font-mono" dir="ltr">{request.contactPhone}</p>
                        </div>
                    </div>
                    <div className="w-1/3 pl-4 text-left">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">تفاصيل الفاتورة</h3>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-600">رقم الطلب:</span>
                                <span className="font-mono font-bold">{request.id.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">التاريخ:</span>
                                <span className="font-bold">{new Date(request.requestDate).toLocaleDateString('ar-SY')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">طريقة الدفع:</span>
                                <span className="font-bold">{request.paymentMethodName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="py-3 px-4 text-right w-1/2 rounded-tr-lg">المنتج</th>
                                <th className="py-3 px-4 text-center">الكمية</th>
                                <th className="py-3 px-4 text-center">السعر الإفرادي</th>
                                <th className="py-3 px-4 text-left rounded-tl-lg">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-200">
                                <td className="py-4 px-4 font-bold text-base">{productName}</td>
                                <td className="py-4 px-4 text-center">{request.quantity}</td>
                                <td className="py-4 px-4 text-center font-mono">${((request.totalPrice || 0) - (request.shippingCost || 0)) / request.quantity}</td>
                                <td className="py-4 px-4 text-left font-mono font-bold">${((request.totalPrice || 0) - (request.shippingCost || 0)).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 sm:w-1/3 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 border-b pb-2">
                            <span>المجموع الفرعي</span>
                            <span className="font-mono">${((request.totalPrice || 0) - (request.shippingCost || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600 border-b pb-2">
                            <span>الشحن والتوصيل</span>
                            <span className="font-mono">${request.shippingCost?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black bg-slate-100 p-2 rounded">
                            <span>الإجمالي الكلي</span>
                            <span className="font-mono">${request.totalPrice?.toLocaleString()}</span>
                        </div>
                        {request.paymentMethodId?.includes('cod') && (
                            <div className="text-center text-xs text-white bg-slate-800 p-1 rounded mt-2">
                                مطلوب التحصيل نقداً
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end pt-8 border-t-2 border-slate-200">
                        <div className="text-center w-40">
                            <div className="h-16 mb-2 border-b border-slate-300"></div>
                            <p className="text-xs font-bold text-slate-400">توقيع المستلم</p>
                        </div>
                        <div className="text-center text-slate-500 text-xs">
                            <p>شكراً لثقتكم بـ {settings.appName}</p>
                            <p className="mt-1" dir="ltr">{settings.mainDomain}</p>
                        </div>
                        <div className="text-center w-40">
                            <div className="h-16 mb-2 border-b border-slate-300"></div>
                            <p className="text-xs font-bold text-slate-400">الختم والتوقيع</p>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};
