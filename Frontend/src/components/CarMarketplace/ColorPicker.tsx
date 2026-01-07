import React from 'react';
import { Check } from 'lucide-react';

interface ColorOption {
    name: string;
    nameAr: string;
    hex: string;
}

interface ColorPickerProps {
    label: string;
    selectedColor: string;
    onChange: (color: string) => void;
}

const COLORS: ColorOption[] = [
    { name: 'white', nameAr: 'أبيض', hex: '#FFFFFF' },
    { name: 'black', nameAr: 'أسود', hex: '#000000' },
    { name: 'silver', nameAr: 'فضي', hex: '#C0C0C0' },
    { name: 'gray', nameAr: 'رمادي', hex: '#808080' },
    { name: 'red', nameAr: 'أحمر', hex: '#DC2626' },
    { name: 'blue', nameAr: 'أزرق', hex: '#2563EB' },
    { name: 'green', nameAr: 'أخضر', hex: '#16A34A' },
    { name: 'yellow', nameAr: 'أصفر', hex: '#EAB308' },
    { name: 'brown', nameAr: 'بني', hex: '#92400E' },
    { name: 'gold', nameAr: 'ذهبي', hex: '#F59E0B' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
    label,
    selectedColor,
    onChange
}) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="grid grid-cols-5 gap-3">
                {COLORS.map(color => (
                    <button
                        key={color.name}
                        type="button"
                        onClick={() => onChange(color.name)}
                        className={`
                            relative flex flex-col items-center gap-2 p-3 rounded-xl border-2
                            transition-all hover:scale-105
                            ${selectedColor === color.name
                                ? 'border-primary shadow-lg'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }
                        `}
                    >
                        <div
                            className={`
                                w-12 h-12 rounded-full
                                ${color.name === 'white' ? 'border-2 border-slate-300' : ''}
                            `}
                            style={{ backgroundColor: color.hex }}
                        >
                            {selectedColor === color.name && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Check className={`w-6 h-6 ${color.name === 'white' || color.name === 'yellow' || color.name === 'silver' ? 'text-slate-700' : 'text-white'}`} />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {color.nameAr}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
