import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Bed } from 'lucide-react';

const COLORS = {
    Available:   '#10b981', // emerald-500
    Occupied:    '#6366f1', // indigo-500
    Maintenance: '#f59e0b', // amber-500
};

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-2.5 text-xs">
            <p className="font-semibold text-slate-700">{name}</p>
            <p className="text-slate-600">{value} beds</p>
        </div>
    );
};

const CustomLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {(payload ?? []).map(entry => (
            <div key={entry.value} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                {entry.value}
            </div>
        ))}
    </div>
);

/**
 * BedOccupancyChart — donut pie chart of available/occupied/maintenance beds.
 * Aggregates across all wards returned from the API.
 * @param {{ occupancy: Array|null, loading: boolean }} props
 */
export const BedOccupancyChart = ({ occupancy, loading }) => {
    // Aggregate totals across all wards
    const totals = (occupancy ?? []).reduce(
        (acc, ward) => ({
            Available:    acc.Available    + (ward.available    ?? 0),
            Occupied:     acc.Occupied     + (ward.occupied     ?? 0),
            Maintenance:  acc.Maintenance  + (ward.maintenance  ?? 0),
        }),
        { Available: 0, Occupied: 0, Maintenance: 0 }
    );

    const data = Object.entries(totals)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
                <Bed className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-800 text-sm">Bed Occupancy</h3>
                {!loading && total > 0 && (
                    <span className="text-xs text-slate-400 ml-auto">{total} beds total</span>
                )}
            </div>
            {loading ? (
                <div className="h-[250px] flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-8 border-slate-100 animate-pulse" />
                </div>
            ) : data.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                    No bed data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map(entry => (
                                <Cell key={entry.name} fill={COLORS[entry.name] ?? '#cbd5e1'} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
