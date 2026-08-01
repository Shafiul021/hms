import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { patientsApi } from '../../api/patients';
import { opdApi } from '../../api/opd';
import { formatDate } from '../../utils/formatDate';
import { Table } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
    FileText,
    Search,
    X,
    User,
    CalendarDays,
    Hash,
    ChevronRight,
} from 'lucide-react';

// ── Columns for the table ──────────────────────────────────────────────────────
const columns = [
    { key: 'patient',   header: 'Patient' },
    { key: 'icd',       header: 'ICD Code',   className: 'text-center w-28' },
    { key: 'diagnosis', header: 'Diagnosis' },
    { key: 'notes',     header: 'Notes',      className: 'max-w-xs' },
    { key: 'date',      header: 'Date',       className: 'w-36' },
    { key: 'actions',   header: '',           className: 'text-right w-24' },
];

// ── Badge component for ICD code ───────────────────────────────────────────────
const IcdBadge = ({ code }) =>
    code ? (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">
            <Hash className="w-3 h-3" />
            {code}
        </span>
    ) : (
        <span className="text-xs text-gray-400">—</span>
    );

// ── Main Page ──────────────────────────────────────────────────────────────────
export const DiagnosisList = () => {
    const navigate  = useNavigate();
    const { user }  = useAuthStore();

    const roles = Array.isArray(user?.roles)
        ? user.roles.map((r) => r.name || r)
        : [user?.role].filter(Boolean);

    const isDoctor = roles.includes('doctor');

    // State
    const [diagnoses, setDiagnoses] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [search, setSearch]       = useState('');
    const [debounced, setDebounced] = useState('');

    // Debounce
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    /**
     * Diagnoses don't have a top-level list endpoint per the API Reference.
     * The doctor sees their patients' histories. We fetch via doctor's patient history.
     * For admin/doctor: list diagnoses from the consultation view context.
     *
     * API: GET /api/patients/{id}/history — but there's no global /diagnoses list endpoint.
     * We surface diagnoses from the doctor's appointments via appointments API,
     * using the diagnosis embedded in each appointment's response.
     */
    const fetchDiagnoses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Import appointments api inline to keep dependencies clean
            const { appointmentsApi } = await import('../../api/appointments');
            const data = await appointmentsApi.getAppointments({ per_page: 100, status: 'completed' });
            const appts = data.data || data;

            // Extract appointments that have a diagnosis
            const withDiagnosis = appts.filter((a) => a.diagnosis);
            const mapped = withDiagnosis.map((a) => ({
                id:          a.diagnosis.id ?? a.id,
                icd_code:    a.diagnosis.icd_code,
                description: a.diagnosis.description,
                notes:       a.diagnosis.notes,
                diagnosed_at: a.diagnosis.diagnosed_at || a.updated_at,
                patient:     a.patient,
                appointment_id: a.id,
            }));

            setDiagnoses(mapped);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load diagnoses.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDiagnoses(); }, [fetchDiagnoses]);

    // Client-side filter
    const filtered = debounced
        ? diagnoses.filter(
              (d) =>
                  d.patient?.name?.toLowerCase().includes(debounced.toLowerCase()) ||
                  d.description?.toLowerCase().includes(debounced.toLowerCase()) ||
                  d.icd_code?.toLowerCase().includes(debounced.toLowerCase())
          )
        : diagnoses;

    const rows = filtered.map((d) => ({
        patient: (
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{d.patient?.name ?? '—'}</p>
                    {d.patient?.patient_code && (
                        <p className="text-xs text-gray-400 font-mono">{d.patient.patient_code}</p>
                    )}
                </div>
            </div>
        ),
        icd:       <IcdBadge code={d.icd_code} />,
        diagnosis: (
            <p className="text-sm font-medium text-gray-800 max-w-xs truncate">
                {d.description || '—'}
            </p>
        ),
        notes: (
            <p className="text-xs text-gray-500 max-w-xs truncate">
                {d.notes || <span className="italic text-gray-300">No additional notes</span>}
            </p>
        ),
        date: (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(d.diagnosed_at, false)}
            </span>
        ),
        actions: (
            <button
                onClick={() => navigate(`/appointments/${d.appointment_id}/consult`)}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                title="View consultation"
            >
                View <ChevronRight className="w-3.5 h-3.5" />
            </button>
        ),
    }));

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-500" />
                        OPD Diagnoses
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isDoctor
                            ? 'Diagnoses you have recorded from completed appointments.'
                            : 'All recorded OPD diagnoses across completed appointments.'}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        id="diagnosis-search"
                        type="text"
                        placeholder="Search by patient, diagnosis or ICD code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <Skeleton rows={8} columns={columns.length} />
                ) : error ? (
                    <div className="p-8 text-center text-red-500 text-sm">{error}</div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="w-10 h-10" />}
                        title="No diagnoses found"
                        description={
                            search
                                ? 'Try a different search term.'
                                : 'No diagnoses have been recorded from completed appointments yet.'
                        }
                    />
                ) : (
                    <Table columns={columns} rows={rows} />
                )}
            </div>

            {/* Count */}
            {!loading && !error && filtered.length > 0 && (
                <p className="text-xs text-gray-400 text-right">
                    {filtered.length} diagnosis record{filtered.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};
