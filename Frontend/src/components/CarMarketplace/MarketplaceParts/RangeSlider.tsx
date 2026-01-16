import React from 'react';
import { cn } from '../../../lib/utils';

interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
    formatLabel?: (value: number) => string;
    className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    value,
    onChange,
    step = 1,
    formatLabel = (val) => val.toString(),
    className
}) => {
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Number(e.target.value);
        // Ensure min doesn't cross max
        onChange([Math.min(newMin, value[1]), value[1]]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Number(e.target.value);
        // Ensure max doesn't cross min
        onChange([value[0], Math.max(newMax, value[0])]);
    };

    // Calculate percentages for track background
    const minPercent = Math.min(Math.max(((value[0] - min) / (max - min)) * 100, 0), 100);
    const maxPercent = Math.min(Math.max(((value[1] - min) / (max - min)) * 100, 0), 100);

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-700 dark:text-slate-300">
                    {formatLabel(value[0])}
                </span>
                <span className="text-slate-400">-</span>
                <span className="text-slate-700 dark:text-slate-300">
                    {formatLabel(value[1])}
                </span>
            </div>

            <div className="relative h-2 py-2">
                {/* Track Background */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />

                {/* Selected Range Highlight */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full transition-all duration-75"
                    style={{
                        left: `${minPercent}%`,
                        right: `${100 - maxPercent}%`
                    }}
                />

                {/* Min Range Input (Invisible logic, visible thumb) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={handleMinChange}
                    className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-transparent appearance-none pointer-events-none 
                    [&::-webkit-slider-thumb]:pointer-events-auto 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-slate-800
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary 
                    [&::-webkit-slider-thumb]:cursor-pointer 
                    [&::-webkit-slider-thumb]:shadow-md 
                    [&::-webkit-slider-thumb]:hover:scale-110 
                    [&::-webkit-slider-thumb]:transition-transform z-20"
                />

                {/* Max Range Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[1]}
                    onChange={handleMaxChange}
                    className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-transparent appearance-none pointer-events-none 
                    [&::-webkit-slider-thumb]:pointer-events-auto 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-slate-800
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary 
                    [&::-webkit-slider-thumb]:cursor-pointer 
                    [&::-webkit-slider-thumb]:shadow-md 
                    [&::-webkit-slider-thumb]:hover:scale-110 
                    [&::-webkit-slider-thumb]:transition-transform z-10"
                />
            </div>

            {/* Manual Input Fields */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        من
                    </label>
                    <input
                        type="number"
                        value={value[0]}
                        onChange={handleMinChange}
                        min={min}
                        max={value[1]}
                        step={step}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        إلى
                    </label>
                    <input
                        type="number"
                        value={value[1]}
                        onChange={handleMaxChange}
                        min={value[0]}
                        max={max}
                        step={step}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>
        </div>
    );
};
