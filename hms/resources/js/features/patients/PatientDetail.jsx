import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/patients';
import { appointmentsApi } from '../../api/appointments';
import { billingApi } from '../../api/billing';
import { PatientCodeChip, StatusBadge } from '@hms/ui';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { Skeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import {
    User,
    CalendarRange,
    FlaskConical,
    ChevronLeft,
    Phone,
    Mail,
    Droplets,
    AlertCircle,
    Heart,
    Pill,
    Receipt,
    Download,
    Activity,
    Stethoscope,
    Clock,
    Pencil,
    Trash2,
} from 'lucide-react';

// ─── Tab Definitions ─────────────────────────────────────────────────────────
const TABS = [
    { id: 'profile',       label: 'Profile',         icon: User },
    { id: 'appointments',  label: 'Appointments',    icon: CalendarRange },
    { id: 'prescriptions', label: 'Prescriptions',   icon: FlaskConical },
    { id: 'bills',         label: 'Bills',           icon: Receipt },
    { id: 'history',       label: 'Medical History', icon: Activity },
];

// ─── Info Row helper ──────────────────────────────────────────────────────────
const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
        {Icon && <Icon className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-800 mt-0.5 break-words">{value || '—'}</p>
        </div>
    </div>
);

// ─── Tab 1: Profile ───────────────────────────────────────────────────────────
const ProfileTab = ({ patient }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> Personal Information
            </h3>
            <InfoRow label="Full Name"    value={patient.name}          icon={User} />
            <InfoRow label="Date of Birth" value={formatDate(patient.date_of_birth, false)} />
            <InfoRow label="Age"          value={patient.age ? `${patient.age} years` : null} />
            <InfoRow label="Gender"       value={patient.gender} />
            <InfoRow label="Phone"        value={patient.phone}         icon={Phone} />
            <InfoRow label="Email"        value={patient.email}         icon={Mail} />
            <InfoRow label="Address"      value={patient.address} />
        </div>

        {/* Medical Info */}
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-red-500" /> Medical Details
                </h3>
                <InfoRow label="Blood Type"    value={patient.blood_type}    icon={Droplets} />
                <InfoRow label="Height"        value={patient.height ? `${patient.height} cm` : null} />
                <InfoRow label="Weight"        value={patient.weight ? `${patient.weight} kg` : null} />

                {/* Allergies */}
                <div className="py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-400" /> Allergies
                    </p>
                    {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(patient.allergies)
                                ? patient.allergies
                                : patient.allergies.split(',')
                            ).map((a, i) => {
                                const allergenText = typeof a === 'object' && a !== null
                                    ? (a.allergen + (a.severity ? ` (${a.severity})` : ''))
                                    : String(a).trim();
                                return (
                                    <span key={i} className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-full">
                                        {allergenText}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">None recorded</p>
                    )}
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" /> Emergency Contact
                </h3>
                <InfoRow label="Name"         value={patient.emergency_contact_name} />
                <InfoRow label="Relationship" value={patient.emergency_contact_relation} />
                <InfoRow label="Phone"        value={patient.emergency_contact_phone} icon={Phone} />
            </div>
        </div>
    </div>
);

// ─── Tab 2: Appointments ──────────────────────────────────────────────────────
const AppointmentsTab = ({ patientId }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);

    useEffect(() => {
        appointmentsApi
            .getAppointments({ patient_id: patientId, per_page: 50 })
            .then((data) => setAppointments(data.data || data || []))
            .catch(() => setAppointments([]))
            .finally(() => setLoading(false));
    }, [patientId]);

    if (loading) return <Skeleton rows={5} columns={4} />;

    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <CalendarRange className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No appointments found for this patient.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        {['Date', 'Time', 'Doctor', 'Type', 'Status'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-700">{appt.date ? formatDate(appt.date, false) : '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                                {appt.slot?.start_time ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{appt.doctor?.name ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{appt.type ?? 'OPD'}</td>
                            <td className="px-4 py-3"><StatusBadge status={appt.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Tab 3: Prescriptions ────────────────────────────────────────────────────
const PrescriptionsTab = ({ patientId }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading]             = useState(true);

    useEffect(() => {
        patientsApi
            .getPrescriptions(patientId)
            .then((data) => setPrescriptions(data.data || data))
            .catch(() => setPrescriptions([]))
            .finally(() => setLoading(false));
    }, [patientId]);

    if (loading) return <Skeleton rows={4} columns={3} />;

    if (prescriptions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No prescriptions found for this patient.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {prescriptions.map((rx) => (
                <div key={rx.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                Dr. {rx.doctor?.name ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(rx.created_at, false)}</p>
                        </div>
                        <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                            Rx #{rx.id}
                        </span>
                    </div>

                    {rx.notes && (
                        <p className="text-sm text-gray-600 italic border-l-2 border-indigo-200 pl-3 mb-3">
                            {rx.notes}
                        </p>
                    )}

                    {/* Medicine items */}
                    {rx.items && rx.items.length > 0 && (
                        <div className="space-y-1.5">
                            {rx.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Pill className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="text-sm font-medium text-gray-700">{item.medicine_name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{item.dosage} — {item.frequency}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ─── Tab 4: Bills ────────────────────────────────────────────────────────────
const BillsTab = ({ patientId }) => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        patientsApi
            .getBills(patientId)
            .then((data) => setBills(data.data || data))
            .catch(() => setBills([]))
            .finally(() => setLoading(false));
    }, [patientId]);

    const handleDownloadPdf = async (billId) => {
        try {
            const blob = await billingApi.downloadPdf(billId);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bill-${billId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch {
            alert('Failed to download PDF. Please try again.');
        }
    };

    if (loading) return <Skeleton rows={4} columns={5} />;

    if (bills.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No bills found for this patient.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        {['Bill #', 'Date', 'Status', 'Total', 'Paid', 'Actions'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-950">#{bill.bill_number || bill.id}</td>
                            <td className="px-4 py-3 text-gray-600">{formatDate(bill.created_at, false)}</td>
                            <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
                            <td className="px-4 py-3 text-gray-800 font-medium">{formatCurrency(bill.total_amount)}</td>
                            <td className="px-4 py-3 text-green-700">{formatCurrency(bill.paid_amount || 0)}</td>
                            <td className="px-4 py-3">
                                <button
                                    onClick={() => handleDownloadPdf(bill.id)}
                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" /> PDF
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Tab 5: Medical History Timeline ─────────────────────────────────────────
const MedicalHistoryTab = ({ patientId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        patientsApi
            .getMedicalHistory(patientId)
            .then((data) => {
                const diagnoses = data?.diagnoses || data?.data?.diagnoses || [];
                setHistory(diagnoses);
            })
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [patientId]);

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-4">
                        <div className="w-3 h-3 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2 pb-6 border-l border-gray-100 pl-4">
                            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No medical history recorded for this patient.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Diagnosis Timeline
            </h3>

            <ol className="relative border-l-2 border-indigo-100 ml-3 space-y-0">
                {history.map((entry, idx) => (
                    <li key={entry.id ?? idx} className="mb-8 ml-6">
                        {/* Dot */}
                        <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 border-2 border-indigo-300 ring-4 ring-white">
                            <Stethoscope className="w-2.5 h-2.5 text-indigo-600" />
                        </span>

                        {/* Date */}
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <time className="text-xs font-medium text-gray-500">
                                {entry.date || entry.diagnosed_at
                                    ? new Date(entry.date || entry.diagnosed_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                      })
                                    : formatDate(entry.created_at)}
                            </time>
                        </div>

                        {/* Diagnosis card */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                            <p className="text-sm font-semibold text-gray-900">
                                {entry.description || entry.icd_code || entry.diagnosis || entry.title || 'Consultation'}
                            </p>
                            {entry.notes && (
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    {entry.notes}
                                </p>
                            )}
                            {(entry.doctor?.user?.name || entry.doctor?.name) && (
                                <p className="text-xs text-indigo-500 mt-2 font-medium">
                                    Dr. {entry.doctor?.user?.name || entry.doctor?.name}
                                    {entry.doctor?.specialization
                                        ? ` — ${entry.doctor.specialization}`
                                        : ''}
                                </p>
                            )}
                            {/* Medications */}
                            {entry.medications && entry.medications.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {entry.medications.map((med, mi) => (
                                        <span
                                            key={mi}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 text-xs rounded-full"
                                        >
                                            <Pill className="w-3 h-3" />
                                            {typeof med === 'string' ? med : med.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
};


// ─── Main PatientDetail ───────────────────────────────────────────────────────
export const PatientDetail = () => {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const { user }   = useAuthStore();

    // Role check
    const roles   = Array.isArray(user?.roles)
        ? user.roles.map(r => r.name || r)
        : [user?.role].filter(Boolean);
    const isAdmin = roles.includes('admin');

    const [patient, setPatient]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    // Delete state
    const [deleteOpen, setDeleteOpen]   = useState(false);
    const [deleting, setDeleting]       = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    useEffect(() => {
        patientsApi
            .getPatient(id)
            .then((data) => setPatient(data.data || data))
            .catch((err) => setError(err?.response?.data?.message || 'Failed to load patient.'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await patientsApi.deletePatient(id);
            navigate('/patients', { replace: true });
        } catch (err) {
            setDeleteError(err?.response?.data?.message || 'Failed to delete patient. Please try again.');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="p-6 text-center text-red-500 text-sm">
                {error || 'Patient not found.'}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            {/* Back + Action buttons row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                    onClick={() => navigate('/patients')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Patients
                </button>

                {/* Admin-only actions */}
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/patients/${id}/edit`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Patient
                        </button>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Patient
                        </button>
                    </div>
                )}
            </div>

            {/* Patient header card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md shadow-indigo-200">
                    {patient.name?.[0]?.toUpperCase() ?? 'P'}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                        <PatientCodeChip code={patient.patient_code} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        {patient.age  && <span>{patient.age} yrs</span>}
                        {patient.gender && <span className="capitalize">{patient.gender}</span>}
                        {patient.blood_type && (
                            <span className="flex items-center gap-1 text-red-600 font-semibold">
                                <Droplets className="w-3.5 h-3.5" />{patient.blood_type}
                            </span>
                        )}
                        {patient.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" /> {patient.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'profile'       && <ProfileTab patient={patient} />}
                {activeTab === 'appointments'  && <AppointmentsTab patientId={id} />}
                {activeTab === 'prescriptions' && <PrescriptionsTab patientId={id} />}
                {activeTab === 'bills'         && <BillsTab patientId={id} />}
                {activeTab === 'history'       && <MedicalHistoryTab patientId={id} />}
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteOpen}
                title="Delete Patient"
                message={`Are you sure you want to permanently delete ${patient.name ?? 'this patient'}? All associated records will be removed. This action cannot be undone.`}
                confirmText="Yes, Delete"
                isDanger={true}
                isLoading={deleting}
                onConfirm={handleDelete}
                onClose={() => { setDeleteOpen(false); setDeleteError(null); }}
            />

            {/* Delete error toast (shown inline below the dialog if it fails) */}
            {deleteError && (
                <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
                    {deleteError}
                </div>
            )}
        </div>
    );
};
