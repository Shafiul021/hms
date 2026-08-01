import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ipdApi } from '../../api/ipd';
import { NursingNotes } from './NursingNotes';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import { Bed, ChevronLeft, User, Stethoscope, CalendarDays } from 'lucide-react';

/**
 * NursingNotesPage — a routable wrapper around the NursingNotes panel.
 *
 * Route: /ipd/:admissionId/notes
 *
 * It fetches the admission details to show context (patient, doctor, bed),
 * then renders the reusable <NursingNotes admissionId={...} /> panel below.
 */
export const NursingNotesPage = () => {
    const { admissionId } = useParams();
    const navigate = useNavigate();

    const [admission, setAdmission] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    useEffect(() => {
        if (!admissionId) return;
        // The IPD api doesn't expose a single-admission GET, so we fetch the ward list
        // and look for the matching admission via the bed's current_admission.
        // If the backend adds GET /api/admissions/{id} later, swap this out.
        ipdApi
            .getWards()
            .then((data) => {
                const wards = data.data || data;
                let found = null;
                outer: for (const ward of wards) {
                    for (const bed of ward.beds ?? []) {
                        const ca = bed.current_admission;
                        if (ca && String(ca.id) === String(admissionId)) {
                            found = {
                                ...ca,
                                bed_number: bed.bed_number,
                                ward_name:  ward.name,
                            };
                            break outer;
                        }
                    }
                }
                setAdmission(found);
            })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Failed to load admission details.');
            })
            .finally(() => setLoading(false));
    }, [admissionId]);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Back button + header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/ipd')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Back to IPD Wards"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bed className="w-6 h-6 text-indigo-500" />
                        Nursing Notes
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Admission #{admissionId} — clinical observations &amp; notes timeline.
                    </p>
                </div>
            </div>

            {/* Admission context card */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 animate-pulse space-y-3">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4">
                    {error} — Nursing notes panel is still available below.
                </div>
            ) : admission ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Admission Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Patient</p>
                                <p className="font-semibold text-gray-800">{admission.patient?.name ?? '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                                <Bed className="w-4 h-4 text-sky-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Bed / Ward</p>
                                <p className="font-semibold text-gray-800">
                                    {admission.bed_number ?? 'Bed'} — {admission.ward_name ?? 'Ward'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <CalendarDays className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Admitted</p>
                                <p className="font-semibold text-gray-800">
                                    {formatDate(admission.admitted_at ?? admission.created_at, true)}
                                </p>
                            </div>
                        </div>
                    </div>
                    {admission.reason && (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                            <span className="text-gray-400 text-xs">Reason: </span>
                            <span className="text-gray-700">{admission.reason}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-2xl p-4">
                    Admission details not found. The patient may have been discharged.
                </div>
            )}

            {/* Notes panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <NursingNotes admissionId={admissionId} />
            </div>
        </div>
    );
};
