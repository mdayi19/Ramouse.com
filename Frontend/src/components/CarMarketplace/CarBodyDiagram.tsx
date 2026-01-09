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
    pristine: { label: 'أوريجنال', color: '#e2e8f0', icon: Check, pattern: 'none' },
    scratched: { label: 'خدوش', color: '#fbbf24', icon: AlertTriangle, pattern: 'dots' },
    dented: { label: 'صدمة', color: '#f87171', icon: X, pattern: 'none' },
    painted: { label: 'مدهون', color: '#fb923c', icon: Paintbrush, pattern: 'stripes' },
    replaced: { label: 'جديل', color: '#ef4444', icon: RefreshCw, pattern: 'none' }
};

// Car parts definitions with simple paths for clean line art
const carParts = {
    // Top view - center
    hood: { id: 'hood', label: 'غطاء المحرك', view: 'top', d: 'M140,40 L260,40 L270,120 L130,120 Z' },
    roof: { id: 'roof', label: 'السقف', view: 'top', d: 'M135,135 L265,135 L265,265 L135,265 Z' },
    trunk: { id: 'trunk', label: 'الصندوق', view: 'top', d: 'M130,280 L270,280 L260,360 L140,360 Z' },

    // Left side view
    left_front_fender: { id: 'left_front_fender', label: 'رفرف أمامي', view: 'left', d: 'M20,120 L90,115 L90,155 L30,160 Z' },
    left_front_door: { id: 'left_front_door', label: 'باب أمامي', view: 'left', d: 'M25,165 L90,165 L90,245 L35,250 Z' },
    left_rear_door: { id: 'left_rear_door', label: 'باب خلفي', view: 'left', d: 'M40,255 L90,255 L90,335 L50,340 Z' },
    left_rear_fender: { id: 'left_rear_fender', label: 'رفرف خلفي', view: 'left', d: 'M55,345 L90,340 L90,380 L70,385 Z' },

    // Right side view
    right_front_fender: { id: 'right_front_fender', label: 'رفرف أمامي', view: 'right', d: 'M310,115 L380,120 L370,160 L310,155 Z' },
    right_front_door: { id: 'right_front_door', label: 'باب أمامي', view: 'right', d: 'M310,165 L375,165 L365,250 L310,245 Z' },
    right_rear_door: { id: 'right_rear_door', label: 'باب خلفي', view: 'right', d: 'M310,255 L360,255 L350,340 L310,335 Z' },
    right_rear_fender: { id: 'right_rear_fender', label: 'رفرف خلفي', view: 'right', d: 'M310,340 L345,345 L330,385 L310,380 Z' },

    // Rear view
    rear_bumper: { id: 'rear_bumper', label: 'صدام خلفي', view: 'rear', d: 'M140,395 L260,395 L260,420 L140,420 Z' },
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
            return `url(#stripes-${partId})`;
        } else if (config.pattern === 'dots') {
            return `url(#dots-${partId})`;
        }
        return config.color;
    };

    const getStrokeColor = (partId: string) => {
        const condition = value[partId] || 'pristine';
        return conditionConfig[condition as keyof typeof conditionConfig].color;
    };

    return (
        <div className="space-y-6 select-none">
            {/* Title */}
            <h3 className="text-center text-lg font-bold text-slate-700 dark:text-slate-200">
                مخطط الأضرار
            </h3>

            {/* Main Diagram */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
                <svg viewBox="0 0 400 500" className="w-full h-auto">
                    <defs>
                        {/* Define stripe patterns for each part */}
                        {Object.keys(carParts).map(partId => (
                            <pattern
                                key={`stripes-${partId}`}
                                id={`stripes-${partId}`}
                                patternUnits="userSpaceOnUse"
                                width="8"
                                height="8"
                                patternTransform="rotate(45)"
                            >
                                <rect width="4" height="8" fill={getStrokeColor(partId)} />
                                <rect x="4" width="4" height="8" fill="white" />
                            </pattern>
                        ))}

                        {/* Define dot patterns */}
                        {Object.keys(carParts).map(partId => (
                            <pattern
                                key={`dots-${partId}`}
                                id={`dots-${partId}`}
                                patternUnits="userSpaceOnUse"
                                width="10"
                                height="10"
                            >
                                <circle cx="5" cy="5" r="2" fill={getStrokeColor(partId)} />
                            </pattern>
                        ))}
                    </defs>

                    {/* Car outline background - top view */}
                    <g opacity="0.15">
                        <path d="M130,30 L270,30 L280,120 L280,280 L270,370 L130,370 L120,280 L120,120 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2" />
                    </g>

                    {/* Car outline - left side */}
                    <g opacity="0.15">
                        <path d="M10,110 L95,105 L95,390 L60,395 L10,390 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2" />
                    </g>

                    {/* Car outline - right side */}
                    <g opacity="0.15">
                        <path d="M305,105 L390,110 L390,390 L340,395 L305,390 Z"
                            fill="none" stroke="#94a3b8" strokeWidth="2" />
                    </g>

                    {/* Car outline - rear */}
                    <g opacity="0.15">
                        <rect x="130" y="390" width="140" height="35" rx="5"
                            fill="none" stroke="#94a3b8" strokeWidth="2" />
                    </g>

                    {/* Interactive Parts */}
                    {Object.entries(carParts).map(([key, part]) => {
                        const isHovered = hoveredPart === part.id;
                        const condition = value[part.id] || 'pristine';
                        const isPristine = condition === 'pristine';

                        return (
                            <g
                                key={part.id}
                                onMouseEnter={() => setHoveredPart(part.id)}
                                onMouseLeave={() => setHoveredPart(null)}
                                onClick={() => cycleCondition(part.id)}
                                className={!readOnly ? "cursor-pointer" : ""}
                            >
                                <path
                                    d={part.d}
                                    fill={getPartFill(part.id)}
                                    fillOpacity={isPristine ? 0.3 : 0.8}
                                    stroke={getStrokeColor(part.id)}
                                    strokeWidth={isHovered ? 3 : 1.5}
                                    strokeOpacity={isPristine ? 0.4 : 1}
                                    className="transition-all duration-200"
                                />
                            </g>
                        );
                    })}

                    {/* View Labels */}
                    <text x="50" y="95" textAnchor="middle" className="text-xs fill-slate-400" fontSize="11">جانب أيسر</text>
                    <text x="200" y="25" textAnchor="middle" className="text-xs fill-slate-400" fontSize="11">منظر علوي</text>
                    <text x="350" y="95" textAnchor="middle" className="text-xs fill-slate-400" fontSize="11">جانب أيمن</text>
                    <text x="200" y="450" textAnchor="middle" className="text-xs fill-slate-400" fontSize="11">منظر خلفي</text>
                </svg>

                {/* Instruction */}
                {!readOnly && (
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                        اضغط على أي جزء لتغيير حالته
                    </p>
                )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(conditionConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isUsed = value && Object.values(value).includes(key as any);

                    return (
                        <div
                            key={key}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isUsed
                                    ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-700'
                                    : 'border-slate-200 dark:border-slate-700 opacity-60'
                                }`}
                        >
                            <div
                                className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 flex-shrink-0"
                                style={{
                                    backgroundColor: config.color,
                                    backgroundImage: config.pattern === 'stripes'
                                        ? `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 6px)`
                                        : config.pattern === 'dots'
                                            ? `radial-gradient(circle, ${config.color} 2px, transparent 2px)`
                                            : 'none',
                                    backgroundSize: config.pattern === 'dots' ? '8px 8px' : 'auto'
                                }}
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {config.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Hovered Part Info */}
            <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    {hoveredPart && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-1.5 rounded-lg text-sm font-medium"
                        >
                            {carParts[hoveredPart as keyof typeof carParts]?.label}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
