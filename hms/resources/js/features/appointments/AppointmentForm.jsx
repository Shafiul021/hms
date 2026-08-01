import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { patientsApi } from '../../api/patients';
import { doctorsApi } from '../../api/doctors';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { CalendarRange, Save, ChevronLeft } from 'lucide-react';

export const AppointmentForm = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Data lists
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);

    // Form inputs
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [type, setType] = useState('OPD');
    const [status, setStatus] = useState('scheduled');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [ptsData, docsData] = await Promise.all([
                    patientsApi.getPatients({ per_page: 100 }),
                    doctorsApi.getDoctors({ per_page: 100 })
                ]);
                setPatients(ptsData.data || ptsData);
                setDoctors(docsData.data || docsData);

                if (isEdit) {
                    const apptData = await appointmentsApi.getAppointmentDetails(id);
                    const appt = apptData.data || apptData;
                    
                    setSelectedPatientId(appt.patient_id || appt.patient?.id || '');
                    setSelectedDoctorId(appt.doctor_id || appt.doctor?.id || '');
                    
                    // Split date and time slot
                    if (appt.appointment_date) {
                        const dt = new Date(appt.appointment_date);
                        const dateStr = dt.toISOString().split('T')[0];
                        const timeStr = dt.toTimeString().substring(0, 5);
                        setAppointmentDate(dateStr);
                        setSelectedSlot(timeStr);
                    }
                    setType(appt.type || 'OPD');
                    setStatus(appt.status || 'scheduled');
                    setNotes(appt.notes || '');
                }
            } catch (err) {
                addToast('Failed to load form details.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [id, isEdit]);

    // Fetch doctor slots when doctor or date changes
    useEffect(() => {
        if (!selectedDoctorId || !appointmentDate) {
            setSlots([]);
            return;
        }

        doctorsApi
            .getDoctorSlots(selectedDoctorId, appointmentDate)
            .then((data) => {
                const allSlots = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setSlots(allSlots.filter((s) => !s.is_blocked));
            })
            .catch(() => setSlots([]));
    }, [selectedDoctorId, appointmentDate]);

    const addToast = (message, type = 'success') => {
        const tid = Date.now();
        setToasts((prev) => [...prev, { id: tid, message, type }]);
    };

    const removeToast = (tid) => {
        setToasts((prev) => prev.filter((t) => t.id !== tid));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatientId || !selectedDoctorId || !appointmentDate || (!isEdit && !selectedSlot)) {
            addToast('Patient, Doctor, Date and Time Slot are required.', 'error');
            return;
        }

        setSubmitting(true);
        const payload = isEdit
            ? { status }
            : {
                  patient_id: parseInt(selectedPatientId, 10),
                  doctor_id: parseInt(selectedDoctorId, 10),
                  slot_id: parseInt(selectedSlot, 10),
                  date: appointmentDate,
                  notes,
              };

        try {
            if (isEdit) {
                await appointmentsApi.updateStatus(id, status);
                addToast('Appointment status updated successfully!');
            } else {
                await appointmentsApi.bookAppointment(payload);
                addToast('Appointment booked successfully!');
            }
            setTimeout(() => navigate('/appointments'), 1500);
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to save appointment.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="h-96 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CalendarRange className="w-6 h-6 text-indigo-500" />
                            {isEdit ? 'Modify Appointment Record' : 'Schedule Appointment'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isEdit ? 'Update appointment status and details.' : 'Book a new slot for an arriving patient.'}
                        </p>
                    </div>
                </div>
                {!isEdit && (
                    <button
                        onClick={() => navigate('/appointments/book')}
                        className="flex-shrink-0 mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 transition-colors"
                    >
                        Use guided wizard instead →
                    </button>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
                
                {/* Select Patient */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patient <span className="text-red-500">*</span>
                    </label>
                    <select
                        disabled={isEdit}
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-medium text-gray-800 disabled:opacity-60"
                        required
                    >
                        <option value="">Select Patient</option>
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.patient_code})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Select Doctor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                        disabled={isEdit}
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-medium text-gray-800 disabled:opacity-60"
                        required
                    >
                        <option value="">Select Doctor</option>
                        {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                                Dr. {d.name} ({d.specialization})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Select Date and Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            disabled={isEdit}
                            type="date"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50 disabled:opacity-60"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Slot <span className="text-red-500">*</span>
                        </label>
                        {isEdit ? (
                            <input
                                disabled
                                type="text"
                                value={selectedSlot}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50 disabled:opacity-60"
                            />
                        ) : (
                            <select
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                                required
                            >
                                <option value="">Choose Slot</option>
                                {slots.map((s, index) => {
                                    const formatTime = (t) => (t ? t.substring(0, 5) : '');
                                    const label = `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
                                    const keyVal = s.id || index;
                                    return (
                                        <option key={keyVal} value={s.id}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                </div>

                {/* Select Type and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            disabled={isEdit}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white disabled:opacity-60"
                        >
                            <option value="OPD">OPD Consultation</option>
                            <option value="IPD">IPD Visit</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-indigo-700"
                        >
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                    <textarea
                        disabled={isEdit}
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Symptoms or details..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none disabled:opacity-60"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={() => navigate('/appointments')}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={submitting} icon={<Save className="w-4 h-4" />}>
                        Save Appointment
                    </Button>
                </div>
            </form>

            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};
