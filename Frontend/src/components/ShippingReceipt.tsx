
import React, { useEffect, useRef } from 'react';
import { Order, Settings } from '../types';
import { toCanvas } from 'qrcode';

interface ShippingReceiptProps {
  order: Order;
  settings: Settings;
  onDone: () => void;
}

const ShippingReceipt: React.FC<ShippingReceiptProps> = ({ order, settings, onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      toCanvas(canvasRef.current, order.orderNumber, { width: 128, margin: 1, color: { dark: '#000000', light: '#ffffff' } }, (error) => {
        if (error) console.error(error);
      });
    }

    const handleAfterPrint = () => {
      onDone();
      window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // Slight delay to ensure QR code is rendered and styles applied
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      clearTimeout(timer);
    };
  }, [onDone, order.orderNumber]);

  const printStyles = `
    @media print {
      @page {
        size: A5 portrait;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body * {
        visibility: hidden;
      }
      #shipping-receipt, #shipping-receipt * {
        visibility: visible;
      }
      #shipping-receipt {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        min-height: 100vh;
        background: white;
        padding: 15mm;
        box-sizing: border-box;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <div id="shipping-receipt" className="bg-white text-slate-900 font-sans" dir="rtl">

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex flex-col gap-1">
            {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain mb-2" />}
            <h1 className="text-xl font-black text-slate-900">{settings.appName}</h1>
            <div className="text-xs text-slate-600">
              <p>{settings.companyAddress}</p>
              <p dir="ltr" className="text-right">{settings.companyPhone}</p>
              <p>{settings.companyEmail}</p>
            </div>
          </div>
          <div className="text-left flex flex-col items-end">
            <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-2">إيصال شحن</h2>
            <div className="text-center border-2 border-slate-900 p-2 rounded-lg">
              <canvas ref={canvasRef} className="w-24 h-24 mb-1"></canvas>
              <p className="text-xs font-mono font-bold">{order.orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">معلومات المستلم</h3>
            <div className="text-sm space-y-1">
              <p className="font-bold text-lg">{order.customerName}</p>
              <p>{order.customerAddress}</p>
              <p>{order.formData.city}</p>
              <p className="font-mono mt-1" dir="ltr">{order.customerPhone}</p>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">تفاصيل الطلب</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">التاريخ:</span>
                <span className="font-bold">{new Date(order.date).toLocaleDateString('ar-SY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">طريقة الدفع:</span>
                <span className="font-bold">{order.paymentMethodName || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">طريقة الاستلام:</span>
                <span className="font-bold">{order.deliveryMethod === 'pickup' ? 'استلام من الشركة' : 'توصيل'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Content */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y-2 border-slate-800">
                <th className="py-3 px-4 text-right w-1/2">وصف القطعة / السيارة</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الكمية</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-4 px-4">
                  <p className="font-bold text-base mb-1">{order.formData.partDescription}</p>
                  <p className="text-xs text-slate-500">
                    {order.formData.brand} {order.formData.model} {order.formData.year} - {order.formData.category}
                  </p>
                  {order.formData.partNumber && <p className="text-xs font-mono text-slate-500 mt-0.5">PN: {order.formData.partNumber}</p>}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs">{order.acceptedQuote?.partStatus === 'new' ? 'جديد' : 'مستعمل'}</span>
                </td>
                <td className="py-4 px-4 text-center font-bold">1</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer / Notes */}
        <div className="grid grid-cols-2 gap-8 mt-auto">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">ملاحظات الشحن</h4>
            <div className="border border-slate-300 rounded-lg p-3 h-24 bg-slate-50 text-sm">
              {order.shippingNotes || 'لا توجد ملاحظات إضافية.'}
            </div>
          </div>
          <div className="flex flex-col justify-end">
            {order.paymentMethodId === 'pm-cod' && (
              <div className="mb-4 p-3 bg-slate-800 text-white text-center rounded-lg">
                <p className="text-xs opacity-80 mb-1">المبلغ المطلوب تحصيله</p>
                <p className="text-xl font-mono font-bold">${order.acceptedQuote?.price.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-12 pt-8 border-t-2 border-slate-200">
          <div className="text-center w-32">
            <p className="text-xs font-bold text-slate-400 mb-12">توقيع المستلم</p>
            <div className="border-b border-slate-300"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{settings.mainDomain}</p>
            <p className="text-xs text-slate-500">شكراً لاستخدامكم {settings.appName}</p>
          </div>
          <div className="text-center w-32">
            <p className="text-xs font-bold text-slate-400 mb-12">ختم الشركة</p>
            <div className="border-b border-slate-300"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingReceipt;
