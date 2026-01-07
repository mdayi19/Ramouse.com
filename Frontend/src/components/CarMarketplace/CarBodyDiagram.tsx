import React, { useState } from 'react';
import { Check, X, AlertTriangle, Paintbrush, RefreshCw } from 'lucide-react';

interface BodyCondition {
    [key: string]: 'pristine' | 'scratched' | 'dented' | 'painted' | 'replaced';
}

interface CarBodyDiagramProps {
    value: BodyCondition;
    onChange: (condition: BodyCondition) => void;
}

const conditionColors = {
    pristine: '#10b981', // green
    scratched: '#f59e0b', // amber
    dented: '#ef4444', // red
    painted: '#8b5cf6', // purple
    replaced: '#3b82f6' // blue
};

const conditionLabels = {
    pristine: 'ممتازة',
    scratched: 'خدوش',
    dented: 'مضروبة',
    painted: 'مدهونة',
    replaced: 'مستبدلة'
};

const conditionIcons = {
    pristine: Check,
    scratched: AlertTriangle,
    dented: X,
    painted: Paintbrush,
    replaced: RefreshCw
};

const bodyParts = [
    { id: 'hood', label: 'الكبوت', x: 250, y: 100 },
    { id: 'roof', label: 'السقف', x: 250, y: 250 },
    { id: 'trunk', label: 'الصندوق', x: 250, y: 400 },
    { id: 'front_bumper', label: 'صدام أمامي', x: 250, y: 30 },
    { id: 'rear_bumper', label: 'صدام خلفي', x: 250, y: 470 },
    { id: 'left_front_door', label: 'باب أمامي أيسر', x: 80, y: 200 },
    { id: 'left_rear_door', label: 'باب خلفي أيسر', x: 80, y: 300 },
    { id: 'right_front_door', label: 'باب أمامي أيمن', x: 420, y: 200 },
    { id: 'right_rear_door', label: 'باب خلفي أيمن', x: 420, y: 300 },
    { id: 'left_fender', label: 'رفرف أيسر', x: 80, y: 100 },
    { id: 'right_fender', label: 'رفرف أيمن', x: 420, y: 100 },
];

export const CarBodyDiagram: React.FC<CarBodyDiagramProps> = ({ value, onChange }) => {
    const [selectedPart, setSelectedPart] = useState<string | null>(null);

    const cycleCondition = (partId: string) => {
        const conditions: Array<'pristine' | 'scratched' | 'dented' | 'painted' | 'replaced'> =
            ['pristine', 'scratched', 'dented', 'painted', 'replaced'];

        const currentCondition = value[partId] || 'pristine';
        const currentIndex = conditions.indexOf(currentCondition);
        const nextIndex = (currentIndex + 1) % conditions.length;

        onChange({
            ...value,
            [partId]: conditions[nextIndex]
        });
    };

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(conditionLabels).map(([key, label]) => {
                    const Icon = conditionIcons[key as keyof typeof conditionIcons];
                    return (
                        <div
                            key={key}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm"
                            style={{
                                backgroundColor: conditionColors[key as keyof typeof conditionColors] + '20',
                                color: conditionColors[key as keyof typeof conditionColors]
                            }}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Car Diagram */}
            <div className="relative bg-slate-100 dark:bg-slate-700 rounded-2xl p-8 overflow-hidden">
                <svg
                    viewBox="0 0 500 550"
                    className="w-full max-w-lg mx-auto"
                    style={{ maxHeight: '600px' }}
                >
                    {/* Car Outline (Top-down view) */}

                    {/* Front Bumper */}
                    <path
                        d="M 150 20 L 350 20 L 370 50 L 130 50 Z"
                        fill={conditionColors[value['front_bumper'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['front_bumper'] || 'pristine']}
                        strokeWidth="3"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('front_bumper')}
                    />

                    {/* Hood */}
                    <rect
                        x="130"
                        y="50"
                        width="240"
                        height="120"
                        fill={conditionColors[value['hood'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['hood'] || 'pristine']}
                        strokeWidth="3"
                        rx="10"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('hood')}
                    />

                    {/* Left Front Fender */}
                    <rect
                        x="40"
                        y="60"
                        width="90"
                        height="100"
                        fill={conditionColors[value['left_fender'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['left_fender'] || 'pristine']}
                        strokeWidth="3"
                        rx="8"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('left_fender')}
                    />

                    {/* Right Front Fender */}
                    <rect
                        x="370"
                        y="60"
                        width="90"
                        height="100"
                        fill={conditionColors[value['right_fender'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['right_fender'] || 'pristine']}
                        strokeWidth="3"
                        rx="8"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('right_fender')}
                    />

                    {/* Left Front Door */}
                    <rect
                        x="40"
                        y="170"
                        width="90"
                        height="90"
                        fill={conditionColors[value['left_front_door'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['left_front_door'] || 'pristine']}
                        strokeWidth="3"
                        rx="5"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('left_front_door')}
                    />

                    {/* Right Front Door */}
                    <rect
                        x="370"
                        y="170"
                        width="90"
                        height="90"
                        fill={conditionColors[value['right_front_door'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['right_front_door'] || 'pristine']}
                        strokeWidth="3"
                        rx="5"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('right_front_door')}
                    />

                    {/* Roof/Cabin */}
                    <rect
                        x="130"
                        y="170"
                        width="240"
                        height="170"
                        fill={conditionColors[value['roof'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['roof'] || 'pristine']}
                        strokeWidth="3"
                        rx="10"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('roof')}
                    />

                    {/* Left Rear Door */}
                    <rect
                        x="40"
                        y="270"
                        width="90"
                        height="90"
                        fill={conditionColors[value['left_rear_door'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['left_rear_door'] || 'pristine']}
                        strokeWidth="3"
                        rx="5"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('left_rear_door')}
                    />

                    {/* Right Rear Door */}
                    <rect
                        x="370"
                        y="270"
                        width="90"
                        height="90"
                        fill={conditionColors[value['right_rear_door'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['right_rear_door'] || 'pristine']}
                        strokeWidth="3"
                        rx="5"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('right_rear_door')}
                    />

                    {/* Trunk */}
                    <rect
                        x="130"
                        y="340"
                        width="240"
                        height="110"
                        fill={conditionColors[value['trunk'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['trunk'] || 'pristine']}
                        strokeWidth="3"
                        rx="10"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('trunk')}
                    />

                    {/* Rear Bumper */}
                    <path
                        d="M 130 450 L 370 450 L 350 480 L 150 480 Z"
                        fill={conditionColors[value['rear_bumper'] || 'pristine']}
                        fillOpacity="0.3"
                        stroke={conditionColors[value['rear_bumper'] || 'pristine']}
                        strokeWidth="3"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => cycleCondition('rear_bumper')}
                    />

                    {/* Labels */}
                    {bodyParts.map(part => {
                        const Icon = conditionIcons[value[part.id] as keyof typeof conditionIcons || 'pristine'];
                        return (
                            <g key={part.id}>
                                <foreignObject
                                    x={part.x - 30}
                                    y={part.y - 10}
                                    width="60"
                                    height="20"
                                    className="pointer-events-none"
                                >
                                    <div className="flex items-center justify-center">
                                        <div
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 shadow-lg"
                                            style={{ color: conditionColors[value[part.id] || 'pristine'] }}
                                        >
                                            <Icon className="w-3 h-3" />
                                        </div>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </svg>

                {/* Instructions */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        اضغط على أي جزء من السيارة لتغيير حالته
                    </p>
                </div>
            </div>

            {/* Selected Part Info */}
            {selectedPart && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <div className="text-center">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {bodyParts.find(p => p.id === selectedPart)?.label}:
                            <span className="mr-2" style={{ color: conditionColors[value[selectedPart] || 'pristine'] }}>
                                {conditionLabels[value[selectedPart] || 'pristine']}
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
