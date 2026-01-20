import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-primary text-white hover:bg-primary-800 focus:ring-primary/20 shadow-lg hover:shadow-xl',
            secondary: 'bg-secondary text-slate-900 hover:bg-secondary-500 focus:ring-secondary/20 shadow-md hover:shadow-lg',
            outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/20',
            ghost: 'text-primary hover:bg-primary/10 focus:ring-primary/20',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20 shadow-lg hover:shadow-xl',
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm min-h-[36px]',
            md: 'px-6 py-3 text-base min-h-[44px]',
            lg: 'px-8 py-4 text-lg min-h-[52px]',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {!isLoading && leftIcon && leftIcon}
                {children}
                {!isLoading && rightIcon && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';
