import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import { billingApi } from '../../api/billing';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '@hms/ui';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
    CalendarRange, Receipt, ArrowRight, Clock, AlertCircle,
    CheckCircle, User, Heart, Stethoscope
} from 'lucide-react';

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color = 'indigo', sub }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

// ── Upcoming Appointments ─────────────────────────────────────────────────────
const UpcomingAppointments = ({ appointments, loading }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-indigo-500" /> Upcoming Appointments
                </h2>
                <Link to="/appointments" className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
            {loading ? (
                <div className="p-5"><Skeleton rows={3} columns={4} /></div>
            ) : appointments.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                    <CalendarRange className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No upcoming appointments.
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {appointments.slice(0, 5).map(appt => (
                        <div
                            key={appt.id}
                            onClick={() => navigate(`/appointments`)}
                            className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <Stethoscope className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Dr. {appt.doctor?.name ?? '—'}</p>
                                    <p className="text-xs text-slate-400">
                                        <span className="font-medium">{appt.doctor?.specialization ?? 'General'}</span>
                                        {appt.slot && ` · ${appt.slot.start_time?.slice(0, 5)}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-semibold text-slate-700">{formatDate(appt.date, false)}</p>
                                </div>
                                <StatusBadge status={appt.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Pending Bills ─────────────────────────────────────────────────────────────
const PendingBills = ({ bills, loading }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-500" /> Outstanding Bills
                </h2>
                <Link to="/billing" className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
            {loading ? (
                <div className="p-5"><Skeleton rows={3} columns={3} /></div>
            ) : bills.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                    All bills settled. No outstanding balance.
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {bills.slice(0, 5).map(bill => {
                        const balance = (bill.total_amount ?? 0) - (bill.paid_amount ?? 0);
                        return (
                            <div
                                key={bill.id}
                                onClick={() => navigate(`/billing/${bill.id}`)}
                                className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <Receipt className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Invoice #{bill.id}</p>
                                        <p className="text-xs text-slate-400">{formatDate(bill.issued_at, false)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-rose-600">{formatCurrency(balance)}</p>
                                    <p className="text-[10px] text-slate-400">Balance due</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Recent Documents ─────────────────────────────────────────────────────────────
const RecentDocuments = ({ appointments, loading }) => {
    const completedAppts = appointments.filter(a => a.status === 'completed').slice(0, 5);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" /> Recent Documents
                </h2>
                <Link to="/appointments" className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
            {loading ? (
                <div className="p-5"><Skeleton rows={3} columns={3} /></div>
            ) : completedAppts.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-rose-300" />
                    No recent medical documents.
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {completedAppts.map(appt => (
                        <div key={appt.id} className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-slate-400" />
                                    <p className="text-sm font-semibold text-slate-700">Dr. {appt.doctor?.name ?? '—'}</p>
                                </div>
                                <p className="text-xs text-slate-400">{formatDate(appt.date, false)}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        appointmentsApi.downloadPrescription(appt.id).then(blob => {
                                            const url = window.URL.createObjectURL(new Blob([blob]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', `prescription_${appt.id}.pdf`);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                        });
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-colors"
                                >
                                    Download Prescription
                                </button>
                                <button
                                    onClick={() => {
                                        const patientId = appt.patient?.id;
                                        if (patientId) {
                                            patientsApi.downloadMedicalHistory(patientId).then(blob => {
                                                const url = window.URL.createObjectURL(new Blob([blob]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `medical_history_patient_${patientId}.pdf`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                            });
                                        }
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors"
                                >
                                    Download Medical History
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const PatientDashboard = () => {
    const { user } = useAuthStore();
    const [appointments, setAppointments] = useState([]);
    const [allAppts, setAllAppts] = useState([]); // Need to keep track of completed for documents
    const [bills, setBills] = useState([]);
    const [loadingAppts, setLoadingAppts] = useState(true);
    const [loadingBills, setLoadingBills] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetching more so we can get recent completed ones too
                const data = await appointmentsApi.getAppointments({ per_page: 20 });
                const fetched = data.data || [];
                setAllAppts(fetched);
                // Show upcoming + in progress only for the Upcoming widget
                const upcoming = fetched.filter(a =>
                    ['pending', 'confirmed', 'in_progress'].includes(a.status)
                );
                setAppointments(upcoming);
            } catch {
                setAppointments([]);
                setAllAppts([]);
            } finally {
                setLoadingAppts(false);
            }
        };

        const fetchBills = async () => {
            try {
                const data = await billingApi.getBills({ status: 'unpaid', per_page: 10 });
                const partial = await billingApi.getBills({ status: 'partial', per_page: 10 });
                const combined = [...(data.data || []), ...(partial.data || [])];
                setBills(combined);
            } catch {
                setBills([]);
            } finally {
                setLoadingBills(false);
            }
        };

        fetchData();
        fetchBills();
    }, []);

    const completedAppts = allAppts.filter(a => a.status === 'completed').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Welcome Banner */}
            <div className="bg-sky-500 rounded-2xl p-6 text-white border border-sky-600">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Heart className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-sky-100 text-sm mt-0.5">Your health dashboard — track appointments, documents, and bills at a glance.</p>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard
                    icon={CalendarRange}
                    label="Upcoming Appointments"
                    value={loadingAppts ? '…' : appointments.length}
                    color="indigo"
                />
                <KpiCard
                    icon={Receipt}
                    label="Outstanding Bills"
                    value={loadingBills ? '…' : bills.length}
                    color="amber"
                />
                <KpiCard
                    icon={Clock}
                    label="Pending Appointments"
                    value={loadingAppts ? '…' : appointments.filter(a => a.status === 'pending').length}
                    color="rose"
                    sub="Awaiting confirmation"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    to="/appointments/book"
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <CalendarRange className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Book Appointment</p>
                        <p className="text-xs text-slate-400">Schedule a new consultation with a doctor</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-indigo-500 transition-colors" />
                </Link>
                <Link
                    to="/billing"
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-amber-200 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Receipt className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">My Bills</p>
                        <p className="text-xs text-slate-400">View invoices and make payments</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-amber-500 transition-colors" />
                </Link>
            </div>

            {/* Data Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <UpcomingAppointments appointments={appointments} loading={loadingAppts} />
                <PendingBills bills={bills} loading={loadingBills} />
                <RecentDocuments appointments={allAppts} loading={loadingAppts} />
            </div>
        </div>
    );
};
