import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import { History, User, Calendar, MessageSquare, Terminal } from 'lucide-react';

export const ActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const fetchLogs = async (p = 1) => {
        setLoading(true);
        try {
            const data = await adminApi.getActivityLogs(p);
            setLogs(data.data || []);
            setMeta(data.meta || null);
        } catch {
            showToast('Failed to load system activity logs.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-6 h-6 text-indigo-500" /> System Activity Log
                </h1>
                <p className="text-sm text-slate-500">Audit trail of critical modifications, user activities, and background actions.</p>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <Skeleton rows={8} columns={4} />
                </div>
            ) : logs.length === 0 ? (
                <EmptyState 
                    title="No Activity Recorded" 
                    description="When users register, login, create records, or modify schedules, activity logs will be generated here." 
                    icon={History} 
                />
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/60 border-b border-slate-100">
                                    <tr>
                                        {['Description', 'Triggered By', 'Log Name', 'Timestamp'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-2.5">
                                                    <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-slate-700 font-medium">{log.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {log.causer ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="font-semibold">{log.causer.name}</p>
                                                            <p className="text-xs text-slate-400">{log.causer.email}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">System Action</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 uppercase">
                                                    <Terminal className="w-3 h-3 text-slate-500" /> {log.log_name || 'default'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(log.created_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                            <span className="text-xs text-slate-500">
                                Page <span className="font-semibold text-slate-700">{meta.current_page}</span> of <span className="font-semibold text-slate-700">{meta.last_page}</span>
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === meta.last_page}
                                    onClick={() => setPage(p => Math.min(p + 1, meta.last_page))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
