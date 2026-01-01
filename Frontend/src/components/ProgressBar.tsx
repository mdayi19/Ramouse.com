import React from 'react';
import Icon from './Icon';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  goToStep: (step: number) => void;
}

// Step emojis for visual recognition
const stepEmojis = [
  '🚗', // Step 1: Category
  '🏭', // Step 2: Brand  
  '📋', // Step 3: Model
  '🔧', // Step 4: Part Type
  '📝', // Step 5: Details
  '✅', // Step 6: Review
  '🎉', // Step 7: Success
];

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepNames, goToStep }) => {
  return (
    <div className="w-full mb-8 px-2 sm:px-0">
      {/* Desktop View - Emoji Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full -z-10"></div>

        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-primary via-primary-500 to-secondary rounded-full -z-10 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(14,165,233,0.4)]"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        {stepNames.slice(0, totalSteps).map((name, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const canNavigate = stepNumber < currentStep;

          return (
            <div
              key={stepNumber}
              className={`flex flex-col items-center relative ${canNavigate ? 'cursor-pointer' : 'cursor-default'} group`}
              onClick={() => canNavigate && goToStep(stepNumber)}
            >
              {/* Emoji Circle */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-3 transition-all duration-500 z-10 relative ${isCompleted
                    ? 'bg-gradient-to-br from-primary to-primary-600 border-primary text-white shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:shadow-xl'
                    : isActive
                      ? 'bg-white dark:bg-slate-900 border-primary border-4 scale-125 shadow-2xl shadow-primary/20 ring-4 ring-primary/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                  }`}
              >
                <span className={`text-2xl ${isCompleted || isActive ? '' : 'grayscale opacity-50'}`}>
                  {stepEmojis[index] || '📦'}
                </span>

                {/* Pulse effect for active step */}
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping"></span>
                )}

                {/* Completed checkmark badge */}
                {isCompleted && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                    <Icon name="Check" className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>

              {/* Step Name Label */}
              <span className={`absolute top-16 text-xs font-bold whitespace-nowrap transition-all duration-300 ${isActive
                  ? 'text-primary scale-110'
                  : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 opacity-50'
                }`}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile View - Big Emoji Progress */}
      <div className="sm:hidden">
        {/* Current Step Hero */}
        <div className="flex items-center gap-4 mb-4 px-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-3xl">{stepEmojis[currentStep - 1] || '📦'}</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              الخطوة {currentStep} من {totalSteps}
            </p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
              {stepNames[currentStep - 1]}
            </h4>
          </div>
          <div className="text-lg font-black text-primary bg-primary/10 px-3 py-2 rounded-xl">
            {Math.round((currentStep / totalSteps) * 100)}%
          </div>
        </div>

        {/* Progress Bar with Emoji Markers */}
        <div className="relative px-1">
          {/* Background bar */}
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary-500 to-secondary transition-all duration-500 ease-out rounded-full shadow-[0_2px_10px_rgba(14,165,233,0.4)] relative overflow-hidden"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-white/30 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>

          {/* Step dots with mini emojis */}
          <div className="flex justify-between mt-2">
            {stepEmojis.slice(0, totalSteps).map((emoji, index) => {
              const stepNumber = index + 1;
              const isCompleted = currentStep > stepNumber;
              const isActive = currentStep === stepNumber;

              return (
                <div
                  key={stepNumber}
                  className={`text-sm transition-all duration-300 ${isCompleted
                      ? 'opacity-100'
                      : isActive
                        ? 'opacity-100 scale-125'
                        : 'opacity-30 grayscale'
                    }`}
                >
                  {emoji}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;