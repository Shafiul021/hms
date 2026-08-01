import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { labApi } from '../../api/lab';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PatientCodeChip } from '@hms/ui';
import { formatDate } from '../../utils/formatDate';
import { FlaskConical, Download, AlertTriangle, FileText, ArrowLeft, Calendar, User, Heart } from 'lucide-react';

export const ResultViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadResult = async () => {
            try {
                const data = await labApi.getResult(id);
                setResult(data.data);
            } catch (err) {
                console.error('Failed to load lab result details:', err);
                setError('Could not retrieve lab result details.');
            } finally {
                setLoading(false);
            }
        };
        loadResult();
    }, [id]);

    const handleDownload = () => {
        if (result?.download_url) {
            window.open(result.download_url, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <Skeleton rows={8} columns={1} />
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-rose-50 rounded-full text-rose-500">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Error Loading Lab Result</h2>
                <p className="text-slate-500">{error || 'Result details are unavailable.'}</p>
                <Button onClick={() => navigate('/lab')} variant="secondary">Back to Queue</Button>
            </div>
        );
    }

    const { lab_request } = result;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/lab')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Lab Queue
                </button>
            </div>

            {/* Abnormal Alert Banner */}
            {result.is_abnormal ? (
                <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 flex items-start gap-3 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-sm">Abnormal Lab Result Flagged</h3>
                        <p className="text-xs text-rose-700 mt-0.5">
                            One or more readings in this lab report fall outside the normal standard range. Please consult the ordering physician immediately.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-start gap-3 shadow-sm">
                    <FlaskConical className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-sm">Normal Test Result</h3>
                        <p className="text-xs text-emerald-700 mt-0.5">
                            This report has been uploaded and finalized by the lab technician.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Result Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                            Lab Test Report
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 mt-2">{lab_request?.test?.name}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Test Code: {lab_request?.test?.code}</p>
                    </div>
                    {result.download_url && (
                        <div className="flex items-center">
                            <Button
                                onClick={handleDownload}
                                variant="primary"
                                className="inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <Download className="w-4 h-4" /> Download File
                            </Button>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Patient Details
                        </h3>
                        <div>
                            <div className="flex items-center gap-2">
                                <PatientCodeChip code={lab_request?.patient?.patient_code} />
                                <span className="font-semibold text-slate-800">{lab_request?.patient?.name}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Gender: {lab_request?.patient?.gender} | DOB: {formatDate(lab_request?.patient?.date_of_birth, false)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5" /> Care Team
                        </h3>
                        <div>
                            <p className="font-semibold text-slate-800">Dr. {lab_request?.doctor?.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Ordering Physician</p>
                        </div>
                    </div>
                </div>

                {/* Dates & Technicians */}
                <div className="px-6 py-4 bg-slate-50/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-b border-slate-100">
                    <div>
                        <p className="text-slate-400">Date Ordered</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{formatDate(lab_request?.requested_at)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Date Completed</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{formatDate(result.result_at)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Lab Technician</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{result.technician?.name || 'N/A'}</p>
                    </div>
                </div>

                {/* Technician Notes */}
                <div className="p-6 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Technician Findings / Notes
                    </h3>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-slate-700 text-sm whitespace-pre-line leading-relaxed min-h-24">
                        {result.notes || 'No notes provided by the laboratory technician.'}
                    </div>
                </div>
            </div>
        </div>
    );
};
