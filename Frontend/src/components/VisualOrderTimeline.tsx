
import React from 'react';
import { Order, OrderStatus } from '../types';
import Icon from './Icon';
import type { icons } from 'lucide-react';

interface VisualOrderTimelineProps {
  order: Order;
}

type StepConfig = {
  status: OrderStatus;
  label: string;
  icon: keyof typeof icons;
};

const shippingSteps: StepConfig[] = [
  { status: 'pending', label: 'استلام الطلب', icon: 'ClipboardList' },
  { status: 'payment_pending', label: 'تأكيد الدفع', icon: 'Wallet' },
  { status: 'processing', label: 'تجهيز الطلب', icon: 'PackageSearch' },
  { status: 'provider_received', label: 'استلام القطعة', icon: 'Warehouse' },
  { status: 'shipped', label: 'تم الشحن', icon: 'Send' },
  { status: 'out_for_delivery', label: 'قيد التوصيل', icon: 'Truck' },
  { status: 'delivered', label: 'اكتمل التوصيل', icon: 'CheckCircle' },
];

const pickupSteps: StepConfig[] = [
  { status: 'pending', label: 'استلام الطلب', icon: 'ClipboardList' },
  { status: 'payment_pending', label: 'تأكيد الدفع', icon: 'Wallet' },
  { status: 'processing', label: 'تجهيز الطلب', icon: 'PackageSearch' },
  { status: 'ready_for_pickup', label: 'جاهز للاستلام', icon: 'Store' },
  { status: 'completed', label: 'تم الاستلام', icon: 'UserCheck' },
];

const VisualOrderTimeline: React.FC<VisualOrderTimelineProps> = ({ order }) => {
  const { status, deliveryMethod } = order;

  // Default to shipping flow for older orders without a deliveryMethod
  const steps = deliveryMethod === 'pickup' ? pickupSteps : shippingSteps;

  // Helper to normalize status for comparison (handles legacy Arabic statuses)
  const getNormalizedStatusIndex = (currentStatus: OrderStatus) => {
    // Direct match
    let index = steps.findIndex(step => step.status === currentStatus);
    if (index !== -1) return index;

    // Legacy mapping
    const legacyMap: Record<string, OrderStatus> = {
      'قيد المراجعة': 'pending',
      'بانتظار تأكيد الدفع': 'payment_pending',
      'جاري التجهيز': 'processing',
      'جاهز للاستلام': 'ready_for_pickup',
      'تم الاستلام من المزود': 'provider_received',
      'تم الشحن للعميل': 'shipped',
      'قيد التوصيل': 'out_for_delivery',
      'تم التوصيل': 'delivered',
      'تم الاستلام من الشركة': 'completed',
      'ملغي': 'cancelled'
    };

    const normalized = legacyMap[currentStatus];
    return steps.findIndex(step => step.status === normalized);
  };

  const currentStatusIndex = getNormalizedStatusIndex(status);
  const isCancelled = status === 'cancelled' || status === 'ملغي';

  if (isCancelled) {
    return (
      <div className="w-full px-2 py-1">
        <div className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">
          <Icon name="XCircle" className="w-5 h-5 text-red-500 dark:text-red-400 ml-2" />
          <span className="font-bold text-xs sm:text-sm text-red-700 dark:text-red-300">تم إلغاء هذا الطلب</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-start min-w-max px-2">
        {steps.map((step, index) => {
          const isCompleted = currentStatusIndex > index;
          const isActive = currentStatusIndex === index;

          const nodeClasses =
            isCompleted ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' :
              isActive ? 'bg-white dark:bg-slate-800 border-2 border-primary-500 text-primary-500 shadow-md ring-4 ring-primary-500/10 scale-110' :
                'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700';

          return (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center flex-shrink-0 relative group z-10" title={step.label}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${nodeClasses}`}>
                  <Icon name={step.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className={`mt-2 text-[10px] sm:text-xs text-center font-bold transition-colors duration-300 w-16 sm:w-20 leading-tight ${isActive ? 'text-primary-600 dark:text-primary-400 scale-105' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 sm:h-1 mt-4 sm:mt-5 mx-1 sm:mx-2 bg-slate-100 dark:bg-slate-800 rounded-full min-w-[20px] sm:min-w-[40px] relative overflow-hidden">
                  <div className={`absolute inset-0 bg-primary-500 transition-all duration-1000 origin-left ${isCompleted ? 'scale-x-100' : isActive ? 'scale-x-50 opacity-50' : 'scale-x-0'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default VisualOrderTimeline;
