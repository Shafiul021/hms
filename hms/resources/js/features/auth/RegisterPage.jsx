import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Stethoscope, User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
});

export const RegisterPage = () => {
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', password_confirmation: '' }
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError(null);
        try {
            // Patient registration: explicitly set role to patient
            const res = await authApi.register({
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                role: 'patient',
            });
            // Automatically log in on successful registration
            setAuth(res.user, res.token);
            navigate('/dashboard');
        } catch (err) {
            setServerError(err.response?.data?.message || 'Registration failed. Email might already exist.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#090f1d] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-[#0d1527] border border-[#1e293b] p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Register a new patient account
                    </p>
                </div>

                {serverError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>{serverError}</div>
                    </div>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    <User className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    {...register('name')}
                                    className={`block w-full pl-10 pr-4 py-3 bg-[#151f32] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                                        errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-[#1e293b] focus:border-sky-500'
                                    }`}
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.name.message}</p>
                            )}
                        </div>

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
                                    placeholder="johndoe@example.com"
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

                        {/* Confirm Password Input */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type="password"
                                    {...register('password_confirmation')}
                                    className={`block w-full pl-10 pr-4 py-3 bg-[#151f32] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                                        errors.password_confirmation ? 'border-red-500/50 focus:ring-red-500' : 'border-[#1e293b] focus:border-sky-500'
                                    }`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password_confirmation.message}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-4"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <span>Sign Up</span>
                        )}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-sky-400 hover:underline font-semibold transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};
