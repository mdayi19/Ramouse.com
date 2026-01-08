import React, { useState } from 'react';
import { Calendar, Gauge, Settings, Fuel, Zap, Palette, Package, Shield, ExternalLink } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CarListing } from '../../../services/carprovider.service';

interface SpecificationsTabsProps {
    listing: CarListing;
    className?: string;
}

type TabType = 'overview' | 'performance' | 'features' | 'additional';

const SpecificationsTabs: React.FC<SpecificationsTabsProps> = ({ listing, className }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const tabs = [
        { id: 'overview' as TabType, label: 'نظرة عامة', icon: Package },
        { id: 'performance' as TabType, label: 'الأداء', icon: Zap },
        { id: 'features' as TabType, label: 'المميزات', icon: Shield },
        { id: 'additional' as TabType, label: 'إضافي', icon: ExternalLink },
    ];

    // Helper function to translate values
    const translateValue = (val: string | undefined): string => {
        if (!val) return '';
        const translations: Record<string, string> = {
            automatic: 'أوتوماتيك',
            manual: 'عادي',
            gasoline: 'بنزين',
            diesel: 'ديزل',
            electric: 'كهرباء',
            hybrid: 'هجين',
            new: 'جديدة',
            used: 'مستعملة',
            certified_pre_owned: 'مستعملة معتمدة',
        };
        return translations[val.toLowerCase()] || val;
    };

    const SpecItem: React.FC<{ icon: any; label: string; value: any }> = ({ icon: Icon, label, value }) => {
        if (value === undefined || value === null || value === '' || typeof value === 'object') return null;

        return (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
                    <p className="font-medium text-slate-900 dark:text-white capitalize line-clamp-2">
                        {typeof value === 'string' ? translateValue(value) : value}
                    </p>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <SpecItem icon={Calendar} label="السنة" value={listing.year} />
                        <SpecItem icon={Gauge} label="الممشى" value={`${listing.mileage?.toLocaleString()} كم`} />
                        <SpecItem icon={Settings} label="ناقل الحركة" value={listing.transmission} />
                        <SpecItem icon={Fuel} label="نوع الوقود" value={listing.fuel_type} />
                        <SpecItem icon={Palette} label="اللون الخارجي" value={listing.exterior_color} />
                        <SpecItem icon={Palette} label="اللون الداخلي" value={listing.interior_color} />
                    </div>
                );

            case 'performance':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <SpecItem icon={Zap} label="قوة المحرك" value={listing.horsepower ? `${listing.horsepower} حصان` : null} />
                        <SpecItem icon={Settings} label="حجم المحرك" value={listing.engine_size} />
                        <SpecItem icon={Fuel} label="نوع الوقود" value={listing.fuel_type} />
                        <SpecItem icon={Settings} label="ناقل الحركة" value={listing.transmission} />
                    </div>
                );

            case 'features':
                return listing.features && Array.isArray(listing.features) && listing.features.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {listing.features.map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">لا توجد مميزات مدرجة</p>
                );

            case 'additional':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <SpecItem icon={Package} label="نمط الهيكل" value={listing.category?.name_ar || listing.category?.name} />
                        <SpecItem icon={Settings} label="عدد الأبواب" value={listing.doors_count} />
                        <SpecItem icon={Settings} label="عدد المقاعد" value={listing.seats_count} />
                        <SpecItem icon={Shield} label="الضمان" value={listing.warranty} />
                        {listing.license_plate && <SpecItem icon={ExternalLink} label="رقم اللوحة" value={listing.license_plate} />}
                        {listing.chassis_number && <SpecItem icon={ExternalLink} label="رقم الهيكل" value={listing.chassis_number} />}
                        {listing.previous_owners !== undefined && listing.previous_owners !== null && (
                            <SpecItem icon={Package} label="عدد الملاك السابقين" value={`${listing.previous_owners} مالك`} />
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={cn('bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden', className)}>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 sm:px-6 py-4 font-medium text-sm sm:text-base whitespace-nowrap transition-all flex-1 sm:flex-none',
                                activeTab === tab.id
                                    ? 'text-primary border-b-2 border-primary bg-blue-50/50 dark:bg-blue-900/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 animate-fade-in">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SpecificationsTabs;
