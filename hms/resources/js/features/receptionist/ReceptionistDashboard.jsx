import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '@hms/ui';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import {
    CalendarRange, ArrowRight, UserPlus, Clock, Users,
    PlusCircle, CheckCircle2, Phone, Stethoscope
} from 'lucide-react';

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color = 'indigo' }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber:   'bg-amber-50 text-amber-600',
        sky:     'bg-sky-50 text-sky-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
        </div>
    );
};

// ── Today's Schedule ──────────────────────────────────────────────────────────
const TodaySchedule = ({ appointments, loading, onStatusChange }) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-indigo-500" /> Today's Appointments
                </h2>
                <Link to="/appointments" className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                    Full List <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
            {loading ? (
                <div className="p-5"><Skeleton rows={5} columns={4} /></div>
            ) : appointments.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                    <CalendarRange className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No appointments scheduled for today.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/60 border-b border-slate-100">
                            <tr>
                                {['Patient', 'Doctor', 'Time', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {appointments.map(appt => (
                                <tr key={appt.id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
                                                <Users className="w-3.5 h-3.5 text-indigo-500" />
                                            </div>
                                            <span className="font-medium text-slate-700">{appt.patient?.name ?? '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <p className="font-medium">Dr. {appt.doctor?.name ?? '—'}</p>
                                        <p className="text-xs text-slate-400">{appt.doctor?.specialization ?? ''}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                        {appt.slot?.start_time?.slice(0, 5) ?? '—'}
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={appt.status} /></td>
                                    <td className="px-4 py-3">
                                        {appt.status === 'pending' && (
                                            <button
                                                onClick={() => onStatusChange(appt.id, 'confirmed')}
                                                className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const ReceptionistDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    // Fetch today's appointments
    const fetchToday = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await appointmentsApi.getAppointments({ date: today, per_page: 50 });
            setAppointments(data.data || []);
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchToday();
    }, []);

    const handleStatusChange = async (id, status) => {
        setUpdating(id);
        try {
            await appointmentsApi.updateStatus(id, status);
            fetchToday();
        } catch {
            // fail silently; could add toast here
        } finally {
            setUpdating(null);
        }
    };

    const todayCount   = appointments.length;
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-2xl p-6 text-white shadow-lg shadow-sky-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Phone className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Good day, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-sky-200 text-sm mt-0.5">Receptionist dashboard — today's schedule and patient intake.</p>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard icon={CalendarRange} label="Total Today" value={loading ? '…' : todayCount} color="indigo" />
                <KpiCard icon={Clock} label="Awaiting Confirmation" value={loading ? '…' : pendingCount} color="amber" />
                <KpiCard icon={CheckCircle2} label="Confirmed" value={loading ? '…' : confirmedCount} color="emerald" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/appointments/book')}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <PlusCircle className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Book Appointment</p>
                        <p className="text-xs text-slate-400">Schedule appointment on behalf of patient</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-indigo-500 transition-colors" />
                </button>
                <button
                    onClick={() => navigate('/patients/new')}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-sky-200 hover:shadow-md transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                        <UserPlus className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Register New Patient</p>
                        <p className="text-xs text-slate-400">Create a patient profile and HMS code</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-sky-500 transition-colors" />
                </button>
            </div>

            {/* Today's Schedule Table */}
            <TodaySchedule
                appointments={appointments}
                loading={loading}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
};
