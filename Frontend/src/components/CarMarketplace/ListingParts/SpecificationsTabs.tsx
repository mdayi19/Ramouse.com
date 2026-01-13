import React, { useState } from 'react';
import { Calendar, Gauge, Settings, Fuel, Zap, Palette, Package, Shield, ExternalLink, FileText, Sparkles, Car as CarIcon, DoorClosed } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CarListing } from '../../../services/carprovider.service';

interface SpecificationsTabsProps {
    listing: CarListing;
    className?: string;
}

type TabType = 'overview' | 'performance' | 'features' | 'additional';

const SpecificationsTabs: React.FC<SpecificationsTabsProps> = ({ listing, className }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showFullDescription, setShowFullDescription] = useState(false);

    const tabs = [
        { id: 'overview' as TabType, label: 'نظرة عامة', icon: Package },
        { id: 'performance' as TabType, label: 'الأداء', icon: Zap },
        { id: 'features' as TabType, label: 'المميزات', icon: Sparkles },
        { id: 'additional' as TabType, label: 'إضافي', icon: Shield },
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
            fwd: 'دفع أمامي',
            rwd: 'دفع خلفي',
            awd: 'دفع رباعي',
            '4wd': 'دفع رباعي',
            sedan: 'سيدان',
            suv: 'دفع رباعي',
            coupe: 'كوبيه',
            hatchback: 'هاتشباك',
            convertible: 'مكشوفة',
            truck: 'شاحنة',
            van: 'فان',
            minivan: 'ميني فان',
            wagon: 'ستيشن واغن',
            'sale': 'للبيع',
            'rent': 'للإيجار',
        };
        return translations[val.toLowerCase()] || val;
    };

    const SpecItem: React.FC<{ icon: any; label: string; value: any }> = ({ icon: Icon, label, value }) => {
        if (value === undefined || value === null || value === '' || typeof value === 'object' && !Array.isArray(value)) return null;

        return (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 group">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-500 dark:group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-200 flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">{label}</p>
                    <p className="font-bold text-slate-900 dark:text-white text-base capitalize line-clamp-2">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SpecItem icon={Calendar} label="السنة" value={listing.year} />
                        <SpecItem icon={Gauge} label="المسافة المقطوعة" value={listing.mileage ? `${listing.mileage?.toLocaleString()} كم` : null} />
                        <SpecItem icon={Package} label="الحالة" value={listing.condition} />
                        <SpecItem icon={Palette} label="اللون الخارجي" value={listing.exterior_color} />
                        <SpecItem icon={Palette} label="اللون الداخلي" value={listing.interior_color} />
                        <SpecItem icon={CarIcon} label="نوع الهيكل" value={listing.category?.name_ar || listing.category?.name} />
                        <SpecItem icon={DoorClosed} label="عدد الأبواب" value={listing.doors_count} />
                        <SpecItem icon={Settings} label="عدد المقاعد" value={listing.seats_count} />
                    </div>
                );

            case 'performance':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SpecItem icon={Settings} label="ناقل الحركة" value={listing.transmission} />
                        <SpecItem icon={Fuel} label="نوع الوقود" value={listing.fuel_type} />
                        <SpecItem icon={Zap} label="قوة المحرك" value={listing.horsepower ? `${listing.horsepower} حصان` : null} />
                        <SpecItem icon={Settings} label="حجم المحرك" value={listing.engine_size ? `${listing.engine_size} CC` : null} />
                        <SpecItem icon={Gauge} label="نظام الدفع" value={listing.drive_type} />
                        <SpecItem icon={Settings} label="نوع المحرك" value={listing.engine_type} />
                    </div>
                );

            case 'features':
                return listing.features && Array.isArray(listing.features) && listing.features.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listing.features.map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200 group">
                                <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-150 transition-transform flex-shrink-0"></div>
                                <span className="text-base font-semibold text-slate-800 dark:text-slate-200">{feature}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <Sparkles className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">لا توجد مميزات مدرجة</p>
                    </div>
                );

            case 'additional':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SpecItem icon={Shield} label="الضمان" value={listing.warranty} />
                        <SpecItem icon={ExternalLink} label="رقم اللوحة" value={listing.license_plate} />
                        <SpecItem icon={ExternalLink} label="رقم الهيكل" value={listing.chassis_number} />
                        <SpecItem icon={Package} label="عدد الملاك السابقين" value={listing.previous_owners !== undefined && listing.previous_owners !== null ? `${listing.previous_owners} مالك` : null} />
                        <SpecItem icon={Settings} label="نوع البيع" value={listing.listing_type === 'sale' ? 'للبيع' : 'للإيجار'} />
                        <SpecItem icon={Calendar} label="تاريخ الإنشاء" value={listing.created_at ? new Date(listing.created_at).toLocaleDateString('ar-SA') : null} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Description Section - Outside tabs */}
            {listing.description && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">الوصف</h3>
                    </div>
                    <div className="relative">
                        <p className={cn(
                            "text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-base transition-all duration-300",
                            !showFullDescription && listing.description.length > 300 && "line-clamp-3"
                        )}>
                            {listing.description}
                        </p>
                        {listing.description.length > 300 && (
                            <button
                                onClick={() => setShowFullDescription(!showFullDescription)}
                                className="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm flex items-center gap-1 transition-colors"
                            >
                                {showFullDescription ? (
                                    <>
                                        <span>عرض أقل</span>
                                        <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>عرض المزيد</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs Section */}
            <div className={cn('bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700', className)}>
                {/* Tabs */}
                <div className="flex border-b-2 border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar bg-slate-50 dark:bg-slate-900/50">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2.5 px-5 sm:px-8 py-4 font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-200 flex-1 sm:flex-none relative',
                                    activeTab === tab.id
                                        ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                                )}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full"></div>
                                )}
                                <Icon className={cn(
                                    "w-5 h-5 flex-shrink-0 transition-all duration-200",
                                    activeTab === tab.id && "scale-110"
                                )} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 animate-fade-in">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default SpecificationsTabs;
