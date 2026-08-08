import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingApi } from '../../api/billing';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '@hms/ui';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
    Receipt, Download, CreditCard, AlertCircle,
    ArrowLeft, CheckCircle, Wallet, TrendingUp
} from 'lucide-react';

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, color }) => {
    const colors = {
        blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-400',   border: 'border-blue-100'   },
        green:  { bg: 'bg-emerald-50', text: 'text-emerald-700',icon: 'text-emerald-400',border: 'border-emerald-100' },
        orange: { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-400',  border: 'border-amber-100'  },
        red:    { bg: 'bg-rose-50',   text: 'text-rose-700',   icon: 'text-rose-400',   border: 'border-rose-100'   },
    };
    const c = colors[color] || colors.blue;
    return (
        <div className={`${c.bg} border ${c.border} rounded-2xl p-5 flex items-center gap-4`}>
            <div className={`p-2.5 rounded-xl bg-white shadow-sm ${c.icon}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-bold mt-0.5 ${c.text}`}>{value}</p>
            </div>
        </div>
    );
};

// ─── Payment Method Badge ─────────────────────────────────────────────────────
const MethodBadge = ({ method }) => {
    const map = {
        cash:   'bg-green-50 text-green-700 border-green-100',
        card:   'bg-blue-50 text-blue-700 border-blue-100',
        online: 'bg-violet-50 text-violet-700 border-violet-100',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${map[method] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
            {method}
        </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const BillDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});

    // Payment form state
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [referenceNo, setReferenceNo] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchBill = useCallback(async () => {
        setLoading(true);
        try {
            const data = await billingApi.getBill(id);
            setBill(data.data);
        } catch {
            showToast('Failed to load bill details.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBill();
    }, [fetchBill]);

    // ── PDF Download ──────────────────────────────────────────────────────────
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const blob = await billingApi.downloadPdf(id);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('Invoice downloaded successfully.');
        } catch {
            showToast('Failed to download PDF. Please try again.', 'error');
        } finally {
            setDownloading(false);
        }
    };

    // ── Record Payment ────────────────────────────────────────────────────────
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const newErrors = {};
        if (!amount || parseFloat(amount) <= 0) newErrors.amount = ['Please enter a valid amount.'];
        if (!method) newErrors.method = ['Please select a payment method.'];
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setSaving(true);
        try {
            const payload = {
                bill_id: parseInt(id),
                amount: parseFloat(amount),
                method,
                ...(referenceNo && { reference_no: referenceNo }),
            };
            await billingApi.recordPayment(payload);
            setPaymentOpen(false);
            setAmount('');
            setMethod('cash');
            setReferenceNo('');
            showToast('Payment recorded successfully!');
            await fetchBill(); // Refresh bill data
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                showToast(err.response?.data?.message || 'Failed to record payment.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const balance = bill ? parseFloat(bill.total_amount) - parseFloat(bill.paid_amount) : 0;

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <Skeleton rows={2} columns={1} />
                <div className="grid grid-cols-3 gap-4"><Skeleton rows={2} columns={1} /><Skeleton rows={2} columns={1} /><Skeleton rows={2} columns={1} /></div>
                <Skeleton rows={6} columns={4} />
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="p-6 max-w-5xl mx-auto text-center py-20">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-700">Bill not found</h2>
                <Button onClick={() => navigate(-1)} variant="secondary" className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Receipt className="w-6 h-6 text-indigo-500" /> Invoice #{bill.id}
                        </h1>
                        <p className="text-sm text-slate-400">Patient: <span className="font-semibold text-slate-600">{bill.patient?.name}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={bill.status} size="md" />
                    <Button
                        onClick={handleDownload}
                        variant="secondary"
                        loading={downloading}
                        className="inline-flex items-center gap-1.5"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </Button>
                    {bill.status !== 'paid' && (
                        <Button
                            onClick={() => setPaymentOpen(true)}
                            variant="primary"
                            className="inline-flex items-center gap-1.5"
                        >
                            <CreditCard className="w-4 h-4" /> Record Payment
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard label="Total Amount"   value={formatCurrency(bill.total_amount)} icon={Receipt}    color="blue"   />
                        <KpiCard label="Amount Paid"    value={formatCurrency(bill.paid_amount)}  icon={CheckCircle} color="green"  />
                        <KpiCard label="Balance Due"    value={formatCurrency(balance)}            icon={Wallet}      color={balance > 0 ? 'red' : 'green'} />
                    </div>

                    {/* Bill Items Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <h2 className="font-semibold text-slate-700">Itemized Charges</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/60 border-b border-slate-100">
                                    <tr>
                                        {['Description', 'Type', 'Qty', 'Unit Price', 'Total'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {bill.items && bill.items.length > 0 ? bill.items.map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-700">{item.description}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full capitalize font-medium">{item.item_type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{item.quantity ?? 1}</td>
                                            <td className="px-6 py-4 text-slate-500">{formatCurrency(item.unit_price)}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No items found on this bill.</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50/40 border-t border-slate-200">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-right font-bold text-slate-700">Total</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-base">{formatCurrency(bill.total_amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payment History */}
                    {bill.payments && bill.payments.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-slate-400" />
                                <h2 className="font-semibold text-slate-700">Payment History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/60 border-b border-slate-100">
                                        <tr>
                                            {['Date', 'Amount', 'Method', 'Reference'].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {bill.payments.map((pmt, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-600">{formatDate(pmt.paid_at)}</td>
                                                <td className="px-6 py-4 font-semibold text-emerald-700">{formatCurrency(pmt.amount)}</td>
                                                <td className="px-6 py-4"><MethodBadge method={pmt.method} /></td>
                                                <td className="px-6 py-4 text-slate-400 text-xs font-mono">{pmt.reference_no || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {bill.appointment_id && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
                            <h2 className="font-semibold text-slate-700 border-b pb-2 mb-4">Related Consultation</h2>
                            
                            <p className="text-sm text-slate-500">
                                This bill is linked to Appointment #{bill.appointment_id}. You can download the related medical documents below.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <a
                                    href={`/api/appointments/${bill.appointment_id}/download-prescription`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download Prescription
                                </a>
                                <a
                                    href={`/api/appointments/${bill.appointment_id}/download-medical-history`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download Medical History
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <Modal isOpen={paymentOpen} onClose={() => { setPaymentOpen(false); setErrors({}); }} title="Record Payment" size="sm">
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-1">
                        <div className="flex justify-between text-slate-500"><span>Total</span><span>{formatCurrency(bill.total_amount)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Paid</span><span className="text-emerald-600">{formatCurrency(bill.paid_amount)}</span></div>
                        <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200 mt-2">
                            <span>Balance Due</span><span className="text-rose-600">{formatCurrency(balance)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Amount (৳)</label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={balance}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder={`Max: ${formatCurrency(balance)}`}
                        />
                        {errors.amount && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.amount[0]}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700">Payment Method</label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="online">Online Transfer</option>
                        </select>
                        {errors.method && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.method[0]}</p>}
                    </div>

                    {(method === 'card' || method === 'online') && (
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Reference No.</label>
                            <Input
                                value={referenceNo}
                                onChange={e => setReferenceNo(e.target.value)}
                                placeholder="Transaction / cheque ID"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => { setPaymentOpen(false); setErrors({}); }} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" loading={saving} className="flex-1 inline-flex items-center gap-1.5 justify-center">
                            <CheckCircle className="w-4 h-4" /> Confirm Payment
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
