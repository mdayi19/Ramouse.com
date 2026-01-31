import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Star, BadgeCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TechnicianCardProps {
    id: number;
    name: string;
    specialty: string;
    rating: number;
    city: string;
    distance?: string;
    isVerified: boolean;
    phone: string;
}

export const TechnicianCard: React.FC<TechnicianCardProps> = ({
    name,
    specialty,
    rating,
    city,
    distance,
    isVerified,
    phone
}) => {
    const handleCall = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = `tel:${phone}`;
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                    </div>

                    {/* Name & Specialty */}
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            {name}
                            {isVerified && (
                                <BadgeCheck className="w-4 h-4 text-primary" />
                            )}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{specialty}</p>
                    </div>
                </div>

                {/* Rating */}
                {rating > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {rating.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{city}</span>
                {distance && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        {distance}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                    onClick={handleCall}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-xs font-medium"
                >
                    <Phone className="w-3.5 h-3.5" />
                    اتصال
                </button>
                <button
                    onClick={handleWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-xs font-medium"
                >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.304-1.654a11.882 11.882 0 005.713 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    واتساب
                </button>
            </div>
        </motion.div>
    );
};
