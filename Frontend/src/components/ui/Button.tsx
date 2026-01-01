import * as React from "react"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"
import Icon from "../Icon"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' | 'success' | 'warning';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    icon?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "default", isLoading, leftIcon, rightIcon, icon, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

        const variants = {
            primary: "bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/25 hover:shadow-primary/40",
            secondary: "bg-secondary text-slate-900 hover:bg-secondary-500 shadow-lg shadow-secondary/25",
            outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
            ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
            danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
            success: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25 transition-colors",
            warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25",
            link: "text-primary underline-offset-4 hover:underline",
        };

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-lg px-3",
            lg: "h-12 rounded-xl px-8 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && icon && <Icon name={icon as any} className="mr-2 h-4 w-4" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
