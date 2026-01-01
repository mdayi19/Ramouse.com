import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import StepHelper from './StepHelper';

interface Props {
  resetForm: () => void;
  orderNumber: string | null;
}

// Confetti particle component
const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  useEffect(() => {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ y: -20, x: `${particle.x}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: [0, 360, 720],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: particle.delay,
            ease: 'linear',
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
};

// Star burst animation
const StarBurst: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, rotate: i * 45 }}
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
        className="absolute text-4xl"
        style={{
          transform: `rotate(${i * 45}deg) translateY(-80px)`,
        }}
      >
        ⭐
      </motion.div>
    ))}
  </div>
);

const Step7Success: React.FC<Props> = ({ resetForm, orderNumber }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Play celebration sound (if available and user has interacted)
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => { }); // Ignore if blocked
    } catch { }

    // Haptic celebration pattern
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center max-w-lg mx-auto min-h-[70vh]">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Step Helper */}
      <StepHelper step={7} autoHide={false} />

      {/* Star Burst Effect */}
      <div className="relative mb-8">
        <StarBurst />

        {/* Main Success Icon with animations */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 } as const}
          className="relative"
        >
          {/* Pulsing background rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-32 h-32 bg-green-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              className="absolute w-40 h-40 bg-green-300 rounded-full"
            />
          </div>

          {/* Main check circle */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.4 } as const}
            className="relative w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Icon name="Check" className="w-16 h-16 sm:w-20 sm:h-20 text-white stroke-[3]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Celebration emojis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-5xl sm:text-6xl mb-4 flex gap-2"
      >
        🎉🎊🥳
      </motion.div>

      {/* Success Message */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3"
      >
        مبروك! 🎉
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed"
      >
        تم إرسال طلبك بنجاح!
        <br />
        <span className="text-base text-slate-500">سنتواصل معك قريباً 📞</span>
      </motion.p>

      {/* Order Number Card */}
      {orderNumber && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="w-full bg-white dark:bg-slate-800 border-2 border-green-200 dark:border-green-800 rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">
            📋 رقم طلبك
          </p>

          <div className="flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900/50 py-4 px-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-3xl sm:text-4xl font-mono font-black text-slate-800 dark:text-white tracking-wider">
              {orderNumber}
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                navigator.clipboard.writeText(orderNumber);
                if (navigator.vibrate) navigator.vibrate(30);
              }}
              className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-colors"
              title="نسخ الرقم"
            >
              <Icon name="Copy" className="w-6 h-6" />
            </motion.button>
          </div>

          <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
            <span>💾</span>
            <span>احفظ هذا الرقم لمتابعة طلبك</span>
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="w-full space-y-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetForm}
          className="w-full bg-primary text-white font-black text-lg py-5 px-6 rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">➕</span>
          <span>طلب قطعة أخرى</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/'}
          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-lg py-4 px-6 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🏠</span>
          <span>العودة للرئيسية</span>
        </motion.button>
      </motion.div>

      {/* Fun footer message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 text-slate-400 text-sm"
      >
        شكراً لثقتك في راموسة 💚
      </motion.p>
    </div>
  );
};

export default Step7Success;