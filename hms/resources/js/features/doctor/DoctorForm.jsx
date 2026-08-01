import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Stethoscope, Save, ChevronLeft } from 'lucide-react';

export const DoctorForm = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [qualification, setQualification] = useState('');
    const [fee, setFee] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (!isEdit) return;
        doctorsApi
            .getDoctor(id)
            .then((data) => {
                const d = data.data || data;
                setName(d.name || '');
                setEmail(d.email || '');
                setSpecialization(d.specialization || '');
                setQualification(d.qualification || '');
                setFee(d.fee || '');
                setPhone(d.phone || '');
                setAddress(d.address || '');
            })
            .catch(() => addToast('Failed to load doctor details.', 'error'))
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
            specialization,
            qualification,
            fee: parseFloat(fee) || 0,
            phone: phone || null,
            address: address || null,
        };

        if (!isEdit) {
            payload.password = password || 'password123';
        }

        try {
            if (isEdit) {
                await doctorsApi.updateDoctor(id, payload);
                addToast('Doctor details updated successfully!');
            } else {
                await doctorsApi.createDoctor(payload);
                addToast('Doctor registered successfully!');
            }
            setTimeout(() => navigate('/doctors'), 1500);
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to save doctor details.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="h-[300px] bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/doctors')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-indigo-500" />
                        {isEdit ? 'Edit Doctor Profile' : 'Register New Doctor'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isEdit ? 'Update details, specialization, qualifications and consultation fee.' : 'Onboard a new medical consultant.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                
                {/* Account details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Full Name"
                        placeholder="Dr. Gregory House"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="doctor@hms.com"
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

                {/* Contact details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
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

                {/* Professional details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                    <Input
                        label="Specialization"
                        placeholder="e.g. Cardiology, Pediatrics"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        required
                    />
                    <Input
                        label="Qualification"
                        placeholder="e.g. MD, MBBS"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        required
                    />
                    <Input
                        label="Consultation Fee ($)"
                        type="number"
                        placeholder="e.g. 150"
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        required
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/doctors')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={submitting}
                        icon={<Save className="w-4 h-4" />}
                    >
                        Save Doctor
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
