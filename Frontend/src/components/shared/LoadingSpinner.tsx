import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    text,
    fullScreen = false,
}) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2
                className={cn(
                    'animate-spin text-primary',
                    sizes[size],
                    className
                )}
                aria-label="جاري التحميل"
            />
            {text && (
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                role="status"
                aria-live="polite"
            >
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
            {spinner}
        </div>
    );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'rectangular',
    width,
    height,
    animation = true,
    className,
    ...props
}) => {
    const variants = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    return (
        <div
            className={cn(
                'bg-slate-200 dark:bg-slate-700',
                animation && 'animate-pulse',
                variants[variant],
                className
            )}
            style={{
                width: width || (variant === 'text' ? '100%' : undefined),
                height: height || (variant === 'circular' ? width : undefined),
            }}
            role="status"
            aria-label="جاري التحميل"
            {...props}
        />
    );
};

Skeleton.displayName = 'Skeleton';
