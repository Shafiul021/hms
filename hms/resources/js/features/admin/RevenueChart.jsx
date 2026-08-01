import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-2.5 text-xs">
            <p className="font-semibold text-slate-600 mb-1">{label}</p>
            <p className="text-amber-600 font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
    );
};

// Gradient colour from low (amber-300) to high (amber-600) based on value rank
const BAR_COLORS = ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];

/**
 * RevenueChart — monthly revenue bar chart for the last 12 months.
 * @param {{ trend: Array|null, loading: boolean }} props
 */
export const RevenueChart = ({ trend, loading }) => {
    const data = (trend ?? []).map(d => ({
        ...d,
        label: new Date(d.period + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }));

    const maxRev = Math.max(...data.map(d => d.revenue), 1);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Revenue Trend</h3>
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
                    <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis
                            tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fef3c7', radius: 4 }} />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                            {data.map((entry, index) => {
                                const intensity = Math.floor((entry.revenue / maxRev) * (BAR_COLORS.length - 1));
                                return <Cell key={index} fill={BAR_COLORS[intensity] ?? BAR_COLORS[0]} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
