import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';

interface ChartPoint {
    label: string;
    value: number;
}

const AuctionCharts: React.FC = () => {
    // Mock Data - In real app, pass this as prop
    const bidData: ChartPoint[] = Array.from({ length: 12 }, (_, i) => ({
        label: `${i * 2}h`,
        value: Math.floor(Math.random() * 50) + 10
    }));

    const revenueData: ChartPoint[] = Array.from({ length: 7 }, (_, i) => ({
        label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: Math.floor(Math.random() * 50000) + 10000
    }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard
                title="Bids Velocity (24h)"
                subtitle="High tracking activity"
                data={bidData}
                color="#3b82f6"
                icon="Activity"
            />
            <ChartCard
                title="Revenue Trend"
                subtitle="+12.5% vs last week"
                data={revenueData}
                color="#10b981"
                icon="TrendingUp"
                isCurrency
            />
        </div>
    );
};

interface ChartCardProps {
    title: string;
    subtitle: string;
    data: ChartPoint[];
    color: string;
    icon: string;
    isCurrency?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, data, color, icon, isCurrency }) => {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = 0;
    const height = 120;
    const width = 300; // viewBox width

    // Generate path
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - minVal) / (maxVal - minVal)) * height;
        return `${x},${y}`;
    }).join(' L ');

    const areaPath = `M 0,${height} L ${points} L ${width},${height} Z`;
    const linePath = `M ${points}`;

    return (
        <div className="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <div className={`p-2.5 rounded-xl opacity-80`} style={{ backgroundColor: `${color}20` }}>
                    <Icon name={icon as any} className="w-5 h-5" style={{ color }} />
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-[140px] w-full">
                <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`grad-${icon}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area */}
                    <motion.path
                        d={areaPath}
                        fill={`url(#grad-${icon})`}
                        initial={{ opacity: 0, pathLength: 0 }}
                        animate={{ opacity: 1, pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Line */}
                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Interactive Points */}
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * width;
                        const y = height - ((d.value - minVal) / (maxVal - minVal)) * height;

                        return (
                            <g key={i}>
                                {/* Interaction Area */}
                                <rect
                                    x={x - 10}
                                    y={0}
                                    width={20}
                                    height={height}
                                    fill="transparent"
                                    onMouseEnter={() => setHoveredPoint(i)}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                />

                                {/* Visible Point (on hover) */}
                                <AnimatePresence>
                                    {hoveredPoint === i && (
                                        <motion.g
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                        >
                                            <circle cx={x} cy={y} r="5" fill="white" stroke={color} strokeWidth="3" />

                                            {/* Tooltip */}
                                            <foreignObject x={x - 40} y={y - 50} width="80" height="40">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg font-bold shadow-xl whitespace-nowrap">
                                                        {isCurrency ? `$${d.value.toLocaleString()}` : d.value}
                                                    </div>
                                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900"></div>
                                                </div>
                                            </foreignObject>
                                        </motion.g>
                                    )}
                                </AnimatePresence>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default AuctionCharts;
