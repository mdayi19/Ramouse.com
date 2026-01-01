import React from 'react';
import Icon from '../Icon';

interface CheckoutStepperProps {
    currentStep: 'cart' | 'details' | 'payment';
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
    const steps = [
        { id: 'cart', label: 'السلة', emoji: '🛒' },
        { id: 'details', label: 'الشحن', emoji: '🚚' },
        { id: 'payment', label: 'الدفع', emoji: '💳' },
    ];

    const currentIdx = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between relative px-4">
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 dark:bg-slate-700 -z-10 rounded-full" />
                <div
                    className="absolute right-0 top-1/2 h-1 bg-primary -z-10 transition-all duration-500 rounded-full"
                    style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                    const isActive = idx === currentIdx;
                    const isCompleted = idx < currentIdx;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${isActive
                                        ? 'border-primary bg-white dark:bg-slate-800 text-3xl scale-110 shadow-lg shadow-primary/30 z-10'
                                        : isCompleted
                                            ? 'border-primary bg-primary text-2xl text-white'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-2xl grayscale opacity-60'
                                    }`}
                            >
                                {isCompleted ? '✅' : step.emoji}
                            </div>
                            <span className={`text-xs font-bold mt-2 transition-colors ${isActive ? 'text-primary scale-110' : isCompleted ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
