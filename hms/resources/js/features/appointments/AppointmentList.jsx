import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '@hms/ui';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CancelModal } from './CancelModal';
import { RescheduleModal } from './RescheduleModal';
import { InstantBookingModal } from './InstantBookingModal';
import {
    CalendarRange, Plus, Search, Filter, X, ChevronRight,
    User, Stethoscope, Clock, FileText, AlertCircle, Tag,
    LayoutGrid, List, ArrowUpDown, Receipt
} from 'lucide-react';

const STATUS_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'No Show', value: 'no_show' },
];

const TYPE_FILTERS = [
    { label: 'All Types', value: '' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Instant', value: 'instant' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'VIP', value: 'vip' },
    { label: 'Walk-in', value: 'walk_in' },
];

const columns = [
    { key: 'patient',  header: 'Patient' },
    { key: 'doctor',   header: 'Doctor' },
    { key: 'datetime', header: 'Date & Time' },
    { key: 'type',     header: 'Type' },
    { key: 'status',   header: 'Status' },
    { key: 'actions',  header: '',           className: 'text-right' },
];

// ─── Appointment Detail Slide-over ────────────────────────────────────────────
const AppointmentDrawer = ({ appointmentId, onClose }) => {
    const [appt, setAppt]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

    useEffect(() => {
        if (!appointmentId) return;
        setLoading(true);
        setError(null);
        setAppt(null);
        appointmentsApi.getAppointmentDetails(appointmentId)
            .then(data => setAppt(data.data ?? data))
            .catch(() => setError('Failed to load consultation details.'))
            .finally(() => setLoading(false));
    }, [appointmentId]);

    const open = !!appointmentId;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-indigo-600 text-white">
                    <div className="flex items-center gap-2">
                        <CalendarRange className="w-5 h-5" />
                        <h2 className="font-semibold text-base">Appointment Details</h2>
                        {appt && (
                            <span className="ml-1 text-xs font-mono bg-indigo-500 px-2 py-0.5 rounded-full">
                                #{appt.id}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {loading && (
                        <div className="space-y-3 animate-pulse">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 text-red-500">
                            <AlertCircle className="w-8 h-8" />
                            <p className="text-sm font-medium">{error}</p>
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    setError(null);
                                    appointmentsApi.getAppointmentDetails(appointmentId)
                                        .then(data => setAppt(data.data ?? data))
                                        .catch(() => setError('Failed to load consultation details.'))
                                        .finally(() => setLoading(false));
                                }}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {appt && (
                        <>
                            {/* Patient */}
                            <DrawerSection icon={<User className="w-4 h-4 text-indigo-500" />} title="Patient">
                                <p className="font-semibold text-gray-900">{appt.patient?.name ?? '—'}</p>
                                <p className="text-xs text-gray-500">{appt.patient?.patient_code}</p>
                            </DrawerSection>

                            {/* Doctor */}
                            <DrawerSection icon={<Stethoscope className="w-4 h-4 text-indigo-500" />} title="Doctor">
                                <p className="font-semibold text-gray-900">{appt.doctor?.name ?? '—'}</p>
                                <p className="text-xs text-gray-500">{appt.doctor?.specialization}</p>
                            </DrawerSection>

                            {/* Date & Time */}
                            <DrawerSection icon={<Clock className="w-4 h-4 text-indigo-500" />} title="Date & Time">
                                <p className="font-semibold text-gray-900">{formatDate(appt.date, false)}</p>
                                {appt.slot && (
                                    <p className="text-xs text-gray-500">{appt.slot.start_time} – {appt.slot.end_time}</p>
                                )}
                            </DrawerSection>

                            {/* Status & Type */}
                            <DrawerSection icon={<Tag className="w-4 h-4 text-indigo-500" />} title="Status & Type">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <StatusBadge status={appt.status} />
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                        {appt.type ?? 'OPD'}
                                    </span>
                                </div>
                            </DrawerSection>

                            {/* Notes */}
                            {appt.notes && (
                                <DrawerSection icon={<FileText className="w-4 h-4 text-indigo-500" />} title="Notes / Reason">
                                    <p className="text-sm text-gray-700 leading-relaxed">{appt.notes}</p>
                                </DrawerSection>
                            )}

                            {/* Consultation Logs */}
                            {appt.logs && appt.logs.length > 0 && (
                                <DrawerSection icon={<FileText className="w-4 h-4 text-indigo-500" />} title="Status History">
                                    <ul className="space-y-2">
                                        {appt.logs.map((log, i) => (
                                            <li key={i} className="text-xs flex justify-between text-gray-600 border-b border-gray-50 pb-1">
                                                <span className="capitalize font-medium">{log.status}</span>
                                                <span className="text-gray-400">{log.changed_by?.name} · {formatDate(log.created_at)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </DrawerSection>
                            )}

                            {/* Downloads */}
                            {appt.status === 'completed' && (
                                <DrawerSection icon={<FileText className="w-4 h-4 text-indigo-500" />} title="Downloads">
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => {
                                                appointmentsApi.downloadPrescription(appointmentId).then(blob => {
                                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `prescription_${appointmentId}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                });
                                            }}
                                            className="text-xs text-left text-indigo-600 hover:underline font-medium"
                                        >
                                            Download Prescription
                                        </button>
                                        <button
                                            onClick={() => {
                                                appointmentsApi.downloadBill(appointmentId).then(blob => {
                                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `bill_${appointmentId}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                });
                                            }}
                                            className="text-xs text-left text-indigo-600 hover:underline font-medium"
                                        >
                                            Download Bill
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
                                            className="text-xs text-left text-indigo-600 hover:underline font-medium"
                                        >
                                            Download Medical History
                                        </button>
                                    </div>
                                </DrawerSection>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

const DrawerSection = ({ icon, title, children }) => (
    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const AppointmentList = () => {
    const navigate = useNavigate();
    const { id: routeId } = useParams();   // from /appointments/:id route

    const [appointments, setAppointments] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    // Cancel/Reschedule/Modal States
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'card'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    const [drawerApptId, setDrawerApptId] = useState(routeId ? Number(routeId) : null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [instantBookingOpen, setInstantBookingOpen] = useState(false);

    // Sorting & View mode states
    const [sortField, setSortField] = useState('date');

    const { user } = useAuthStore();
    const userRoles = Array.isArray(user?.roles)
        ? user.roles.map(r => r.name || r)
        : [user?.role].filter(Boolean);
    // Nurse can view appointments but cannot book them
    const canBook = userRoles.some(r => ['admin', 'doctor', 'receptionist', 'patient'].includes(r));
    const canCancel = userRoles.some(r => ['admin', 'patient'].includes(r));
    const isPatient = userRoles.includes('patient') && !userRoles.some(r => ['admin', 'doctor', 'receptionist'].includes(r));


    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const data = await appointmentsApi.getAppointments(params);
            setAppointments(data.data || data);
            setMeta(data.meta || null);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, typeFilter, startDate, endDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Reset to page 1 whenever filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, startDate, endDate]);

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await appointmentsApi.cancel(cancelTarget.id);
            fetchAppointments();
        } catch {
            // silently re-fetch
        } finally {
            setCancelling(false);
            setCancelTarget(null);
        }
    };

    // Sort appointments locally
    const sortedAppointments = [...appointments].sort((a, b) => {
        let comparison = 0;
        if (sortField === 'date') {
            const valA = new Date(a.date + ' ' + (a.slot?.start_time || '00:00:00'));
            const valB = new Date(b.date + ' ' + (b.slot?.start_time || '00:00:00'));
            comparison = valA - valB;
        } else if (sortField === 'patient') {
            const valA = (a.patient?.name || '').toLowerCase();
            const valB = (b.patient?.name || '').toLowerCase();
            comparison = valA.localeCompare(valB);
        } else if (sortField === 'doctor') {
            const valA = (a.doctor?.name || '').toLowerCase();
            const valB = (b.doctor?.name || '').toLowerCase();
            comparison = valA.localeCompare(valB);
        } else if (sortField === 'status') {
            const valA = (a.status || '').toLowerCase();
            const valB = (b.status || '').toLowerCase();
            comparison = valA.localeCompare(valB);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const rows = sortedAppointments.map((appt) => ({
        patient: (
            <div>
                <p className="font-medium text-gray-900 text-sm">{appt.patient?.name ?? '—'}</p>
                <p className="text-xs text-gray-500">{appt.patient?.patient_code ?? ''}</p>
            </div>
        ),
        doctor: (
            <div>
                <p className="font-medium text-gray-900 text-sm">{appt.doctor?.name ?? '—'}</p>
                <p className="text-xs text-gray-500">{appt.doctor?.specialization ?? ''}</p>
            </div>
        ),
        datetime: (
            <div>
                <p className="text-sm text-gray-700">{appt.date ? formatDate(appt.date, false) : '—'}</p>
                {appt.slot?.start_time && (
                    <p className="text-xs text-gray-500">{appt.slot.start_time} – {appt.slot.end_time}</p>
                )}
            </div>
        ),
        type: (
            <span className="text-sm text-gray-600 capitalize">{appt.type ?? 'OPD'}</span>
        ),
        status: <StatusBadge status={appt.status} />,
        actions: (
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => setDrawerApptId(appt.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors flex items-center gap-1"
                >
                    View <ChevronRight className="w-3 h-3" />
                </button>
                {!isPatient && (
                    <button
                        onClick={() => navigate(`/appointments/${appt.id}/edit`)}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                    >
                        Edit
                    </button>
                )}
                {appt.status === 'completed' && (
                    <>
                        <button
                            onClick={() => {
                                appointmentsApi.downloadPrescription(appt.id).then(blob => {
                                    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                                    window.open(url, '_blank');
                                    // Clean up after a delay to allow the new tab to load the blob
                                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                                });
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors flex items-center gap-1"
                            title="View Prescription"
                        >
                            <FileText className="w-3.5 h-3.5" /> Rx
                        </button>
                        <button
                            onClick={() => {
                                appointmentsApi.downloadBill(appt.id).then(blob => {
                                    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                                    window.open(url, '_blank');
                                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                                });
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors flex items-center gap-1"
                            title="View Bill"
                        >
                            <Receipt className="w-3.5 h-3.5" /> Bill
                        </button>
                        <button
                            onClick={() => {
                                const patientId = appt.patient?.id;
                                if (patientId) {
                                    patientsApi.downloadMedicalHistory(patientId).then(blob => {
                                        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                                        window.open(url, '_blank');
                                        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                                    });
                                }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                            title="View Medical History"
                        >
                            <Stethoscope className="w-3.5 h-3.5" /> History
                        </button>
                    </>
                )}
                {appt.status === 'scheduled' && (
                    <>
                        <button
                            onClick={() => setRescheduleTarget(appt)}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >
                            Reschedule
                        </button>
                        <button
                            onClick={() => setCancelTarget(appt)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        ),
    }));

    return (
        <div className="p-6 space-y-5">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarRange className="w-6 h-6 text-indigo-500" />
                        Appointments
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        View, filter, and manage all patient appointments.
                    </p>
                </div>
                {canBook && (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setInstantBookingOpen(true)}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Instant Book
                        </Button>
                        <Button
                            onClick={() => navigate('/appointments/book')}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Book New
                        </Button>
                    </div>
                )}
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search patient or doctor…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 w-full md:w-auto">
                        <span className="font-medium whitespace-nowrap">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 bg-gray-50"
                        />
                        <span className="font-medium whitespace-nowrap">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 bg-gray-50"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="Clear dates"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status filter chips, sorting, and view toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-50">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setStatusFilter(f.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                                        statusFilter === f.value
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            {TYPE_FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setTypeFilter(f.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                                        typeFilter === f.value
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Sort */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="font-semibold uppercase whitespace-nowrap">Sort:</span>
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none"
                            >
                                <option value="date">Date</option>
                                <option value="patient">Patient Name</option>
                                <option value="doctor">Doctor Name</option>
                                <option value="status">Status</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-1 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 flex items-center justify-center"
                                title="Toggle Order"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span className="ml-1 font-mono uppercase">{sortOrder}</span>
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="List View"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Card View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table or Card layout */}
            <div className={viewMode === 'list' ? "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" : ""}>
                {loading ? (
                    <Skeleton rows={8} columns={columns.length} />
                ) : error ? (
                    <div className="p-8 text-center text-red-500 text-sm bg-white rounded-2xl border border-gray-200">{error}</div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <EmptyState
                            icon={<CalendarRange className="w-10 h-10" />}
                            title="No appointments found"
                            description={
                                search || statusFilter
                                    ? 'Try adjusting your filters.'
                                    : 'No appointments have been booked yet.'
                            }
                            action={
                                <Button size="sm" onClick={() => navigate('/appointments/book')}>
                                    Book First Appointment
                                </Button>
                            }
                        />
                    </div>
                ) : viewMode === 'list' ? (
                    <Table columns={columns} rows={rows} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sortedAppointments.map((appt) => (
                            <div key={appt.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{appt.patient?.name ?? '—'}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5 font-medium">{appt.patient?.patient_code ?? ''}</p>
                                        </div>
                                        <StatusBadge status={appt.status} />
                                    </div>
                                    <div className="space-y-2 text-xs text-gray-500 border-t border-gray-50 pt-3">
                                        <p className="flex items-center gap-1.5">
                                            <Stethoscope className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                            <span className="font-medium text-gray-700">Dr. {appt.doctor?.name ?? '—'}</span>
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                            <span>{appt.date ? formatDate(appt.date, false) : '—'} ({appt.slot?.start_time ?? '—'} - {appt.slot?.end_time ?? '—'})</span>
                                        </p>
                                        <p className="flex items-center gap-1.5 capitalize">
                                            <Tag className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                            <span>Type: {appt.type ?? 'OPD'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-2">
                                    <button
                                        onClick={() => setDrawerApptId(appt.id)}
                                        className="text-xs text-indigo-600 hover:text-indigo-850 font-semibold transition-colors flex items-center gap-1"
                                    >
                                        View Details <ChevronRight className="w-3 h-3" />
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/appointments/${appt.id}/edit`)}
                                            className="text-xs text-amber-600 hover:text-amber-850 font-semibold transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {appt.status === 'completed' && (
                                            <>
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
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
                                                    title="Download Prescription"
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> Rx
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        appointmentsApi.downloadBill(appt.id).then(blob => {
                                                            const url = window.URL.createObjectURL(new Blob([blob]));
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', `bill_${appt.id}.pdf`);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.remove();
                                                        });
                                                    }}
                                                    className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold transition-colors flex items-center gap-1"
                                                    title="Download Bill"
                                                >
                                                    <Receipt className="w-3.5 h-3.5" /> Bill
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        appointmentsApi.downloadMedicalHistory(appt.id).then(blob => {
                                                            const url = window.URL.createObjectURL(new Blob([blob]));
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', `medical_history_${appt.id}.pdf`);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.remove();
                                                        });
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors flex items-center gap-1"
                                                    title="Download Medical History"
                                                >
                                                    <Stethoscope className="w-3.5 h-3.5" /> History
                                                </button>
                                            </>
                                        )}
                                        {appt.status === 'scheduled' && (
                                            <button
                                                onClick={() => setCancelTarget(appt)}
                                                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
                <Pagination
                    currentPage={meta.current_page}
                    totalPages={meta.last_page}
                    onPageChange={setPage}
                />
            )}

            <CancelModal
                isOpen={!!cancelTarget}
                appointment={cancelTarget}
                onClose={() => {
                    setCancelTarget(null);
                    fetchAppointments(); // refresh list
                }}
            />

            <RescheduleModal
                isOpen={!!rescheduleTarget}
                appointment={rescheduleTarget}
                onClose={() => {
                    setRescheduleTarget(null);
                    fetchAppointments(); // refresh list
                }}
            />

            <InstantBookingModal
                isOpen={instantBookingOpen}
                onClose={() => {
                    setInstantBookingOpen(false);
                    fetchAppointments(); // refresh list
                }}
            />

            {/* Appointment Details Slide-over Drawer */}
            <AppointmentDrawer
                appointmentId={drawerApptId}
                onClose={() => {
                    setDrawerApptId(null);
                    // If opened from a direct URL (/appointments/:id), go back to the list
                    if (routeId) navigate('/appointments', { replace: true });
                }}
            />
        </div>
    );
};
