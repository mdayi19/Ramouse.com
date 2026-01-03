import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../Icon';
import { Badge } from '../ui/Badge';
import { AuctionStatusBadge } from './AuctionStatusBadge';
import { Auction } from '../../types';

interface AuctionCarDetailsProps {
    auction: Auction;
    car: any;
    showCarDetails: boolean;
    setShowCarDetails: React.Dispatch<React.SetStateAction<boolean>>;
    isLive: boolean;
}

export const AuctionCarDetails: React.FC<AuctionCarDetailsProps> = ({
    auction,
    car,
    showCarDetails,
    setShowCarDetails,
    isLive,
}) => {
    return (
        <div className="lg:col-span-2 order-3">
            <div className="bg-slate-800/50 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-sm border border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                            <AuctionStatusBadge status={auction.status} isLive={isLive} />
                            <h1 className="text-xl md:text-3xl font-black text-white">{auction.title}</h1>
                        </div>
                        {car && (
                            <p className="text-slate-400 font-medium text-sm md:text-base">{car.brand} {car.model} • {car.year}</p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCarDetails(!showCarDetails)}
                        className="!text-primary hover:!bg-primary/10"
                    >
                        {showCarDetails ? 'إخفاء' : 'عرض الكل'}
                        <Icon name={showCarDetails ? 'ChevronUp' : 'ChevronDown'} className="w-4 h-4 mr-1" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                    {car?.mileage && (
                        <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                            <Icon name="Gauge" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                            <p className="text-slate-400 text-[10px] md:text-xs font-medium">الممشى</p>
                            <p className="text-white font-bold text-sm md:text-base">{car.mileage.toLocaleString()}</p>
                        </div>
                    )}
                    {car?.transmission && (
                        <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                            <Icon name="Settings" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                            <p className="text-slate-400 text-[10px] md:text-xs font-medium">القير</p>
                            <p className="text-white font-bold text-sm md:text-base">{car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'}</p>
                        </div>
                    )}
                    {car?.fuel_type && (
                        <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                            <Icon name="Fuel" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                            <p className="text-slate-400 text-[10px] md:text-xs font-medium">الوقود</p>
                            <p className="text-white font-bold text-sm md:text-base">
                                {(() => {
                                    const fuelMap: Record<string, string> = {
                                        'petrol': 'بنزين',
                                        'gasoline': 'بنزين',
                                        'diesel': 'ديزل',
                                        'electric': 'كهربائي',
                                        'hybrid': 'هايبرد',
                                        'plug_in_hybrid': 'هايبرد قابل للشحن',
                                        'hydrogen': 'هيدروجين',
                                        'natural_gas': 'غاز طبيعي',
                                        'lpg': 'غاز مسال',
                                    };
                                    return fuelMap[car.fuel_type.toLowerCase()] || car.fuel_type;
                                })()}
                            </p>
                        </div>
                    )}
                    {car?.exterior_color && (
                        <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                            <Icon name="Palette" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                            <p className="text-slate-400 text-[10px] md:text-xs font-medium">اللون</p>
                            <p className="text-white font-bold text-sm md:text-base capitalize">{car.exterior_color}</p>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showCarDetails && car?.description && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-white/10">
                                <h3 className="text-white font-bold mb-2">الوصف</h3>
                                <p className="text-slate-300 leading-relaxed text-sm md:text-base">{car.description}</p>
                                {car.features && car.features.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-white font-bold mb-2">المميزات</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {car.features.map((feature: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="!bg-slate-700 !text-white border border-white/10">
                                                    <Icon name="Check" className="w-3 h-3 mr-1 text-emerald-400" />
                                                    {feature}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
