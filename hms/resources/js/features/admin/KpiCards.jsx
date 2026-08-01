import React from 'react';
import { Users, Stethoscope, CalendarCheck, DollarSign, Bed } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const CARDS = [
    {
        key: 'total_patients',
        label: 'Total Patients',
        icon: Users,
        color: 'indigo',
        format: v => v?.toLocaleString() ?? '—',
    },
    {
        key: 'total_doctors',
        label: 'Doctors',
        icon: Stethoscope,
        color: 'sky',
        format: v => v?.toLocaleString() ?? '—',
    },
    {
        key: 'appointments_today',
        label: "Today's Appointments",
        icon: CalendarCheck,
        color: 'emerald',
        format: v => v?.toLocaleString() ?? '—',
    },
    {
        key: 'revenue_this_month',
        label: 'Revenue This Month',
        icon: DollarSign,
        color: 'amber',
        format: v => (v !== undefined ? formatCurrency(v) : '—'),
    },
];

const COLOR_MAP = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
    sky:    { bg: 'bg-sky-50',    text: 'text-sky-600',    ring: 'ring-sky-100' },
    emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-600',ring: 'ring-emerald-100' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  ring: 'ring-amber-100' },
};

const Pulse = () => (
    <div className="animate-pulse h-8 w-20 bg-slate-200 rounded-lg" />
);

/**
 * KpiCards — 4 metric cards: patients, doctors, appointments, revenue.
 * @param {{ stats: object|null, loading: boolean }} props
 */
export const KpiCards = ({ stats, loading }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon: Icon, color, format }) => {
            const c = COLOR_MAP[color];
            return (
                <div
                    key={key}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                    <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ring-4 ${c.ring} flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <div className="min-w-0">
                        {loading ? <Pulse /> : (
                            <p className="text-2xl font-bold text-slate-800 truncate">
                                {format(stats?.[key])}
                            </p>
                        )}
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
                    </div>
                </div>
            );
        })}
    </div>
);
