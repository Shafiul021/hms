import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { User, Mail, ShieldAlert } from 'lucide-react';

export const EditProfile = () => {
    const { user, setAuth } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        const valErrors = {};
        if (!name.trim()) valErrors.name = ['Name is required.'];
        if (!email.trim()) valErrors.email = ['Email is required.'];
        if (Object.keys(valErrors).length) {
            setErrors(valErrors);
            return;
        }

        setLoading(true);
        try {
            const data = await authApi.updateProfile({ name, email });
            // Save updated user in Zustand authStore
            setAuth(user.token || localStorage.getItem('token'), data.user || data);
            showToast('Profile updated successfully!');
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="pl-10"
                    />
                </div>
                {errors.name && <p className="text-xs text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{errors.name[0]}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10"
                    />
                </div>
                {errors.email && <p className="text-xs text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{errors.email[0]}</p>}
            </div>

            <div className="pt-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full">
                    Save Profile Changes
                </Button>
            </div>
        </form>
    );
};
