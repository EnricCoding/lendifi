// frontend/components/HistoryChart.tsx
'use client';

import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from 'recharts';

export interface Point {
    ts: number;            // timestamp in seconds
    collateralValue: number;
    debtValue: number;
}

interface HistoryChartProps {
    data: Point[];
}

export function HistoryChart({ data }: HistoryChartProps) {
    // Convert timestamps to readable labels (e.g. hours/minutes)
    const formatted = data.map((p) => ({
        ...p,
        time: new Date(p.ts * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        }),
    }));

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formatted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: '#6B7280' }} />
                <YAxis
                    tick={{ fill: '#6B7280' }}
                    domain={['auto', 'auto']}
                    allowDataOverflow={false}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: 4 }}
                    labelFormatter={(label) => `Hora: ${label}`}
                    formatter={(value: number, name: string) => [
                        value.toFixed(2),
                        name === 'collateralValue'
                            ? 'Colateral'
                            : name === 'debtValue'
                                ? 'Deuda'
                                : name,
                    ]}
                />
                <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                />
                <Line
                    type="monotone"
                    dataKey="collateralValue"
                    name="Colateral"
                    stroke="#0EA5E9"
                    dot={false}
                    strokeWidth={2}
                />
                <Line
                    type="monotone"
                    dataKey="debtValue"
                    name="Deuda"
                    stroke="#F43F5E"
                    dot={false}
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
