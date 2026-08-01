import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
    Users,
    UserPlus,
    ShieldAlert,
    Shield,
    Pencil,
    Trash2,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    UserCog,
    Eye,
    EyeOff,
} from 'lucide-react';

// Role config
const ROLES = [
    { value: 'admin',        label: 'Admin',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'doctor',       label: 'Doctor',       color: 'bg-sky-100 text-sky-700 border-sky-200' },
    { value: 'nurse',        label: 'Nurse',        color: 'bg-teal-100 text-teal-700 border-teal-200' },
    { value: 'receptionist', label: 'Receptionist', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const getRoleStyle = (role) =>
    ROLES.find(r => r.value === role)?.color ?? 'bg-slate-100 text-slate-600 border-slate-200';

const getRoleLabel = (role) =>
    ROLES.find(r => r.value === role)?.label ?? role;

const FieldError = ({ errors, field }) =>
    errors?.[field] ? (
        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
            <ShieldAlert className="w-3 h-3 flex-shrink-0" />
            {errors[field][0]}
        </p>
    ) : null;

const DoctorFields = ({ data, onChange, errors }) => (
    <div className="space-y-3 pt-3 border-t border-slate-100">
        <p className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" /> Doctor Profile
        </p>
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Specialization *</label>
                <Input
                    value={data.specialization}
                    onChange={e => onChange('specialization', e.target.value)}
                    placeholder="e.g. Cardiology"
                />
                <FieldError errors={errors} field="specialization" />
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Qualification *</label>
                <Input
                    value={data.qualification}
                    onChange={e => onChange('qualification', e.target.value)}
                    placeholder="e.g. MBBS, MD"
                />
                <FieldError errors={errors} field="qualification" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Consultation Fee (BDT) *</label>
                <Input
                    type="number"
                    min="0"
                    value={data.fee}
                    onChange={e => onChange('fee', e.target.value)}
                    placeholder="e.g. 500"
                />
                <FieldError errors={errors} field="fee" />
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Phone</label>
                <Input
                    value={data.phone}
                    onChange={e => onChange('phone', e.target.value)}
                    placeholder="01XXXXXXXXX"
                />
            </div>
        </div>
    </div>
);

const PasswordInput = ({ value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-10"
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
};

const BLANK_FORM = {
    name: '', email: '', password: '', role: 'receptionist',
    specialization: '', qualification: '', fee: '', phone: '',
};

export const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [toasts, setToasts] = useState([]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [form, setForm] = useState(BLANK_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const fetchUsers = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(p);
            setUsers(data.data || []);
            setMeta(data.meta || null);
        } catch {
            showToast('Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(page); }, [page, fetchUsers]);

    const displayedUsers = users.filter(u => {
        const matchSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || (u.roles?.[0] === roleFilter);
        return matchSearch && matchRole;
    });

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const openCreate = () => {
        setForm(BLANK_FORM);
        setFormErrors({});
        setIsCreateOpen(true);
    };

    const openEdit = (user) => {
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.roles?.[0] ?? 'receptionist',
            specialization: user.doctor?.specialization ?? '',
            qualification: user.doctor?.qualification ?? '',
            fee: user.doctor?.fee ?? '',
            phone: user.doctor?.phone ?? '',
        });
        setFormErrors({});
        setEditTarget(user);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormErrors({});
        const errs = {};
        if (!form.name.trim()) errs.name = ['Name is required.'];
        if (!form.email.trim()) errs.email = ['Email is required.'];
        if (!form.password || form.password.length < 8) errs.password = ['Password must be at least 8 characters.'];
        if (form.role === 'doctor') {
            if (!form.specialization.trim()) errs.specialization = ['Specialization is required.'];
            if (!form.qualification.trim()) errs.qualification = ['Qualification is required.'];
            if (!form.fee || isNaN(form.fee)) errs.fee = ['A valid fee is required.'];
        }
        if (Object.keys(errs).length) { setFormErrors(errs); return; }

        setSaving(true);
        try {
            if (form.role === 'doctor') {
                await doctorsApi.createDoctor({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    specialization: form.specialization,
                    qualification: form.qualification,
                    fee: parseFloat(form.fee),
                    phone: form.phone || null,
                });
            } else {
                await adminApi.createUser({ name: form.name, email: form.email, password: form.password, role: form.role });
            }
            showToast('User account created successfully!');
            setIsCreateOpen(false);
            fetchUsers(page);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(err.response.data.errors || {});
            } else {
                showToast(err.response?.data?.message || 'Failed to create user.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        if (!editTarget) return;
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;

        setSaving(true);
        try {
            await adminApi.updateUser(editTarget.id, payload);
            if (form.role === 'doctor' && editTarget.doctor_id) {
                await doctorsApi.updateDoctor(editTarget.doctor_id, {
                    specialization: form.specialization,
                    qualification: form.qualification,
                    fee: parseFloat(form.fee) || 0,
                    phone: form.phone || null,
                });
            }
            showToast('User updated successfully!');
            setEditTarget(null);
            fetchUsers(page);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(err.response.data.errors || {});
            } else {
                showToast(err.response?.data?.message || 'Failed to update user.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await adminApi.deleteUser(deleteTarget.id);
            showToast(`${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
            fetchUsers(page);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const UserForm = ({ onSubmit, isEdit = false }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Sarah Connor" />
                <FieldError errors={formErrors} field="name" />
            </div>
            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="e.g. sarah@hms.com" />
                <FieldError errors={formErrors} field="email" />
            </div>
            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">
                    {isEdit ? 'New Password' : 'Password'}
                    {isEdit && <span className="text-xs font-normal text-slate-400 ml-1">(leave blank to keep current)</span>}
                </label>
                <PasswordInput
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
                />
                <FieldError errors={formErrors} field="password" />
            </div>
            <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">System Role</label>
                <select
                    value={form.role}
                    onChange={e => setField('role', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
                >
                    {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
            </div>
            {form.role === 'doctor' && (
                <DoctorFields data={form} onChange={setField} errors={formErrors} />
            )}
            {form.role !== 'doctor' && (
                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                    <span>
                        The <strong className="text-slate-700 capitalize">{getRoleLabel(form.role)}</strong> role
                        grants access to relevant modules. No additional profile setup required.
                    </span>
                </div>
            )}
            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => isEdit ? setEditTarget(null) : setIsCreateOpen(false)}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving} className="flex-1">
                    {isEdit ? 'Save Changes' : 'Create Account'}
                </Button>
            </div>
        </form>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map(t => (
                    <Toast
                        key={t.id}
                        message={t.message}
                        type={t.type}
                        onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-indigo-500" /> User Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Create, edit, and manage all hospital staff accounts and their system roles.
                    </p>
                </div>
                <Button onClick={openCreate} variant="primary" className="flex items-center gap-2 shrink-0">
                    <UserPlus className="w-4 h-4" /> Create Staff Account
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-700"
                >
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <Skeleton rows={8} columns={5} />
                </div>
            ) : displayedUsers.length === 0 ? (
                <EmptyState
                    title="No Users Found"
                    description={
                        search || roleFilter
                            ? 'Try adjusting your search or filter.'
                            : "Click 'Create Staff Account' to register your first staff user."
                    }
                    icon={Users}
                />
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/60 border-b border-slate-100">
                                    <tr>
                                        {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {displayedUsers.map(u => {
                                        const role = u.roles?.[0] ?? 'guest';
                                        const initials = u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                                        const hue = (u.id * 47) % 360;
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                            style={{ background: `hsl(${hue}, 55%, 50%)` }}
                                                            aria-hidden="true"
                                                        >
                                                            {initials}
                                                        </div>
                                                        <span className="font-semibold text-slate-700">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-slate-500">{u.email}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getRoleStyle(role)}`}>
                                                        <Shield className="w-3 h-3" />
                                                        {getRoleLabel(role)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-slate-400 text-xs">
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            id={`edit-user-${u.id}`}
                                                            onClick={() => openEdit(u)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            aria-label={`Edit ${u.name}`}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            id={`delete-user-${u.id}`}
                                                            onClick={() => setDeleteTarget(u)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            aria-label={`Delete ${u.name}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                            <span className="text-xs text-slate-500">
                                Page <span className="font-semibold text-slate-700">{meta.current_page}</span> of{' '}
                                <span className="font-semibold text-slate-700">{meta.last_page}</span>
                                {meta.total && <span className="ml-2 text-slate-400">({meta.total} total)</span>}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))}>
                                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                                </Button>
                                <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage(p => Math.min(p + 1, meta.last_page))}>
                                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Staff Account"
                size={form.role === 'doctor' ? 'lg' : 'md'}
                id="create-user-modal"
            >
                <UserForm onSubmit={handleCreate} />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                title={`Edit: ${editTarget?.name ?? ''}`}
                size={form.role === 'doctor' ? 'lg' : 'md'}
                id="edit-user-modal"
            >
                <UserForm onSubmit={handleEdit} isEdit />
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete User Account"
                message={`Are you sure you want to remove ${deleteTarget?.name ?? 'this user'}? This action soft-deletes the account.`}
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isDanger
                isLoading={deleting}
            />
        </div>
    );
};
