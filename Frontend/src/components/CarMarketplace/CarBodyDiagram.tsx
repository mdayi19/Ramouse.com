import React, { useState } from 'react';
import { Check, X, AlertTriangle, Paintbrush, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BodyCondition {
    [key: string]: 'pristine' | 'scratched' | 'dented' | 'painted' | 'replaced';
}

interface CarBodyDiagramProps {
    value: BodyCondition;
    onChange: (condition: BodyCondition) => void;
    readOnly?: boolean;
}

const conditionConfig = {
    pristine: { label: 'سليم', color: '#10b981', gradient: 'from-emerald-400 to-emerald-600', icon: Check },
    scratched: { label: 'خدوش', color: '#f59e0b', gradient: 'from-amber-400 to-amber-600', icon: AlertTriangle },
    dented: { label: 'صدمة', color: '#ef4444', gradient: 'from-red-400 to-red-600', icon: X },
    painted: { label: 'رش', color: '#8b5cf6', gradient: 'from-purple-400 to-purple-600', icon: Paintbrush },
    replaced: { label: 'تغيير', color: '#3b82f6', gradient: 'from-blue-400 to-blue-600', icon: RefreshCw }
};

// Precise vector paths for a modern sedan (Top View)
// Canvas: 300x520
const carPaths = {
    // Interactive Parts
    hood: { id: 'hood', label: 'الكبوت', d: 'M75,90 C75,90 150,85 225,90 L220,185 L80,185 Z' },
    front_bumper: { id: 'front_bumper', label: 'صدام أمامي', d: 'M70,85 Q150,60 230,85 L230,55 Q150,30 70,55 Z' },
    left_fender: { id: 'left_fender', label: 'رفرف أيسر', d: 'M55,90 L70,90 L75,185 L40,180 Q40,135 55,90 Z' },
    right_fender: { id: 'right_fender', label: 'رفرف أيمن', d: 'M230,90 L245,90 Q260,135 260,180 L225,185 L225,90 Z' },
    roof: { id: 'roof', label: 'السقف', d: 'M75,225 L225,225 L225,310 L75,310 Z' },
    left_front_door: { id: 'left_front_door', label: 'باب أمامي أيسر', d: 'M38,185 L75,190 L75,270 L38,270 Z' },
    right_front_door: { id: 'right_front_door', label: 'باب أمامي أيمن', d: 'M262,185 L225,190 L225,270 L262,270 Z' },
    left_rear_door: { id: 'left_rear_door', label: 'باب خلفي أيسر', d: 'M38,275 L75,275 L75,350 L42,345 Z' },
    right_rear_door: { id: 'right_rear_door', label: 'باب خلفي أيمن', d: 'M262,275 L225,275 L225,350 L258,345 Z' },
    left_quarter: { id: 'left_quarter', label: 'رفرف خلفي أيسر', d: 'M42,350 L75,350 L70,445 L50,445 C40,400 42,350 42,350 Z' },
    right_quarter: { id: 'right_quarter', label: 'رفرف خلفي أيمن', d: 'M258,350 L225,350 L230,445 L250,445 C260,400 258,350 258,350 Z' },
    trunk: { id: 'trunk', label: 'الشنطة', d: 'M75,370 L225,370 L225,445 L75,445 Z' },
    rear_bumper: { id: 'rear_bumper', label: 'صدام خلفي', d: 'M230,450 L70,450 L70,470 Q150,490 230,470 Z' },

    // Contextual (Non-interactive)
    windshield_front: { d: 'M80,188 L220,188 L225,220 L75,220 Z', fill: '#e2e8f0', opacity: 0.5 },
    windshield_rear: { d: 'M75,315 L225,315 L220,365 L80,365 Z', fill: '#e2e8f0', opacity: 0.5 },
    mirror_left: { d: 'M38,185 L25,175 L25,195 Z', fill: '#94a3b8', opacity: 0.8 },
    mirror_right: { d: 'M262,185 L275,175 L275,195 Z', fill: '#94a3b8', opacity: 0.8 },
    headlight_left: { d: 'M55,65 L70,68 L70,85 L52,80 Z', fill: '#fcd34d', opacity: 0.6 },
    headlight_right: { d: 'M245,65 L230,68 L230,85 L248,80 Z', fill: '#fcd34d', opacity: 0.6 },
    wheel_fl: { rx: 5, ry: 15, x: 25, y: 100, fill: '#334155' },
    wheel_fr: { rx: 5, ry: 15, x: 265, y: 100, fill: '#334155' },
    wheel_rl: { rx: 5, ry: 15, x: 25, y: 380, fill: '#334155' },
    wheel_rr: { rx: 5, ry: 15, x: 265, y: 380, fill: '#334155' },
};

export const CarBodyDiagram: React.FC<CarBodyDiagramProps> = ({ value, onChange, readOnly = false }) => {
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);

    const cycleCondition = (partId: string) => {
        if (readOnly) return;
        const keys = Object.keys(conditionConfig);
        const currentCondition = value[partId] || 'pristine';
        const currentIndex = keys.indexOf(currentCondition);
        const nextIndex = (currentIndex + 1) % keys.length;

        onChange({
            ...value,
            [partId]: keys[nextIndex] as any
        });
    };

    const getPartStyle = (partId: string) => {
        const condition = value[partId] || 'pristine';
        const config = conditionConfig[condition as keyof typeof conditionConfig];
        return { condition, config };
    };

    return (
        <div className="space-y-8 select-none">
            {/* Condition Legend */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-2">
                {Object.entries(conditionConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                        <div
                            key={key}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border shadow-sm",
                                "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                                value && Object.values(value).includes(key as any) ? "ring-2 ring-offset-2 ring-blue-500 opacity-100" : "opacity-70 hover:opacity-100"
                            )}
                        >
                            <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${config.gradient}`} />
                            <span className="text-slate-700 dark:text-slate-200">{config.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* The Diagram */}
            <div className="relative mx-auto max-w-[340px] perspective-1000">
                <div
                    className={cn(
                        "relative bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50",
                        "rounded-[3rem] p-8 border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden",
                        "transition-all duration-500 hover:shadow-lg"
                    )}
                >
                    {/* Grid Background Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    <svg
                        viewBox="0 0 300 520"
                        className="w-full h-auto drop-shadow-2xl"
                        style={{ maxHeight: '600px' }}
                    >
                        <defs>
                            <filter id="part-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <linearGradient id="glass-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Shadows for wheels */}
                        {['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].map(key => {
                            const part = carPaths[key as keyof typeof carPaths];
                            return <ellipse key={key} cx={part.x! + 5} cy={part.y! + 7.5} rx={part.rx} ry={part.ry} fill="black" opacity="0.2" filter="url(#part-glow)" />
                        })}

                        {/* Context Parts (Wheels, Glass, Lights - Underneath) */}
                        {Object.entries(carPaths).filter(([_, p]) => !('id' in p)).map(([key, part]) => (
                            part.d ? (
                                <path key={key} d={part.d} fill={part.fill} fillOpacity={part.opacity} />
                            ) : (
                                <ellipse key={key} cx={part.x} cy={part.y} rx={part.rx} ry={part.ry} fill={part.fill} />
                            )
                        ))}

                        {/* Interactive Body Parts */}
                        {Object.entries(carPaths).filter(([_, p]) => 'id' in p).map(([key, part]) => {
                            const { id, label, d } = part as any;
                            const { condition, config } = getPartStyle(id);
                            const isHovered = hoveredPart === id;
                            const isPristine = condition === 'pristine';

                            return (
                                <g
                                    key={id}
                                    onClick={() => cycleCondition(id)}
                                    onMouseEnter={() => setHoveredPart(id)}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    className={cn(
                                        "transition-all duration-300",
                                        !readOnly ? "cursor-pointer hover:opacity-90" : ""
                                    )}
                                    style={{
                                        transformOrigin: 'center center',
                                        transform: isHovered && !readOnly ? 'scale(1.01)' : 'scale(1)'
                                    }}
                                >
                                    <path
                                        d={d}
                                        fill={config.color}
                                        fillOpacity={isPristine ? 0.15 : 0.85} // More subtle when pristine
                                        stroke={config.color}
                                        strokeWidth={isHovered && !readOnly ? 3 : 1.5}
                                        strokeOpacity={isHovered ? 1 : 0.6}
                                        filter={isHovered && !readOnly ? 'url(#part-glow)' : undefined}
                                        className="transition-all duration-300 ease-out"
                                    />

                                    {/* Glass shine effect overlay for cool look */}
                                    <path d={d} fill="url(#glass-shine)" className="pointer-events-none opacity-30" />
                                </g>
                            );
                        })}
                    </svg>

                    {!readOnly && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium text-slate-500 animate-fade-in-up">
                                <Info className="w-3.5 h-3.5 text-blue-500" />
                                اضغط على الجزء لتغيير حالته
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Part Details (Floating or Below) */}
            <div className="h-12 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    {hoveredPart && (
                        <motion.div
                            key="tooltip"
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3"
                        >
                            <span className="font-bold text-sm">
                                {carPaths[hoveredPart as keyof typeof carPaths].label || ''}
                            </span>
                            <div className="w-px h-4 bg-white/20 dark:bg-black/10" />
                            <span className="text-sm font-medium flex items-center gap-1.5">
                                {React.createElement(conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].icon, { size: 14 })}
                                <span className={cn(
                                    "font-bold",
                                    `text-${conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].color.replace('#', '')}-400`
                                )}>
                                    {conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].label}
                                </span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
