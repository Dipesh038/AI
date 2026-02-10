import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

const Graph = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-400 py-20">Select a country to view usage data</div>;
    }

    // Modern gradient palette
    const colors = [
        '#ef4444', // Red
        '#f97316', // Orange
        '#eab308', // Yellow
        '#22c55e', // Green
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#d946ef', // Fuchsia
        '#f43f5e', // Rose
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e1e2e]/90 backdrop-blur-sm border border-gray-700 p-3 rounded-lg shadow-xl max-w-xs">
                    <p className="text-gray-200 font-medium mb-1">{label}</p>
                    <p className="text-cyan-400 font-bold mb-2">
                        {payload[0].value}% <span className="text-gray-500 font-normal ml-1">Popularity</span>
                    </p>
                    <p className="text-xs text-gray-400 border-t border-gray-700 pt-2 leading-relaxed">
                        Popularity score is a normalized metric derived from AI adoption and tool usage indicators.
                    </p>
                </div>
            );
        }
        return null;
    };

    // Consistent color mapping based on tool name
    const getColor = (name) => {
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Sort data by usage and take top 10
    const sortedData = [...data].sort((a, b) => b.usage - a.usage).slice(0, 10);

    return (
        <div className="h-full w-full pb-4 overflow-hidden [&_*:focus]:outline-none" style={{ outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                    barSize={24}
                >
                    <defs>
                        {sortedData.map((entry, index) => {
                            const color = getColor(entry.name);
                            return (
                                <linearGradient key={`gradient-${index}`} id={`colorUv-${index}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                </linearGradient>
                            );
                        })}
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.3} />

                    <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                    />

                    <YAxis
                        dataKey="name"
                        type="category"
                        interval={0}
                        width={120}
                        tick={{ fill: '#e5e7eb', fontSize: 11, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        cursor={{ fill: '#ffffff', opacity: 0.05, radius: 4 }}
                        content={<CustomTooltip />}
                    />

                    <Bar
                        dataKey="usage"
                        radius={[0, 10, 10, 0]}
                        animationDuration={1500}
                    >
                        <LabelList dataKey="usage" position="right" fill="#ffffff" fontSize={11} formatter={(value) => `${value}%`} />
                        {sortedData.map((entry, index) => {
                            const color = getColor(entry.name);
                            return (
                                <Cell key={`cell-${index}`} fill={`url(#colorUv-${index})`} stroke={color} strokeWidth={0} />
                            );
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default React.memo(Graph);
