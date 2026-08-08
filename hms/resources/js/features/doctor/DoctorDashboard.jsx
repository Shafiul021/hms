import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { labApi } from '../../api/lab';
import { useAuthStore } from '../../store/authStore';
import { useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import toast from 'react-hot-toast';
import {
    Stethoscope,
    FlaskConical,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    ChevronRight,
    CalendarDays,
    Activity,
    Loader2,
} from 'lucide-react';

// ─── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        scheduled:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'Scheduled' },
        confirmed:   { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Confirmed' },
        completed:   { cls: 'bg-green-50 text-green-700 border-green-200', label: 'Completed' },
        cancelled:   { cls: 'bg-red-50 text-red-600 border-red-200',       label: 'Cancelled' },
        pending:     { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
        in_progress: { cls: 'bg-purple-50 text-purple-700 border-purple-200', label: 'In Progress' },
        delayed:     { cls: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Delayed' },
        rescheduled: { cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Rescheduled' },
    };
    const { cls, label } = map[status] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: status };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            {label}
        </span>
    );
};

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, count, color = 'indigo' }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        </div>
        {count !== undefined && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>
                {count}
            </span>
        )}
    </div>
);

// ─── Skeleton row ────────────────────────────────────────────────────────────
const SkeletonRow = () => (
    <div className="animate-pulse flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-white">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
    </div>
);

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-400 mb-2" />
        <p className="text-sm text-gray-500">{message}</p>
    </div>
);

// ─── Today's Appointments section ────────────────────────────────────────────
const TodaysAppointments = ({ navigate, doctorId }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { mutate: updateStatus, isLoading: updatingStatus } = useUpdateAppointmentStatus();

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!doctorId) return;
        appointmentsApi
            .getAppointments({ start_date: today, end_date: today, doctor_id: doctorId, per_page: 50 })
            .then((data) => setAppointments(data.data || data || []))
            .catch(() => setAppointments([]))
            .finally(() => setLoading(false));
    }, [today, doctorId]);

    const pending = appointments.filter(
        (a) => !['completed', 'cancelled'].includes(a.status)
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader
                icon={CalendarDays}
                title="Today's Appointments"
                count={loading ? '…' : pending.length}
                color="indigo"
            />

            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : pending.length === 0 ? (
                    <EmptyState message="No appointments scheduled for today." />
                ) : (
                    pending.map((appt) => {
                        const timeStr = appt.slot?.start_time
                            ? appt.slot.start_time.substring(0, 5)
                            : '-';

                        return (
                            <div
                                key={appt.id}
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all duration-150 group"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {appt.patient?.name?.[0] ?? <User className="w-4 h-4" />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {appt.patient?.name ?? `Patient #${appt.patient_id}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{timeStr}</span>
                                        {appt.notes && (
                                            <>
                                                <span className="text-gray-300">·</span>
                                                <span className="text-xs text-gray-400 truncate max-w-[160px]">
                                                    {appt.notes}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status badge */}
                                <StatusBadge status={appt.status} />

                                {/* Action */}
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                    {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateStatus({ id: appt.id, status: 'delayed' }, {
                                                    onSuccess: () => {
                                                        toast.success("Appointment marked as delayed");
                                                        // Update locally without refetching for speed
                                                        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'delayed' } : a));
                                                    },
                                                    onError: () => toast.error("Failed to mark as delayed")
                                                });
                                            }}
                                            disabled={updatingStatus}
                                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                                        >
                                            Delay
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() =>
                                            navigate(`/appointments/${appt.id}/consult`)
                                        }
                                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                                    >
                                        Consult
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// ─── Pending Lab Requests section ────────────────────────────────────────────
const PendingLabRequests = ({ navigate }) => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        labApi
            .getLabRequests({ status: 'pending', per_page: 50 })
            .then((data) => setLabs(data.data || data || []))
            .catch(() => setLabs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader
                icon={FlaskConical}
                title="Pending Lab Results"
                count={loading ? '…' : labs.length}
                color="amber"
            />

            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                ) : labs.length === 0 ? (
                    <EmptyState message="All lab results have been reviewed." />
                ) : (
                    labs.map((lab) => (
                        <div
                            key={lab.id}
                            className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-200 transition-all duration-150 group"
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <FlaskConical className="w-4 h-4 text-amber-600" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {lab.test_name ?? lab.test_type ?? `Lab Request #${lab.id}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Patient:{' '}
                                    <span className="font-medium text-gray-700">
                                        {lab.patient?.name ?? `#${lab.patient_id}`}
                                    </span>
                                </p>
                            </div>

                            {/* Status */}
                            <StatusBadge status={lab.status ?? 'pending'} />

                            {/* Action */}
                            <button
                                onClick={() => navigate(`/lab/${lab.id}/result`)}
                                className="flex items-center gap-1 text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:underline"
                            >
                                View
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ─── KPI Mini Cards ──────────────────────────────────────────────────────────
const QuickStat = ({ icon: Icon, label, value, color }) => (
    <div className={`flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm`}>
        <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{value ?? '—'}</p>
        </div>
    </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const [statsAppts, setStatsAppts] = useState(null);
    const [statsPending, setStatsPending] = useState(null);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!user?.doctor_id) {
            setStatsAppts(0);
            return;
        }

        appointmentsApi
            .getAppointments({ start_date: todayStr, end_date: todayStr, doctor_id: user.doctor_id, per_page: 200 })
            .then((data) => {
                const all = data.data || data || [];
                setStatsAppts(all.filter(a => !['cancelled'].includes(a.status)).length);
            })
            .catch(() => setStatsAppts(0));

        labApi
            .getLabRequests({ status: 'pending', per_page: 1 })
            .then((data) => {
                setStatsPending(data.total ?? (data.data || data || []).length);
            })
            .catch(() => setStatsPending(0));
    }, [todayStr, user?.doctor_id]);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-indigo-500" />
                        Doctor Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome back, <span className="font-medium text-gray-700">{user?.name ?? 'Doctor'}</span>.{' '}
                        {today}
                    </p>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <QuickStat
                    icon={CalendarDays}
                    label="Today's Appointments"
                    value={statsAppts === null ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : statsAppts}
                    color="indigo"
                />
                <QuickStat
                    icon={FlaskConical}
                    label="Pending Lab Results"
                    value={statsPending === null ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : statsPending}
                    color="amber"
                />
                <QuickStat
                    icon={Activity}
                    label="My Schedule"
                    value={
                        <button
                            onClick={() => navigate('/doctors/schedule')}
                            className="text-indigo-600 hover:underline text-sm font-semibold"
                        >
                            View →
                        </button>
                    }
                    color="green"
                />
            </div>

            {/* Main panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TodaysAppointments navigate={navigate} doctorId={user?.doctor_id} />
                <PendingLabRequests navigate={navigate} />
            </div>
        </div>
    );
};
