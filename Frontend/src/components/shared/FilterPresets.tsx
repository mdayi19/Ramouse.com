import React from 'react';
import { Save, Star, Trash2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterPreset {
    id: string;
    name: string;
    filters: Record<string, any>;
    isDefault?: boolean;
    createdAt?: Date;
}

export interface FilterPresetsProps {
    presets: FilterPreset[];
    currentFilters: Record<string, any>;
    onApplyPreset: (preset: FilterPreset) => void;
    onSavePreset: (name: string, filters: Record<string, any>) => void;
    onDeletePreset: (id: string) => void;
    onSetDefault?: (id: string) => void;
    className?: string;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
    presets,
    currentFilters,
    onApplyPreset,
    onSavePreset,
    onDeletePreset,
    onSetDefault,
    className,
}) => {
    const [isCreating, setIsCreating] = React.useState(false);
    const [presetName, setPresetName] = React.useState('');

    const handleSave = () => {
        if (presetName.trim()) {
            onSavePreset(presetName.trim(), currentFilters);
            setPresetName('');
            setIsCreating(false);
        }
    };

    const hasActiveFilters = Object.values(currentFilters).some(
        (v) => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
    );

    return (
        <div className={cn('space-y-3', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    الفلاتر المحفوظة
                </h3>
                {hasActiveFilters && !isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        type="button"
                    >
                        <Save className="w-3.5 h-3.5" />
                        حفظ الفلتر الحالي
                    </button>
                )}
            </div>

            {/* Create New Preset */}
            {isCreating && (
                <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="اسم الفلتر..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') {
                                setIsCreating(false);
                                setPresetName('');
                            }
                        }}
                        aria-label="اسم الفلتر المحفوظ"
                    />
                    <button
                        onClick={handleSave}
                        disabled={!presetName.trim()}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        type="button"
                        aria-label="حفظ"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setIsCreating(false);
                            setPresetName('');
                        }}
                        className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        type="button"
                        aria-label="إلغاء"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Preset List */}
            {presets.length > 0 ? (
                <div className="space-y-2">
                    {presets.map((preset) => (
                        <div
                            key={preset.id}
                            className="group flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                            <button
                                onClick={() => onApplyPreset(preset)}
                                className="flex-1 flex items-center gap-2 text-right"
                                type="button"
                            >
                                {preset.isDefault && (
                                    <Star className="w-4 h-4 text-secondary fill-current" />
                                )}
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {preset.name}
                                </span>
                            </button>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onSetDefault && !preset.isDefault && (
                                    <button
                                        onClick={() => onSetDefault(preset.id)}
                                        className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded transition-colors"
                                        title="تعيين كافتراضي"
                                        aria-label="تعيين كافتراضي"
                                        type="button"
                                    >
                                        <Star className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => onDeletePreset(preset.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    aria-label="حذف"
                                    type="button"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    لا توجد فلاتر محفوظة
                </div>
            )}
        </div>
    );
};

FilterPresets.displayName = 'FilterPresets';
