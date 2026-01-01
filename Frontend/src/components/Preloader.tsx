import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PreloaderProps {
    onFinish?: () => void;
    isLoading?: boolean;
    minDuration?: number;
}

const MAX_BEFORE_DONE = 95;

const Preloader: React.FC<PreloaderProps> = memo(({
    onFinish,
    isLoading = false,
    minDuration = 500,
}) => {
    const [progress, setProgress] = useState(0);
    const [minTimeDone, setMinTimeDone] = useState(false);
    const finishedRef = useRef(false);
    const prefersReducedMotion = useReducedMotion();

    /* Minimum display time */
    useEffect(() => {
        const timer = setTimeout(() => setMinTimeDone(true), minDuration);
        return () => clearTimeout(timer);
    }, [minDuration]);

    /* Progress animation */
    useEffect(() => {
        let rafId: number;
        let lastTime = performance.now();

        const update = (now: number) => {
            const delta = now - lastTime;
            lastTime = now;

            setProgress(prev => {
                if (prev >= 100) return 100;

                if (isLoading) {
                    const remaining = MAX_BEFORE_DONE - prev;
                    return prev + Math.max(remaining * 0.02, 0.15);
                }

                return Math.min(prev + delta * 0.08, 100);
            });

            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [isLoading]);

    /* Finish trigger (once only) */
    useEffect(() => {
        if (
            !isLoading &&
            minTimeDone &&
            progress >= 100 &&
            !finishedRef.current
        ) {
            finishedRef.current = true;
            onFinish?.();
        }
    }, [progress, minTimeDone, isLoading, onFinish]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950"
        >
            {/* Background glow */}
            {!prefersReducedMotion && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
                        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1/4 -left-1/4 w-2/3 h-2/3 bg-amber-500/20 rounded-full blur-[90px]"
                    />
                </div>
            )}

            <div className="relative flex flex-col items-center gap-8">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                    className="relative"
                >
                    <div className="absolute -inset-10 rounded-full border border-amber-500/10 border-dashed animate-spin-slow" />
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl pulse-glow" />

                    <motion.img
                        src="/logo without name.svg"
                        alt="Ramouse"
                        className="relative z-10 w-32 h-32"
                        animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                </motion.div>

                {/* Title & Progress */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-amber-200 to-amber-600">
                        Ramouse.com
                    </h1>

                    <div className="w-64 h-[2px] bg-amber-900/20 rounded overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-amber-600 to-yellow-400"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.25 }}
                        />
                    </div>

                    <div className="text-[10px] tracking-widest text-amber-200/50">
                        {Math.round(progress)}% · {progress >= 100 ? 'READY' : 'LOADING'}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pulse-glow {
          0%,100% { transform: scale(1); opacity: .15 }
          50% { transform: scale(1.2); opacity: .25 }
        }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite }
        .animate-spin-slow { animation: spin 20s linear infinite }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
        </motion.div>
    );
});

export default Preloader;
