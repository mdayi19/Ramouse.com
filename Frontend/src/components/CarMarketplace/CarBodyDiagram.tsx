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

// Simple, clear car body parts (Top View)
const carParts = [
    { id: 'front_bumper', label: 'صدام أمامي', x: 60, y: 30, width: 180, height: 40, rx: 20 },
    { id: 'hood', label: 'الكبوت', x: 70, y: 75, width: 160, height: 100, rx: 8 },
    { id: 'windshield', label: 'زجاج أمامي', x: 80, y: 180, width: 140, height: 30, rx: 5, isGlass: true },
    { id: 'roof', label: 'السقف', x: 85, y: 215, width: 130, height: 130, rx: 8 },
    { id: 'left_front_door', label: 'باب أمامي أيسر', x: 20, y: 200, width: 60, height: 80, rx: 8 },
    { id: 'right_front_door', label: 'باب أمامي أيمن', x: 220, y: 200, width: 60, height: 80, rx: 8 },
    { id: 'left_rear_door', label: 'باب خلفي أيسر', x: 20, y: 285, width: 60, height: 80, rx: 8 },
    { id: 'right_rear_door', label: 'باب خلفي أيمن', x: 220, y: 285, width: 60, height: 80, rx: 8 },
    { id: 'rear_windshield', label: 'زجاج خلفي', x: 80, y: 350, width: 140, height: 30, rx: 5, isGlass: true },
    { id: 'trunk', label: 'الشنطة', x: 70, y: 385, width: 160, height: 90, rx: 8 },
    { id: 'rear_bumper', label: 'صدام خلفي', x: 60, y: 480, width: 180, height: 40, rx: 20 },
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

    const getPartStyle = (partId: string) => {
        const condition = value[partId] || 'pristine';
        const config = conditionConfig[condition as keyof typeof conditionConfig];
        return { condition, config };
    };

    return (
        <div className="space-y-6 select-none">
            {/* Condition Legend */}
            <div className="flex flex-wrap justify-center gap-3 px-2">
                {Object.entries(conditionConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                        <div
                            key={key}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                "bg-white dark:bg-slate-800 border-2",
                                value && Object.values(value).includes(key as any)
                                    ? "border-blue-500 shadow-md"
                                    : "border-slate-200 dark:border-slate-700 opacity-60"
                            )}
                        >
                            <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${config.gradient}`} />
                            <span className="text-slate-700 dark:text-slate-200">{config.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Simple Car Diagram */}
            <div className="relative mx-auto max-w-[340px]">
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700">
                    <svg
                        viewBox="0 0 300 550"
                        className="w-full h-auto"
                    >
                        {/* Simple car outline for context */}
                        <rect x="55" y="25" width="190" height="500" rx="25"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            opacity="0.3"
                        />

                        {/* Car Parts */}
                        {carParts.map((part) => {
                            if (part.isGlass) {
                                // Non-interactive glass parts
                                return (
                                    <rect
                                        key={part.id}
                                        x={part.x}
                                        y={part.y}
                                        width={part.width}
                                        height={part.height}
                                        rx={part.rx}
                                        fill="#94a3b8"
                                        opacity="0.3"
                                        stroke="#64748b"
                                        strokeWidth="1"
                                    />
                                );
                            }

                            const { condition, config } = getPartStyle(part.id);
                            const isHovered = hoveredPart === part.id;
                            const isPristine = condition === 'pristine';

                            return (
                                <g
                                    key={part.id}
                                    onClick={() => cycleCondition(part.id)}
                                    onMouseEnter={() => setHoveredPart(part.id)}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    className={!readOnly ? "cursor-pointer" : ""}
                                >
                                    <rect
                                        x={part.x}
                                        y={part.y}
                                        width={part.width}
                                        height={part.height}
                                        rx={part.rx}
                                        fill={config.color}
                                        fillOpacity={isPristine ? 0.15 : 0.7}
                                        stroke={config.color}
                                        strokeWidth={isHovered && !readOnly ? 3 : 1.5}
                                        strokeOpacity={isHovered ? 1 : 0.6}
                                        className="transition-all duration-200"
                                        style={{
                                            transform: isHovered && !readOnly ? 'scale(1.02)' : 'scale(1)',
                                            transformOrigin: `${part.x + part.width / 2}px ${part.y + part.height / 2}px`
                                        }}
                                    />

                                    {/* Part Label - shown when hovered or when has damage */}
                                    {(isHovered || !isPristine) && (
                                        <text
                                            x={part.x + part.width / 2}
                                            y={part.y + part.height / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="text-xs font-bold fill-slate-700 dark:fill-white pointer-events-none"
                                            style={{ fontSize: '10px' }}
                                        >
                                            {!isPristine && config.label}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Simple wheels for context */}
                        <ellipse cx="45" cy="120" rx="8" ry="18" fill="#334155" opacity="0.5" />
                        <ellipse cx="255" cy="120" rx="8" ry="18" fill="#334155" opacity="0.5" />
                        <ellipse cx="45" cy="430" rx="8" ry="18" fill="#334155" opacity="0.5" />
                        <ellipse cx="255" cy="430" rx="8" ry="18" fill="#334155" opacity="0.5" />
                    </svg>

                    {!readOnly && (
                        <div className="mt-4 flex justify-center">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                                <Info className="w-4 h-4" />
                                اضغط على أي جزء لتغيير حالته
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hovered Part Info */}
            <div className="h-10 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    {hoveredPart && (
                        <motion.div
                            key="tooltip"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                        >
                            <span className="font-bold text-sm">
                                {carParts.find(p => p.id === hoveredPart)?.label}
                            </span>
                            <span className="text-xs opacity-75">•</span>
                            <span className="text-sm">
                                {conditionConfig[value[hoveredPart] as keyof typeof conditionConfig || 'pristine'].label}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
