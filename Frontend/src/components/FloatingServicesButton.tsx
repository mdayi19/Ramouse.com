import React from 'react';
import { motion } from 'framer-motion';

interface FloatingServicesButtonProps {
    onClick: () => void;
    logoUrl?: string;
}

const FloatingServicesButton: React.FC<FloatingServicesButtonProps> = ({ onClick, logoUrl }) => {
    return (
        <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Initially constrained, will update to window
            dragElastic={0.2}
            dragMomentum={false}
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            initial={{ x: 20, y: -20 }} // Start slightly offset from bottom-left
            className="fixed bottom-8 left-4 z-50 touch-none" // Positioning
            style={{ x: 0, y: 0 }} // Reset transformation for drag to work properly relative to updated position
        >
            <div className="relative group">
                {/* Outer Glow - Pulsing */}
                <div className="absolute inset-0 rounded-full bg-secondary/20 blur-xl animate-pulse pointer-events-none" />

                {/* Rotating Ring */}
                <div className="absolute inset-[-4px] rounded-full border border-secondary/20 animate-spin-slow pointer-events-none" style={{ animationDuration: '8s' }} />

                <button
                    onClick={onClick}
                    className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_45px_rgba(0,0,0,0.25)] active:scale-95 transition-all duration-300 border-[3px] border-white/90 hover:border-white cursor-grab active:cursor-grabbing bg-[#f3efe4]"
                    aria-label="الخدمات"
                >
                    {/* Inner Glow */}
                    <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none" />

                    {/* Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <img
                        src={logoUrl || "/logo without name.svg"}
                        alt="Services"
                        className="w-10 h-10 object-contain relative z-10 drop-shadow-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none"
                    />
                </button>

                {/* Badge - Services Count with Animation */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-secondary to-orange-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-subtle pointer-events-none">
                    <span className="text-[10px] font-black text-primary-900">10</span>
                </div>
            </div>
        </motion.div>
    );
};

export default FloatingServicesButton;
