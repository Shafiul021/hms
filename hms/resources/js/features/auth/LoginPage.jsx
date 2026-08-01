import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { Stethoscope, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginPage = () => {
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError(null);
        try {
            const res = await authApi.login(data.email, data.password);
            // Save to Zustand persist storage
            setAuth(res.user, res.token);
            navigate('/dashboard');
        } catch (err) {
            setServerError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#090f1d] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Visual background decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-[#0d1527] border border-[#1e293b] p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Sign in to manage patient care
                    </p>
                </div>

                {serverError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>{serverError}</div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className={`block w-full pl-10 pr-4 py-3 bg-[#151f32] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                                        errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-[#1e293b] focus:border-sky-500'
                                    }`}
                                    placeholder="doctor@hms.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type="password"
                                    {...register('password')}
                                    className={`block w-full pl-10 pr-4 py-3 bg-[#151f32] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                                        errors.password ? 'border-red-500/50 focus:ring-red-500' : 'border-[#1e293b] focus:border-sky-500'
                                    }`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Signing you in...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-sky-400 hover:underline font-semibold transition-colors">
                        Create Patient Account
                    </Link>
                </div>
            </div>
        </div>
    );
};
