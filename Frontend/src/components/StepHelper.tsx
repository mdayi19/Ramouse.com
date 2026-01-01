import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, HelpCircle, X } from 'lucide-react';

interface StepHelperProps {
    step: number;
    onDismiss?: () => void;
    autoHide?: boolean;
    autoHideDelay?: number;
}

// Helper messages for each step
const STEP_HELPERS = [
    { emoji: '👋', message: 'مرحباً!', audio: 'مرحباً بك في راموسة' },
    { emoji: '🚗', message: 'اختر سيارتك', audio: 'اضغط على نوع سيارتك' },
    { emoji: '🏭', message: 'الشركة المصنعة', audio: 'اختر شعار شركة سيارتك' },
    { emoji: '📅', message: 'الموديل والسنة', audio: 'اختر موديل سيارتك وسنة الصنع' },
    { emoji: '🔧', message: 'ماذا تحتاج؟', audio: 'اختر نوع القطعة المطلوبة' },
    { emoji: '🎤', message: 'اضغط وتكلم!', audio: 'اضغط على المايك وأخبرنا ماذا تريد' },
    { emoji: '✅', message: 'تأكد ثم أرسل', audio: 'راجع طلبك ثم اضغط إرسال' },
    { emoji: '🎉', message: 'تم بنجاح!', audio: 'مبروك! تم إرسال طلبك بنجاح' },
];

const StepHelper: React.FC<StepHelperProps> = ({
    step,
    onDismiss,
    autoHide = true,
    autoHideDelay = 8000,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(() => {
        const saved = localStorage.getItem('voiceGuidanceEnabled');
        return saved !== 'false'; // Default to true
    });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const helper = STEP_HELPERS[step] || STEP_HELPERS[0];

    // Auto-hide timer
    useEffect(() => {
        if (autoHide && isVisible) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                onDismiss?.();
            }, autoHideDelay);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [autoHide, autoHideDelay, isVisible, onDismiss]);

    // Auto-speak on mount if voice enabled
    useEffect(() => {
        if (voiceEnabled && isVisible) {
            speak();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, voiceEnabled]);

    const speak = () => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(helper.audio);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = 1.1;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleVoice = () => {
        const newValue = !voiceEnabled;
        setVoiceEnabled(newValue);
        localStorage.setItem('voiceGuidanceEnabled', String(newValue));

        if (newValue) {
            speak();
        } else {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        window.speechSynthesis?.cancel();
        onDismiss?.();
    };

    if (!isVisible) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setIsVisible(true)}
                className="fixed bottom-24 left-4 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
                aria-label="إظهار المساعد"
            >
                <HelpCircle className="w-7 h-7" />
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80"
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-primary/20 overflow-hidden">
                    {/* Animated gradient top bar */}
                    <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient" />

                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            {/* Animated Mascot */}
                            <motion.div
                                animate={{
                                    y: [0, -5, 0],
                                    rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="text-5xl flex-shrink-0"
                            >
                                {helper.emoji}
                            </motion.div>

                            {/* Message */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                                    {helper.message}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {helper.audio}
                                </p>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                aria-label="إغلاق المساعد"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-4">
                            {/* Voice toggle */}
                            <button
                                onClick={toggleVoice}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${voiceEnabled
                                        ? 'bg-primary text-white hover:bg-primary-700'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {voiceEnabled ? (
                                    <>
                                        <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                                        <span>🔊 استمع</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX className="w-5 h-5" />
                                        <span>🔇 صامت</span>
                                    </>
                                )}
                            </button>

                            {/* Speak again */}
                            {voiceEnabled && (
                                <button
                                    onClick={speak}
                                    disabled={isSpeaking}
                                    className="py-3 px-4 bg-secondary/10 text-secondary rounded-xl font-bold hover:bg-secondary/20 transition-colors disabled:opacity-50"
                                >
                                    🔁
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Pointing hand animation */}
                    <motion.div
                        animate={{
                            x: [0, 10, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute -bottom-8 right-1/2 translate-x-1/2 text-3xl"
                    >
                        👇
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StepHelper;
