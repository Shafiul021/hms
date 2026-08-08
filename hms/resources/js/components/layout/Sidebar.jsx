import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    LayoutDashboard,
    CalendarRange,
    Users,
    Stethoscope,
    FileText,
    FlaskConical,
    Bed,
    Pill,
    Receipt,
    Settings,
    User,
    History,
    Menu,
    X,
    UserCog,
    Activity,
} from 'lucide-react';

export const Sidebar = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Normalise Spatie role objects to plain strings
    const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => r.name || r)
        : [user?.role].filter(Boolean);

    const hasRole = (allowed) => allowed.some(r => roles.includes(r));

    // ── Navigation items grouped by section ───────────────────────────────────
    const navSections = [
        {
            title: 'General',
            items: [
                {
                    to: '/dashboard',
                    label: 'Dashboard',
                    icon: LayoutDashboard,
                    visible: true,
                },
                {
                    to: '/profile',
                    label: 'My Profile',
                    icon: User,
                    visible: true,
                },
            ],
        },
        {
            title: 'Clinical',
            items: [
                {
                    to: '/appointments',
                    label: 'Appointments',
                    icon: CalendarRange,
                    visible: hasRole(['admin', 'doctor', 'receptionist', 'nurse', 'patient']),
                },
                {
                    to: '/patients',
                    label: 'Patients',
                    icon: Users,
                    visible: hasRole(['admin', 'doctor', 'receptionist', 'nurse']),
                },
                {
                    to: '/doctors',
                    label: 'Doctors',
                    icon: Stethoscope,
                    visible: hasRole(['admin', 'doctor', 'receptionist', 'patient']),
                },
                {
                    to: '/diagnoses',
                    label: 'OPD Diagnoses',
                    icon: FileText,
                    visible: hasRole(['admin', 'doctor']),
                },
                {
                    to: '/lab',
                    label: 'Lab Results',
                    icon: FlaskConical,
                    visible: hasRole(['admin', 'doctor', 'nurse', 'patient']),
                },
                {
                    to: '/ipd',
                    label: 'IPD Ward Map',
                    icon: Bed,
                    visible: hasRole(['admin', 'doctor', 'nurse']),
                },
            ],
        },
        {
            title: 'Operations',
            items: [
                {
                    to: '/pharmacy',
                    label: 'Pharmacy Stock',
                    icon: Pill,
                    visible: hasRole(['admin', 'receptionist', 'nurse']),
                },
                {
                    to: '/pharmacy/dispense',
                    label: 'Dispense Rx',
                    icon: Activity,
                    visible: hasRole(['admin', 'receptionist', 'nurse']),
                },
                {
                    to: '/billing',
                    label: 'Billing',
                    icon: Receipt,
                    visible: hasRole(['admin', 'receptionist', 'patient']),
                },
            ],
        },
        {
            title: 'Administration',
            items: [
                {
                    to: '/admin/users',
                    label: 'User Management',
                    icon: UserCog,
                    visible: hasRole(['admin']),
                },
                {
                    to: '/admin/activity-log',
                    label: 'Activity Log',
                    icon: History,
                    visible: hasRole(['admin']),
                },
                {
                    to: '/settings',
                    label: 'System Settings',
                    icon: Settings,
                    visible: hasRole(['admin']),
                },
            ],
        },
    ];

    const NavContent = () => (
        <>
            {/* Header */}
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-800/80 flex-shrink-0 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 border border-white/10">
                        <span className="text-lg">H</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base tracking-tight text-white leading-tight">
                            HMS System
                        </span>
                        <span className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase leading-tight">
                            Medical Portal
                        </span>
                    </div>
                </div>
                {/* Close btn (mobile) */}
                <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                    className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            {/* Role chip */}
            {roles[0] && (
                <div className="px-6 pt-5 pb-2">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 capitalize shadow-inner">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                        {roles[0]}
                    </div>
                </div>
            )}

            {/* Nav Menu */}
            <nav aria-label="Main navigation" className="flex-1 px-4 py-3 space-y-6 overflow-y-auto custom-scrollbar">
                {navSections.map(section => {
                    const visibleItems = section.items.filter(item => item.visible);
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={section.title} className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-4">
                                {section.title}
                            </p>
                            <div className="space-y-1">
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.to === '/dashboard'}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                                                ${isActive
                                                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                                                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent'}
                                            `}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isActive && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                                    )}
                                                    <Icon
                                                        aria-hidden="true"
                                                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`}
                                                    />
                                                    <span className="relative z-10 tracking-wide">{item.label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800/80 bg-slate-950/50 flex flex-col gap-1 flex-shrink-0">
                <div className="flex items-center gap-2 text-slate-400">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium">System Online</span>
                </div>
                <span className="text-[10px] text-slate-500 tracking-wider">HMS Monorepo v1.0.0</span>
            </div>
        </>
    );

    return (
        <>
            {/* ── Mobile hamburger button (visible only < md) ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-sidebar"
            >
                <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/80 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Mobile drawer (slides in) ── */}
            <aside
                id="mobile-sidebar"
                aria-label="Navigation menu"
                aria-hidden={!mobileOpen}
                className={`
                    md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300
                    flex flex-col border-r border-slate-800 shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <NavContent />
            </aside>

            {/* ── Desktop sidebar (always visible >= md) ── */}
            <aside className="hidden md:flex w-72 bg-slate-900 text-slate-300 h-screen sticky top-0 flex-col border-r border-slate-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-40">
                <NavContent />
            </aside>
        </>
    );
};
