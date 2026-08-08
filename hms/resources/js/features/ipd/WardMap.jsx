import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipdApi } from '../../api/ipd';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Toast } from '../../components/ui/Toast';
import { PatientCodeChip } from '@hms/ui';
import {
    Bed,
    LayoutGrid,
    RefreshCw,
    Activity,
    AlertTriangle,
    CheckCircle,
    Wrench,
    User,
    CalendarDays,
    FileText,
    LogOut,
    Plus,
} from 'lucide-react';

// ── Status config ─────────────────────────────────────────────────────────────
const BED_STATUS = {
    available: {
        card:      'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md',
        dot:       'bg-emerald-500',
        badge:     'bg-emerald-100 text-emerald-800',
        label:     'Available',
    },
    occupied: {
        card:      'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-md',
        dot:       'bg-red-500 animate-pulse',
        badge:     'bg-red-100 text-red-800',
        label:     'Occupied',
    },
    maintenance: {
        card:      'bg-slate-100 border-slate-200 text-slate-500 cursor-default',
        dot:       'bg-slate-400',
        badge:     'bg-slate-100 text-slate-600',
        label:     'Maintenance',
    },
};

const getBedStatus = (bed) => {
    if (bed.status === 'maintenance') return 'maintenance';
    if (bed.status === 'occupied' || bed.is_occupied || !!bed.current_admission) return 'occupied';
    return 'available';
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`flex items-center gap-3 bg-white rounded-2xl border px-5 py-4 shadow-sm ${color}`}>
        <div className="p-2 rounded-xl bg-current/5">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
        </div>
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const WardMap = () => {
    const navigate = useNavigate();

    const [wards, setWards] = useState([]);
    const [selectedWardId, setSelectedWardId] = useState('');
    const [beds, setBeds] = useState([]);
    const [loadingWards, setLoadingWards] = useState(true);
    const [loadingBeds, setLoadingBeds] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedBed, setSelectedBed] = useState(null);
    const [dischargeTarget, setDischargeTarget] = useState(null);
    const [discharging, setDischarging] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    // ── Fetch beds for selected ward ──────────────────────────────────────────
    const fetchBeds = useCallback(async (silent = false) => {
        if (!selectedWardId) return;
        if (!silent) setLoadingBeds(true);
        else setRefreshing(true);
        try {
            const data = await ipdApi.getBeds(selectedWardId);
            setBeds(data.data || data);
        } catch {
            if (!silent) setBeds([]);
            addToast('Could not refresh bed data.', 'error');
        } finally {
            setLoadingBeds(false);
            setRefreshing(false);
        }
    }, [selectedWardId]);

    // ── Fetch all wards on mount ──────────────────────────────────────────────
    useEffect(() => {
        ipdApi.getWards()
            .then(data => {
                const list = data.data || data;
                setWards(list);
                if (list.length > 0) setSelectedWardId(list[0].id);
            })
            .catch(() => addToast('Failed to load wards.', 'error'))
            .finally(() => setLoadingWards(false));
    }, []);

    useEffect(() => { fetchBeds(); }, [fetchBeds]);

    // ── Stats derived from beds ───────────────────────────────────────────────
    const stats = {
        total:       beds.length,
        available:   beds.filter(b => getBedStatus(b) === 'available').length,
        occupied:    beds.filter(b => getBedStatus(b) === 'occupied').length,
        maintenance: beds.filter(b => getBedStatus(b) === 'maintenance').length,
    };

    // ── Discharge handler ─────────────────────────────────────────────────────
    const handleDischarge = async () => {
        if (!dischargeTarget) return;
        setDischarging(true);
        try {
            await ipdApi.dischargePatient(dischargeTarget.id);
            addToast('Patient discharged successfully. Bed is now available.', 'success');
            setSelectedBed(null);
            setDischargeTarget(null);
            fetchBeds(true);
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to discharge patient.', 'error');
        } finally {
            setDischarging(false);
        }
    };

    // ── Selected ward object ──────────────────────────────────────────────────
    const selectedWard = wards.find(w => String(w.id) === String(selectedWardId));

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loadingWards) {
        return (
            <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-gray-200 rounded-lg" />
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
                </div>
                <div className="h-72 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    if (wards.length === 0) {
        return (
            <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                <LayoutGrid className="w-12 h-12 opacity-30" />
                <p className="text-base font-semibold">No wards configured</p>
                <p className="text-sm">Ask an administrator to set up wards and beds.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <Toast
                        key={t.id}
                        message={t.message}
                        type={t.type}
                        onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                    />
                ))}
            </div>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-indigo-500" />
                        IPD Ward &amp; Bed Map
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Real-time status of all hospital ward beds. Click any bed for details.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Ward selector */}
                    <select
                        value={selectedWardId}
                        onChange={e => setSelectedWardId(e.target.value)}
                        className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-medium text-slate-700"
                    >
                        {wards.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name} ({w.type ?? 'General'})
                            </option>
                        ))}
                    </select>

                    {/* Refresh button */}
                    <Button
                        variant="outline"
                        size="md"
                        onClick={() => fetchBeds(true)}
                        disabled={refreshing}
                        aria-label="Refresh bed status"
                        className="gap-1.5"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* ── Ward summary stats ────────────────────────────────────────── */}
            {!loadingBeds && beds.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard icon={Bed}          label="Total Beds"   value={stats.total}       color="border-slate-200 text-slate-600" />
                    <StatCard icon={CheckCircle}  label="Available"    value={stats.available}    color="border-emerald-200 text-emerald-600" />
                    <StatCard icon={Activity}     label="Occupied"     value={stats.occupied}     color="border-red-200 text-red-600" />
                    <StatCard icon={Wrench}       label="Maintenance"  value={stats.maintenance}  color="border-slate-200 text-slate-500" />
                </div>
            )}

            {/* ── Bed grid panel ────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                {/* Panel header + legend */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Bed className="w-5 h-5 text-indigo-500" />
                        {selectedWard?.name ?? 'Beds'}
                        {selectedWard?.type && (
                            <span className="text-xs font-medium text-slate-400 capitalize">· {selectedWard.type}</span>
                        )}
                    </h2>

                    <div className="flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {Object.entries(BED_STATUS).map(([key, cfg]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot.replace(' animate-pulse', '')}`} />
                                <span>{cfg.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bed grid */}
                {loadingBeds ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : beds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                        <Bed className="w-10 h-10 opacity-30" />
                        <p className="text-sm font-medium">No beds configured for this ward.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {beds.map(bed => {
                            const statusKey = getBedStatus(bed);
                            const cfg = BED_STATUS[statusKey];
                            const isMaintenance = statusKey === 'maintenance';

                            return (
                                <button
                                    key={bed.id}
                                    id={`bed-${bed.id}`}
                                    type="button"
                                    onClick={() => !isMaintenance && setSelectedBed(bed)}
                                    disabled={isMaintenance}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition-all duration-200 ${cfg.card} ${isMaintenance ? 'opacity-60' : 'cursor-pointer active:scale-95'}`}
                                    aria-label={`Bed ${bed.bed_number} — ${cfg.label}`}
                                >
                                    {/* Status dot */}
                                    <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${cfg.dot}`} />

                                    <Bed className="w-8 h-8 mb-2 opacity-80" />
                                    <span className="font-bold text-sm leading-tight">{bed.bed_number}</span>
                                    <span className="text-[10px] uppercase font-semibold tracking-wider mt-0.5 opacity-70">
                                        {cfg.label}
                                    </span>

                                    {/* Patient name hint for occupied beds */}
                                    {statusKey === 'occupied' && bed.current_admission?.patient?.name && (
                                        <span className="text-[10px] mt-1 font-medium truncate w-full text-center opacity-80">
                                            {bed.current_admission.patient.name.split(' ')[0]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Bed detail modal ──────────────────────────────────────────── */}
            <Modal
                isOpen={!!selectedBed}
                onClose={() => setSelectedBed(null)}
                title={`Bed ${selectedBed?.bed_number ?? ''} — Details`}
                size="md"
                id="bed-detail-modal"
            >
                {selectedBed && (
                    <div className="space-y-5">
                        {/* Status badge */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">Bed Status</span>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${BED_STATUS[getBedStatus(selectedBed)]?.badge ?? ''}`}>
                                {BED_STATUS[getBedStatus(selectedBed)]?.label ?? selectedBed.status}
                            </span>
                        </div>

                        <hr className="border-slate-100" />

                        {selectedBed.current_admission ? (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupying Patient</p>

                                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                                    {/* Patient name + code */}
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <span className="font-bold text-slate-800 text-sm">
                                                {selectedBed.current_admission.patient?.name ?? 'Unknown'}
                                            </span>
                                        </div>
                                        {selectedBed.current_admission.patient?.patient_code && (
                                            <PatientCodeChip code={selectedBed.current_admission.patient.patient_code} />
                                        )}
                                    </div>

                                    {/* Admission info */}
                                    <div className="space-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                                        {selectedBed.current_admission.reason && (
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                                <span><strong className="text-slate-600">Reason:</strong> {selectedBed.current_admission.reason}</span>
                                            </div>
                                        )}
                                        {selectedBed.current_admission.admitted_at && (
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                                <span>
                                                    <strong className="text-slate-600">Admitted:</strong>{' '}
                                                    {new Date(selectedBed.current_admission.admitted_at).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {/* View patient file */}
                                    {selectedBed.current_admission.patient?.id && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedBed(null);
                                                navigate(`/patients/${selectedBed.current_admission.patient.id}`);
                                            }}
                                            className="gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            View Patient File
                                        </Button>
                                    )}

                                    {/* View nursing notes */}
                                    {selectedBed.current_admission.id && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedBed(null);
                                                navigate(`/ipd/${selectedBed.current_admission.id}/notes`);
                                            }}
                                            className="gap-1.5"
                                        >
                                            <Activity className="w-3.5 h-3.5" />
                                            Nursing Notes
                                        </Button>
                                    )}

                                    <div className="ml-auto">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDischargeTarget(selectedBed.current_admission)}
                                            className="gap-1.5"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            Discharge
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-6 gap-3 text-slate-400">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                                <p className="text-sm font-medium text-slate-600 font-semibold">This bed is available</p>
                                <p className="text-xs text-slate-500">Ready for new patient admissions.</p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedBed(null);
                                        navigate(`/ipd/admit?ward_id=${selectedWardId}&bed_id=${selectedBed.id}`);
                                    }}
                                    className="mt-2 gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Admit Patient
                                </Button>
                            </div>
                        )}

                        {!selectedBed.current_admission && (
                            <div className="flex justify-end pt-1 border-t border-slate-100 mt-4">
                                <Button variant="outline" size="sm" onClick={() => setSelectedBed(null)}>
                                    Close
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Discharge confirmation ────────────────────────────────────── */}
            <ConfirmDialog
                isOpen={!!dischargeTarget}
                onClose={() => setDischargeTarget(null)}
                onConfirm={handleDischarge}
                title="Discharge Patient"
                message={`Are you sure you want to discharge ${dischargeTarget?.patient?.name ?? 'this patient'}? This will mark the bed as available and cannot be undone.`}
                confirmText="Yes, Discharge"
                cancelText="Cancel"
                isDanger
                isLoading={discharging}
            />
        </div>
    );
};
