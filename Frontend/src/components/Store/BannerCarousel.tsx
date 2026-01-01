import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../Icon';
import { StoreBanner } from '../../types';
import { Button } from '../ui/Button';

interface BannerCarouselProps {
    banners: StoreBanner[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeBanners = useMemo(() => banners.filter(b => b.isActive), [banners]);

    useEffect(() => {
        if (activeBanners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % activeBanners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeBanners.length]);

    if (activeBanners.length === 0) {
        // Default Static Banner
        return (
            <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-10 rounded-3xl mb-8 overflow-hidden shadow-xl mx-4 sm:mx-8 mt-4 border border-slate-700">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-center sm:text-right">
                        <h1 className="text-3xl sm:text-5xl font-black mb-2 tracking-tight">متجر راموسة</h1>
                        <p className="text-slate-300 text-sm sm:text-lg max-w-md font-medium">أفضل قطع الغيار والإكسسوارات الأصلية بأفضل الأسعار، تصلك أينما كنت.</p>
                    </div>
                    <div className="hidden sm:block">
                        <Icon name="ShoppingBag" className="w-24 h-24 text-white/10 rotate-12" />
                    </div>
                </div>
            </div>
        );
    }

    // ...

    return (
        <div className="relative mx-4 sm:mx-8 mt-4 mb-8 rounded-3xl overflow-hidden shadow-xl h-48 sm:h-72 group bg-slate-900">
            {activeBanners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white flex flex-col items-start">
                        <h2 className="text-2xl sm:text-4xl font-black mb-3 drop-shadow-lg leading-tight max-w-2xl">{banner.title}</h2>
                        {banner.link && (
                            <Button
                                onClick={() => window.location.href = banner.link!}
                                variant="outline"
                                className="bg-white text-slate-900 hover:bg-slate-100 border-none rounded-full font-bold shadow-lg transform hover:scale-105 h-auto py-2.5 px-6"
                            >
                                تسوق الآن <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}

            {/* Dots */}
            {activeBanners.length > 1 && (
                <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                    {activeBanners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
