import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface Reaction {
    id: number;
    emoji: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
}

export const AuctionReactions: React.FC = () => {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    // Add a reaction locally and broadcast (simulated)
    const addReaction = useCallback((emoji: string) => {
        const id = Date.now() + Math.random();
        // Random slight x variation for "natural" feel from bottom center
        const startX = 50 + (Math.random() * 20 - 10);

        setReactions(prev => [...prev, { id, emoji, x: startX, y: 100 }]);

        // Cleanup after animation
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);
    }, []);

    // Simulate receiving reactions from others
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every 2s
                const emojis = ['🔥', '❤️', '😮', '💸', '👏'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                addReaction(randomEmoji);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [addReaction]);

    return (
        <>
            {/* Display Area (Overlay) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
                <AnimatePresence>
                    {reactions.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ y: '100%', x: `${r.x}%`, opacity: 0, scale: 0.5 }}
                            animate={{
                                y: '20%',
                                opacity: [0, 1, 1, 0],
                                scale: [0.5, 1.5, 1],
                                x: `${r.x + (Math.random() * 20 - 10)}%` // Drift
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute bottom-0 text-4xl footer-reaction"
                            style={{ left: 0 }} // Positioning handled by translate in animate/initial
                        >
                            {r.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute bottom-24 right-4 flex flex-col gap-3 z-50">
                <ReactionButton emoji="🔥" onClick={() => addReaction('🔥')} />
                <ReactionButton emoji="❤️" onClick={() => addReaction('❤️')} />
                <ReactionButton emoji="💸" onClick={() => addReaction('💸')} />
            </div>
        </>
    );
};

const ReactionButton: React.FC<{ emoji: string, onClick: () => void }> = ({ emoji, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors"
    >
        {emoji}
    </motion.button>
);
