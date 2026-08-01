import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '../../api/billing';
import { StatusBadge } from '@hms/ui';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Receipt, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_FILTERS = [
    { key: '',        label: 'All'     },
    { key: 'unpaid',  label: 'Unpaid'  },
    { key: 'partial', label: 'Partial' },
    { key: 'paid',    label: 'Paid'    },
    { key: 'waived',  label: 'Waived'  },
];

export const BillList = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState(null);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 15 };
            if (status) params.status = status;
            if (search.trim()) params.search = search.trim();
            const data = await billingApi.getBills(params);
            setBills(data.data || []);
            setMeta(data.meta || null);
        } catch {
            setToast({ message: 'Failed to load bills.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBills(); }, [status, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchBills();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-indigo-500" /> Billing
                </h1>
                <p className="text-sm text-slate-500">View and manage all patient invoices and payments.</p>
            </div>

            {/* Filter + Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => { setStatus(key); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                                status === key
                                    ? 'bg-indigo-500 text-white shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search by patient name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </form>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <Skeleton rows={8} columns={6} />
                </div>
            ) : bills.length === 0 ? (
                <EmptyState title="No Bills Found" description="No invoices match your current filter." icon={Receipt} />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/60 border-b border-slate-100">
                                <tr>
                                    {['Invoice #', 'Patient', 'Total', 'Paid', 'Balance', 'Status', 'Issued', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {bills.map(bill => {
                                    const balance = parseFloat(bill.total_amount) - parseFloat(bill.paid_amount);
                                    return (
                                        <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-500">#{bill.id}</td>
                                            <td className="px-5 py-4 font-medium text-slate-800">{bill.patient?.name ?? '—'}</td>
                                            <td className="px-5 py-4 text-slate-600">{formatCurrency(bill.total_amount)}</td>
                                            <td className="px-5 py-4 text-emerald-600 font-medium">{formatCurrency(bill.paid_amount)}</td>
                                            <td className={`px-5 py-4 font-semibold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(balance)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={bill.status} size="sm" />
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(bill.issued_at)}</td>
                                            <td className="px-5 py-4">
                                                <Button
                                                    onClick={() => navigate(`/billing/${bill.id}`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Page <span className="font-semibold text-slate-700">{meta.current_page}</span> of <span className="font-semibold text-slate-700">{meta.last_page}</span></span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={meta.current_page <= 1}
                                    className="inline-flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                    disabled={meta.current_page >= meta.last_page}
                                    className="inline-flex items-center gap-1"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
