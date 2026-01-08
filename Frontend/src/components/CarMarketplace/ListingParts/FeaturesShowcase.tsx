import React from 'react';
import { Shield, Music, Cpu, Palette, Zap, Wind, Snowflake, Sun } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CarListing } from '../../../services/carprovider.service';
import { Badge } from '../../ui/Badge';

interface FeaturesShowcaseProps {
    listing: CarListing;
    className?: string;
}

interface FeatureCategory {
    id: string;
    label: string;
    icon: any;
    color: string;
    bgColor: string;
    features: string[];
}

const FeaturesShowcase: React.FC<FeaturesShowcaseProps> = ({ listing, className }) => {
    // Early return if no features
    if (!listing.features || !Array.isArray(listing.features) || listing.features.length === 0) {
        return null;
    }

    // Categorize features based on keywords
    const categorizeFeatures = (): FeatureCategory[] => {
        const safety: string[] = [];
        const comfort: string[] = [];
        const technology: string[] = [];
        const exterior: string[] = [];
        const climate: string[] = [];
        const other: string[] = [];

        // Now TypeScript knows features is defined and is an array
        listing.features!.forEach((feature: string) => {
            const lower = feature.toLowerCase();

            if (lower.includes('أمان') || lower.includes('فرامل') || lower.includes('abs') || lower.includes('وسادة')) {
                safety.push(feature);
            } else if (lower.includes('صوت') || lower.includes('مقاعد') || lower.includes('جلد') || lower.includes('راحة')) {
                comfort.push(feature);
            } else if (lower.includes('تقنية') || lower.includes('شاشة') || lower.includes('كاميرا') || lower.includes('حساسات') || lower.includes('bluetooth')) {
                technology.push(feature);
            } else if (lower.includes('فتحة') || lower.includes('جنوط') || lower.includes('مصابيح') || lower.includes('led')) {
                exterior.push(feature);
            } else if (lower.includes('تكييف') || lower.includes('تدفئة') || lower.includes('مناخ')) {
                climate.push(feature);
            } else {
                other.push(feature);
            }
        });

        const categories: FeatureCategory[] = [];

        if (safety.length > 0) {
            categories.push({
                id: 'safety',
                label: 'السلامة',
                icon: Shield,
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                features: safety
            });
        }

        if (comfort.length > 0) {
            categories.push({
                id: 'comfort',
                label: 'الراحة',
                icon: Music,
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                features: comfort
            });
        }

        if (technology.length > 0) {
            categories.push({
                id: 'technology',
                label: 'التقنية',
                icon: Cpu,
                color: 'text-purple-600 dark:text-purple-400',
                bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                features: technology
            });
        }

        if (climate.length > 0) {
            categories.push({
                id: 'climate',
                label: 'التحكم بالمناخ',
                icon: Snowflake,
                color: 'text-cyan-600 dark:text-cyan-400',
                bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
                features: climate
            });
        }

        if (exterior.length > 0) {
            categories.push({
                id: 'exterior',
                label: 'خارجي',
                icon: Sun,
                color: 'text-amber-600 dark:text-amber-400',
                bgColor: 'bg-amber-50 dark:bg-amber-900/20',
                features: exterior
            });
        }

        if (other.length > 0) {
            categories.push({
                id: 'other',
                label: 'مميزات أخرى',
                icon: Zap,
                color: 'text-slate-600 dark:text-slate-400',
                bgColor: 'bg-slate-50 dark:bg-slate-900/20',
                features: other
            });
        }

        return categories;
    };

    const categories = categorizeFeatures();

    return (
        <div className={cn('bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6', className)}>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                المميزات
            </h2>

            <div className="space-y-6">
                {categories.map((category, catIndex) => {
                    const Icon = category.icon;
                    return (
                        <div
                            key={category.id}
                            className={cn(
                                'animate-slide-up-fade rounded-xl p-4',
                                category.bgColor
                            )}
                            style={{ animationDelay: `${catIndex * 100}ms` }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className={cn('p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm', category.color)}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    {category.label}
                                </h3>
                                <Badge variant="outline" className="mr-auto">
                                    {category.features.length}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {category.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 p-2 bg-white/50 dark:bg-slate-700/30 rounded-lg"
                                    >
                                        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', category.color.replace('text-', 'bg-'))}></div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FeaturesShowcase;
