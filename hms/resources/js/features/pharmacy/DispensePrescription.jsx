import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pharmacyApi } from '../../api/pharmacy';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Pill, Search, CheckCircle, AlertTriangle, Clipboard, User, FileText } from 'lucide-react';

export const DispensePrescription = () => {
    const { prescriptionId } = useParams();
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState(prescriptionId || '');
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dispensing, setDispensing] = useState(false);
    const [notes, setNotes] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const fetchPrescription = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await pharmacyApi.getPrescription(id);
            setPrescription(data.data || data);
            setNotes('');
        } catch (err) {
            setPrescription(null);
            showToast(err.response?.data?.message || 'Prescription not found.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (prescriptionId) {
            setSearchId(prescriptionId);
            fetchPrescription(prescriptionId);
        }
    }, [prescriptionId]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchId.trim()) {
            navigate(`/pharmacy/dispense/${searchId.trim()}`);
        }
    };

    const handleDispense = async () => {
        if (!prescription) return;
        setDispensing(true);
        try {
            await pharmacyApi.dispensePrescription({
                prescription_id: prescription.id,
                notes: notes,
            });
            showToast('Prescription dispensed successfully!');
            fetchPrescription(prescription.id);
        } catch (err) {
            showToast(err.response?.data?.message || 'Dispensing failed.', 'error');
        } finally {
            setDispensing(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Pill className="w-6 h-6 text-indigo-500" /> Dispense Prescription
                </h1>
                <p className="text-sm text-slate-500">Fulfil medicine orders, check inventory levels, and track dispensings.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        type="number"
                        placeholder="Enter Prescription ID (e.g. 5)..."
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button type="submit" variant="primary" loading={loading}>
                    Lookup Prescription
                </Button>
            </form>

            {loading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <Skeleton rows={5} columns={2} />
                </div>
            ) : prescription ? (
                <div className="space-y-6">
                    {/* Prescription Details Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                            <div>
                                <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                                    Rx #{prescription.id}
                                </span>
                                <p className="text-xs text-slate-400 mt-2">
                                    Issued: <span className="font-semibold text-slate-600">{formatDate(prescription.created_at)}</span>
                                </p>
                            </div>

                            {prescription.dispensing ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <p>Already Dispensed</p>
                                        <p className="text-[10px] text-emerald-600 font-medium">
                                            {formatDate(prescription.dispensing.dispensed_at)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-sm font-semibold">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                                    <span>Pending Fulfilment</span>
                                </div>
                            )}
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Patient info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-slate-400" /> Patient Details
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-700">{prescription.patient?.name ?? '—'}</p>
                                    <p className="text-xs text-slate-500">
                                        Email: <span className="text-slate-600">{prescription.patient?.email ?? '—'}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        DOB: <span className="text-slate-600">{formatDate(prescription.patient?.dob, false)}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Blood Group: <span className="font-semibold text-indigo-600">{prescription.patient?.blood_type ?? '—'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Doctor & Appointment info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clipboard className="w-4 h-4 text-slate-400" /> Medical Context
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-700">Dr. {prescription.doctor?.name ?? '—'}</p>
                                    <p className="text-xs text-slate-500">
                                        Specialization: <span className="text-slate-600">{prescription.doctor?.specialization ?? '—'}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Appointment Date: <span className="text-slate-600">{formatDate(prescription.appointment?.date, false)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {prescription.notes && (
                            <div className="px-6 pb-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-sm text-slate-600">
                                    <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-700 block mb-1">Doctor's Notes:</strong>
                                        <span className="italic">{prescription.notes}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prescribed Items & Stock Status */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-50 bg-slate-50/30">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                Prescribed Medicines
                            </h2>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {prescription.items?.map((item, index) => {
                                const totalStock = item.medicine?.total_stock ?? 0;
                                const isAvailable = totalStock >= 1;
                                return (
                                    <div key={index} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-700 text-base flex items-center gap-2">
                                                <Pill className="w-4 h-4 text-indigo-500" /> {item.medicine?.name || item.medicine_name}
                                                {item.medicine?.generic_name && (
                                                    <span className="text-xs font-normal text-slate-400">({item.medicine.generic_name})</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Dosage: <span className="font-medium text-slate-700">{item.dosage}</span> · 
                                                Frequency: <span className="font-medium text-slate-700">{item.frequency}</span> · 
                                                Duration: <span className="font-medium text-slate-700">{item.duration}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right sm:border-r sm:pr-4 sm:border-slate-100">
                                                <p className="text-xs text-slate-400">Inventory Stock</p>
                                                <p className="text-sm font-bold text-slate-700">{totalStock} {item.medicine?.unit ?? 'unit'}(s)</p>
                                            </div>

                                            {isAvailable ? (
                                                <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                                                    Available
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Panel */}
                    {!prescription.dispensing && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Dispensing Notes (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-400 resize-none min-h-[80px]"
                                    placeholder="Enter any pharmacist comments or notes about this dispensation..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    variant="primary"
                                    onClick={handleDispense}
                                    loading={dispensing}
                                    className="w-full sm:w-auto px-8"
                                    disabled={prescription.items?.some(item => (item.medicine?.total_stock ?? 0) < 1)}
                                >
                                    Dispense & Deduct Stock
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                    <Clipboard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-700 text-lg">No Prescription Selected</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                        Please enter a valid prescription ID in the lookup bar above to inspect medicine details and dispense.
                    </p>
                </div>
            )}
        </div>
    );
};
