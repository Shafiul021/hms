import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
    CalendarRange,
    ChevronRight,
    ChevronLeft,
    Stethoscope,
    Clock,
    CheckCircle2,
    User,
    Search,
    Plus,
} from 'lucide-react';

// ─── Step indicators ──────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Select Doctor', icon: Stethoscope },
    { id: 2, label: 'Pick Date & Slot', icon: Clock },
    { id: 3, label: 'Confirm', icon: CheckCircle2 },
];

const StepBar = ({ current }) => (
    <div className="flex items-center justify-center gap-0 mb-8">
        {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const done = current > step.id;
            const active = current === step.id;
            return (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                done
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : active
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                                    : 'border-gray-300 text-gray-400 bg-white'
                            }`}
                        >
                            {done ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <Icon className="w-4 h-4" />
                            )}
                        </div>
                        <span
                            className={`mt-1.5 text-xs font-medium ${
                                active ? 'text-indigo-600' : done ? 'text-gray-700' : 'text-gray-400'
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div
                            className={`h-0.5 w-16 sm:w-24 mx-1 mt-[-14px] transition-all duration-300 ${
                                current > step.id ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                        />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Step 1: Doctor selection ─────────────────────────────────────────────────
const Step1SelectDoctor = ({ selected, onSelect }) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        doctorsApi
            .getDoctors({ per_page: 50 })
            .then((data) => setDoctors(data.data || data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = doctors.filter((d) => {
        const q = search.toLowerCase();
        return (
            d.name?.toLowerCase().includes(q) ||
            d.specialization?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by name or specialization…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No doctors found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {filtered.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => onSelect(doc)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 hover:shadow-md ${
                                selected?.id === doc.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
                                    : 'border-gray-200 bg-white hover:border-indigo-300'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {doc.name?.[0] ?? 'D'}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">{doc.name}</p>
                                <p className="text-xs text-gray-500 truncate">{doc.specialization ?? 'General'}</p>
                            </div>
                            {selected?.id === doc.id && (
                                <CheckCircle2 className="w-5 h-5 text-indigo-600 ml-auto flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Step 2: Date + slot picker ───────────────────────────────────────────────
const Step2PickSlot = ({ doctor, date, slot, onDateChange, onSlotSelect }) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Today's date string for min value
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!doctor || !date) return;
        setLoading(true);
        doctorsApi
            .getDoctorSlots(doctor.id, date)
            .then((data) => {
                // API returns: { data: [ { id, start_time, end_time, is_blocked }, ... ] }
                // TimeSlotResource::collection returns a flat array — already filtered by backend
                const allSlots = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setSlots(allSlots.filter((s) => !s.is_blocked));
            })
            .catch(() => setSlots([]))
            .finally(() => setLoading(false));
    }, [doctor, date]);

    const formatTime = (t) => (t ? t.substring(0, 5) : '');

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full sm:w-56 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                />
            </div>

            {date && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Time Slots</p>
                    {loading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : slots.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">
                            No available slots for {date}. Please try another date or doctor.
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {slots.map((s) => {
                                const label = `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
                                const isSelected = slot?.id === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => onSlotSelect(s)}
                                        className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all duration-150 ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Step 3: Confirm ──────────────────────────────────────────────────────────
const Step3Confirm = ({
    doctor,
    date,
    slot,
    notes,
    onNotesChange,
    isStaff,
    patients,
    selectedPatientId,
    onPatientChange,
    loadingPatients,
    onAddPatient,
}) => {
    const formatTime = (t) => (t ? t.substring(0, 5) : '');
    const slotLabel = slot
        ? `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`
        : '—';

    return (
        <div className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide text-xs">
                    Appointment Summary
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Doctor</p>
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium text-gray-800">{doctor?.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 pl-6">{doctor?.specialization ?? 'General'}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Date &amp; Time</p>
                        <div className="flex items-center gap-2">
                            <CalendarRange className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium text-gray-800">
                                {new Date(date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium text-gray-800">{slotLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Book on behalf Patient Selector */}
            {isStaff && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-700">
                            Book on Behalf of Patient <span className="text-red-500">*</span>
                        </label>
                        {onAddPatient && (
                            <button
                                type="button"
                                onClick={onAddPatient}
                                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add New Patient
                            </button>
                        )}
                    </div>
                    {loadingPatients ? (
                        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    ) : (
                        <select
                            value={selectedPatientId}
                            onChange={(e) => onPatientChange(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 font-medium text-gray-800"
                        >
                            <option value="">-- Select Patient --</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.patient_code})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason / Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                    rows={3}
                    placeholder="Briefly describe symptoms or the reason for the visit…"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                />
            </div>
        </div>
    );
};

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    // Roles check
    const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => r.name || r)
        : [user?.role].filter(Boolean);
    const isStaff = roles.some(r => ['admin', 'receptionist'].includes(r));
    const isPatient = roles.includes('patient');

    // Pre-filled doctor from navigation state (e.g. from DoctorList)
    const prefilledDoctor = location.state?.doctor ?? null;

    // Wizard step — start at 2 if doctor was pre-selected
    const [step, setStep] = useState(prefilledDoctor ? 2 : 1);

    // Wizard state
    const [doctor, setDoctor] = useState(prefilledDoctor);
    const [date, setDate] = useState('');
    // slot is the full slot object { id, start_time, end_time } from the API
    const [slot, setSlot] = useState(null);
    const [notes, setNotes] = useState('');

    // Book on behalf states (admin / receptionist)
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(
        isPatient && user?.patient_id ? String(user.patient_id) : ''
    );
    const [loadingPatients, setLoadingPatients] = useState(false);

    // Load patients if receptionist/admin
    useEffect(() => {
        if (!isStaff) return;
        setLoadingPatients(true);
        patientsApi.getPatients({ per_page: 200 })
            .then(data => {
                setPatients(data.data || data || []);
            })
            .catch(() => setPatients([]))
            .finally(() => setLoadingPatients(false));
    }, [isStaff]);

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Step validity
    const canProceed = () => {
        if (step === 1) return !!doctor;
        if (step === 2) return !!date && !!slot;
        if (step === 3 && isStaff) return !!selectedPatientId;
        return true;
    };

    const handleNext = () => {
        if (step < 3) setStep((s) => s + 1);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((s) => s - 1);
            if (step === 2) {
                setSlot(null);
            }
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            // API requires: { patient_id, doctor_id, slot_id, date, notes }
            const payload = {
                doctor_id: doctor.id,
                slot_id:   slot.id,
                date:      date,
                notes,
            };
            // Staff selects patient; patient role auto-injects via backend prepareForValidation
            // but we also send it explicitly for clarity
            if (isStaff && selectedPatientId) {
                payload.patient_id = parseInt(selectedPatientId, 10);
            } else if (isPatient && user?.patient_id) {
                payload.patient_id = user.patient_id;
            }
            await appointmentsApi.bookAppointment(payload);
            navigate('/appointments');
        } catch (err) {
            setSubmitError(
                err?.response?.data?.message || 'Failed to book appointment. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
        <div className="mb-6">
                <button
                    onClick={() => navigate('/appointments')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Appointments
                </button>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CalendarRange className="w-6 h-6 text-indigo-500" />
                            Book New Appointment
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {prefilledDoctor
                                ? `Booking with Dr. ${prefilledDoctor.user?.name ?? prefilledDoctor.name ?? ''}. Pick a date and slot below.`
                                : 'Follow the 3 steps to book a new appointment.'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/appointments/new')}
                        className="flex-shrink-0 mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 transition-colors"
                    >
                        Use manual form instead →
                    </button>
                </div>
            </div>

            {/* Wizard card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <StepBar current={step} />


                {/* Step content */}
                <div className="min-h-[300px]">
                    {step === 1 && (
                        <Step1SelectDoctor selected={doctor} onSelect={setDoctor} />
                    )}
                    {step === 2 && (
                        <Step2PickSlot
                            doctor={doctor}
                            date={date}
                            slot={slot}
                            onDateChange={(d) => {
                                setDate(d);
                                setSlot('');
                            }}
                            onSlotSelect={setSlot}
                        />
                    )}
                    {step === 3 && (
                        <Step3Confirm
                            doctor={doctor}
                            date={date}
                            slot={slot}
                            notes={notes}
                            onNotesChange={setNotes}
                            isStaff={isStaff}
                            patients={patients}
                            selectedPatientId={selectedPatientId}
                            onPatientChange={setSelectedPatientId}
                            loadingPatients={loadingPatients}
                            onAddPatient={isStaff ? () => navigate('/patients/new') : null}
                        />
                    )}
                </div>

                {/* Error */}
                {submitError && (
                    <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {submitError}
                    </p>
                )}

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                        icon={<ChevronLeft className="w-4 h-4" />}
                    >
                        Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            icon={<ChevronRight className="w-4 h-4 order-last" />}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                            icon={<CheckCircle2 className="w-4 h-4 order-last" />}
                        >
                            Confirm Booking
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
