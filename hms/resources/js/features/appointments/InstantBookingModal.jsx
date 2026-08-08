import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useInstantBook } from '../../hooks/useAppointments';
import { patientsApi } from '../../api/patients';
import { doctorsApi } from '../../api/doctors';
import { Search, User, Stethoscope, ArrowRight, UserPlus, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export const InstantBookingModal = ({ isOpen, onClose, defaultDoctorId = null }) => {
    const { mutate: bookInstant, isLoading: isBooking } = useInstantBook();
    const [doctors, setDoctors] = useState([]);
    
    // Steps: 'search' -> 'create' | 'book'
    const [step, setStep] = useState('search');
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    
    // Create patient state
    const [newPatient, setNewPatient] = useState({
        name: '', email: '', phone: '', dob: '', gender: 'male', blood_type: ''
    });

    // Book state
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState(defaultDoctorId || '');
    const [notes, setNotes] = useState('');
    const [type, setType] = useState('walk_in');

    useEffect(() => {
        if (isOpen) {
            if (!defaultDoctorId) {
                doctorsApi.getDoctors({ per_page: 200 }).then(data => setDoctors(data.data || []));
            }
            // Reset all state
            setStep('search');
            setSearchQuery('');
            setNewPatient({ name: '', email: '', phone: '', dob: '', gender: 'male', blood_type: '' });
            setSelectedPatient(null);
            setNotes('');
            setType('walk_in');
        }
    }, [isOpen, defaultDoctorId]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const data = await patientsApi.getPatients({ search: searchQuery });
            const results = data.data || [];
            
            if (results.length > 0) {
                // Patient found!
                setSelectedPatient(results[0]);
                toast.success(`Patient ${results[0].name} found!`);
                setStep('book');
            } else {
                // No patient found
                toast.error("No patient found. Please register them quickly.");
                const isEmail = searchQuery.includes('@');
                setNewPatient(prev => ({
                    ...prev,
                    email: isEmail ? searchQuery : '',
                    phone: isEmail ? '' : searchQuery
                }));
                setStep('create');
            }
        } catch (err) {
            toast.error("Error searching for patient.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const patientData = {
                ...newPatient,
                password: 'password123' // Default password for instant registrations
            };
            const created = await patientsApi.createPatient(patientData);
            toast.success("Patient created successfully!");
            setSelectedPatient(created.data || created.patient || created);
            setStep('book');
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to create patient.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleBook = () => {
        if (!selectedPatient || !selectedDoctorId) {
            toast.error("Please ensure patient and doctor are selected.");
            return;
        }

        bookInstant(
            { 
                patient_id: selectedPatient.id, 
                doctor_id: selectedDoctorId,
                type,
                notes 
            },
            {
                onSuccess: () => {
                    toast.success(`Instant ${type.replace('_', ' ')} appointment booked!`);
                    onClose();
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || "Failed to book instant appointment.");
                }
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Book Instant Appointment" size="lg">
            {step === 'search' && (
                <form onSubmit={handleSearch} className="space-y-5 pb-4">
                    <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm border border-indigo-100 flex items-start gap-3">
                        <div className="mt-0.5"><Search className="w-4 h-4" /></div>
                        <div>
                            Enter the patient's <strong>Phone Number</strong> or <strong>Email</strong> to check if they already exist in the system.
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Phone or Email <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. +1234567890 or patient@example.com"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                            autoFocus
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={isSearching} icon={<ArrowRight className="w-4 h-4" />}>
                            Check Patient
                        </Button>
                    </div>
                </form>
            )}

            {step === 'create' && (
                <form onSubmit={handleCreatePatient} className="space-y-5 pb-4">
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm border border-emerald-100 flex items-start gap-3">
                        <div className="mt-0.5"><UserPlus className="w-4 h-4" /></div>
                        <div>
                            <strong>New Patient!</strong> Please quickly register them to proceed with the booking.
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                            <input type="text" required value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Email *</label>
                            <input type="email" required value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="text" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                            <input type="date" required value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Gender *</label>
                            <select required value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Blood Type *</label>
                            <select required value={newPatient.blood_type} onChange={e => setNewPatient({...newPatient, blood_type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none">
                                <option value="">Select...</option>
                                <option value="A+">A+</option><option value="A-">A-</option>
                                <option value="B+">B+</option><option value="B-">B-</option>
                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                <option value="O+">O+</option><option value="O-">O-</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                        <Button variant="outline" type="button" onClick={() => setStep('search')}>Back</Button>
                        <Button variant="primary" type="submit" loading={isCreating}>Create & Continue</Button>
                    </div>
                </form>
            )}

            {step === 'book' && (
                <div className="space-y-5 pb-4">
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-100 flex items-start gap-3">
                        <div className="mt-0.5">⚡</div>
                        <div>
                            Booking for <strong>{selectedPatient?.name}</strong>. This bypasses schedule checks.
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Doctor Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Doctor <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                                    disabled={!!defaultDoctorId}
                                    className={`w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 font-medium ${defaultDoctorId ? 'text-gray-500 opacity-80' : 'text-gray-800'}`}
                                >
                                    <option value="">-- Select Doctor --</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            Dr. {d.name} ({d.specialization || 'General'})
                                        </option>
                                    ))}
                                    {defaultDoctorId && doctors.length === 0 && (
                                        <option value={defaultDoctorId}>Pre-selected Doctor</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Appointment Type */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Priority Type <span className="text-red-500">*</span></label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 font-medium text-gray-800"
                            >
                                <option value="walk_in">Walk-In (Waitlist)</option>
                                <option value="emergency">Emergency (Immediate)</option>
                                <option value="vip">VIP (Priority)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Reason / Notes (Optional)</label>
                        <textarea 
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 sm:text-sm resize-none"
                            rows="2"
                            placeholder="e.g. Severe chest pain, Walk-in checkup..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-gray-100">
                        <Button variant="outline" type="button" onClick={() => setStep('search')}>Back to Search</Button>
                        <div className="flex gap-2">
                            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                            <Button variant="primary" type="button" onClick={handleBook} loading={isBooking}>Book Appointment</Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
