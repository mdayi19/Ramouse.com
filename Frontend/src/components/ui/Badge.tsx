import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' | 'purple' | 'orange' | 'sky' | 'teal' | 'indigo';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {

    const variants = {
        default: "border-transparent bg-primary text-slate-50 hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-slate-900 hover:bg-secondary/80",
        destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
        success: "border-transparent bg-emerald-500 text-slate-50 hover:bg-emerald-500/80",
        warning: "border-transparent bg-amber-500 text-white hover:bg-amber-500/80",
        info: "border-transparent bg-blue-500 text-slate-50 hover:bg-blue-500/80",
        purple: "border-transparent bg-purple-500 text-slate-50 hover:bg-purple-500/80",
        orange: "border-transparent bg-orange-500 text-slate-50 hover:bg-orange-500/80",
        sky: "border-transparent bg-sky-500 text-slate-50 hover:bg-sky-500/80",
        teal: "border-transparent bg-teal-500 text-slate-50 hover:bg-teal-500/80",
        indigo: "border-transparent bg-indigo-500 text-slate-50 hover:bg-indigo-500/80",
        outline: "text-slate-950 dark:text-slate-50",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
