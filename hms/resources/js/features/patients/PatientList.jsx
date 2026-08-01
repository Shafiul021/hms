import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/patients';
import { PatientCodeChip } from '@hms/ui';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import { Users, Plus, Search, X, Pencil, Trash2, LayoutGrid, List, ArrowUpDown } from 'lucide-react';

const columns = [
    { key: 'code',    header: 'Patient Code' },
    { key: 'name',    header: 'Name' },
    { key: 'age',     header: 'Age',   className: 'text-center w-16' },
    { key: 'blood',   header: 'Blood', className: 'text-center w-20' },
    { key: 'phone',   header: 'Phone' },
    { key: 'joined',  header: 'Registered' },
    { key: 'actions', header: '', className: 'text-right' },
];

export const PatientList = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => r.name || r)
        : [user?.role].filter(Boolean);
    const isAdmin = roles.includes('admin');
    const isReceptionist = roles.includes('receptionist');
    const canCreateOrEdit = isAdmin || isReceptionist;

    const [patients, setPatients]   = useState([]);
    const [meta, setMeta]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [search, setSearch]       = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage]           = useState(1);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);

    // Sorting & View mode states
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [viewMode, setViewMode] = useState('list');

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, per_page: 15 };
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
            const data = await patientsApi.getPatients(params);
            setPatients(data.data || data);
            setMeta(data.meta || null);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load patients.');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchPatients(); }, [fetchPatients]);
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await patientsApi.deletePatient(deleteTarget.id);
            fetchPatients();
        } catch {
            // silently re-fetch; toast can be added later
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    // Sort patients locally
    const sortedPatients = [...patients].sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
            comparison = (a.name || '').localeCompare(b.name || '');
        } else if (sortField === 'code') {
            comparison = (a.patient_code || '').localeCompare(b.patient_code || '');
        } else if (sortField === 'age') {
            comparison = (a.age || 0) - (b.age || 0);
        } else if (sortField === 'joined') {
            comparison = new Date(a.created_at) - new Date(b.created_at);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const rows = sortedPatients.map((p) => ({
        code: <PatientCodeChip code={p.patient_code} />,
        name: (
            <div>
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.email}</p>
            </div>
        ),
        age:   <span className="text-sm text-center block">{p.age ?? '—'}</span>,
        blood: (
            <span className={`text-xs font-bold text-center block ${p.blood_type ? 'text-red-600' : 'text-gray-400'}`}>
                {p.blood_type ?? '—'}
            </span>
        ),
        phone:  <span className="text-sm text-gray-600">{p.phone ?? '—'}</span>,
        joined: <span className="text-sm text-gray-500">{formatDate(p.created_at, false)}</span>,
        actions: (
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                    View →
                </button>
                {canCreateOrEdit && (
                    <button
                        onClick={() => navigate(`/patients/${p.id}/edit`)}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors flex items-center gap-1"
                    >
                        <Pencil className="w-3 h-3" /> Edit
                    </button>
                )}
                {isAdmin && (
                    <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                )}
            </div>
        ),
    }));

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage all registered patients.</p>
                </div>
                {canCreateOrEdit && (
                    <Button onClick={() => navigate('/patients/new')} icon={<Plus className="w-4 h-4" />}>
                        New Patient
                    </Button>
                )}
            </div>

            {/* Search, Sorting, and View Toggle bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, code or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                            <option value="code">Code</option>
                            <option value="age">Age</option>
                            <option value="joined">Registered Date</option>
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

            {/* Table or Card layout */}
            <div className={viewMode === 'list' ? "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" : ""}>
                {loading ? (
                    <Skeleton rows={8} columns={columns.length} />
                ) : error ? (
                    <div className="p-8 text-center text-red-500 text-sm bg-white rounded-2xl border border-gray-200">{error}</div>
                ) : patients.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <EmptyState
                            icon={<Users className="w-10 h-10" />}
                            title="No patients found"
                            description={search ? 'Try a different search term.' : 'No patients have been registered yet.'}
                            action={canCreateOrEdit ? <Button size="sm" onClick={() => navigate('/patients/new')}>Register First Patient</Button> : null}
                        />
                    </div>
                ) : viewMode === 'list' ? (
                    <Table columns={columns} rows={rows} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sortedPatients.map((p) => (
                            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{p.email}</p>
                                        </div>
                                        <PatientCodeChip code={p.patient_code} />
                                    </div>
                                    <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-50 pt-3">
                                        <p>
                                            <span className="font-semibold text-gray-400 uppercase mr-1">Age:</span>
                                            <span className="text-gray-700 font-medium">{p.age ?? '—'}</span>
                                        </p>
                                        <p>
                                            <span className="font-semibold text-gray-400 uppercase mr-1">Blood Type:</span>
                                            <span className={p.blood_type ? "text-red-650 font-bold" : "text-gray-700"}>{p.blood_type ?? '—'}</span>
                                        </p>
                                        <p>
                                            <span className="font-semibold text-gray-400 uppercase mr-1">Phone:</span>
                                            <span className="text-gray-700">{p.phone ?? '—'}</span>
                                        </p>
                                        <p>
                                            <span className="font-semibold text-gray-400 uppercase mr-1">Registered:</span>
                                            <span className="text-gray-700">{formatDate(p.created_at, false)}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-2">
                                    <button
                                        onClick={() => navigate(`/patients/${p.id}`)}
                                        className="text-xs text-indigo-600 hover:text-indigo-850 font-semibold transition-colors"
                                    >
                                        View Detail →
                                    </button>
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/patients/${p.id}/edit`)}
                                                className="text-xs text-amber-600 hover:text-amber-800 font-semibold transition-colors flex items-center gap-1"
                                            >
                                                <Pencil className="w-3 h-3" /> Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(p)}
                                                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {meta && meta.last_page > 1 && (
                <Pagination currentPage={meta.current_page} totalPages={meta.last_page} onPageChange={setPage} />
            )}

            {/* Delete confirmation dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete Patient"
                message={`Are you sure you want to permanently delete ${deleteTarget?.name ?? 'this patient'}? This action cannot be undone.`}
                confirmText="Yes, Delete"
                isDanger
                isLoading={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </div>
    );
};
