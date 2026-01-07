import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconCardProps {
    icon: LucideIcon;
    label: string;
    selected: boolean;
    onClick: () => void;
    badge?: string;
    subtitle?: string;
}

export const IconCard: React.FC<IconCardProps> = ({
    icon: Icon,
    label,
    selected,
    onClick,
    badge,
    subtitle
}) => {
    return (
        <div
            className={`
                relative cursor-pointer rounded-xl p-6 border-2 transition-all
                hover:scale-105 hover:shadow-xl
                ${selected
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary/50'
                }
            `}
            onClick={onClick}
        >
            {badge && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-xs rounded-full font-bold">
                    {badge}
                </span>
            )}
            <Icon
                className={`w-12 h-12 mx-auto mb-3 ${selected ? 'text-primary' : 'text-slate-600 dark:text-slate-400'
                    }`}
            />
            <div className={`text-center font-bold ${selected ? 'text-primary' : 'text-slate-900 dark:text-white'
                }`}>
                {label}
            </div>
            {subtitle && (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {subtitle}
                </div>
            )}
        </div>
    );
};
