import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ipdApi } from '../../api/ipd';
import { patientsApi } from '../../api/patients';
import { doctorsApi } from '../../api/doctors';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { UserPlus, ChevronLeft, Bed, Save } from 'lucide-react';

export const AdmissionForm = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const urlWardId = queryParams.get('ward_id');
    const urlBedId = queryParams.get('bed_id');

    // Data lists for selection
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [wards, setWards] = useState([]);
    const [beds, setBeds] = useState([]);

    // Form inputs
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedWardId, setSelectedWardId] = useState(urlWardId || '');
    const [selectedBedId, setSelectedBedId] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [ptsData, docsData, wardsData] = await Promise.all([
                    patientsApi.getPatients({ per_page: 100 }),
                    doctorsApi.getDoctors({ per_page: 100 }),
                    ipdApi.getWards()
                ]);
                setPatients(ptsData.data || ptsData);
                setDoctors(docsData.data || docsData);
                setWards(wardsData.data || wardsData);
            } catch (err) {
                addToast('Failed to load form dependencies.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Load available beds when ward changes
    useEffect(() => {
        if (!selectedWardId) {
            setBeds([]);
            setSelectedBedId('');
            return;
        }

        ipdApi
            .getBeds(selectedWardId)
            .then((data) => {
                const list = data.data || data;
                // Filter only available beds, EXCEPT if a specific bed was pre-selected via query params
                const available = list.filter((b) => b.status === 'available' || String(b.id) === String(urlBedId));
                setBeds(available);
                
                if (urlBedId && list.some(b => String(b.id) === String(urlBedId))) {
                    setSelectedBedId(urlBedId);
                } else {
                    setSelectedBedId('');
                }
            })
            .catch(() => setBeds([]));
    }, [selectedWardId]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatientId || !selectedDoctorId || !selectedWardId || !selectedBedId) {
            addToast('All fields are required.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await ipdApi.admitPatient({
                patient_id: selectedPatientId,
                doctor_id: selectedDoctorId,
                ward_id: selectedWardId,
                bed_id: selectedBedId,
                reason: reason || 'Initial Admission',
            });
            addToast('Patient admitted successfully!');
            setTimeout(() => {
                navigate('/ipd');
            }, 1500);
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to complete admission.', 'error');
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
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/ipd')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-indigo-500" />
                        IPD Patient Admission Form
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Admit a patient to a ward and assign an available bed.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Patient <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-medium text-gray-800"
                        required
                    >
                        <option value="">Choose Patient</option>
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.patient_code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admitting Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-medium text-gray-800"
                        required
                    >
                        <option value="">Choose Consultant</option>
                        {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                                Dr. {d.name} ({d.specialization})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Ward <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedWardId}
                            onChange={(e) => setSelectedWardId(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-medium text-gray-800"
                            required
                        >
                            <option value="">Choose Ward</option>
                            {wards.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({w.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Bed <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedBedId}
                            disabled={!selectedWardId}
                            onChange={(e) => setSelectedBedId(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white font-medium text-gray-800 disabled:opacity-50"
                            required
                        >
                            <option value="">
                                {!selectedWardId ? 'Select a ward first' : beds.length === 0 ? 'No beds available' : 'Choose Bed'}
                            </option>
                            {beds.map((b) => (
                                <option key={b.id} value={b.id}>
                                    Bed {b.bed_number}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admission Reason / Primary Complaint
                    </label>
                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Detail symptoms, provisional diagnosis, or reason for inpatient admission..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={() => navigate('/ipd')}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={submitting} icon={<Save className="w-4 h-4" />}>
                        Admit Patient
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
