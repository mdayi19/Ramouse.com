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

// Realistic car parts with smooth curves and proper car-like proportions
const carParts = {
    // Top view - Center car (more realistic sedan shape)
    front_bumper: {
        id: 'front_bumper',
        label: 'صدام أمامي',
        d: 'M155,18 Q200,12 245,18 C248,20 250,23 250,28 L248,48 Q200,52 152,48 L150,28 C150,23 152,20 155,18 Z'
    },
    hood: {
        id: 'hood',
        label: 'غطاء المحرك',
        d: 'M152,52 Q200,56 248,52 L252,140 C252,145 250,148 246,150 L154,150 C150,148 148,145 148,140 Z'
    },
    roof: {
        id: 'roof',
        label: 'السقف',
        d: 'M150,165 L250,165 C252,167 253,170 253,175 L253,305 C253,310 252,313 250,315 L150,315 C148,313 147,310 147,305 L147,175 C147,170 148,167 150,165 Z'
    },
    trunk: {
        id: 'trunk',
        label: 'الصندوق',
        d: 'M148,330 L252,330 L254,415 C254,420 252,423 248,425 L152,425 C148,423 146,420 146,415 Z'
    },
    rear_bumper: {
        id: 'rear_bumper',
        label: 'صدام خلفي',
        d: 'M152,430 Q200,434 248,430 L250,452 C250,457 248,460 245,462 Q200,468 155,462 C152,460 150,457 150,452 Z'
    },

    // Left side profile (more car-like with curves)
    left_front_fender: {
        id: 'left_front_fender',
        label: 'رفرف أمامي',
        d: 'M18,85 Q22,82 28,82 L78,80 C82,80 84,82 85,86 L85,128 C85,132 83,134 79,135 L30,138 C24,138 20,134 18,128 Z'
    },
    left_front_door: {
        id: 'left_front_door',
        label: 'باب أمامي',
        d: 'M30,143 L82,140 C86,140 88,142 88,146 L88,238 C88,242 86,244 82,245 L38,248 C32,248 28,244 28,238 L28,148 C28,145 29,143 30,143 Z'
    },
    left_rear_door: {
        id: 'left_rear_door',
        label: 'باب خلفي',
        d: 'M38,253 L82,250 C86,250 88,252 88,256 L88,348 C88,352 86,354 82,355 L45,358 C39,358 35,354 35,348 L35,258 C35,255 36,253 38,253 Z'
    },
    left_rear_fender: {
        id: 'left_rear_fender',
        label: 'رفرف خلفي',
        d: 'M45,363 L82,360 C86,360 88,362 88,366 L88,403 C88,407 86,409 82,410 L52,413 C46,413 42,409 40,403 L40,368 C40,365 42,363 45,363 Z'
    },

    // Right side profile (mirror of left)
    right_front_fender: {
        id: 'right_front_fender',
        label: 'رفرف أمامي',
        d: 'M322,80 L372,82 Q378,82 382,85 L382,128 C382,134 378,138 370,138 L321,135 C317,134 315,132 315,128 L315,86 C315,82 318,80 322,80 Z'
    },
    right_front_door: {
        id: 'right_front_door',
        label: 'باب أمامي',
        d: 'M318,140 L370,143 C371,143 372,145 372,148 L372,238 C372,244 368,248 362,248 L318,245 C314,244 312,242 312,238 L312,146 C312,142 314,140 318,140 Z'
    },
    right_rear_door: {
        id: 'right_rear_door',
        label: 'باب خلفي',
        d: 'M318,250 L370,253 C371,253 372,255 372,258 L372,348 C372,354 368,358 355,358 L318,355 C314,354 312,352 312,348 L312,256 C312,252 314,250 318,250 Z'
    },
    right_rear_fender: {
        id: 'right_rear_fender',
        label: 'رفرف خلفي',
        d: 'M318,360 L370,363 C372,363 372,365 372,368 L372,403 C372,409 368,413 348,413 L318,410 C314,409 312,407 312,403 L312,366 C312,362 314,360 318,360 Z'
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

        if ('pattern' in config && config.pattern === 'stripes') {
            return `url(#stripe-pattern-${partId})`;
        }
        return config.color;
    };

    const setAllParts = (condition: keyof typeof conditionConfig) => {
        if (readOnly) return;
        const allParts = Object.keys(carParts).reduce((acc, key) => {
            acc[carParts[key as keyof typeof carParts].id] = condition;
            return acc;
        }, {} as BodyCondition);
        onChange(allParts);
    };

    const resetAll = () => {
        if (readOnly) return;
        onChange({});
    };

    return (
        <div className="space-y-4 select-none">
            {/* Quick Actions */}
            {!readOnly && (
                <div className="flex flex-wrap gap-2 justify-center">
                    <button
                        onClick={resetAll}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                    >
                        🔄 إعادة تعيين
                    </button>
                    <button
                        onClick={() => setAllParts('pristine')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-300 dark:border-emerald-700"
                    >
                        ✓ كل أوريجنال
                    </button>
                    <button
                        onClick={() => setAllParts('painted')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors border border-orange-300 dark:border-orange-700"
                    >
                        🎨 كل بخ موضعي
                    </button>
                    <button
                        onClick={() => setAllParts('scratched')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors border border-yellow-300 dark:border-yellow-700"
                    >
                        ⚠ كل مبخوخ
                    </button>
                    <button
                        onClick={() => setAllParts('replaced')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-300 dark:border-red-700"
                    >
                        🔴 كل مبدل
                    </button>
                    <button
                        onClick={() => setAllParts('dented')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                    >
                        💥 كل صدمة
                    </button>
                </div>
            )}

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
                                {/* Part label text */}
                                <text
                                    x={
                                        part.id === 'hood' ? 200 :
                                            part.id === 'roof' ? 200 :
                                                part.id === 'trunk' ? 200 :
                                                    part.id === 'front_bumper' ? 200 :
                                                        part.id === 'rear_bumper' ? 200 :
                                                            part.id.startsWith('left') ? 52 :
                                                                part.id.startsWith('right') ? 348 :
                                                                    200
                                    }
                                    y={
                                        part.id === 'hood' ? 95 :
                                            part.id === 'roof' ? 237 :
                                                part.id === 'trunk' ? 365 :
                                                    part.id === 'front_bumper' ? 38 :
                                                        part.id === 'rear_bumper' ? 462 :
                                                            part.id === 'left_front_fender' ? 108 :
                                                                part.id === 'left_front_door' ? 195 :
                                                                    part.id === 'left_rear_door' ? 295 :
                                                                        part.id === 'left_rear_fender' ? 378 :
                                                                            part.id === 'right_front_fender' ? 108 :
                                                                                part.id === 'right_front_door' ? 195 :
                                                                                    part.id === 'right_rear_door' ? 295 :
                                                                                        part.id === 'right_rear_fender' ? 378 :
                                                                                            100
                                    }
                                    textAnchor="middle"
                                    fontSize="9"
                                    fontWeight="600"
                                    className="fill-slate-700 dark:fill-slate-100 pointer-events-none select-none"
                                    opacity={isPristine ? 0.6 : 0.9}
                                >
                                    {part.label}
                                </text>
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
                                    backgroundImage: ('pattern' in config && config.pattern === 'stripes')
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
