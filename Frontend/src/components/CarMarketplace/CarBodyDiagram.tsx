import React, { useState } from 'react';
import { Check, X, AlertTriangle, Paintbrush, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const bodyParts = [
    { id: 'hood', label: 'الكبوت', x: 250, y: 100, type: 'rect', w: 240, h: 120, rx: 20 },
    { id: 'roof', label: 'السقف', x: 250, y: 250, type: 'rect', w: 240, h: 170, rx: 15 },
    { id: 'trunk', label: 'الشنطة', x: 250, y: 400, type: 'rect', w: 240, h: 110, rx: 20 },
    { id: 'front_bumper', label: 'صدام أمامي', x: 250, y: 30, type: 'path', d: 'M 150 20 L 350 20 L 370 50 L 130 50 Z' },
    { id: 'rear_bumper', label: 'صدام خلفي', x: 250, y: 470, type: 'path', d: 'M 130 450 L 370 450 L 350 480 L 150 480 Z' },
    { id: 'left_front_door', label: 'باب أمامي أيسر', x: 80, y: 200, type: 'rect', w: 90, h: 90, rx: 10 },
    { id: 'left_rear_door', label: 'باب خلفي أيسر', x: 80, y: 300, type: 'rect', w: 90, h: 90, rx: 10 },
    { id: 'right_front_door', label: 'باب أمامي أيمن', x: 420, y: 200, type: 'rect', w: 90, h: 90, rx: 10 },
    { id: 'right_rear_door', label: 'باب خلفي أيمن', x: 420, y: 300, type: 'rect', w: 90, h: 90, rx: 10 },
    { id: 'left_fender', label: 'رفرف أيسر', x: 80, y: 100, type: 'rect', w: 90, h: 100, rx: 12 },
    { id: 'right_fender', label: 'رفرف أيمن', x: 420, y: 100, type: 'rect', w: 90, h: 100, rx: 12 },
];

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

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3">
                {Object.entries(conditionConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                        <div
                            key={key}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm
                                bg-gradient-to-r ${config.gradient} text-white`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{config.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Diagram */}
            <div className="relative bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-inner">
                <svg
                    viewBox="0 0 500 520"
                    className="w-full max-w-lg mx-auto drop-shadow-xl"
                    style={{ maxHeight: '500px' }}
                >
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {bodyParts.map((part) => {
                        const condition = value[part.id] || 'pristine';
                        const config = conditionConfig[condition as keyof typeof conditionConfig];
                        const isHovered = hoveredPart === part.id;

                        const commonProps = {
                            fill: config.color,
                            fillOpacity: condition === 'pristine' ? 0.3 : 0.6,
                            stroke: config.color,
                            strokeWidth: isHovered && !readOnly ? 4 : 2,
                            className: `transition-all duration-300 ${!readOnly ? 'cursor-pointer' : ''}`,
                            onClick: () => cycleCondition(part.id),
                            onMouseEnter: () => setHoveredPart(part.id),
                            onMouseLeave: () => setHoveredPart(null),
                            filter: isHovered && !readOnly ? 'url(#glow)' : undefined
                        };

                        return (
                            <g key={part.id}>
                                {part.type === 'rect' ? (
                                    <rect
                                        x={part.x - (part.w! / 2)} // Center the rect
                                        y={part.y - (part.h! / 2)}
                                        width={part.w}
                                        height={part.h}
                                        rx={part.rx}
                                        {...commonProps}
                                    />
                                ) : (
                                    <path
                                        d={part.d}
                                        {...commonProps}
                                    />
                                )}

                                {/* Label Bubble */}
                                <foreignObject
                                    x={part.x - 40}
                                    y={part.y - 12}
                                    width="80"
                                    height="24"
                                    className="pointer-events-none"
                                >
                                    <div className={`flex justify-center transition-opacity duration-300 ${condition !== 'pristine' || isHovered ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                            {part.label}
                                        </div>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </svg>

                {!readOnly && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            اضغط على الجزء لتغيير حالته
                        </p>
                    </div>
                )}
            </div>

            {/* Selected Info */}
            <AnimatePresence mode='wait'>
                {hoveredPart && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-center"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                            {bodyParts.find(p => p.id === hoveredPart)?.label}:
                            <span className={`text-${conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].color.replace('#', '')}-500`}>
                                {conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].label}
                            </span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
