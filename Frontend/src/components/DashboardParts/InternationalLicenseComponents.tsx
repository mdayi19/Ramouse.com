import React, { useMemo } from 'react';
import Icon from '../Icon';

export interface Step {
    id: string;
    label: string;
    icon: string;
    description?: string;
}

export interface TimelineEvent {
    id: string;
    status: string;
    timestamp: string;
    note?: string;
    actor?: string;
}

// Shared workflow steps - used across all international license views
export const INTERNATIONAL_LICENSE_STEPS: Step[] = [
    { id: 'pending', label: 'قيد الانتظار', icon: 'Clock', description: 'في انتظار المراجعة' },
    { id: 'payment_check', label: 'فحص الدفع', icon: 'DollarSign', description: 'التحقق من الدفع' },
    { id: 'documents_check', label: 'فحص المستندات', icon: 'FileSearch', description: 'مراجعة الوثائق' },
    { id: 'in_work', label: 'قيد العمل', icon: 'Briefcase', description: 'جاري التجهيز' },
    { id: 'ready_to_handle', label: 'جاهز للتسليم', icon: 'CheckCircle', description: 'جاهز للاستلام' },
];

// Document types for international license
export const DOCUMENT_TYPES = [
    { key: 'personal_photo', label: 'الصورة الشخصية', icon: 'User' },
    { key: 'id_document', label: 'وثيقة الهوية (أمامي)', icon: 'CreditCard' },
    { key: 'id_document_back', label: 'وثيقة الهوية (خلفي)', icon: 'CreditCard' },
    { key: 'passport_document', label: 'جواز السفر', icon: 'Book' },
    { key: 'driving_license_front', label: 'رخصة القيادة (أمامي)', icon: 'FileText' },
    { key: 'driving_license_back', label: 'رخصة القيادة (خلفي)', icon: 'FileText' },
    { key: 'proof_of_payment', label: 'إثبات الدفع', icon: 'DollarSign' },
] as const;

// Shared utility functions
export const formatCurrency = (amount: number): string => `$${amount}`;

export const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium' }).format(new Date(dateString));
};

export const formatDateShort = (dateString: string): string => {
    return new Intl.DateTimeFormat('ar-SY', {
        day: 'numeric',
        month: 'short'
    }).format(new Date(dateString));
};

export const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('ar-SY', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(dateString));
};

// Enhanced status configurations with more detailed styling
export const getStatusConfig = (status: string) => {
    const configs: Record<string, {
        color: string;
        bgGradient: string;
        icon: string;
        label: string;
        textColor: string;
        ringColor: string;
    }> = {
        'ready_to_handle': {
            color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            bgGradient: 'from-emerald-500 to-teal-600',
            icon: 'CheckCircle',
            label: 'جاهز للتسليم',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            ringColor: 'ring-emerald-500/30'
        },
        'in_work': {
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            bgGradient: 'from-blue-500 to-indigo-600',
            icon: 'Briefcase',
            label: 'قيد العمل',
            textColor: 'text-blue-600 dark:text-blue-400',
            ringColor: 'ring-blue-500/30'
        },
        'documents_check': {
            color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
            bgGradient: 'from-violet-500 to-purple-600',
            icon: 'FileSearch',
            label: 'فحص المستندات',
            textColor: 'text-violet-600 dark:text-violet-400',
            ringColor: 'ring-violet-500/30'
        },
        'payment_check': {
            color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            bgGradient: 'from-amber-500 to-orange-600',
            icon: 'DollarSign',
            label: 'فحص الدفع',
            textColor: 'text-amber-600 dark:text-amber-400',
            ringColor: 'ring-amber-500/30'
        },
        'rejected': {
            color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
            bgGradient: 'from-red-500 to-rose-600',
            icon: 'XCircle',
            label: 'مرفوض',
            textColor: 'text-red-600 dark:text-red-400',
            ringColor: 'ring-red-500/30'
        },
        'pending': {
            color: 'bg-slate-100 dark:bg-slate-700/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600',
            bgGradient: 'from-slate-400 to-slate-500',
            icon: 'Clock',
            label: 'قيد الانتظار',
            textColor: 'text-slate-600 dark:text-slate-400',
            ringColor: 'ring-slate-500/30'
        }
    };
    return configs[status] || configs.pending;
};

// Enhanced Status Badge with animation
export const StatusBadge: React.FC<{
    status: string;
    size?: 'sm' | 'md' | 'lg';
    showPulse?: boolean;
}> = ({ status, size = 'sm', showPulse = false }) => {
    const config = getStatusConfig(status);

    const sizeClasses = {
        sm: 'px-2.5 py-1 text-xs gap-1.5',
        md: 'px-3 py-1.5 text-sm gap-2',
        lg: 'px-4 py-2 text-base gap-2.5'
    };

    const iconSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const isActive = ['pending', 'payment_check', 'documents_check', 'in_work'].includes(status);

    return (
        <span className={`
            inline-flex items-center rounded-full font-bold border-2 
            ${config.color} ${sizeClasses[size]}
            transition-all duration-300 hover:scale-105
            ${showPulse && isActive ? 'animate-pulse' : ''}
        `}>
            <span className="relative">
                <Icon name={config.icon} className={iconSizes[size]} />
                {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-current rounded-full animate-ping opacity-75" />
                )}
            </span>
            <span>{config.label}</span>
        </span>
    );
};

// Enhanced Document Preview with lightbox capability
export const DocumentPreview: React.FC<{
    url: string;
    type: string;
    label?: string;
    onPreview?: (url: string) => void;
}> = ({ url, type, label, onPreview }) => {
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const fullUrl = url.startsWith('http') ? url : `/storage/${url}`;

    const handleClick = (e: React.MouseEvent) => {
        if (onPreview) {
            e.preventDefault();
            onPreview(fullUrl);
        }
    };

    return (
        <div className="group relative">
            {label && (
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Icon name="FileText" className="w-3.5 h-3.5" />
                    {label}
                </p>
            )}
            <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="block relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 
                    hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
                {isImage ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                            src={fullUrl}
                            alt={type}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                            opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                                <span className="text-white text-xs font-bold">{type}</span>
                                <div className="flex gap-2">
                                    <span className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                                        <Icon name="Maximize2" className="w-4 h-4 text-white" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-[4/3] flex flex-col items-center justify-center bg-gradient-to-br 
                        from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 
                        group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3 
                            group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                            <Icon name="FileText" className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                            عرض المستند
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PDF</p>
                    </div>
                )}
            </a>
        </div>
    );
};

// Modern Visual Stepper with enhanced animations
export const VisualStepper: React.FC<{
    status: string;
    steps: Step[];
    orientation?: 'horizontal' | 'vertical';
    showLabels?: boolean;
}> = ({ status, steps, orientation = 'horizontal', showLabels = true }) => {
    const currentStepIndex = useMemo(() =>
        steps.findIndex(s => s.id === status),
        [steps, status]
    );

    const progressWidth = useMemo(() => {
        if (status === 'rejected') return 0;
        return (Math.max(0, currentStepIndex) / (steps.length - 1)) * 100;
    }, [status, currentStepIndex, steps.length]);

    if (orientation === 'vertical') {
        return (
            <div className="relative flex flex-col gap-0 pr-4">
                {steps.map((step, index) => {
                    const isCompleted = status !== 'rejected' && index <= currentStepIndex;
                    const isCurrent = status === step.id;
                    const isRejected = status === 'rejected';

                    return (
                        <div key={step.id} className="relative flex items-start gap-4">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="absolute right-[19px] top-10 w-0.5 h-[calc(100%-16px)] bg-slate-200 dark:bg-slate-700">
                                    <div
                                        className={`absolute top-0 left-0 w-full bg-gradient-to-b from-primary to-primary-dark transition-all duration-700 ${isCompleted && index < currentStepIndex ? 'h-full' : 'h-0'
                                            }`}
                                    />
                                </div>
                            )}

                            {/* Step Circle */}
                            <div className={`
                                relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 
                                transition-all duration-500 flex-shrink-0
                                ${isRejected && index === 0
                                    ? 'bg-red-500 border-red-500 text-white'
                                    : isCompleted
                                        ? 'bg-gradient-to-br from-primary to-primary-dark border-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                                }
                                ${isCurrent ? 'scale-110 ring-4 ring-primary/20' : ''}
                            `}>
                                <Icon name={step.icon} className="w-5 h-5" />
                                {isCurrent && !isRejected && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                                )}
                            </div>

                            {/* Step Content */}
                            {showLabels && (
                                <div className="pb-8 pt-2">
                                    <span className={`
                                        text-sm font-bold transition-colors block
                                        ${isCurrent
                                            ? 'text-primary'
                                            : isCompleted
                                                ? 'text-slate-800 dark:text-white'
                                                : 'text-slate-400 dark:text-slate-500'
                                        }
                                    `}>
                                        {step.label}
                                    </span>
                                    {step.description && (
                                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">
                                            {step.description}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="relative w-full">
            {/* Background Track */}
            <div className="absolute top-5 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />

            {/* Progress Track */}
            <div
                className="absolute top-5 right-4 h-1 bg-gradient-to-l from-primary to-primary-dark rounded-full transition-all duration-700 ease-out"
                style={{ width: `calc(${progressWidth}% - 32px)` }}
            />

            {/* Steps */}
            <div className="relative flex items-start justify-between">
                {steps.map((step, index) => {
                    const isCompleted = status !== 'rejected' && index <= currentStepIndex;
                    const isCurrent = status === step.id;
                    const isRejected = status === 'rejected';

                    return (
                        <div
                            key={step.id}
                            className="relative z-10 flex flex-col items-center"
                            style={{ flex: '1 1 0%' }}
                        >
                            {/* Step Circle */}
                            <div className={`
                                relative w-10 h-10 rounded-xl flex items-center justify-center border-2 
                                transition-all duration-500
                                ${isRejected && index === 0
                                    ? 'bg-red-500 border-red-500 text-white'
                                    : isCompleted
                                        ? 'bg-gradient-to-br from-primary to-primary-dark border-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                                }
                                ${isCurrent ? 'scale-125 ring-4 ring-primary/20' : 'hover:scale-110'}
                            `}>
                                <Icon name={step.icon} className="w-5 h-5" />
                                {isCurrent && !isRejected && (
                                    <>
                                        <span className="absolute inset-0 rounded-xl bg-primary animate-ping opacity-30" />
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                                    </>
                                )}
                            </div>

                            {/* Step Label */}
                            {showLabels && (
                                <span className={`
                                    mt-3 text-xs font-bold text-center transition-colors max-w-[80px]
                                    ${isCurrent
                                        ? 'text-primary'
                                        : isCompleted
                                            ? 'text-slate-700 dark:text-slate-300'
                                            : 'text-slate-400 dark:text-slate-500'
                                    }
                                `}>
                                    {step.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// NEW: Timeline Component for tracking history
export const StatusTimeline: React.FC<{
    events: TimelineEvent[];
    currentStatus: string;
}> = ({ events, currentStatus }) => {
    if (!events || events.length === 0) return null;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SY', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    return (
        <div className="space-y-0">
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Icon name="History" className="w-4 h-4" />
                سجل التحديثات
            </h4>

            <div className="relative pr-4">
                {/* Timeline Line */}
                <div className="absolute right-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

                {events.map((event, index) => {
                    const config = getStatusConfig(event.status);
                    const isLatest = index === 0;

                    return (
                        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                            {/* Dot */}
                            <div className={`
                                relative z-10 w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1
                                ${isLatest
                                    ? `bg-gradient-to-br ${config.bgGradient} border-transparent shadow-md`
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                }
                            `}>
                                {isLatest && (
                                    <span className="absolute inset-0 rounded-full animate-ping opacity-50 bg-current" />
                                )}
                            </div>

                            {/* Content */}
                            <div className={`
                                flex-1 p-3 rounded-xl border transition-all
                                ${isLatest
                                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-900/50 border-transparent'
                                }
                            `}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-bold ${config.textColor}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>
                                {event.note && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {event.note}
                                    </p>
                                )}
                                {event.actor && (
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Icon name="User" className="w-3 h-3" />
                                        {event.actor}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// NEW: Quick Stats Card
export const QuickStatCard: React.FC<{
    icon: string;
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}> = ({ icon, label, value, trend, trendValue, color = 'primary' }) => {
    const colorClasses = {
        primary: 'from-primary/10 to-primary/5 text-primary',
        success: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
        warning: 'from-amber-500/10 to-amber-500/5 text-amber-600',
        danger: 'from-red-500/10 to-red-500/5 text-red-600'
    };

    const trendColors = {
        up: 'text-emerald-500',
        down: 'text-red-500',
        neutral: 'text-slate-400'
    };

    return (
        <div className={`
            p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} 
            border border-current/10 transition-all hover:scale-105 hover:shadow-lg
        `}>
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-current/10">
                    <Icon name={icon} className="w-5 h-5" />
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trendColors[trend]}`}>
                        <Icon
                            name={trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus'}
                            className="w-3 h-3"
                        />
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs opacity-70 font-medium mt-1">{label}</p>
        </div>
    );
};

// NEW: Info Card for displaying key-value pairs
export const InfoCard: React.FC<{
    icon: string;
    label: string;
    value: string;
    subValue?: string;
    action?: {
        icon: string;
        onClick: () => void;
        label: string;
    };
}> = ({ icon, label, value, subValue, action }) => {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 
            border border-slate-200 dark:border-slate-700 transition-all hover:border-primary/30">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                flex items-center justify-center flex-shrink-0">
                <Icon name={icon} className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{value}</p>
                {subValue && (
                    <p className="text-xs text-slate-400 truncate">{subValue}</p>
                )}
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                    title={action.label}
                >
                    <Icon name={action.icon} className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

// NEW: Empty State Component
export const EmptyState: React.FC<{
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: string;
    };
}> = ({ icon, title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 
                dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6 
                shadow-inner">
                <Icon name={icon} className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark 
                        text-white rounded-xl font-bold shadow-lg shadow-primary/25 
                        transition-all transform hover:scale-105"
                >
                    {action.icon && <Icon name={action.icon} className="w-5 h-5" />}
                    {action.label}
                </button>
            )}
        </div>
    );
};

// NEW: Loading Skeleton
export const RequestCardSkeleton: React.FC<{ viewMode?: 'grid' | 'list' | 'compact' }> = ({ viewMode = 'grid' }) => {
    if (viewMode === 'list' || viewMode === 'compact') {
        return (
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="text-left space-y-2">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
        </div>
    );
};

// NEW: Confirmation Dialog
export const ConfirmDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'تأكيد',
    cancelLabel = 'إلغاء',
    variant = 'info',
    isLoading = false
}) => {
        if (!isOpen) return null;

        const variantStyles = {
            danger: {
                icon: 'AlertTriangle',
                iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                button: 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
            },
            warning: {
                icon: 'AlertCircle',
                iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
            },
            info: {
                icon: 'Info',
                iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                button: 'bg-primary hover:bg-primary-dark shadow-primary/30'
            }
        };

        const styles = variantStyles[variant];

        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            >
                <div
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${styles.iconBg}`}>
                            <Icon name={styles.icon} className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{message}</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 
                            dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 
                            rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 text-white rounded-xl font-bold shadow-lg 
                            transition-all disabled:opacity-50 flex items-center justify-center gap-2
                            ${styles.button}`}
                        >
                            {isLoading ? (
                                <>
                                    <Icon name="Loader" className="w-4 h-4 animate-spin" />
                                    جاري التنفيذ...
                                </>
                            ) : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        );
    };