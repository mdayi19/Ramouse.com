import React from 'react';
import { Calendar, Gauge, Settings, Fuel, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CarListing } from '../../../services/carprovider.service';

interface QuickSpecsBarProps {
    listing: CarListing;
    className?: string;
}

const QuickSpecsBar: React.FC<QuickSpecsBarProps> = ({ listing, className }) => {
    const specs = [
        {
            icon: Calendar,
            label: 'السنة',
            value: listing.year,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            icon: Gauge,
            label: 'الكيلومترات',
            value: listing.mileage ? `${listing.mileage.toLocaleString('ar-SY')} كم` : null,
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
        {
            icon: Settings,
            label: 'ناقل الحركة',
            value: listing.transmission === 'automatic' ? 'أوتوماتيك' : listing.transmission === 'manual' ? 'عادي' : listing.transmission,
            color: 'text-green-500',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
        {
            icon: Fuel,
            label: 'نوع الوقود',
            value: listing.fuel_type === 'gasoline' ? 'بنزين'
                : listing.fuel_type === 'diesel' ? 'ديزل'
                    : listing.fuel_type === 'electric' ? 'كهرباء'
                        : listing.fuel_type === 'hybrid' ? 'هجين'
                            : listing.fuel_type,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        },
        {
            icon: Zap,
            label: 'قوة المحرك',
            value: listing.horsepower ? `${listing.horsepower} حصان` : null,
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
        },
    ].filter(spec => spec.value); // Filter out null values

    if (specs.length === 0) return null;

    return (
        <div
            className={cn(
                'bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-100 dark:border-slate-700',
                'animate-slide-up-fade',
                className
            )}
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {specs.map((spec, index) => {
                    const Icon = spec.icon;
                    return (
                        <div
                            key={index}
                            className={cn(
                                'flex flex-col items-center text-center p-3 sm:p-4 rounded-xl transition-all',
                                'hover:scale-105 hover:shadow-md cursor-default',
                                spec.bgColor
                            )}
                        >
                            <div className={cn(
                                'p-2.5 rounded-full mb-2',
                                'bg-white dark:bg-slate-800 shadow-sm',
                                spec.color
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                                {spec.label}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                                {spec.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickSpecsBar;
