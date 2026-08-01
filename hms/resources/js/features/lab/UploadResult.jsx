import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { labApi } from '../../api/lab';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { PatientCodeChip } from '@hms/ui';
import { formatDate } from '../../utils/formatDate';
import { FlaskConical, Upload, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export const UploadResult = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Form states
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [isAbnormal, setIsAbnormal] = useState(false);
    const [resultAt, setResultAt] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const loadRequest = async () => {
            try {
                const data = await labApi.getLabRequest(id);
                setRequest(data.data);
            } catch (err) {
                console.error('Failed to load lab request details:', err);
                setError('Could not retrieve lab request details.');
            } finally {
                setLoading(false);
            }
        };
        loadRequest();
    }, [id]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 10 * 1024 * 1024) {
                setValidationErrors(prev => ({ ...prev, result_file: ['File size must be less than 10MB'] }));
                return;
            }
            setFile(selectedFile);
            setValidationErrors(prev => {
                const updated = { ...prev };
                delete updated.result_file;
                return updated;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setValidationErrors({});
        setError(null);

        const formData = new FormData();
        // Method spoofing to work around php patch body parsing limitations
        formData.append('_method', 'PATCH');
        if (file) {
            formData.append('result_file', file);
        }
        formData.append('notes', notes);
        formData.append('is_abnormal', isAbnormal ? '1' : '0');
        formData.append('result_at', resultAt);

        try {
            // Note: Since labApi.uploadResult does patch, let's call it.
            // If patch fails, we can send a custom POST with method spoofing.
            // Actually, sending it as a POST with _method=PATCH works with both PATCH and POST endpoints in Laravel
            // if route allows or we use patch. Let's send the PATCH request with FormData.
            await labApi.uploadResult(id, formData);
            navigate('/lab');
        } catch (err) {
            console.error('Upload failed:', err);
            if (err.response?.status === 422) {
                setValidationErrors(err.response.data.errors || {});
            } else {
                setError(err.response?.data?.message || 'Failed to upload result. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <Skeleton rows={8} columns={1} />
            </div>
        );
    }

    if (error && !request) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-rose-50 rounded-full text-rose-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Error Loading Lab Request</h2>
                <p className="text-slate-500">{error}</p>
                <Button onClick={() => navigate('/lab')} variant="secondary">Back to Queue</Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <FlaskConical className="w-6 h-6 text-indigo-500" />
                <h1 className="text-2xl font-bold text-slate-800">Upload Lab Result</h1>
            </div>

            {/* Request info card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lab Request Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-400">Patient</p>
                        <div className="flex items-center gap-2 mt-1">
                            <PatientCodeChip code={request.patient?.patient_code} />
                            <span className="font-semibold text-slate-800">{request.patient?.name}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400">Test ordered</p>
                        <p className="font-semibold text-slate-800 mt-1">{request.test?.name} ({request.test?.code})</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Ordering Doctor</p>
                        <p className="font-semibold text-slate-800 mt-1">Dr. {request.doctor?.name}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Requested At</p>
                        <p className="font-semibold text-slate-800 mt-1">{formatDate(request.requested_at)}</p>
                    </div>
                </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl border border-rose-100 flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* File Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Result Document (PDF / Image)</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="application/pdf,image/png,image/jpeg,image/jpg"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        {file ? (
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                                <FileText className="w-4 h-4" /> {file.name}
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-600">Click to select or drag and drop</p>
                                <p className="text-xs text-slate-400 mt-1">PDF, JPG, JPEG, PNG up to 10MB</p>
                            </div>
                        )}
                    </div>
                    {validationErrors.result_file && (
                        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.result_file[0]}
                        </p>
                    )}
                </div>

                {/* Notes Textarea */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Technician Notes / Findings</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write result summaries, readings, or notes here..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm resize-none"
                    />
                    {validationErrors.notes && (
                        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.notes[0]}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date picker */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Result Date</label>
                        <Input
                            type="date"
                            value={resultAt}
                            onChange={(e) => setResultAt(e.target.value)}
                        />
                        {validationErrors.result_at && (
                            <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.result_at[0]}
                            </p>
                        )}
                    </div>

                    {/* Abnormal Toggle */}
                    <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">Mark as Abnormal</span>
                            <span className="text-xs text-slate-400">Flags the result red for the physician</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={isAbnormal}
                            onChange={(e) => setIsAbnormal(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <Button
                        type="button"
                        onClick={() => navigate('/lab')}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        variant="primary"
                        className="inline-flex items-center gap-2"
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" /> Submit Result
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
