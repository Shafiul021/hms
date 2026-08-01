import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labApi } from '../../api/lab';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge, PatientCodeChip } from '@hms/ui';
import { formatDate } from '../../utils/formatDate';
import { Search, FlaskConical, PlusCircle, Eye, AlertTriangle } from 'lucide-react';

export const LabQueue = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const data = await labApi.getLabRequests(params);
            setRequests(data.data || []);
        } catch (error) {
            console.error('Failed to fetch lab requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const patientName = req.patient?.name?.toLowerCase() || '';
        const patientCode = req.patient?.patient_code?.toLowerCase() || '';
        const testName = req.test?.name?.toLowerCase() || '';
        const query = searchTerm.toLowerCase();
        return patientName.includes(query) || patientCode.includes(query) || testName.includes(query);
    });

    const handleUploadClick = (requestId) => {
        navigate(`/lab/${requestId}/upload`);
    };

    const handleViewClick = (resultId) => {
        navigate(`/lab/${resultId}/result`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-indigo-500" /> Lab Test Queue
                    </h1>
                    <p className="text-sm text-slate-500">Manage lab test requests, upload results, and track diagnostic data.</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2 w-full sm:w-auto">
                    {['all', 'requested', 'completed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                                statusFilter === status
                                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-100'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search patient, code, test..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table or Loading / Empty States */}
            {loading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <Skeleton rows={6} columns={6} />
                </div>
            ) : filteredRequests.length === 0 ? (
                <EmptyState
                    title="No Lab Requests Found"
                    description={searchTerm ? "Try adjusting your search terms or filters." : "There are currently no lab test requests matching this criteria."}
                    icon={FlaskConical}
                />
            ) : (
                <Table
                    headers={['Requested Date', 'Patient Code & Name', 'Doctor', 'Test ordered', 'Status', 'Actions']}
                >
                    {filteredRequests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="text-slate-500 font-medium">
                                {formatDate(req.requested_at)}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <PatientCodeChip code={req.patient?.patient_code} />
                                        <span className="font-semibold text-slate-800">{req.patient?.name || 'N/A'}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                                {req.doctor?.name ? `Dr. ${req.doctor.name}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <div className="font-semibold text-slate-700">{req.test?.name || 'N/A'}</div>
                                <div className="text-xs text-slate-400">Code: {req.test?.code || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={req.status} />
                                    {req.result?.is_abnormal && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Abnormal
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {req.status === 'requested' ? (
                                    <Button
                                        onClick={() => handleUploadClick(req.id)}
                                        variant="primary"
                                        size="sm"
                                        className="inline-flex items-center gap-1.5"
                                    >
                                        <PlusCircle className="w-4 h-4" /> Upload Result
                                    </Button>
                                ) : req.result?.id ? (
                                    <Button
                                        onClick={() => handleViewClick(req.result.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="inline-flex items-center gap-1.5"
                                    >
                                        <Eye className="w-4 h-4" /> View Result
                                    </Button>
                                ) : (
                                    <span className="text-xs text-slate-400">Processing / Missing Result</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            )}
        </div>
    );
};
