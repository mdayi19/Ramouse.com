import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, X, Paintbrush, RefreshCw } from 'lucide-react';

interface BodyCondition {
    [key: string]: 'pristine' | 'scratched' | 'dented' | 'painted' | 'replaced';
}

interface CarBodyDiagramProps {
    value: BodyCondition;
    onChange: (condition: BodyCondition) => void;
    readOnly?: boolean;
}

const conditionConfig = {
    pristine: { label: 'أوريجنال', color: '#10b981', textColor: '#065f46' },
    painted: { label: 'بخ موضعي', color: '#fb923c', textColor: '#9a3412', pattern: 'stripes' },
    scratched: { label: 'مبخوخ', color: '#fbbf24', textColor: '#92400e' },
    replaced: { label: 'مبدل', color: '#ef4444', textColor: '#7f1d1d' },
    dented: { label: 'صدمة', color: '#94a3b8', textColor: '#475569' }
};

// Detailed car parts with realistic proportions
const carParts = {
    // Top view - Center car
    hood: {
        id: 'hood',
        label: 'غطاء المحرك',
        d: 'M165,50 Q200,45 235,50 L240,135 L230,145 L170,145 L160,135 Z'
    },
    roof: {
        id: 'roof',
        label: 'السقف',
        d: 'M165,160 L235,160 L235,310 L165,310 Z'
    },
    trunk: {
        id: 'trunk',
        label: 'الصندوق',
        d: 'M160,325 L170,325 L230,325 L240,325 L235,410 Q200,415 165,410 Z'
    },

    // Left side silhouette
    left_front_fender: {
        id: 'left_front_fender',
        label: 'رفرف أمامي أيسر',
        d: 'M25,90 L75,85 L80,105 L78,125 L40,130 L30,120 Z'
    },
    left_front_door: {
        id: 'left_front_door',
        label: 'باب أمامي أيسر',
        d: 'M35,135 L78,135 L80,165 L80,210 L78,240 L45,245 L38,220 Z'
    },
    left_rear_door: {
        id: 'left_rear_door',
        label: 'باب خلفي أيسر',
        d: 'M40,250 L78,250 L80,280 L80,325 L78,355 L50,360 L43,335 Z'
    },
    left_rear_fender: {
        id: 'left_rear_fender',
        label: 'رفرف خلفي أيسر',
        d: 'M48,365 L78,365 L80,385 L75,405 L55,410 L50,390 Z'
    },

    // Right side silhouette
    right_front_fender: {
        id: 'right_front_fender',
        label: 'رفرف أمامي أيمن',
        d: 'M325,85 L375,90 L370,120 L360,130 L322,125 L320,105 Z'
    },
    right_front_door: {
        id: 'right_front_door',
        label: 'باب أمامي أيمن',
        d: 'M322,135 L365,135 L362,220 L355,245 L322,240 L320,210 L320,165 Z'
    },
    right_rear_door: {
        id: 'right_rear_door',
        label: 'باب خلفي أيمن',
        d: 'M322,250 L360,250 L357,335 L350,360 L322,355 L320,325 L320,280 Z'
    },
    right_rear_fender: {
        id: 'right_rear_fender',
        label: 'رفرف خلفي أيمن',
        d: 'M322,365 L352,365 L350,390 L345,410 L325,405 L320,385 Z'
    },

    // Rear view
    rear_bumper: {
        id: 'rear_bumper',
        label: 'صدام خلفي',
        d: 'M160,445 L240,445 L240,475 Q200,480 160,475 Z'
    },
    front_bumper: {
        id: 'front_bumper',
        label: 'صدام أمامي',
        d: 'M160,25 Q200,20 240,25 L240,45 L160,45 Z'
    }
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

    const getPartFill = (partId: string) => {
        const condition = value[partId] || 'pristine';
        const config = conditionConfig[condition as keyof typeof conditionConfig];

        if (config.pattern === 'stripes') {
            return `url(#stripe-pattern-${partId})`;
        }
        return config.color;
    };

    return (
        <div className="space-y-4 select-none">
            {/* Title */}
            <h3 className="text-center text-base font-bold text-slate-700 dark:text-slate-200 mb-2">
                مخطط الأضرار
            </h3>

            {/* Main Diagram */}
            <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6">
                <svg viewBox="0 0 400 550" className="w-full h-auto">
                    <defs>
                        {/* Stripe patterns for painted parts */}
                        {Object.keys(carParts).map(partId => {
                            const condition = value[partId] || 'pristine';
                            const config = conditionConfig[condition as keyof typeof conditionConfig];
                            return (
                                <pattern
                                    key={`stripe-pattern-${partId}`}
                                    id={`stripe-pattern-${partId}`}
                                    patternUnits="userSpaceOnUse"
                                    width="6"
                                    height="6"
                                    patternTransform="rotate(45)"
                                >
                                    <rect width="3" height="6" fill={config.color} />
                                    <rect x="3" width="3" height="6" fill="#ffffff" fillOpacity="0.7" />
                                </pattern>
                            );
                        })}
                    </defs>

                    {/* Car body outlines for context */}
                    <g className="opacity-20 dark:opacity-10">
                        {/* Top view outline */}
                        <path d="M155,20 Q200,15 245,20 L250,135 L250,325 L245,420 Q200,425 155,420 L150,325 L150,135 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                        {/* Left side outline */}
                        <path d="M20,80 L85,75 L85,415 L60,420 Q35,410 20,390 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                        {/* Right side outline */}
                        <path d="M315,75 L380,80 L380,390 Q365,410 340,420 L315,415 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                        {/* Rear outline */}
                        <path d="M155,440 L245,440 L245,485 Q200,490 155,485 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                        {/* Windshields */}
                        <rect x="170" y="145" width="60" height="12" rx="2" fill="#64748b" opacity="0.3" />
                        <rect x="170" y="313" width="60" height="12" rx="2" fill="#64748b" opacity="0.3" />

                        {/* Side windows */}
                        <rect x="40" y="140" width="35" height="35" rx="3" fill="#64748b" opacity="0.25" />
                        <rect x="40" y="255" width="35" height="35" rx="3" fill="#64748b" opacity="0.25" />
                        <rect x="325" y="140" width="35" height="35" rx="3" fill="#64748b" opacity="0.25" />
                        <rect x="325" y="255" width="35" height="35" rx="3" fill="#64748b" opacity="0.25" />

                        {/* Wheels */}
                        <ellipse cx="20" cy="110" rx="6" ry="14" fill="#334155" />
                        <ellipse cx="20" cy="380" rx="6" ry="14" fill="#334155" />
                        <ellipse cx="380" cy="110" rx="6" ry="14" fill="#334155" />
                        <ellipse cx="380" cy="380" rx="6" ry="14" fill="#334155" />
                    </g>

                    {/* Interactive car parts */}
                    {Object.entries(carParts).map(([key, part]) => {
                        const isHovered = hoveredPart === part.id;
                        const condition = value[part.id] || 'pristine';
                        const isPristine = condition === 'pristine';
                        const config = conditionConfig[condition as keyof typeof conditionConfig];

                        return (
                            <g
                                key={part.id}
                                onMouseEnter={() => setHoveredPart(part.id)}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => cycleCondition(part.id)}
                                className={!readOnly ? "cursor-pointer transition-all" : ""}
                            >
                                <path
                                    d={part.d}
                                    fill={getPartFill(part.id)}
                                    fillOpacity={isPristine ? 0.25 : 0.85}
                                    stroke={config.color}
                                    strokeWidth={isHovered ? 3 : 2}
                                    strokeOpacity={isPristine ? 0.4 : 0.9}
                                    className="transition-all duration-200"
                                    style={{
                                        filter: isHovered ? 'drop-shadow(0 0 6px rgba(0,0,0,0.2))' : 'none'
                                    }}
                                />
                            </g>
                        );
                    })}

                    {/* View labels */}
                    <text x="50" y="65" textAnchor="middle" fontSize="11" className="fill-slate-400 dark:fill-slate-500 font-medium">
                        جانب أيسر
                    </text>
                    <text x="200" y="12" textAnchor="middle" fontSize="11" className="fill-slate-400 dark:fill-slate-500 font-medium">
                        منظر علوي
                    </text>
                    <text x="350" y="65" textAnchor="middle" fontSize="11" className="fill-slate-400 dark:fill-slate-500 font-medium">
                        جانب أيمن
                    </text>
                    <text x="200" y="505" textAnchor="middle" fontSize="11" className="fill-slate-400 dark:fill-slate-500 font-medium">
                        منظر خلفي
                    </text>
                </svg>

                {!readOnly && (
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                        اضغط على أي جزء لتغيير حالته
                    </p>
                )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-2">
                {Object.entries(conditionConfig).map(([key, config]) => {
                    const isUsed = value && Object.values(value).includes(key as any);

                    return (
                        <div
                            key={key}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all ${isUsed
                                ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 opacity-50'
                                }`}
                        >
                            <div
                                className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex-shrink-0"
                                style={{
                                    backgroundColor: config.color,
                                    backgroundImage: config.pattern === 'stripes'
                                        ? `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.6) 2px, rgba(255,255,255,0.6) 4px)`
                                        : 'none'
                                }}
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {config.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Hovered part tooltip */}
            <div className="h-10 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    {hoveredPart && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
                        >
                            {carParts[hoveredPart as keyof typeof carParts]?.label}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
