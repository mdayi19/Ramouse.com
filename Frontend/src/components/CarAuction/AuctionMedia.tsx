import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../Icon';
import { Auction } from '../../types';

interface AuctionMediaProps {
    images: string[];
    currentImageIndex: number;
    setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
    auction: Auction;
    hasEnded: boolean;
}

export const AuctionMedia: React.FC<AuctionMediaProps> = ({
    images,
    currentImageIndex,
    setCurrentImageIndex,
    auction,
    hasEnded,
}) => {
    return (
        <div className="lg:col-span-2 order-1">
            <div className="group relative bg-slate-800/50 rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-sm border border-white/10 shadow-xl">
                <div className="relative h-60 sm:h-80 md:h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentImageIndex}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            src={images[currentImageIndex] || '/placeholder-car.jpg'}
                            alt={auction.title}
                            className="w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 !w-10 !h-10 md:!w-12 md:!h-12 !bg-black/30 backdrop-blur-md !text-white hover:!bg-black/50 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icon name="ChevronLeft" className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentImageIndex(i => Math.min(images.length - 1, i + 1))}
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 !w-10 !h-10 md:!w-12 md:!h-12 !bg-black/30 backdrop-blur-md !text-white hover:!bg-black/50 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icon name="ChevronRight" className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                        </>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentImageIndex(i)}
                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4 md:w-6' : 'bg-white/40 hover:bg-white/60'}`}
                            />
                        ))}
                    </div>

                    {/* Ended Overlay */}
                    {hasEnded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10"
                        >
                            <div className="text-center text-white p-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-yellow-500/20"
                                >
                                    <Icon name="Trophy" className="w-8 h-8 md:w-12 md:h-12 text-white" />
                                </motion.div>
                                <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">انتهى المزاد</h2>
                                {auction.winner_name && (
                                    <div className="bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-md border border-white/10 mt-2 md:mt-4">
                                        <p className="text-sm md:text-lg text-slate-300">الفائز بالمزاد</p>
                                        <p className="font-bold text-lg md:text-2xl text-white">{auction.winner_name}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
