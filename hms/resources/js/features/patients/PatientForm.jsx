import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/patients';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { UserPlus, Save, ChevronLeft } from 'lucide-react';

export const PatientForm = () => {
    const { id } = useParams(); // Numeric ID for edit, undefined for new
    const isEdit = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('male');
    const [bloodType, setBloodType] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');

    // Emergency contact (single entry → sent as array)
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    useEffect(() => {
        if (!isEdit) return;
        patientsApi
            .getPatient(id)
            .then((data) => {
                const p = data.data || data;
                setName(p.name || '');
                setEmail(p.email || '');
                setDob(p.dob || p.date_of_birth || '');
                setGender(p.gender || 'male');
                setBloodType(p.blood_type || '');
                setPhone(p.phone || '');
                setAddress(p.address || '');
                setWeight(p.weight || '');
                setHeight(p.height || '');
                // Populate from first emergency contact if exists
                const ec = p.emergency_contacts?.[0] || {};
                setEmergencyName(ec.name || '');
                setEmergencyRelation(ec.relationship || '');
                setEmergencyPhone(ec.phone || '');
            })
            .catch(() => addToast('Failed to load patient data.', 'error'))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    const addToast = (message, type = 'success') => {
        const tid = Date.now();
        setToasts((prev) => [...prev, { id: tid, message, type }]);
    };

    const removeToast = (tid) => {
        setToasts((prev) => prev.filter((t) => t.id !== tid));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name,
            email,
            dob,
            gender,
            blood_type: bloodType || null,
            phone: phone || null,
            address: address || null,
            weight: weight ? parseFloat(weight) : null,
            height: height ? parseFloat(height) : null,
        };

        // Append emergency contact as array if provided
        if (emergencyName) {
            payload.emergency_contacts = [{
                name: emergencyName,
                relationship: emergencyRelation || 'Other',
                phone: emergencyPhone || '',
            }];
        }

        if (!isEdit) {
            payload.password = password || 'password123';
        }

        try {
            if (isEdit) {
                await patientsApi.updatePatient(id, payload);
                addToast('Patient updated successfully!');
            } else {
                await patientsApi.createPatient(payload);
                addToast('Patient created successfully!');
            }
            setTimeout(() => navigate('/patients'), 1500);
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to save patient.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="h-96 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/patients')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-indigo-500" />
                        {isEdit ? 'Edit Patient Profile' : 'Register New Patient'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isEdit ? 'Modify patient records and medical metrics.' : 'Create a new medical file for an arriving patient.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                
                {/* Section: Account Info */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                        Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="johndoe@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {!isEdit && (
                            <Input
                                label="Temporary Password"
                                type="password"
                                placeholder="Enter password (default: password123)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                {/* Section: Personal Info */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                        Personal & Medical Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type <span className="text-red-500">*</span></label>
                            <select
                                value={bloodType}
                                onChange={(e) => setBloodType(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                                required
                            >
                                <option value="">Select Blood Type</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Input
                            label="Phone Number"
                            placeholder="e.g. +1 555 123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <Input
                            label="Address"
                            placeholder="City, Country"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Input
                            label="Weight (kg)"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 70.5"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                        <Input
                            label="Height (cm)"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 175.2"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </div>
                </div>

                {/* Section: Emergency Contact */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                        Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Contact Name"
                            placeholder="Jane Doe"
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                        />
                        <Input
                            label="Relationship"
                            placeholder="e.g. Spouse, Parent"
                            value={emergencyRelation}
                            onChange={(e) => setEmergencyRelation(e.target.value)}
                        />
                        <Input
                            label="Contact Phone"
                            placeholder="e.g. +1 555 987 6543"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/patients')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={submitting}
                        icon={<Save className="w-4 h-4" />}
                    >
                        Save Patient
                    </Button>
                </div>
            </form>

            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((t) => (
                    <Toast
                        key={t.id}
                        message={t.message}
                        type={t.type}
                        onClose={() => removeToast(t.id)}
                    />
                ))}
            </div>
        </div>
    );
};
