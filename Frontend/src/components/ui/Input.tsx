import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    icon?: React.ReactNode;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, icon, startIcon, endIcon, ...props }, ref) => {
        const rightIcon = endIcon || icon;
        const leftIcon = startIcon;

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-primary",
                            leftIcon ? "pl-10" : "",
                            rightIcon ? "pr-10" : "",
                            error ? "border-red-500 focus-visible:ring-red-500" : "",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
