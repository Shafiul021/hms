import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
    Stethoscope,
    Plus,
    Search,
    X,
    DollarSign,
    GraduationCap,
    Pencil,
    CalendarRange,
    Phone,
    MapPin,
    LayoutGrid,
    List,
    ArrowUpDown,
} from 'lucide-react';
import { Table } from '../../components/ui/Table';

// ── Skeleton card ──────────────────────────────────────────────────────────────
const DoctorCardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
        <div className="h-8 w-full bg-gray-100 rounded-xl" />
    </div>
);

// ── Single doctor card ─────────────────────────────────────────────────────────
const DoctorCard = ({ doctor, canManage, onEdit }) => {
    const navigate = useNavigate();

    // Initials avatar
    const initials = doctor.name
        ? doctor.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : 'DR';

    const hue = (doctor.id * 37) % 360;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-5 flex flex-col gap-4">
            {/* Avatar + name */}
            <div className="flex items-start gap-4">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: `hsl(${hue}, 60%, 50%)` }}
                    aria-hidden="true"
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{doctor.name}</h3>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        <Stethoscope className="w-3 h-3" />
                        {doctor.specialization || 'General'}
                    </span>
                </div>
                {canManage && (
                    <button
                        onClick={() => onEdit(doctor.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit doctor"
                        aria-label={`Edit ${doctor.name}`}
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{doctor.qualification || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                        Consultation fee:{' '}
                        <span className="font-semibold text-gray-700">
                            {doctor.fee != null ? `৳${Number(doctor.fee).toLocaleString()}` : '—'}
                        </span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{doctor.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{doctor.address || '—'}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-1 border-t border-gray-100 flex gap-2">
                <button
                    onClick={() => navigate('/appointments/book', { state: { doctor } })}
                    className="flex-1 text-xs font-medium py-1.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors flex items-center justify-center gap-1"
                >
                    <CalendarRange className="w-3.5 h-3.5" />
                    Book Appointment
                </button>
            </div>
        </div>
    );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export const DoctorList = () => {
    const navigate  = useNavigate();
    const { user }  = useAuthStore();

    const roles = Array.isArray(user?.roles)
        ? user.roles.map((r) => r.name || r)
        : [user?.role].filter(Boolean);

    const canManage = roles.includes('admin');

    const [doctors, setDoctors]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [search, setSearch]     = useState('');
    const [debounced, setDebounced] = useState('');

    // Sorting & View mode states
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [viewMode, setViewMode] = useState('card'); // default is card view for doctors

    // Debounce
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (debounced.trim()) params.search = debounced.trim();
            const data = await doctorsApi.getDoctors(params);
            setDoctors(data.data || data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load doctors.');
        } finally {
            setLoading(false);
        }
    }, [debounced]);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

    const filtered = debounced
        ? doctors.filter(
              (d) =>
                  d.name?.toLowerCase().includes(debounced.toLowerCase()) ||
                  d.specialization?.toLowerCase().includes(debounced.toLowerCase())
          )
        : doctors;

    // Sort doctors locally
    const sortedDoctors = [...filtered].sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
            comparison = (a.name || '').localeCompare(b.name || '');
        } else if (sortField === 'specialization') {
            comparison = (a.specialization || '').localeCompare(b.specialization || '');
        } else if (sortField === 'fee') {
            comparison = (Number(a.fee) || 0) - (Number(b.fee) || 0);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const columns = [
        { key: 'name',           header: 'Name' },
        { key: 'specialization', header: 'Specialization' },
        { key: 'qualification',  header: 'Qualification' },
        { key: 'fee',            header: 'Consultation Fee' },
        { key: 'phone',          header: 'Phone' },
        { key: 'address',        header: 'Address' },
        { key: 'actions',        header: '', className: 'text-right' },
    ];

    const rows = sortedDoctors.map((doc) => ({
        name: (
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: `hsl(${(doc.id * 37) % 360}, 60%, 50%)` }}
                >
                    {(doc.name ? doc.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'DR')}
                </div>
                <span className="font-semibold text-gray-900 text-sm">{doc.name}</span>
            </div>
        ),
        specialization: <span className="text-sm text-gray-700">{doc.specialization || 'General'}</span>,
        qualification: <span className="text-sm text-gray-500">{doc.qualification || '—'}</span>,
        fee: <span className="text-sm font-medium text-gray-700">{doc.fee != null ? `৳${Number(doc.fee).toLocaleString()}` : '—'}</span>,
        phone: <span className="text-sm text-gray-650">{doc.phone ?? '—'}</span>,
        address: <span className="text-sm text-gray-500">{doc.address ?? '—'}</span>,
        actions: (
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => navigate('/appointments/book', { state: { doctor: doc } })}
                    className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors flex items-center gap-1"
                >
                    <CalendarRange className="w-3.5 h-3.5" /> Book
                </button>
                {canManage && (
                    <button
                        onClick={() => navigate(`/doctors/${doc.id}/edit`)}
                        className="p-1 text-slate-400 hover:text-indigo-700 rounded-lg hover:bg-slate-100 transition-all"
                        title="Edit Doctor"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        )
    }));

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-indigo-500" />
                        Doctors
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Browse active medical consultants and their schedules.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={() => navigate('/doctors/new')}
                        icon={<Plus className="w-4 h-4" />}
                        id="add-doctor-btn"
                    >
                        Add Doctor
                    </Button>
                )}
            </div>

            {/* Search, Sorting, and View Toggle bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        id="doctor-search"
                        type="text"
                        placeholder="Search by name or specialization…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Sort */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="font-semibold uppercase whitespace-nowrap">Sort:</span>
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none"
                        >
                            <option value="name">Name</option>
                            <option value="specialization">Specialization</option>
                            <option value="fee">Fee</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-1 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 flex items-center justify-center"
                            title="Toggle Order"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span className="ml-1 font-mono uppercase">{sortOrder}</span>
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${
                                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title="List View"
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-md transition-all ${
                                viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title="Card View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <DoctorCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 text-sm bg-white rounded-2xl border border-gray-200">
                    {error}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <EmptyState
                        icon={<Stethoscope className="w-10 h-10" />}
                        title="No doctors found"
                        description={
                            search
                                ? 'Try a different name or specialization.'
                                : 'No doctors have been added to the system yet.'
                        }
                        action={
                            canManage ? (
                                <Button size="sm" onClick={() => navigate('/doctors/new')}>
                                    Add First Doctor
                                </Button>
                            ) : null
                        }
                    />
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <Table columns={columns} rows={rows} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedDoctors.map((doctor) => (
                        <DoctorCard
                            key={doctor.id}
                            doctor={doctor}
                            canManage={canManage}
                            onEdit={(id) => navigate(`/doctors/${id}/edit`)}
                        />
                    ))}
                </div>
            )}

            {/* Results count */}
            {!loading && !error && filtered.length > 0 && (
                <p className="text-xs text-gray-400 text-right">
                    Showing {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};
