import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { KpiCards } from './KpiCards';
import { AppointmentTrendChart } from './AppointmentTrendChart';
import { RevenueChart } from './RevenueChart';
import { BedOccupancyChart } from './BedOccupancyChart';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

// ── TanStack Query keys ────────────────────────────────────────────────────────
const ADMIN_KEYS = {
    stats:       ['admin', 'stats'],
    apptTrend:   ['admin', 'appointmentTrend'],
    revenueTrend:['admin', 'revenueTrend'],
    bedOccupancy:['admin', 'bedOccupancy'],
};

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ children }) => <>{children}</>;

/**
 * AdminDashboard — composes KPI cards + 3 charts from the admin API.
 * Designed for the admin and doctor roles (doctor gets a subset).
 */
export const AdminDashboard = () => {
    const { user } = useAuthStore();

    const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ADMIN_KEYS.stats,
        queryFn: adminApi.getStats,
        staleTime: 60 * 1000,
    });

    const { data: apptTrendData, isLoading: apptLoading } = useQuery({
        queryKey: ADMIN_KEYS.apptTrend,
        queryFn: adminApi.getAppointmentTrend,
        staleTime: 5 * 60 * 1000,
    });

    const { data: revTrendData, isLoading: revLoading } = useQuery({
        queryKey: ADMIN_KEYS.revenueTrend,
        queryFn: adminApi.getRevenueTrend,
        staleTime: 5 * 60 * 1000,
    });

    const { data: bedData, isLoading: bedLoading } = useQuery({
        queryKey: ADMIN_KEYS.bedOccupancy,
        queryFn: adminApi.getBedOccupancy,
        staleTime: 60 * 1000,
    });

    const stats      = statsData ?? null;
    const apptTrend  = apptTrendData?.data ?? null;
    const revTrend   = revTrendData?.data  ?? null;
    const bedOcc     = bedData?.data       ?? null;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-indigo-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Live overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={() => refetchStats()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-sm font-semibold rounded-xl transition-all shadow-sm"
                    title="Refresh stats"
                >
                    <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            <KpiCards stats={stats} loading={statsLoading} />

            {/* ── Charts row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AppointmentTrendChart trend={apptTrend} loading={apptLoading} />
                <RevenueChart trend={revTrend} loading={revLoading} />
            </div>

            {/* ── Bed Occupancy (full width on small, half on large) ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BedOccupancyChart occupancy={bedOcc} loading={bedLoading} />

                {/* Quick stats summary card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-slate-800 text-sm">Bed Summary</h3>
                    {bedLoading ? (
                        <div className="space-y-3">
                            {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-xl" />)}
                        </div>
                    ) : (
                        (bedOcc ?? []).map(ward => (
                            <div key={ward.ward} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-semibold text-slate-700">{ward.ward}</p>
                                    <p className="text-xs text-slate-400 capitalize">{ward.type} ward</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-medium">
                                    <span className="text-emerald-600">{ward.available} free</span>
                                    <span className="text-indigo-600">{ward.occupied} occ.</span>
                                    <span className="text-amber-600">{ward.maintenance} maint.</span>
                                </div>
                            </div>
                        ))
                    )}
                    {!bedLoading && (!bedOcc || bedOcc.length === 0) && (
                        <p className="text-sm text-slate-400">No ward data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
