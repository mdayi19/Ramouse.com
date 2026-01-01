import React from 'react';

// A simple component to render text labels on the charts
const ChartLabel: React.FC<{ x: number, y: number, text: string, className?: string, isValue?: boolean }> = ({ x, y, text, className, isValue }) => (
    <text x={x} y={y} fill="currentColor" fontSize={isValue ? "14" : "12"} textAnchor="middle" className={className}>
        {text}
    </text>
);

// --- Line Chart Component ---
// --- Line Chart Component ---
export const LineChart: React.FC<{ data: { name: string;[key: string]: any }[] }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-center text-slate-500 p-8">لا توجد بيانات لعرضها.</div>;
    // updated finding key to include strings that look like numbers
    const key = Object.keys(data[0]).find(k => k !== 'name' && k !== 'date' && !isNaN(Number(data[0][k]))) || '';

    // Ensure we have a valid key to chart
    if (!key) return <div className="text-center text-slate-500 p-8">بيانات غير صالحة للمخطط.</div>;

    const values = data.map(d => Number(d[key]) || 0);
    const maxValue = Math.max(...values, 1);
    const width = 500, height = 200, padding = 30;

    const points = data.map((d, i) => {
        const val = Number(d[key]) || 0;
        const x = (i / Math.max(data.length - 1, 1)) * (width - padding * 2) + padding;
        const y = height - padding - (val / maxValue) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-500 dark:text-slate-400">
            <polyline fill="none" stroke="#0078D7" strokeWidth="2" points={points} />
            {data.map((d, i) => {
                const val = Number(d[key]) || 0;
                const x = (i / Math.max(data.length - 1, 1)) * (width - padding * 2) + padding;
                const y = height - padding - (val / maxValue) * (height - padding * 2);
                return <circle key={i} cx={x} cy={y} r="3" fill="#0078D7" />;
            })}
            {data.map((d, i) => i % Math.max(1, Math.floor(data.length / 10)) === 0 && (
                <ChartLabel key={i} x={(i / Math.max(data.length - 1, 1)) * (width - padding * 2) + padding} y={height - 10} text={d.name} />
            ))}
        </svg>
    );
};

// --- Pie Chart Component ---
export const PieChart: React.FC<{ data: { name: string, value: number, color: string }[] }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-center text-slate-500 p-8">لا توجد بيانات لعرضها.</div>;
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="text-center text-slate-500 p-8">لا توجد بيانات كافية لعرض المخطط.</div>;
    let startAngle = 0;

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
                {data.map((d, i) => {
                    const angle = (d.value / total) * 360;
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    const x1 = 50 + 45 * Math.cos(startAngle * Math.PI / 180);
                    const y1 = 50 + 45 * Math.sin(startAngle * Math.PI / 180);
                    startAngle += angle;
                    const x2 = 50 + 45 * Math.cos(startAngle * Math.PI / 180);
                    const y2 = 50 + 45 * Math.sin(startAngle * Math.PI / 180);
                    return <path key={i} d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={d.color} />;
                })}
            </svg>
            <div className="text-sm">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }}></span>
                        <span>{d.name}: <strong>{d.value}</strong></span>
                    </div>
                ))}
            </div>
        </div>
    );
};
// --- Bar Chart Component ---
export const BarChart: React.FC<{ data: { name: string;[key: string]: any }[] }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-center text-slate-500 p-8">لا توجد بيانات لعرضها.</div>;
    const key = Object.keys(data[0]).find(k => k !== 'name' && k !== 'date' && !isNaN(Number(data[0][k]))) || '';

    // Ensure we have a valid key to chart
    if (!key) return <div className="text-center text-slate-500 p-8">بيانات غير صالحة للمخطط.</div>;

    const values = data.map(d => Number(d[key]) || 0);
    const maxValue = Math.max(...values, 1);
    const width = 500, height = 200, padding = 30, barPadding = 5;
    const barWidth = data.length > 0 ? (width - padding * 2) / data.length - barPadding : 0;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-500 dark:text-slate-400">
            {data.map((d, i) => {
                const val = Number(d[key]) || 0;
                const barHeight = (val / maxValue) * (height - padding * 2);
                const x = padding + i * (barWidth + barPadding);
                const y = height - padding - barHeight;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barWidth} height={barHeight} fill="#3b82f6" rx="2" />
                        <ChartLabel x={x + barWidth / 2} y={height - 10} text={d.name} />
                        <ChartLabel x={x + barWidth / 2} y={y - 5} text={d[key]?.toString() || '0'} isValue className="fill-slate-700 dark:fill-slate-300 font-semibold" />
                    </g>
                );
            })}
        </svg>
    );
};
