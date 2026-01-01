import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <textarea
                        className={cn(
                            "flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-primary",
                            error ? "border-red-500 focus-visible:ring-red-500" : "",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{error}</p>
                )}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
