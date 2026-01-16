import React from 'react';
import { Sparkles, DollarSign, TrendingUp, Crown, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface FilterPreset {
    id: string;
    name: string;
    icon: React.ReactNode;
    filters: {
        min_price?: number;
        max_price?: number;
        min_year?: number;
        features?: string[];
        category?: string;
    };
}

const FILTER_PRESETS: FilterPreset[] = [
    {
        id: 'luxury',
        name: 'سيارات فاخرة',
        icon: <Crown className="w-4 h-4" />,
        filters: {
            min_price: 50000000,
            min_year: 2020,
            features: ['مقاعد جلد', 'فتحة سقف', 'نظام صوتي فاخر']
        }
    },
    {
        id: 'budget',
        name: 'اقتصادية',
        icon: <DollarSign className="w-4 h-4" />,
        filters: {
            max_price: 20000000,
            features: ['موفر للوقود']
        }
    },
    {
        id: 'new',
        name: 'موديلات حديثة',
        icon: <Sparkles className="w-4 h-4" />,
        filters: {
            min_year: new Date().getFullYear() - 2
        }
    },
    {
        id: 'performance',
        name: 'عالية الأداء',
        icon: <Zap className="w-4 h-4" />,
        filters: {
            features: ['وضعية رياضية', 'تيربو', 'دفع رباعي']
        }
    },
    {
        id: 'trending',
        name: 'الأكثر طلباً',
        icon: <TrendingUp className="w-4 h-4" />,
        filters: {
            min_year: 2019,
            min_price: 20000000,
            max_price: 50000000
        }
    }
];

interface FilterPresetsProps {
    onApplyPreset: (filters: FilterPreset['filters']) => void;
    currentFilters?: any;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({ onApplyPreset, currentFilters }) => {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                فلاتر جاهزة
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {FILTER_PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => onApplyPreset(preset.filters)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                            'border-2 border-slate-200 dark:border-slate-700',
                            'hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10',
                            'text-slate-700 dark:text-slate-300'
                        )}
                    >
                        <span className="text-primary">{preset.icon}</span>
                        <span className="text-xs">{preset.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterPresets;
