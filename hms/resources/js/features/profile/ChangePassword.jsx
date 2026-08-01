import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { KeyRound, ShieldAlert } from 'lucide-react';

export const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        const valErrors = {};
        if (!currentPassword) valErrors.current_password = ['Current password is required.'];
        if (!password || password.length < 8) valErrors.password = ['Password must be at least 8 characters.'];
        if (password !== passwordConfirmation) valErrors.password_confirmation = ['Password confirmation does not match.'];
        if (Object.keys(valErrors).length) {
            setErrors(valErrors);
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword({
                current_password: currentPassword,
                password: password,
                password_confirmation: passwordConfirmation,
            });
            showToast('Password changed successfully!');
            // Reset form
            setCurrentPassword('');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                showToast(err.response?.data?.message || 'Failed to change password.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Current Password</label>
                <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                    />
                </div>
                {errors.current_password && <p className="text-xs text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{errors.current_password[0]}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                    />
                </div>
                {errors.password && <p className="text-xs text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{errors.password[0]}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Confirm New Password</label>
                <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        type="password"
                        value={passwordConfirmation}
                        onChange={e => setPasswordConfirmation(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                    />
                </div>
                {errors.password_confirmation && <p className="text-xs text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{errors.password_confirmation[0]}</p>}
            </div>

            <div className="pt-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full">
                    Change Password
                </Button>
            </div>
        </form>
    );
};
