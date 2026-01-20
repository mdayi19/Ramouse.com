import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined' | 'glass';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            className,
            variant = 'default',
            padding = 'md',
            hover = false,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'rounded-2xl transition-all';

        const variants = {
            default: 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700',
            elevated: 'bg-white dark:bg-slate-800 shadow-lg',
            outlined: 'bg-transparent border-2 border-slate-200 dark:border-slate-700',
            glass: 'backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl',
        };

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        const hoverStyles = hover ? 'hover:shadow-xl hover:-translate-y-1' : '';

        return (
            <div
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    paddings[padding],
                    hoverStyles,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    action,
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('flex items-start justify-between mb-4', className)}
            {...props}
        >
            <div className="flex-1">
                {title && (
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                )}
                {subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
            {action && <div className="ml-4">{action}</div>}
        </div>
    );
};

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> { }

export const CardBody: React.FC<CardBodyProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
};

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export const CardFooter: React.FC<CardFooterProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                'mt-4 pt-4 border-t border-slate-100 dark:border-slate-700',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

CardFooter.displayName = 'CardFooter';
