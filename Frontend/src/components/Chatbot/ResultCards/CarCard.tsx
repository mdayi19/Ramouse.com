import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Calendar, Gauge, Settings } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface CarCardProps {
    id: number;
    title: string;
    price: string;
    year: number;
    mileage: string;
    city: string;
    brand?: string;
    model?: string;
    image?: string;
    url: string;
    condition: string;
    transmission: string;
}

export const CarCard: React.FC<CarCardProps> = ({
    title,
    price,
    year,
    mileage,
    city,
    brand,
    model,
    image,
    url,
    condition,
    transmission
}) => {
    const conditionLabels: Record<string, string> = {
        new: 'جديد',
        used: 'مستعمل',
        certified_pre_owned: 'مستعمل معتمد'
    };

    const transmissionLabels: Record<string, string> = {
        automatic: 'أوتوماتيك',
        manual: 'عادي'
    };

    return (
        <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800 hover:border-primary transition-all",
                "group cursor-pointer no-underline"
            )}
        >
            {/* Car Image */}
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        🚗
                    </div>
                )}
            </div>

            {/* Car Details */}
            <div className="flex-1 min-w-0">
                {/* Title */}
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mb-1 group-hover:text-primary transition-colors">
                    {title}
                </h4>

                {/* Price */}
                <div className="text-lg font-bold text-primary mb-2">
                    {price}
                </div>

                {/* Specs */}
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {year}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                        <Gauge className="w-3 h-3" />
                        {mileage}
                    </span>
                    {transmission && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                            <Settings className="w-3 h-3" />
                            {transmissionLabels[transmission] || transmission}
                        </span>
                    )}
                    {city && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {city}
                        </span>
                    )}
                </div>
            </div>

            {/* External Link Icon */}
            <div className="flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
        </motion.a>
    );
};
