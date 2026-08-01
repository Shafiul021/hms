import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from '../../components/ui/Skeleton';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-2.5 text-xs">
            <p className="font-semibold text-slate-600 mb-1">{label}</p>
            <p className="text-indigo-600 font-bold">{payload[0].value} appointments</p>
        </div>
    );
};

/**
 * AppointmentTrendChart — monthly appointment count for the last 12 months.
 * @param {{ trend: Array|null, loading: boolean }} props
 */
export const AppointmentTrendChart = ({ trend, loading }) => {
    // Format period labels: "2025-01" → "Jan"
    const data = (trend ?? []).map(d => ({
        ...d,
        label: new Date(d.period + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }));

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm">Appointment Trend</h3>
                <span className="text-xs text-slate-400 ml-auto">Last 12 months</span>
            </div>
            {loading ? (
                <div className="h-[250px] flex items-end gap-2 pb-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-slate-100 animate-pulse rounded-md" style={{ height: `${30 + Math.random() * 70}%` }} />
                    ))}
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
