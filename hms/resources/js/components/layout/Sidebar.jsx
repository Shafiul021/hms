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
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e293b] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white">
                        H
                    </div>
                    <span className="font-semibold text-lg tracking-wide text-white">
                        HMS Monorepo
                    </span>
                </div>
                {/* Close btn (mobile) */}
                <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                    className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            {/* Role chip */}
            {roles[0] && (
                <div className="px-5 pt-4 pb-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-full border border-sky-400/20 capitalize">
                        {roles[0]}
                    </span>
                </div>
            )}

            {/* Nav Menu */}
            <nav aria-label="Main navigation" className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
                {navSections.map(section => {
                    const visibleItems = section.items.filter(item => item.visible);
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={section.title}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4 mb-1.5">
                                {section.title}
                            </p>
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.to === '/dashboard'}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                                                ${isActive
                                                    ? 'bg-slate-800 text-sky-400 border border-slate-700/50'
                                                    : 'text-gray-400 hover:bg-[#151f32] hover:text-white border border-transparent'}
                                            `}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon
                                                        aria-hidden="true"
                                                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-sky-400' : 'text-gray-500 group-hover:text-white'}`}
                                                    />
                                                    <span>{item.label}</span>
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
            <div className="p-4 border-t border-[#1e293b] bg-[#090f1d] text-xs text-center text-gray-500 flex-shrink-0">
                HMS Monorepo v1.0.0
            </div>
        </>
    );

    return (
        <>
            {/* ── Mobile hamburger button (visible only < md) ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#0d1527] border border-[#1e293b] text-gray-300 rounded-xl shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-sidebar"
            >
                <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
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
                    md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0d1527] text-gray-300
                    flex flex-col border-r border-[#1e293b]
                    transform transition-transform duration-300 ease-in-out
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <NavContent />
            </aside>

            {/* ── Desktop sidebar (always visible >= md) ── */}
            <aside className="hidden md:flex w-64 bg-[#0d1527] text-gray-300 h-screen sticky top-0 flex-col border-r border-[#1e293b]">
                <NavContent />
            </aside>
        </>
    );
};
