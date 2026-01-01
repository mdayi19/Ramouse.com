import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <label className={cn(
                "flex items-center gap-2 cursor-pointer group",
                props.disabled && "cursor-not-allowed opacity-50",
                className
            )}>
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        className="peer appearance-none h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-950 checked:bg-primary checked:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed"
                        ref={ref}
                        {...props}
                    />
                    <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                </div>
                {label && (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {label}
                    </span>
                )}
                {error && (
                    <span className="text-xs text-red-500">{error}</span>
                )}
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
