import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { opdApi } from '../../api/opd';
import { labApi } from '../../api/lab';
import { pharmacyApi } from '../../api/pharmacy';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { 
    Stethoscope, 
    FileText, 
    Pill, 
    FlaskConical, 
    ChevronLeft, 
    Plus, 
    Trash2, 
    CheckCircle2 
} from 'lucide-react';

export const ConsultationView = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    // Data state
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [medicines, setMedicines] = useState([]);
    const [labTests, setLabTests] = useState([]);

    // Toast states
    const [toasts, setToasts] = useState([]);

    // Form inputs
    const [symptoms, setSymptoms] = useState('');
    const [diagnosisNotes, setDiagnosisNotes] = useState('');
    const [physicalExam, setPhysicalExam] = useState('');

    // Prescription list
    const [prescriptionNotes, setPrescriptionNotes] = useState('');
    const [rxItems, setRxItems] = useState([]); // Array of { medicine_id, dosage, frequency, instructions }

    // Lab requests
    const [selectedLabTests, setSelectedLabTests] = useState([]); // Array of test IDs

    // Submission loading states
    const [submitting, setSubmitting] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const apptData = await appointmentsApi.getAppointmentDetails(appointmentId);
                setAppointment(apptData.data || apptData);

                // Fetch medicines and lab tests for dropdowns
                const [medsData, testsData] = await Promise.all([
                    pharmacyApi.getMedicines(),
                    opdApi.getLabTests()
                ]);
                setMedicines(medsData.data || medsData);
                setLabTests(testsData.data || testsData);
            } catch (err) {
                addToast('Failed to load consultation details.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [appointmentId]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Prescription handlers
    const addRxItem = () => {
        setRxItems((prev) => [
            ...prev,
            { medicine_id: '', dosage: '', frequency: '', instructions: '' }
        ]);
    };

    const updateRxItem = (index, field, value) => {
        setRxItems((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const removeRxItem = (index) => {
        setRxItems((prev) => prev.filter((_, i) => i !== index));
    };

    // Lab request handlers
    const toggleLabTest = (testId) => {
        setSelectedLabTests((prev) =>
            prev.includes(testId)
                ? prev.filter((id) => id !== testId)
                : [...prev, testId]
        );
    };

    // Master submit
    const handleSubmitConsultation = async (e) => {
        e.preventDefault();
        if (!symptoms || !diagnosisNotes) {
            addToast('Symptoms and Diagnosis Notes are required.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Submit Diagnosis
            await opdApi.createDiagnosis({
                appointment_id: appointmentId,
                symptoms,
                diagnosis: diagnosisNotes,
                physical_examination: physicalExam,
            });

            // 2. Submit Prescription if items exist
            if (rxItems.length > 0) {
                const validItems = rxItems.filter(item => item.medicine_id);
                if (validItems.length > 0) {
                    await opdApi.createPrescription({
                        appointment_id: appointmentId,
                        notes: prescriptionNotes,
                        items: validItems
                    });
                }
            }

            // 3. Submit Lab Requests if selected
            if (selectedLabTests.length > 0) {
                await Promise.all(
                    selectedLabTests.map(testId => 
                        labApi.createLabRequest({
                            appointment_id: appointmentId,
                            lab_test_id: testId,
                            notes: 'Requested during consultation'
                        })
                    )
                );
            }

            // 4. Update Appointment status to Completed
            await appointmentsApi.updateStatus(appointmentId, 'completed');

            addToast('Consultation saved and appointment completed successfully!');
            setTimeout(() => {
                navigate('/appointments');
            }, 1500);
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to submit consultation details.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Stethoscope className="w-6 h-6 text-indigo-500" />
                            OPD Consultation View
                        </h1>
                        <p className="text-sm text-gray-500">
                            Patient: <span className="font-semibold text-gray-800">{appointment?.patient?.name}</span> ({appointment?.patient?.patient_code})
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={handleSubmitConsultation} 
                    loading={submitting}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                >
                    Complete Consultation
                </Button>
            </div>

            {/* Layout grid */}
            <form onSubmit={handleSubmitConsultation} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side: Diagnosis Form */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Diagnosis Details
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Symptoms <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="Describe symptoms e.g., high fever, sore throat..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Physical Examination
                            </label>
                            <textarea
                                rows={2}
                                value={physicalExam}
                                onChange={(e) => setPhysicalExam(e.target.value)}
                                placeholder="Blood pressure, heart rate, chest clear, etc."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Diagnosis Notes <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={diagnosisNotes}
                                onChange={(e) => setDiagnosisNotes(e.target.value)}
                                placeholder="Final diagnosis/provisional diagnosis..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Lab Order Panel */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                            <FlaskConical className="w-5 h-5 text-indigo-500" />
                            Order Lab Tests
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                            {labTests.map((test) => (
                                <label
                                    key={test.id}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                                        selectedLabTests.includes(test.id)
                                            ? 'border-indigo-500 bg-indigo-55/10 text-indigo-900 font-semibold'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLabTests.includes(test.id)}
                                        onChange={() => toggleLabTest(test.id)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>{test.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right side: Prescription Form */}
                <div className="lg:col-span-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 min-h-[500px]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <Pill className="w-5 h-5 text-indigo-500" />
                                Prescriptions
                            </h2>
                            <Button 
                                type="button" 
                                size="sm" 
                                variant="secondary" 
                                onClick={addRxItem}
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Add Medicine
                            </Button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prescription Notes / Remarks
                            </label>
                            <textarea
                                rows={2}
                                value={prescriptionNotes}
                                onChange={(e) => setPrescriptionNotes(e.target.value)}
                                placeholder="Dietary instructions, take before meals, review in 5 days..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                            />
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {rxItems.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">
                                    No medicines added yet. Click "Add Medicine" above to write prescription.
                                </p>
                            ) : (
                                rxItems.map((item, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 relative space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => removeRxItem(idx)}
                                            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Medicine</label>
                                            <select
                                                value={item.medicine_id}
                                                onChange={(e) => updateRxItem(idx, 'medicine_id', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                                            >
                                                <option value="">Select Medicine</option>
                                                {medicines.map((med) => (
                                                    <option key={med.id} value={med.id}>
                                                        {med.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dosage</label>
                                                <Input
                                                    placeholder="e.g. 500mg, 1 tablet"
                                                    value={item.dosage}
                                                    onChange={(e) => updateRxItem(idx, 'dosage', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Frequency</label>
                                                <Input
                                                    placeholder="e.g. Twice daily, 1-0-1"
                                                    value={item.frequency}
                                                    onChange={(e) => updateRxItem(idx, 'frequency', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Instructions</label>
                                            <Input
                                                placeholder="e.g. After meals, for 5 days"
                                                value={item.instructions}
                                                onChange={(e) => updateRxItem(idx, 'instructions', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
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
