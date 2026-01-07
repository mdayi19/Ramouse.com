import React from 'react';
import { Star } from 'lucide-react';

interface ConditionPreset {
    id: string;
    label: string;
    stars: number;
    condition: 'new' | 'used' | 'certified_pre_owned';
    bodyCondition: string;
}

const PRESETS: ConditionPreset[] = [
    {
        id: 'excellent',
        label: 'ممتازة',
        stars: 5,
        condition: 'new',
        bodyCondition: JSON.stringify({ front: 'pristine', rear: 'pristine', left: 'pristine', right: 'pristine' })
    },
    {
        id: 'very-good',
        label: 'جيدة جداً',
        stars: 4,
        condition: 'certified_pre_owned',
        bodyCondition: JSON.stringify({ front: 'good', rear: 'good', left: 'good', right: 'good' })
    },
    {
        id: 'good',
        label: 'جيدة',
        stars: 3,
        condition: 'used',
        bodyCondition: JSON.stringify({ front: 'good', rear: 'good', left: 'scratched', right: 'good' })
    },
    {
        id: 'fair',
        label: 'بحاجة إصلاح',
        stars: 2,
        condition: 'used',
        bodyCondition: JSON.stringify({ front: 'scratched', rear: 'scratched', left: 'dented', right: 'scratched' })
    }
];

interface ConditionPresetsProps {
    onSelect: (preset: ConditionPreset) => void;
    selectedId?: string;
}

export const ConditionPresets: React.FC<ConditionPresetsProps> = ({
    onSelect,
    selectedId
}) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                اختر حالة السيارة
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        type="button"
                        onClick={() => onSelect(preset)}
                        className={`
                            p-4 rounded-xl border-2 transition-all hover:scale-105
                            ${selectedId === preset.id
                                ? 'border-primary bg-primary/10 shadow-lg'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary/50'
                            }
                        `}
                    >
                        <div className="flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${i < preset.stars
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className={`text-center font-bold ${selectedId === preset.id ? 'text-primary' : 'text-slate-900 dark:text-white'
                            }`}>
                            {preset.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
