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

// More realistic car paths with proper curves and proportions
// Canvas: 400x700 (better aspect ratio for modern sedan)

interface InteractivePart {
    id: string;
    label: string;
    d: string;
}

interface ContextPathPart {
    d: string;
    fill: string;
    opacity?: number;
    stroke?: string;
    strokeWidth?: number;
}

interface ContextEllipsePart {
    x: number;
    y: number;
    rx: number;
    ry: number;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
}

type CarPart = InteractivePart | ContextPathPart | ContextEllipsePart;

const carPaths: Record<string, CarPart> = {
    // Interactive Parts - More realistic shapes with curves
    front_bumper: {
        id: 'front_bumper',
        label: 'صدام أمامي',
        d: 'M90,70 Q200,45 310,70 L310,95 Q305,100 300,102 L100,102 Q95,100 90,95 Z'
    },
    hood: {
        id: 'hood',
        label: 'الكبوت',
        d: 'M95,105 L305,105 Q308,108 310,115 L310,230 Q308,235 305,238 L95,238 Q92,235 90,230 L90,115 Q92,108 95,105 Z'
    },
    left_fender: {
        id: 'left_fender',
        label: 'رفرف أمامي أيسر',
        d: 'M68,100 L88,103 L88,240 L68,238 Q60,220 58,180 Q60,140 68,120 Z'
    },
    right_fender: {
        id: 'right_fender',
        label: 'رفرف أمامي أيمن',
        d: 'M312,103 L332,100 Q340,120 342,180 Q340,220 332,238 L312,240 Z'
    },
    left_front_door: {
        id: 'left_front_door',
        label: 'باب أمامي أيسر',
        d: 'M55,245 L88,245 L88,360 L55,360 Q52,330 52,302.5 Q52,275 55,245 Z'
    },
    right_front_door: {
        id: 'right_front_door',
        label: 'باب أمامي أيمن',
        d: 'M312,245 L345,245 Q348,275 348,302.5 Q348,330 345,360 L312,360 Z'
    },
    left_rear_door: {
        id: 'left_rear_door',
        label: 'باب خلفي أيسر',
        d: 'M55,365 L88,365 L88,480 L60,478 Q56,450 55,420 Z'
    },
    right_rear_door: {
        id: 'right_rear_door',
        label: 'باب خلفي أيمن',
        d: 'M312,365 L345,365 Q344,420 340,478 L312,480 Z'
    },
    left_quarter: {
        id: 'left_quarter',
        label: 'رفرف خلفي أيسر',
        d: 'M60,485 L88,485 L88,570 L72,572 Q64,550 62,520 Z'
    },
    right_quarter: {
        id: 'right_quarter',
        label: 'رفرف خلفي أيمن',
        d: 'M312,485 L340,485 Q338,520 336,550 L328,572 L312,570 Z'
    },
    trunk: {
        id: 'trunk',
        label: 'الشنطة',
        d: 'M95,488 L305,488 Q308,490 310,495 L310,565 Q308,570 305,573 L95,573 Q92,570 90,565 L90,495 Q92,490 95,488 Z'
    },
    rear_bumper: {
        id: 'rear_bumper',
        label: 'صدام خلفي',
        d: 'M100,578 L300,578 Q305,580 310,585 L310,610 Q200,635 90,610 L90,585 Q95,580 100,578 Z'
    },
    roof: {
        id: 'roof',
        label: 'السقف',
        d: 'M95,285 L305,285 Q310,288 312,293 L312,425 Q310,430 305,433 L95,433 Q90,430 88,425 L88,293 Q90,288 95,285 Z'
    },

    // Contextual (Non-interactive) - Enhanced realism

    // Front Windshield with curve
    windshield_front: {
        d: 'M92,242 L308,242 Q312,245 314,250 L314,280 Q312,283 308,285 L92,285 Q88,283 86,280 L86,250 Q88,245 92,242 Z',
        fill: '#cbd5e1',
        opacity: 0.6,
        stroke: '#64748b',
        strokeWidth: 1
    },

    // Rear Windshield
    windshield_rear: {
        d: 'M92,438 L308,438 Q312,440 314,444 L314,480 Q312,483 308,485 L92,485 Q88,483 86,480 L86,444 Q88,440 92,438 Z',
        fill: '#cbd5e1',
        opacity: 0.6,
        stroke: '#64748b',
        strokeWidth: 1
    },

    // Left window (front door)
    window_left_front: {
        d: 'M58,255 L85,258 L85,350 L58,348 Q56,320 56,304 Q56,280 58,255 Z',
        fill: '#94a3b8',
        opacity: 0.5
    },

    // Right window (front door)
    window_right_front: {
        d: 'M315,258 L342,255 Q344,280 344,304 Q344,320 342,348 L315,350 Z',
        fill: '#94a3b8',
        opacity: 0.5
    },

    // Left window (rear door)
    window_left_rear: {
        d: 'M58,372 L85,373 L85,472 L62,470 Q58,440 58,405 Z',
        fill: '#94a3b8',
        opacity: 0.5
    },

    // Right window (rear door)
    window_right_rear: {
        d: 'M315,373 L342,372 Q342,405 338,470 L315,472 Z',
        fill: '#94a3b8',
        opacity: 0.5
    },

    // Side Mirrors with better shape
    mirror_left: {
        d: 'M52,242 L35,238 Q28,240 28,248 L28,256 Q28,264 35,266 L52,262 Z',
        fill: '#475569',
        opacity: 0.9,
        stroke: '#1e293b',
        strokeWidth: 1
    },
    mirror_right: {
        d: 'M348,242 L365,238 Q372,240 372,248 L372,256 Q372,264 365,266 L348,262 Z',
        fill: '#475569',
        opacity: 0.9,
        stroke: '#1e293b',
        strokeWidth: 1
    },

    // Headlights - More realistic
    headlight_left: {
        d: 'M75,78 L92,82 L92,98 L75,95 Q72,88 72,86 Z',
        fill: '#fef3c7',
        opacity: 0.8,
        stroke: '#fbbf24',
        strokeWidth: 1
    },
    headlight_right: {
        d: 'M308,82 L325,78 Q328,86 328,88 L325,95 L308,98 Z',
        fill: '#fef3c7',
        opacity: 0.8,
        stroke: '#fbbf24',
        strokeWidth: 1
    },

    // Tail lights
    taillight_left: {
        d: 'M78,585 L92,587 L92,605 L78,603 Z',
        fill: '#fecaca',
        opacity: 0.8,
        stroke: '#ef4444',
        strokeWidth: 1
    },
    taillight_right: {
        d: 'M308,587 L322,585 L322,603 L308,605 Z',
        fill: '#fecaca',
        opacity: 0.8,
        stroke: '#ef4444',
        strokeWidth: 1
    },

    // Wheels - More realistic with better proportions
    wheel_fl: { rx: 10, ry: 25, x: 38, y: 135, fill: '#1e293b', stroke: '#475569', strokeWidth: 2 },
    wheel_fr: { rx: 10, ry: 25, x: 362, y: 135, fill: '#1e293b', stroke: '#475569', strokeWidth: 2 },
    wheel_rl: { rx: 10, ry: 25, x: 38, y: 520, fill: '#1e293b', stroke: '#475569', strokeWidth: 2 },
    wheel_rr: { rx: 10, ry: 25, x: 362, y: 520, fill: '#1e293b', stroke: '#475569', strokeWidth: 2 },

    // Wheel hubcaps for detail
    hubcap_fl: { rx: 6, ry: 15, x: 38, y: 135, fill: '#64748b' },
    hubcap_fr: { rx: 6, ry: 15, x: 362, y: 135, fill: '#64748b' },
    hubcap_rl: { rx: 6, ry: 15, x: 38, y: 520, fill: '#64748b' },
    hubcap_rr: { rx: 6, ry: 15, x: 362, y: 520, fill: '#64748b' },
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
            <div className="relative mx-auto max-w-[420px] perspective-1000">
                <div
                    className={cn(
                        "relative bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50",
                        "rounded-[3rem] p-4 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden",
                        "transition-all duration-500 hover:shadow-3xl"
                    )}
                >
                    {/* Subtle Grid Background Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30" />

                    <svg
                        viewBox="0 0 400 700"
                        className="w-full h-auto drop-shadow-2xl"
                        style={{ maxHeight: '800px' }}
                    >
                        <defs>
                            {/* Enhanced glow filter */}
                            <filter id="part-glow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>

                            {/* Metallic shine effect */}
                            <linearGradient id="metallic-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                                <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                            </linearGradient>

                            {/* Car body base color gradient */}
                            <linearGradient id="car-body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>

                        {/* Drop shadows for depth */}
                        {['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].map(key => {
                            const part = carPaths[key as keyof typeof carPaths];
                            if ('rx' in part) {
                                return <ellipse key={`shadow-${key}`} cx={part.x} cy={part.y + 10} rx={part.rx + 2} ry={part.ry + 2} fill="black" opacity="0.15" filter="url(#part-glow)" />
                            }
                            return null;
                        })}

                        {/* Car body base outline for depth */}
                        <path
                            d="M90,70 Q200,45 310,70 L310,95 L332,100 Q342,180 342,180 Q340,220 332,238 L345,245 Q348,302.5 348,302.5 Q348,330 345,360 L345,365 Q344,420 340,478 L340,485 Q338,520 336,550 L328,572 L310,585 L310,610 Q200,635 90,610 L90,585 L72,572 Q64,550 62,520 Q60,485 60,485 L60,478 Q56,450 55,420 L55,365 L55,360 Q52,330 52,302.5 Q52,275 55,245 L68,238 Q60,220 58,180 Q60,140 68,120 L68,100 L90,95 Z"
                            fill="url(#car-body-gradient)"
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            opacity="0.4"
                        />

                        {/* Context Parts (Windows, Glass, Lights, Mirrors - Underneath) */}
                        {Object.entries(carPaths).map(([key, part]) => {
                            // Skip interactive parts (they have an ID)
                            if ('id' in part) return null;

                            if ('d' in part) {
                                const pathPart = part as ContextPathPart;
                                return (
                                    <path
                                        key={key}
                                        d={pathPart.d}
                                        fill={pathPart.fill}
                                        fillOpacity={pathPart.opacity}
                                        stroke={pathPart.stroke}
                                        strokeWidth={pathPart.strokeWidth}
                                    />
                                );
                            }

                            if ('rx' in part) {
                                const ellipsePart = part as ContextEllipsePart;
                                return (
                                    <ellipse
                                        key={key}
                                        cx={ellipsePart.x}
                                        cy={ellipsePart.y}
                                        rx={ellipsePart.rx}
                                        ry={ellipsePart.ry}
                                        fill={ellipsePart.fill}
                                        stroke={ellipsePart.stroke}
                                        strokeWidth={ellipsePart.strokeWidth}
                                    />
                                );
                            }

                            return null;
                        })}

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
                                        transform: isHovered && !readOnly ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <path
                                        d={d}
                                        fill={config.color}
                                        fillOpacity={isPristine ? 0.12 : 0.75}
                                        stroke={config.color}
                                        strokeWidth={isHovered && !readOnly ? 4 : 2}
                                        strokeOpacity={isHovered ? 1 : 0.5}
                                        filter={isHovered && !readOnly ? 'url(#part-glow)' : undefined}
                                        className="transition-all duration-300 ease-out"
                                    />

                                    {/* Metallic shine overlay for premium look */}
                                    <path d={d} fill="url(#metallic-shine)" className="pointer-events-none opacity-20" />
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
                                {(() => {
                                    const part = carPaths[hoveredPart];
                                    return 'label' in part ? part.label : '';
                                })()}
                            </span>
                            <div className="w-px h-4 bg-white/20 dark:bg-black/10" />
                            <span className="text-sm font-medium flex items-center gap-1.5">
                                {React.createElement(conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].icon, { size: 14 })}
                                <span className="font-bold">
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
