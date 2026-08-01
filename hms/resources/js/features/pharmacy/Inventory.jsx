import React, { useState, useEffect } from 'react';
import { pharmacyApi } from '../../api/pharmacy';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Search, Pill, AlertTriangle, Plus, Package, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Stock Badge ──────────────────────────────────────────────────────────────
const StockBadge = ({ quantity, threshold }) => {
    const isLow = quantity <= threshold;
    const isEmpty = quantity === 0;
    if (isEmpty) return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Out of Stock
        </span>
    );
    if (isLow) return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Low Stock
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            <CheckCircle className="w-3 h-3" /> In Stock
        </span>
    );
};

// ─── Restock Modal ────────────────────────────────────────────────────────────
const RestockModal = ({ medicine, isOpen, onClose, onSuccess }) => {
    const [batchNo, setBatchNo] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const reset = () => { setBatchNo(''); setQuantity(''); setExpiryDate(''); setErrors({}); };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!batchNo.trim()) newErrors.batch_no = ['Batch number is required.'];
        if (!quantity || parseInt(quantity) < 1) newErrors.quantity = ['Quantity must be at least 1.'];
        if (!expiryDate) newErrors.expiry_date = ['Expiry date is required.'];
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

        setSaving(true);
        try {
            await pharmacyApi.updateStock(medicine.id, {
                batch_no: batchNo,
                quantity: parseInt(quantity),
                expiry_date: expiryDate,
            });
            reset();
            onSuccess(`Stock updated for ${medicine.name}.`);
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                onSuccess('Failed to update stock.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    if (!medicine) return null;

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Restock: ${medicine.name}`} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-400">
                    Current stock: <span className="font-semibold text-slate-700">{medicine.total_stock ?? 0} {medicine.unit}(s)</span> ·
                    Low-stock threshold: <span className="font-semibold text-slate-700">{medicine.stock_threshold}</span>
                </p>

                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">Batch Number</label>
                    <Input value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="e.g. BTH-2025-001" />
                    {errors.batch_no && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.batch_no[0]}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">Quantity to Add</label>
                    <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 100" />
                    {errors.quantity && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.quantity[0]}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">Expiry Date</label>
                    <Input type="date" min={minDate} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                    {errors.expiry_date && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.expiry_date[0]}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
                    <Button type="submit" variant="primary" loading={saving} className="flex-1">Add Stock</Button>
                </div>
            </form>
        </Modal>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Inventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all | low | out
    const [restockTarget, setRestockTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const data = await pharmacyApi.getMedicines();
            setMedicines(data.data || []);
        } catch {
            showToast('Failed to load medicine inventory.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMedicines(); }, []);

    const handleRestockSuccess = async (message, type = 'success') => {
        setRestockTarget(null);
        showToast(message, type);
        await fetchMedicines();
    };

    const filtered = medicines.filter(med => {
        const q = searchTerm.toLowerCase();
        const matchSearch = med.name.toLowerCase().includes(q) ||
            (med.generic_name || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
        const stock = med.total_stock ?? 0;
        if (filter === 'low') return stock <= med.stock_threshold && stock > 0;
        if (filter === 'out') return stock === 0;
        return true;
    });

    // Summary stats
    const outOfStock = medicines.filter(m => (m.total_stock ?? 0) === 0).length;
    const lowStock   = medicines.filter(m => { const s = m.total_stock ?? 0; return s > 0 && s <= m.stock_threshold; }).length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Pill className="w-6 h-6 text-indigo-500" /> Medicine Inventory
                    </h1>
                    <p className="text-sm text-slate-500">Track stock levels, manage batches, and monitor low-stock alerts.</p>
                </div>
            </div>

            {/* Alert Banner for critical stock */}
            {(outOfStock > 0 || lowStock > 0) && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-sm text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span>
                        {outOfStock > 0 && <><strong>{outOfStock}</strong> medicine(s) are <strong>out of stock</strong>. </>}
                        {lowStock > 0 && <><strong>{lowStock}</strong> medicine(s) are <strong>running low</strong>.</>}
                        {' '}Restock these items to avoid dispensing failures.
                    </span>
                </div>
            )}

            {/* Filter + Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2 w-full sm:w-auto">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'low', label: `Low Stock (${lowStock})` },
                        { key: 'out', label: `Out of Stock (${outOfStock})` },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                                filter === key
                                    ? 'bg-indigo-500 text-white shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search by name or generic..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <Skeleton rows={8} columns={6} />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="No Medicines Found"
                    description={searchTerm ? 'Try adjusting your search terms.' : 'No medicines match this filter.'}
                    icon={Pill}
                />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/60 border-b border-slate-100">
                                <tr>
                                    {['Medicine', 'Generic Name', 'Unit', 'Price', 'Total Stock', 'Threshold', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(med => {
                                    const stock = med.total_stock ?? 0;
                                    const isLow = stock > 0 && stock <= med.stock_threshold;
                                    const isEmpty = stock === 0;
                                    return (
                                        <tr
                                            key={med.id}
                                            className={`hover:bg-slate-50/40 transition-colors ${isEmpty ? 'bg-rose-50/20' : isLow ? 'bg-amber-50/20' : ''}`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-800">{med.name}</div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">{med.generic_name || '—'}</td>
                                            <td className="px-5 py-4 text-slate-500 capitalize">{med.unit}</td>
                                            <td className="px-5 py-4 font-medium text-slate-700">{formatCurrency(med.price)}</td>
                                            <td className={`px-5 py-4 font-bold tabular-nums ${isEmpty ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                                                {stock}
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 tabular-nums">{med.stock_threshold}</td>
                                            <td className="px-5 py-4">
                                                <StockBadge quantity={stock} threshold={med.stock_threshold} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <Button
                                                    onClick={() => setRestockTarget(med)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="inline-flex items-center gap-1"
                                                >
                                                    <Package className="w-3.5 h-3.5" /> Restock
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of <span className="font-semibold text-slate-600">{medicines.length}</span> medicines
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            <RestockModal
                medicine={restockTarget}
                isOpen={!!restockTarget}
                onClose={() => setRestockTarget(null)}
                onSuccess={handleRestockSuccess}
            />
        </div>
    );
};
