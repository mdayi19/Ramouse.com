import React from 'react';
import { cn } from '../../../lib/utils';

interface PriceRangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    currency?: string;
    step?: number;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
    min,
    max,
    value,
    onChange,
    currency = 'SYP',
    step = 100000
}) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-SY', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(price);
    };

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Number(e.target.value);
        onChange([Math.min(newMin, value[1]), value[1]]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Number(e.target.value);
        onChange([value[0], Math.max(newMax, value[0])]);
    };

    const minPercent = ((value[0] - min) / (max - min)) * 100;
    const maxPercent = ((value[1] - min) / (max - min)) * 100;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-700 dark:text-slate-300">
                    {formatPrice(value[0])}
                </span>
                <span className="text-slate-400">-</span>
                <span className="text-slate-700 dark:text-slate-300">
                    {formatPrice(value[1])}
                </span>
            </div>

            <div className="relative h-2">
                {/* Track */}
                <div className="absolute w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />

                {/* Selected range */}
                <div
                    className="absolute h-2 bg-primary rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        right: `${100 - maxPercent}%`
                    }}
                />

                {/* Min slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={handleMinChange}
                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />

                {/* Max slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[1]}
                    onChange={handleMaxChange}
                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
            </div>

            {/* Input fields */}
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

export default PriceRangeSlider;
